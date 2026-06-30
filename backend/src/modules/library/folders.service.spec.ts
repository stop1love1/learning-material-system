import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { FoldersService } from './folders.service';
import { Folder } from '../../schemas/library/folder.schema';
import { FileItem } from '../../schemas/library/file.schema';
import { UserRole } from '../../enums';

function makeChain(resolved: any) {
  const chain: any = {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(resolved),
    exec: jest.fn().mockResolvedValue(resolved),
  };
  return chain;
}

const oid = (hex: string) => new Types.ObjectId(hex);
const A = '5f000000000000000000000a'; // owner / viewer
const B = '5f000000000000000000000b'; // other user
const FOLDER_ID = '5f00000000000000000000c1';

describe('FoldersService', () => {
  let service: FoldersService;
  let folderModel: any;
  let fileModel: any;

  beforeEach(async () => {
    folderModel = {
      find: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      exists: jest.fn(),
    };
    fileModel = {
      exists: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FoldersService,
        { provide: getModelToken(Folder.name), useValue: folderModel },
        { provide: getModelToken(FileItem.name), useValue: fileModel },
      ],
    }).compile();

    service = moduleRef.get<FoldersService>(FoldersService);
  });

  afterEach(() => jest.resetAllMocks());

  const lastFindQuery = () => folderModel.find.mock.calls[folderModel.find.mock.calls.length - 1][0];

  describe('list visibility filter', () => {
    beforeEach(() => folderModel.find.mockReturnValue(makeChain([])));

    it('anonymous → only isPublic:true, parentId null', async () => {
      await service.list({} as any, undefined);
      const q = lastFindQuery();
      expect(q.isPublic).toBe(true);
      expect(q.parentId).toBeNull();
    });

    it('authed non-admin → public OR own merged into query', async () => {
      await service.list({} as any, { userId: A, role: UserRole.Teacher });
      const q = lastFindQuery();
      expect(q.$or[0]).toEqual({ isPublic: true });
      expect(q.$or[1].userId.toString()).toBe(A);
    });

    it('admin → no visibility restriction', async () => {
      await service.list({} as any, { userId: A, role: UserRole.Admin });
      const q = lastFindQuery();
      expect(q.$or).toBeUndefined();
      expect(q.isPublic).toBeUndefined();
    });

    it('resolves parentId to ObjectId when supplied', async () => {
      await service.list({ parentId: FOLDER_ID } as any, { userId: A, role: UserRole.Admin });
      expect(lastFindQuery().parentId.toString()).toBe(FOLDER_ID);
    });

    it('sorts by name asc', async () => {
      const chain = makeChain([]);
      folderModel.find.mockReturnValue(chain);
      await service.list({} as any, undefined);
      expect(chain.sort).toHaveBeenCalledWith({ name: 1 });
    });
  });

  describe('create', () => {
    it('persists name, ObjectId userId, resolved parentId; returns plain object', async () => {
      const toObject = jest.fn().mockReturnValue({ _id: oid(FOLDER_ID), name: 'Thơ' });
      folderModel.create.mockResolvedValue({ toObject });
      const res = await service.create({ name: 'Thơ', parentId: FOLDER_ID, isPublic: false } as any, A);
      const arg = folderModel.create.mock.calls[0][0];
      expect(arg.name).toBe('Thơ');
      expect(arg.userId.toString()).toBe(A);
      expect(arg.parentId.toString()).toBe(FOLDER_ID);
      expect(arg.isPublic).toBe(false);
      expect(res).toEqual({ _id: oid(FOLDER_ID), name: 'Thơ' });
    });

    it('parentId null and isPublic omitted when not provided', async () => {
      folderModel.create.mockResolvedValue({ toObject: () => ({}) });
      await service.create({ name: 'Root' } as any, A);
      const arg = folderModel.create.mock.calls[0][0];
      expect(arg.parentId).toBeNull();
      expect('isPublic' in arg).toBe(false);
    });
  });

  describe('update (load + save, hook-preserving)', () => {
    it('loads by id, applies patch, saves, returns plain object', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const toObject = jest.fn().mockReturnValue({ _id: oid(FOLDER_ID), name: 'New' });
      const doc: any = { userId: oid(A), name: 'Old', save, toObject };
      folderModel.findById.mockResolvedValue(doc);

      const res = await service.update(FOLDER_ID, { name: 'New', isPublic: false } as any, A, UserRole.Teacher);
      expect(folderModel.findById.mock.calls[0][0].toString()).toBe(FOLDER_ID);
      expect(doc.name).toBe('New');
      expect(doc.isPublic).toBe(false);
      expect(save).toHaveBeenCalled(); // save → pre('save') ancestors/depth hook runs
      expect(res).toEqual({ _id: oid(FOLDER_ID), name: 'New' });
    });

    it('resolves parentId to ObjectId in the patch', async () => {
      const doc: any = { userId: oid(A), save: jest.fn(), toObject: () => ({}) };
      folderModel.findById.mockResolvedValue(doc);
      await service.update(FOLDER_ID, { parentId: FOLDER_ID } as any, A, UserRole.Teacher);
      expect(doc.parentId.toString()).toBe(FOLDER_ID);
    });

    it('clears parentId to null when explicitly null', async () => {
      const doc: any = { userId: oid(A), parentId: oid(FOLDER_ID), save: jest.fn(), toObject: () => ({}) };
      folderModel.findById.mockResolvedValue(doc);
      await service.update(FOLDER_ID, { parentId: null } as any, A, UserRole.Teacher);
      expect(doc.parentId).toBeNull();
    });

    it('404 when folder not found', async () => {
      folderModel.findById.mockResolvedValue(null);
      await expect(service.update(FOLDER_ID, {} as any, A, UserRole.Teacher)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('403 when non-admin is not the owner', async () => {
      const doc: any = { userId: oid(B), save: jest.fn(), toObject: () => ({}) };
      folderModel.findById.mockResolvedValue(doc);
      await expect(service.update(FOLDER_ID, { name: 'X' } as any, A, UserRole.Teacher)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(doc.save).not.toHaveBeenCalled();
    });

    it('admin may update a folder owned by someone else', async () => {
      const doc: any = { userId: oid(B), save: jest.fn(), toObject: () => ({}) };
      folderModel.findById.mockResolvedValue(doc);
      await expect(service.update(FOLDER_ID, { name: 'X' } as any, A, UserRole.Admin)).resolves.toBeDefined();
      expect(doc.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('blocks deletion of a folder containing a child folder (409)', async () => {
      const doc: any = { _id: oid(FOLDER_ID), userId: oid(A), deleteOne: jest.fn() };
      folderModel.findById.mockResolvedValue(doc);
      folderModel.exists.mockResolvedValue({ _id: oid('5f00000000000000000000c2') }); // has child folder
      fileModel.exists.mockResolvedValue(null);
      await expect(service.remove(FOLDER_ID, A, UserRole.Teacher)).rejects.toBeInstanceOf(ConflictException);
      expect(doc.deleteOne).not.toHaveBeenCalled();
    });

    it('blocks deletion of a folder containing a file (409)', async () => {
      const doc: any = { _id: oid(FOLDER_ID), userId: oid(A), deleteOne: jest.fn() };
      folderModel.findById.mockResolvedValue(doc);
      folderModel.exists.mockResolvedValue(null);
      fileModel.exists.mockResolvedValue({ _id: oid('5f00000000000000000000f9') }); // has a file
      await expect(service.remove(FOLDER_ID, A, UserRole.Teacher)).rejects.toBeInstanceOf(ConflictException);
      expect(doc.deleteOne).not.toHaveBeenCalled();
    });

    it('deletes an empty folder and returns deleted:true', async () => {
      const deleteOne = jest.fn().mockResolvedValue(undefined);
      const doc: any = { _id: oid(FOLDER_ID), userId: oid(A), deleteOne };
      folderModel.findById.mockResolvedValue(doc);
      folderModel.exists.mockResolvedValue(null);
      fileModel.exists.mockResolvedValue(null);
      const res = await service.remove(FOLDER_ID, A, UserRole.Teacher);
      expect(deleteOne).toHaveBeenCalled();
      expect(res).toEqual({ deleted: true });
      // emptiness checked against this folder's _id
      expect(folderModel.exists.mock.calls[0][0]).toEqual({ parentId: doc._id });
      expect(fileModel.exists.mock.calls[0][0]).toEqual({ folderId: doc._id });
    });

    it('404 when folder not found', async () => {
      folderModel.findById.mockResolvedValue(null);
      await expect(service.remove(FOLDER_ID, A, UserRole.Teacher)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('403 when non-admin is not the owner', async () => {
      const doc: any = { _id: oid(FOLDER_ID), userId: oid(B), deleteOne: jest.fn() };
      folderModel.findById.mockResolvedValue(doc);
      await expect(service.remove(FOLDER_ID, A, UserRole.Teacher)).rejects.toBeInstanceOf(ForbiddenException);
      expect(folderModel.exists).not.toHaveBeenCalled();
    });
  });
});
