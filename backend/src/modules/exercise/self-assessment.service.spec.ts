import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SelfAssessmentService } from './self-assessment.service';
import { SelfAssessment } from '../../schemas/exercise/self-assessment.schema';
import { Rubric } from '../../schemas/rubric/rubric.schema';
import { SelfAssessmentSource } from '../../enums';

const oid = () => new Types.ObjectId().toHexString();

describe('SelfAssessmentService', () => {
  let service: SelfAssessmentService;
  let selfAssessmentModel: any;
  let rubricModel: any;
  let createdDoc: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    createdDoc = undefined;
    selfAssessmentModel = {
      create: jest.fn((doc) => {
        createdDoc = doc;
        return Promise.resolve({ toObject: () => doc });
      }),
      find: jest.fn(),
      findById: jest.fn(),
    };
    rubricModel = {
      exists: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({}),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SelfAssessmentService,
        { provide: getModelToken(SelfAssessment.name), useValue: selfAssessmentModel },
        { provide: getModelToken(Rubric.name), useValue: rubricModel },
      ],
    }).compile();

    service = moduleRef.get(SelfAssessmentService);
  });

  describe('create', () => {
    it('throws NotFound when the rubric does not exist', async () => {
      rubricModel.exists.mockResolvedValue(null);
      await expect(
        service.create(
          { rubricId: oid(), source: SelfAssessmentSource.Text } as any,
          oid(),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(selfAssessmentModel.create).not.toHaveBeenCalled();
    });

    it('validates rubric, stores the scores matrix, and increments usedCount', async () => {
      const rubricId = oid();
      const criterionId = oid();
      const levelId = oid();
      const userId = oid();
      rubricModel.exists.mockResolvedValue({ _id: rubricId });

      const result = await service.create(
        {
          rubricId,
          source: SelfAssessmentSource.Text,
          text: 'bài của tôi',
          scores: [{ criterionId, levelId, percent: 80 }],
        } as any,
        userId,
      );

      // create() was called with a normalized scores matrix (ObjectIds)
      expect(createdDoc.rubricId.toString()).toBe(rubricId);
      expect(createdDoc.userId.toString()).toBe(userId);
      expect(createdDoc.scores).toHaveLength(1);
      expect(createdDoc.scores[0].criterionId.toString()).toBe(criterionId);
      expect(createdDoc.scores[0].levelId.toString()).toBe(levelId);
      expect(createdDoc.scores[0].percent).toBe(80);
      expect(createdDoc.text).toBe('bài của tôi');

      // usedCount incremented on the rubric
      expect(rubricModel.updateOne).toHaveBeenCalledWith(
        { _id: expect.anything() },
        { $inc: { usedCount: 1 } },
      );
      expect(result).toBeDefined();
    });

    it('defaults percent to 0 and levelId to null when omitted', async () => {
      const rubricId = oid();
      const criterionId = oid();
      rubricModel.exists.mockResolvedValue({ _id: rubricId });

      await service.create(
        {
          rubricId,
          source: SelfAssessmentSource.Text,
          scores: [{ criterionId }],
        } as any,
        oid(),
      );

      expect(createdDoc.scores[0].percent).toBe(0);
      expect(createdDoc.scores[0].levelId).toBeNull();
    });

    it('maps optional fileId / exerciseId to ObjectIds when provided', async () => {
      const rubricId = oid();
      const fileId = oid();
      const exerciseId = oid();
      rubricModel.exists.mockResolvedValue({ _id: rubricId });

      await service.create(
        {
          rubricId,
          source: SelfAssessmentSource.Exercise,
          fileId,
          exerciseId,
        } as any,
        oid(),
      );

      expect(createdDoc.fileId.toString()).toBe(fileId);
      expect(createdDoc.exerciseId.toString()).toBe(exerciseId);
    });
  });

  describe('findOne', () => {
    it('throws NotFound when the self-assessment is missing', async () => {
      selfAssessmentModel.findById.mockReturnValue({ lean: () => Promise.resolve(null) });
      await expect(service.findOne(oid())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the document when found', async () => {
      const doc = { _id: oid(), text: 'x' };
      selfAssessmentModel.findById.mockReturnValue({ lean: () => Promise.resolve(doc) });
      await expect(service.findOne(oid())).resolves.toBe(doc);
    });
  });

  describe('listOwn', () => {
    it('scopes the query to the caller userId', async () => {
      const userId = oid();
      const records = [{ _id: oid() }];
      const sort = jest.fn(() => ({ lean: () => Promise.resolve(records) }));
      selfAssessmentModel.find.mockReturnValue({ sort });
      const res = await service.listOwn(userId);
      const filter = selfAssessmentModel.find.mock.calls[0][0];
      expect(filter.userId.toString()).toBe(userId);
      expect(res).toBe(records);
    });
  });
});
