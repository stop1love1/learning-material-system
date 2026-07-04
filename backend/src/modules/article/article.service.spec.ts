import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ArticleService } from './article.service';
import { Article } from '../../schemas/article.schema';
import { UserRole } from '../../enums';

const ARTICLE_ID = 'a'.repeat(24);
const USER_ID = 'b'.repeat(24);
const OTHER_ID = 'c'.repeat(24);

describe('ArticleService', () => {
  let service: ArticleService;
  let articleModel: any;

  beforeEach(async () => {
    articleModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
      deleteOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: getModelToken(Article.name), useValue: articleModel },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('forces isPublished:true so drafts never leak, and applies keyword/category', async () => {
      const chain: any = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: ARTICLE_ID }]),
      };
      articleModel.find.mockReturnValue(chain);
      articleModel.countDocuments.mockResolvedValue(1);

      const res = await service.list({ keyword: 'tho*', category: 'van' } as any);

      const query = articleModel.find.mock.calls[0][0];
      expect(query.isPublished).toBe(true);
      expect(query.category).toBe('van');
      expect(query.$or).toEqual([
        { title: { $regex: 'tho\\*', $options: 'i' } },
        { excerpt: { $regex: 'tho\\*', $options: 'i' } },
      ]);
      expect(res).toMatchObject({ records: [{ _id: ARTICLE_ID }], total: 1 });
    });
  });

  describe('findById', () => {
    it('only matches published articles and increments viewCount', async () => {
      articleModel.findOneAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ _id: ARTICLE_ID, viewCount: 6 }),
      });

      const res = await service.findById(ARTICLE_ID);

      const [filter, update] = articleModel.findOneAndUpdate.mock.calls[0];
      expect(filter.isPublished).toBe(true);
      expect(update).toEqual({ $inc: { viewCount: 1 } });
      expect(res).toMatchObject({ _id: ARTICLE_ID });
    });

    it('throws NotFoundException for an unpublished/unknown article', async () => {
      articleModel.findOneAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });
      await expect(service.findById(ARTICLE_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('stamps userId from the caller', async () => {
      articleModel.create.mockResolvedValue({ _id: new Types.ObjectId(ARTICLE_ID) });
      articleModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ARTICLE_ID }) });

      await service.create(USER_ID, { title: 'T' } as any);

      expect(articleModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'T', userId: new Types.ObjectId(USER_ID) }),
      );
    });
  });

  describe('update', () => {
    it('patches only whitelisted fields, dropping userId/viewCount', async () => {
      articleModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: ARTICLE_ID }),
      });

      await service.update(
        ARTICLE_ID,
        {
          title: 'New',
          isPublished: false,
          // these must be ignored by the whitelist:
          userId: OTHER_ID,
          viewCount: 9999,
          hacker: 'nope',
        } as any,
        USER_ID,
      );

      const patch = articleModel.findOneAndUpdate.mock.calls[0][1];
      expect(patch).toEqual({ title: 'New', isPublished: false });
      expect(patch).not.toHaveProperty('userId');
      expect(patch).not.toHaveProperty('viewCount');
      expect(patch).not.toHaveProperty('hacker');
    });

    it('scopes to the owner for non-admins', async () => {
      articleModel.findOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ARTICLE_ID }) });
      await service.update(ARTICLE_ID, { title: 'X' } as any, USER_ID, UserRole.Student);

      const filter = articleModel.findOneAndUpdate.mock.calls[0][0];
      expect(filter.userId).toEqual(new Types.ObjectId(USER_ID));
    });

    it('admin bypasses the owner scope', async () => {
      articleModel.findOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ARTICLE_ID }) });
      await service.update(ARTICLE_ID, { title: 'X' } as any, USER_ID, UserRole.Admin);

      const filter = articleModel.findOneAndUpdate.mock.calls[0][0];
      expect(filter).not.toHaveProperty('userId');
    });

    it('throws NotFoundException when no doc matches the owner filter', async () => {
      articleModel.findOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      await expect(
        service.update(ARTICLE_ID, { title: 'X' } as any, USER_ID, UserRole.Student),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes within the owner scope', async () => {
      articleModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const res = await service.remove(ARTICLE_ID, USER_ID, UserRole.Student);

      const filter = articleModel.deleteOne.mock.calls[0][0];
      expect(filter.userId).toEqual(new Types.ObjectId(USER_ID));
      expect(res).toEqual({ deleted: true });
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      articleModel.deleteOne.mockResolvedValue({ deletedCount: 0 });
      await expect(
        service.remove(ARTICLE_ID, USER_ID, UserRole.Student),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
