import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RubricService } from './rubric.service';
import { Rubric } from '../../schemas/rubric/rubric.schema';
import { RubricGroup } from '../../schemas/rubric/rubric-group.schema';
import { RubricLevel } from '../../schemas/rubric/rubric-level.schema';
import { RubricCriterion } from '../../schemas/rubric/rubric-criterion.schema';

const USER_ID = 'a'.repeat(24);
const RUBRIC_ID = 'b'.repeat(24);
const GROUP_ID = 'c'.repeat(24);
const LEVEL_ID = 'd'.repeat(24);
const CRIT_ID = 'e'.repeat(24);

// Chain helper for `find(...).sort(...).lean()` and `find(...).lean()`.
const findLean = (model: any, records: any[]) => {
  const chain: any = {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(records),
  };
  model.find.mockReturnValue(chain);
  return chain;
};

describe('RubricService', () => {
  let service: RubricService;
  let rubricModel: any;
  let groupModel: any;
  let levelModel: any;
  let criterionModel: any;

  beforeEach(async () => {
    rubricModel = {
      aggregate: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      updateMany: jest.fn(),
    };
    groupModel = {
      aggregate: jest.fn(),
      exists: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
    };
    levelModel = {
      find: jest.fn(),
      insertMany: jest.fn().mockResolvedValue([]),
      updateOne: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
    };
    criterionModel = {
      find: jest.fn(),
      insertMany: jest.fn().mockResolvedValue([]),
      updateOne: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RubricService,
        { provide: getModelToken(Rubric.name), useValue: rubricModel },
        { provide: getModelToken(RubricGroup.name), useValue: groupModel },
        { provide: getModelToken(RubricLevel.name), useValue: levelModel },
        { provide: getModelToken(RubricCriterion.name), useValue: criterionModel },
      ],
    }).compile();

    service = module.get<RubricService>(RubricService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('listRubrics', () => {
    it('applies escaped keyword + groupId filter and returns pagination', async () => {
      rubricModel.aggregate.mockResolvedValue([{ _id: RUBRIC_ID }]);
      rubricModel.countDocuments.mockResolvedValue(1);

      const res = await service.listRubrics(USER_ID, { keyword: 'a+b', groupId: GROUP_ID });

      const matchStage = rubricModel.aggregate.mock.calls[0][0][0].$match;
      // "+" escaped by parseKeyword.
      expect(matchStage.name).toEqual({ $regex: 'a\\+b', $options: 'i' });
      expect(matchStage.groupId).toBeInstanceOf(Types.ObjectId);
      expect(res).toMatchObject({ records: [{ _id: RUBRIC_ID }], total: 1 });
    });
  });

  describe('getRubric', () => {
    it('embeds levels + criterions', async () => {
      rubricModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: RUBRIC_ID, name: 'R' }) });
      findLean(levelModel, [{ _id: LEVEL_ID }]);
      findLean(criterionModel, [{ _id: CRIT_ID }]);

      const res = await service.getRubric(RUBRIC_ID);
      expect(res).toEqual({ _id: RUBRIC_ID, name: 'R', levels: [{ _id: LEVEL_ID }], criterions: [{ _id: CRIT_ID }] });
    });

    it('throws NotFoundException when rubric missing', async () => {
      rubricModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      await expect(service.getRubric(RUBRIC_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createRubric', () => {
    it('creates rubric + inserts levels/criterions (stripping client _id, mapping levelId)', async () => {
      groupModel.exists.mockResolvedValue(true);
      rubricModel.create.mockResolvedValue({
        _id: new Types.ObjectId(RUBRIC_ID),
        toObject: () => ({ _id: RUBRIC_ID, name: 'R' }),
      });
      levelModel.insertMany.mockResolvedValue([{ toObject: () => ({ _id: LEVEL_ID }) }]);
      criterionModel.insertMany.mockResolvedValue([{ toObject: () => ({ _id: CRIT_ID }) }]);

      const res = await service.createRubric(USER_ID, {
        name: 'R',
        groupId: GROUP_ID,
        levels: [{ _id: 'client-tmp', name: 'L1', order: 0 } as any],
        criterions: [{ _id: 'tmp', name: 'C1', levelId: LEVEL_ID } as any],
      } as any);

      // level insert strips _id.
      const levelArg = levelModel.insertMany.mock.calls[0][0][0];
      expect(levelArg).not.toHaveProperty('_id');
      expect(levelArg.rubricId).toEqual(new Types.ObjectId(RUBRIC_ID));
      // criterion levelId converted to ObjectId.
      const critArg = criterionModel.insertMany.mock.calls[0][0][0];
      expect(critArg.levelId).toEqual(new Types.ObjectId(LEVEL_ID));
      expect(res).toEqual({ _id: RUBRIC_ID, name: 'R', levels: [{ _id: LEVEL_ID }], criterions: [{ _id: CRIT_ID }] });
    });

    it('maps absent levelId to null', async () => {
      rubricModel.create.mockResolvedValue({
        _id: new Types.ObjectId(RUBRIC_ID),
        toObject: () => ({ _id: RUBRIC_ID }),
      });
      criterionModel.insertMany.mockResolvedValue([]);
      levelModel.insertMany.mockResolvedValue([]);

      await service.createRubric(USER_ID, {
        name: 'R',
        levels: [],
        criterions: [{ name: 'C1' } as any],
      } as any);

      expect(criterionModel.insertMany.mock.calls[0][0][0].levelId).toBeNull();
    });

    it('rejects an invalid group with BadRequestException', async () => {
      groupModel.exists.mockResolvedValue(false);
      await expect(
        service.createRubric(USER_ID, { name: 'R', groupId: GROUP_ID, levels: [], criterions: [] } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(rubricModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateRubric', () => {
    const setupUpdate = () => {
      rubricModel.findOneAndUpdate.mockResolvedValue({ _id: RUBRIC_ID });
      // getRubric() at the end:
      rubricModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: RUBRIC_ID }) });
    };

    it('diffs levels into insert/update/delete sets', async () => {
      setupUpdate();
      // existing: LEVEL_ID kept+updated, a SECOND existing level deleted.
      const otherLevelId = new Types.ObjectId();
      levelModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([{ _id: new Types.ObjectId(LEVEL_ID) }, { _id: otherLevelId }]),
      });
      criterionModel.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([]) });
      // getRubric internal finds:
      findLeanSecondCall(levelModel, []);
      findLeanSecondCall(criterionModel, []);

      await service.updateRubric(USER_ID, RUBRIC_ID, {
        name: 'R',
        levels: [
          { name: 'brand-new', order: 5 } as any, // insert
          { _id: LEVEL_ID, name: 'kept', order: 0 } as any, // update
        ],
        criterions: [],
      } as any);

      // one new level inserted (no _id), _id stripped
      expect(levelModel.insertMany).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'brand-new', rubricId: new Types.ObjectId(RUBRIC_ID) }),
      ]);
      // one update on the kept level
      expect(levelModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(LEVEL_ID), rubricId: new Types.ObjectId(RUBRIC_ID) },
        { $set: { name: 'kept', order: 0 } },
      );
      // the second existing level is deleted
      expect(levelModel.deleteMany).toHaveBeenCalledWith({ _id: { $in: [otherLevelId] } });
    });

    it("clears a criterion's levelId when dto explicitly passes levelId: null", async () => {
      setupUpdate();
      levelModel.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([]) });
      criterionModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([{ _id: new Types.ObjectId(CRIT_ID) }]),
      });
      findLeanSecondCall(levelModel, []);
      findLeanSecondCall(criterionModel, []);

      await service.updateRubric(USER_ID, RUBRIC_ID, {
        name: 'R',
        levels: [],
        criterions: [{ _id: CRIT_ID, name: 'C', levelId: null } as any],
      } as any);

      const updateCall = criterionModel.updateOne.mock.calls.find(
        (c: any) => c[0]._id.toString() === CRIT_ID,
      );
      expect(updateCall[1].$set).toHaveProperty('levelId', null);
    });

    it("leaves levelId untouched when 'levelId' is omitted from the criterion dto", async () => {
      setupUpdate();
      levelModel.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([]) });
      criterionModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([{ _id: new Types.ObjectId(CRIT_ID) }]),
      });
      findLeanSecondCall(levelModel, []);
      findLeanSecondCall(criterionModel, []);

      await service.updateRubric(USER_ID, RUBRIC_ID, {
        name: 'R',
        levels: [],
        criterions: [{ _id: CRIT_ID, name: 'C' } as any], // no levelId key
      } as any);

      const updateCall = criterionModel.updateOne.mock.calls.find(
        (c: any) => c[0]._id.toString() === CRIT_ID,
      );
      expect(updateCall[1].$set).not.toHaveProperty('levelId');
    });

    it('validates groupId ownership; null clears the group', async () => {
      setupUpdate();
      levelModel.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([]) });
      criterionModel.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([]) });
      findLeanSecondCall(levelModel, []);
      findLeanSecondCall(criterionModel, []);

      await service.updateRubric(USER_ID, RUBRIC_ID, {
        name: 'R',
        groupId: '', // falsy → clear
        levels: [],
        criterions: [],
      } as any);

      expect(rubricModel.findOneAndUpdate.mock.calls[0][1].groupId).toBeNull();
    });

    it('rejects a group owned by another user', async () => {
      groupModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ userId: { toString: () => 'someone-else' } }),
      });
      await expect(
        service.updateRubric(USER_ID, RUBRIC_ID, {
          name: 'R',
          groupId: GROUP_ID,
          levels: [],
          criterions: [],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when the rubric is not found / not owned', async () => {
      groupModel.findById.mockReturnValue({ lean: jest.fn() });
      rubricModel.findOneAndUpdate.mockResolvedValue(null);
      await expect(
        service.updateRubric(USER_ID, RUBRIC_ID, { name: 'R', levels: [], criterions: [] } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteRubric', () => {
    it('cascades level + criterion deletes', async () => {
      rubricModel.findOneAndDelete.mockResolvedValue({ _id: RUBRIC_ID });
      const res = await service.deleteRubric(USER_ID, RUBRIC_ID);

      expect(levelModel.deleteMany).toHaveBeenCalledWith({ rubricId: new Types.ObjectId(RUBRIC_ID) });
      expect(criterionModel.deleteMany).toHaveBeenCalledWith({ rubricId: new Types.ObjectId(RUBRIC_ID) });
      expect(res).toEqual({ deleted: true });
    });

    it('throws NotFoundException when nothing deleted', async () => {
      rubricModel.findOneAndDelete.mockResolvedValue(null);
      await expect(service.deleteRubric(USER_ID, RUBRIC_ID)).rejects.toBeInstanceOf(NotFoundException);
      expect(levelModel.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteRubricGroup', () => {
    it('nulls groupId on member rubrics after deleting the group', async () => {
      groupModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const res = await service.deleteRubricGroup(USER_ID, GROUP_ID);

      expect(rubricModel.updateMany).toHaveBeenCalledWith(
        { userId: new Types.ObjectId(USER_ID), groupId: new Types.ObjectId(GROUP_ID) },
        { groupId: null },
      );
      expect(res).toEqual({ deleted: true });
    });

    it('throws NotFoundException when the group does not exist', async () => {
      groupModel.deleteOne.mockResolvedValue({ deletedCount: 0 });
      await expect(service.deleteRubricGroup(USER_ID, GROUP_ID)).rejects.toBeInstanceOf(NotFoundException);
      expect(rubricModel.updateMany).not.toHaveBeenCalled();
    });
  });
});

// updateRubric calls find() twice per model (the diff read, then getRubric()).
// First call is set with mockReturnValueOnce above; this sets the SECOND.
function findLeanSecondCall(model: any, records: any[]) {
  model.find.mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(records),
  });
}
