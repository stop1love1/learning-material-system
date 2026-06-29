import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { FilesService } from './files.service';
import { FileItem } from '../../schemas/library/file.schema';
import { Download } from '../../schemas/library/download.schema';
import { DownloadKind, UserRole } from '../../enums';

// Chainable query mock: each chain method returns `this`; the chain resolves to
// `resolved` when awaited (find/findOneAndUpdate use a thenable via .lean()/.exec()).
function makeChain(resolved: any) {
  const chain: any = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(resolved),
    exec: jest.fn().mockResolvedValue(resolved),
  };
  return chain;
}

const oid = (hex: string) => new Types.ObjectId(hex);
const A = '5f000000000000000000000a'; // owner / viewer
const B = '5f000000000000000000000b'; // other user
const FILE_ID = '5f00000000000000000000f1';

describe('FilesService', () => {
  let service: FilesService;
  let fileModel: any;
  let downloadModel: any;

  beforeEach(async () => {
    fileModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      deleteOne: jest.fn(),
    };
    downloadModel = {
      find: jest.fn(),
      updateOne: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: getModelToken(FileItem.name), useValue: fileModel },
        { provide: getModelToken(Download.name), useValue: downloadModel },
      ],
    }).compile();

    service = moduleRef.get<FilesService>(FilesService);
  });

  afterEach(() => jest.resetAllMocks());

  // Pull the query object the service passed to fileModel.find / countDocuments.
  const lastFindQuery = () => fileModel.find.mock.calls[fileModel.find.mock.calls.length - 1][0];
  const visibilityClause = (query: any) => query.$and[0];

  describe('visibilityFilter (via list)', () => {
    beforeEach(() => {
      fileModel.find.mockReturnValue(makeChain([]));
      fileModel.countDocuments.mockResolvedValue(0);
    });

    it('anonymous viewer (no token) → only isPublic:true', async () => {
      await service.list({} as any, undefined);
      expect(visibilityClause(lastFindQuery())).toEqual({ isPublic: true });
    });

    it('viewer with empty userId → treated as anonymous (isPublic:true)', async () => {
      await service.list({} as any, { userId: undefined, role: UserRole.Teacher });
      expect(visibilityClause(lastFindQuery())).toEqual({ isPublic: true });
    });

    it('authed non-admin → public OR own', async () => {
      await service.list({} as any, { userId: A, role: UserRole.Teacher });
      const clause = visibilityClause(lastFindQuery());
      expect(clause.$or).toHaveLength(2);
      expect(clause.$or[0]).toEqual({ isPublic: true });
      expect(clause.$or[1].userId.toString()).toBe(A);
    });

    it('authed student (non-admin) → public OR own', async () => {
      await service.list({} as any, { userId: A, role: UserRole.Student });
      const clause = visibilityClause(lastFindQuery());
      expect(clause.$or[1].userId.toString()).toBe(A);
    });

    it('admin → unrestricted (empty visibility clause)', async () => {
      await service.list({} as any, { userId: A, role: UserRole.Admin });
      expect(visibilityClause(lastFindQuery())).toEqual({});
    });
  });

  describe('list', () => {
    beforeEach(() => {
      fileModel.find.mockReturnValue(makeChain([]));
      fileModel.countDocuments.mockResolvedValue(0);
    });

    it('applies the visibility filter as the first $and clause', async () => {
      await service.list({} as any, { userId: A, role: UserRole.Teacher });
      const q = lastFindQuery();
      expect(Array.isArray(q.$and)).toBe(true);
      expect(q.$and[0].$or[0]).toEqual({ isPublic: true });
    });

    it('runs keyword through parseKeyword — regex metacharacters are escaped', async () => {
      await service.list({ keyword: 'a.*(b)[c]' } as any, { userId: A, role: UserRole.Teacher });
      const q = lastFindQuery();
      // visibility is $and[0]; keyword is $and[1]
      const kw = q.$and[1];
      expect(kw.$or[0].name.$regex).toBe('a\\.\\*\\(b\\)\\[c\\]');
      expect(kw.$or[1].tags.$regex).toBe('a\\.\\*\\(b\\)\\[c\\]');
      expect(kw.$or[0].name.$options).toBe('i');
    });

    it('omits the keyword clause when keyword is empty / whitespace', async () => {
      await service.list({ keyword: '   ' } as any, { userId: A, role: UserRole.Teacher });
      const q = lastFindQuery();
      expect(q.$and).toHaveLength(1); // only visibility
    });

    it('builds folder/category/subject/grade filters with ObjectId folderId', async () => {
      await service.list(
        { folderId: FILE_ID, category: 'thi', subject: 'van', grade: '5' } as any,
        { userId: A, role: UserRole.Admin },
      );
      const q = lastFindQuery();
      expect(q.folderId.toString()).toBe(FILE_ID);
      expect(q.tags).toBe('thi');
      expect(q.subject).toBe('van');
      expect(q.grade).toBe('5');
    });

    it('maps folderId/folderName from the populated folder', async () => {
      const folderObjId = oid('5f00000000000000000000d1');
      fileModel.find.mockReturnValue(
        makeChain([{ _id: oid(FILE_ID), name: 'F', folderId: { _id: folderObjId, name: 'Giáo án' } }]),
      );
      fileModel.countDocuments.mockResolvedValue(1);
      const res: any = await service.list({} as any, { userId: A, role: UserRole.Admin });
      expect(res.records[0].folderName).toBe('Giáo án');
      expect(res.records[0].folderId).toBe(folderObjId);
      expect(res.total).toBe(1);
    });

    it('passes the same query object to countDocuments as to find', async () => {
      await service.list({} as any, { userId: A, role: UserRole.Teacher });
      expect(fileModel.countDocuments).toHaveBeenCalledWith(lastFindQuery());
    });
  });

  describe('findOne', () => {
    it('scopes the findOneAndUpdate match by the visibility filter and increments viewCount', async () => {
      fileModel.findOneAndUpdate.mockReturnValue(makeChain({ _id: oid(FILE_ID), name: 'X', folderId: null }));
      await service.findOne(FILE_ID, { userId: A, role: UserRole.Teacher });
      const [match, update] = fileModel.findOneAndUpdate.mock.calls[0];
      expect(match._id.toString()).toBe(FILE_ID);
      expect(match.$or[0]).toEqual({ isPublic: true }); // visibility merged into match
      expect(update).toEqual({ $inc: { viewCount: 1 } });
    });

    it('private non-owner file → 404 (no leak) and viewCount is NOT incremented', async () => {
      // The scoped findOneAndUpdate matches nothing → null. Because the filter is part of
      // the match, no document is modified, so viewCount cannot be bumped.
      fileModel.findOneAndUpdate.mockReturnValue(makeChain(null));
      await expect(service.findOne(FILE_ID, { userId: B, role: UserRole.Teacher })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      const [match] = fileModel.findOneAndUpdate.mock.calls[0];
      // Filter restricts to public-or-own; a private file owned by A is excluded for B.
      expect(match.$or[1].userId.toString()).toBe(B);
    });

    it('anonymous viewer is restricted to isPublic:true in the match', async () => {
      fileModel.findOneAndUpdate.mockReturnValue(makeChain(null));
      await expect(service.findOne(FILE_ID, undefined)).rejects.toBeInstanceOf(NotFoundException);
      const [match] = fileModel.findOneAndUpdate.mock.calls[0];
      expect(match.isPublic).toBe(true);
    });

    it('admin sees a private file (no visibility restriction in match)', async () => {
      fileModel.findOneAndUpdate.mockReturnValue(makeChain({ _id: oid(FILE_ID), folderId: null }));
      await service.findOne(FILE_ID, { userId: A, role: UserRole.Admin });
      const [match] = fileModel.findOneAndUpdate.mock.calls[0];
      expect(match.$or).toBeUndefined();
      expect(match.isPublic).toBeUndefined();
    });
  });

  describe('download', () => {
    it('private non-owner file → 404, no downloadCount bump, no Download row created', async () => {
      fileModel.findOneAndUpdate.mockReturnValue(makeChain(null));
      await expect(service.download(FILE_ID, { userId: B, role: UserRole.Teacher })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      const [match, update] = fileModel.findOneAndUpdate.mock.calls[0];
      // The $inc was requested but only against a doc the viewer can see — which matched none.
      expect(update).toEqual({ $inc: { downloadCount: 1 } });
      expect(match.$or[1].userId.toString()).toBe(B);
      // No Download row is written when the file is not visible.
      expect(downloadModel.updateOne).not.toHaveBeenCalled();
    });

    it('visible file → bumps downloadCount and upserts a single Download row', async () => {
      fileModel.findOneAndUpdate.mockReturnValue(makeChain({ _id: oid(FILE_ID) }));
      downloadModel.updateOne.mockResolvedValue({ upsertedCount: 1 });
      const res = await service.download(FILE_ID, { userId: A, role: UserRole.Teacher });
      expect(res).toEqual({ ok: true });

      const [match, update] = fileModel.findOneAndUpdate.mock.calls[0];
      expect(match._id.toString()).toBe(FILE_ID);
      expect(match.$or[0]).toEqual({ isPublic: true }); // same visibility filter as list/findOne
      expect(update).toEqual({ $inc: { downloadCount: 1 } });

      expect(downloadModel.updateOne).toHaveBeenCalledTimes(1);
      const [dMatch, dUpdate, dOpts] = downloadModel.updateOne.mock.calls[0];
      expect(dMatch.userId.toString()).toBe(A);
      expect(dMatch.fileId.toString()).toBe(FILE_ID);
      expect(dMatch.kind).toBe(DownloadKind.Download);
      expect(dUpdate.$setOnInsert.kind).toBe(DownloadKind.Download);
      expect(dOpts).toEqual({ upsert: true });
    });

    it('admin download is unrestricted (empty visibility merged into match)', async () => {
      fileModel.findOneAndUpdate.mockReturnValue(makeChain({ _id: oid(FILE_ID) }));
      downloadModel.updateOne.mockResolvedValue({});
      await service.download(FILE_ID, { userId: A, role: UserRole.Admin });
      const [match] = fileModel.findOneAndUpdate.mock.calls[0];
      expect(match.$or).toBeUndefined();
      expect(match.isPublic).toBeUndefined();
    });
  });

  describe('myDownloads', () => {
    it('preserves the createdAt-desc order of downloads (not DB/$in order)', async () => {
      const f1 = oid('5f0000000000000000000101');
      const f2 = oid('5f0000000000000000000102');
      const f3 = oid('5f0000000000000000000103');
      // downloads already sorted desc by the service's .sort({createdAt:-1})
      downloadModel.find.mockReturnValue(makeChain([{ fileId: f1 }, { fileId: f2 }, { fileId: f3 }]));
      // files come back in a DIFFERENT (DB) order
      fileModel.find.mockReturnValue(
        makeChain([
          { _id: f2, name: 'two' },
          { _id: f3, name: 'three' },
          { _id: f1, name: 'one' },
        ]),
      );

      const res = await service.myDownloads(A);
      expect(res.map((f: any) => f.name)).toEqual(['one', 'two', 'three']);
    });

    it('queries downloads scoped to the user and sorted desc', async () => {
      const chain = makeChain([]);
      downloadModel.find.mockReturnValue(chain);
      fileModel.find.mockReturnValue(makeChain([]));
      await service.myDownloads(A);
      expect(downloadModel.find.mock.calls[0][0].userId.toString()).toBe(A);
      expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('drops download rows whose file no longer exists', async () => {
      const f1 = oid('5f0000000000000000000101');
      const fGone = oid('5f00000000000000000001ff');
      downloadModel.find.mockReturnValue(makeChain([{ fileId: f1 }, { fileId: fGone }]));
      fileModel.find.mockReturnValue(makeChain([{ _id: f1, name: 'one' }]));
      const res = await service.myDownloads(A);
      expect(res.map((f: any) => f.name)).toEqual(['one']);
    });
  });

  describe('create', () => {
    it('persists with ObjectId userId and resolved folderId, returns plain object', async () => {
      const toObject = jest.fn().mockReturnValue({ _id: oid(FILE_ID), name: 'New' });
      fileModel.create.mockResolvedValue({ toObject });
      const res = await service.create({ name: 'New', folderId: FILE_ID } as any, A);
      const arg = fileModel.create.mock.calls[0][0];
      expect(arg.name).toBe('New');
      expect(arg.userId.toString()).toBe(A);
      expect(arg.folderId.toString()).toBe(FILE_ID);
      expect(res).toEqual({ _id: oid(FILE_ID), name: 'New' });
    });

    it('sets folderId null when none supplied', async () => {
      fileModel.create.mockResolvedValue({ toObject: () => ({}) });
      await service.create({ name: 'New' } as any, A);
      expect(fileModel.create.mock.calls[0][0].folderId).toBeNull();
    });
  });

  describe('update', () => {
    it('non-admin update is scoped to the owner and uses load+save', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const toObject = jest.fn().mockReturnValue({ _id: oid(FILE_ID), name: 'Renamed' });
      const doc: any = { name: 'Old', folderId: null, save, toObject };
      fileModel.findOne.mockResolvedValue(doc);
      const res = await service.update(FILE_ID, { name: 'Renamed' } as any, A, UserRole.Teacher);
      const filter = fileModel.findOne.mock.calls[0][0];
      expect(filter._id.toString()).toBe(FILE_ID);
      expect(filter.userId.toString()).toBe(A); // owner-scoped
      expect(doc.name).toBe('Renamed');
      expect(save).toHaveBeenCalled();
      expect(res).toEqual({ _id: oid(FILE_ID), name: 'Renamed' });
    });

    it('admin update is not owner-scoped', async () => {
      const doc: any = { save: jest.fn(), toObject: () => ({}) };
      fileModel.findOne.mockResolvedValue(doc);
      await service.update(FILE_ID, { name: 'X' } as any, A, UserRole.Admin);
      expect(fileModel.findOne.mock.calls[0][0].userId).toBeUndefined();
    });

    it('throws 404 when no matching (owned) file', async () => {
      fileModel.findOne.mockResolvedValue(null);
      await expect(service.update(FILE_ID, {} as any, A, UserRole.Teacher)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('non-admin delete is owner-scoped and returns deleted:true', async () => {
      fileModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const res = await service.remove(FILE_ID, A, UserRole.Teacher);
      const filter = fileModel.deleteOne.mock.calls[0][0];
      expect(filter.userId.toString()).toBe(A);
      expect(res).toEqual({ deleted: true });
    });

    it('throws 404 when nothing was deleted', async () => {
      fileModel.deleteOne.mockResolvedValue({ deletedCount: 0 });
      await expect(service.remove(FILE_ID, A, UserRole.Teacher)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
