import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationsService } from './notifications.service';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { Article } from '../../schemas/article.schema';
import { FileItem } from '../../schemas/library/file.schema';
import { User } from '../../schemas/user.schema';
import { Submission } from '../../schemas/exercise/submission.schema';
import { Notification } from '../../schemas/notification.schema';

/**
 * Unit tests for NotificationsService — the stored per-user store (/me, markRead,
 * read-all) plus the existing derived feed(). No live MongoDB: models are jest.fn()
 * bags with thenable lean chains.
 */

const oid = () => new Types.ObjectId();

function leanChain(value: any) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(value),
  };
  return chain;
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let exerciseModel: any;
  let articleModel: any;
  let fileModel: any;
  let userModel: any;
  let submissionModel: any;
  let notificationModel: any;

  beforeEach(async () => {
    exerciseModel = { find: jest.fn() };
    articleModel = { find: jest.fn() };
    fileModel = { find: jest.fn() };
    userModel = { find: jest.fn() };
    submissionModel = { countDocuments: jest.fn() };
    notificationModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateMany: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getModelToken(Exercise.name), useValue: exerciseModel },
        { provide: getModelToken(Article.name), useValue: articleModel },
        { provide: getModelToken(FileItem.name), useValue: fileModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Submission.name), useValue: submissionModel },
        { provide: getModelToken(Notification.name), useValue: notificationModel },
      ],
    }).compile();

    service = moduleRef.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('listForUser', () => {
    it('returns owner-scoped records (newest first shape) + unreadCount', async () => {
      const userId = oid().toString();
      const at = new Date('2026-06-01T10:00:00.000Z');
      const n1 = oid();
      notificationModel.find.mockReturnValue(
        leanChain([
          {
            _id: n1,
            title: 'Bài tập mới: A',
            body: null,
            tag: 'Bài tập',
            icon: 'assign',
            link: '/luyen-tap/x',
            isRead: false,
            createdAt: at,
          },
        ]),
      );
      notificationModel.countDocuments.mockResolvedValue(3);

      const res = await service.listForUser(userId, 20);

      // scoped to the user
      const findQuery = notificationModel.find.mock.calls[0][0];
      expect(findQuery.userId.toString()).toBe(userId);
      const unreadQuery = notificationModel.countDocuments.mock.calls[0][0];
      expect(unreadQuery.userId.toString()).toBe(userId);
      expect(unreadQuery.isRead).toBe(false);

      expect(res.unreadCount).toBe(3);
      expect(res.records).toEqual([
        {
          id: String(n1),
          title: 'Bài tập mới: A',
          body: undefined,
          tag: 'Bài tập',
          icon: 'assign',
          link: '/luyen-tap/x',
          isRead: false,
          at: at.toISOString(),
        },
      ]);
    });

    it('clamps limit into [1,50]', async () => {
      notificationModel.find.mockReturnValue(leanChain([]));
      notificationModel.countDocuments.mockResolvedValue(0);

      const chain = notificationModel.find.mockReturnValue(leanChain([]));
      void chain;
      await service.listForUser(oid().toString(), 999);

      const limitMock = notificationModel.find.mock.results[0].value.limit;
      expect(limitMock).toHaveBeenCalledWith(50);
    });
  });

  describe('markRead', () => {
    it('marks one read (owner-scoped) and returns {id,isRead}', async () => {
      const userId = oid().toString();
      const id = oid();
      notificationModel.findOneAndUpdate.mockResolvedValue({ _id: id, isRead: true });

      const res = await service.markRead(id.toString(), userId);

      const filter = notificationModel.findOneAndUpdate.mock.calls[0][0];
      expect(filter._id.toString()).toBe(id.toString());
      expect(filter.userId.toString()).toBe(userId);
      const patch = notificationModel.findOneAndUpdate.mock.calls[0][1];
      expect(patch.isRead).toBe(true);
      expect(res).toEqual({ id: String(id), isRead: true });
    });

    it('throws NotFound when the notification is not the owner s / missing', async () => {
      notificationModel.findOneAndUpdate.mockResolvedValue(null);
      await expect(service.markRead(oid().toString(), oid().toString())).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('markAllRead', () => {
    it('marks all unread of the user read and returns updated count', async () => {
      const userId = oid().toString();
      notificationModel.updateMany.mockResolvedValue({ modifiedCount: 5 });

      const res = await service.markAllRead(userId);

      const filter = notificationModel.updateMany.mock.calls[0][0];
      expect(filter.userId.toString()).toBe(userId);
      expect(filter.isRead).toBe(false);
      const patch = notificationModel.updateMany.mock.calls[0][1];
      expect(patch.isRead).toBe(true);
      expect(res).toEqual({ updated: 5 });
    });

    it('defaults updated to 0 when modifiedCount is absent', async () => {
      notificationModel.updateMany.mockResolvedValue({});
      const res = await service.markAllRead(oid().toString());
      expect(res).toEqual({ updated: 0 });
    });
  });

  describe('feed', () => {
    it('aggregates recent events and prepends grading-pending when ungraded > 0', async () => {
      exerciseModel.find.mockReturnValue(leanChain([{ _id: oid(), title: 'Bài 1', createdAt: new Date() }]));
      articleModel.find.mockReturnValue(leanChain([{ _id: oid(), title: 'Viết 1', createdAt: new Date() }]));
      fileModel.find.mockReturnValue(leanChain([{ _id: oid(), name: 'Tài liệu 1', createdAt: new Date() }]));
      userModel.find.mockReturnValue(leanChain([{ _id: oid(), name: 'Ada', createdAt: new Date() }]));
      submissionModel.countDocuments.mockResolvedValue(2);

      const items = await service.feed(20);

      expect(items[0]).toMatchObject({ id: 'grading-pending', tag: 'Chấm điểm', icon: 'grade' });
      expect(items.some((i) => i.tag === 'Bài tập')).toBe(true);
      expect(items.some((i) => i.tag === 'Bài viết')).toBe(true);
      expect(items.some((i) => i.tag === 'Học liệu')).toBe(true);
      expect(items.some((i) => i.tag === 'Người dùng')).toBe(true);
    });

    it('omits grading-pending when nothing is ungraded and respects the limit', async () => {
      exerciseModel.find.mockReturnValue(leanChain([]));
      articleModel.find.mockReturnValue(leanChain([]));
      fileModel.find.mockReturnValue(leanChain([]));
      userModel.find.mockReturnValue(leanChain([]));
      submissionModel.countDocuments.mockResolvedValue(0);

      const items = await service.feed(20);

      expect(items.find((i) => i.id === 'grading-pending')).toBeUndefined();
      expect(items).toHaveLength(0);
    });
  });
});
