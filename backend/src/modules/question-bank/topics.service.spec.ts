import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TopicsService } from './topics.service';
import { Topic } from '../../schemas/question-bank/topic.schema';
import { UserRole } from '../../enums';

const oid = () => new Types.ObjectId().toHexString();

function queryStub(result: any) {
  const q: any = {
    sort: jest.fn(() => q),
    skip: jest.fn(() => q),
    limit: jest.fn(() => q),
    lean: jest.fn(() => Promise.resolve(result)),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return q;
}

describe('TopicsService', () => {
  let service: TopicsService;
  let topicModel: any;

  beforeEach(async () => {
    topicModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      countDocuments: jest.fn(),
      deleteOne: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [TopicsService, { provide: getModelToken(Topic.name), useValue: topicModel }],
    }).compile();

    service = moduleRef.get(TopicsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('paginates with skip/limit/sort and returns a pagination envelope', async () => {
      const q = queryStub([{ _id: '1' }, { _id: '2' }]);
      topicModel.find.mockReturnValue(q);
      topicModel.countDocuments.mockResolvedValue(12);

      const res = await service.list(oid(), { page: 2, pageSize: 5 } as any);

      expect(topicModel.find).toHaveBeenCalledTimes(1);
      expect(q.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(q.skip).toHaveBeenCalledWith(5); // (page 2 - 1) * 5
      expect(q.limit).toHaveBeenCalledWith(5);
      // pagination envelope
      expect(res.total).toBe(12);
      expect(res.current).toBe(2);
      expect(res.pages).toBe(3);
      expect(res.hasNextPage).toBe(true);
      expect(res.hasPreviousPage).toBe(true);
      expect(res.records).toHaveLength(2);
    });

    it('scopes the query to the owner and the requested parentId', async () => {
      topicModel.find.mockReturnValue(queryStub([]));
      topicModel.countDocuments.mockResolvedValue(0);

      const parentId = oid();
      await service.list(oid(), { parentId } as any);

      const query = topicModel.find.mock.calls[0][0];
      expect(query.userId).toBeInstanceOf(Types.ObjectId);
      expect(query.parentId).toBeInstanceOf(Types.ObjectId);
    });

    it('defaults parentId to null (root level) when omitted', async () => {
      topicModel.find.mockReturnValue(queryStub([]));
      topicModel.countDocuments.mockResolvedValue(0);

      await service.list(oid(), {} as any);
      const query = topicModel.find.mock.calls[0][0];
      expect(query.parentId).toBeNull();
    });
  });

  describe('update', () => {
    it('loads then saves (so the pre-save hierarchy hook can fire) instead of findOneAndUpdate', async () => {
      const doc: any = {
        _id: new Types.ObjectId(),
        title: 'Old',
        description: null,
        parentId: null,
        save: jest.fn(function (this: any) {
          return Promise.resolve(this);
        }),
        toObject() {
          return { _id: this._id, title: this.title, description: this.description, parentId: this.parentId };
        },
      };
      topicModel.findOne.mockReturnValue(doc);

      const newParent = oid();
      const res = await service.update(
        oid(),
        { title: 'New', description: 'desc', parentId: newParent } as any,
        oid(),
        UserRole.Teacher,
      );

      // mutated the loaded doc and called save() — NOT findOneAndUpdate
      expect(doc.title).toBe('New');
      expect(doc.description).toBe('desc');
      expect(doc.parentId).toBeInstanceOf(Types.ObjectId);
      expect(doc.save).toHaveBeenCalledTimes(1);
      expect(res.title).toBe('New');
    });

    it('sets parentId to null when passed null (move to root)', async () => {
      const doc: any = {
        parentId: new Types.ObjectId(),
        save: jest.fn(function (this: any) {
          return Promise.resolve(this);
        }),
        toObject() {
          return { parentId: this.parentId };
        },
      };
      topicModel.findOne.mockReturnValue(doc);

      await service.update(oid(), { parentId: null } as any, oid(), UserRole.Teacher);
      expect(doc.parentId).toBeNull();
      expect(doc.save).toHaveBeenCalledTimes(1);
    });

    it('is owner-scoped for non-admins and throws NotFound on a miss', async () => {
      topicModel.findOne.mockReturnValue(null);
      await expect(service.update(oid(), { title: 'x' } as any, oid(), UserRole.Teacher)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      const filter = topicModel.findOne.mock.calls[0][0];
      expect(filter).toHaveProperty('userId');
    });

    it('does not owner-scope for Admin', async () => {
      const doc: any = { title: 'a', save: jest.fn().mockResolvedValue(undefined), toObject: () => ({}) };
      topicModel.findOne.mockReturnValue(doc);
      await service.update(oid(), { title: 'b' } as any, oid(), UserRole.Admin);
      const filter = topicModel.findOne.mock.calls[0][0];
      expect(filter).not.toHaveProperty('userId');
    });
  });
});
