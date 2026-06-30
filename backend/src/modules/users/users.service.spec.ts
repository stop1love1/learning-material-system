import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { User } from '../../schemas/user.schema';
import { BcryptService } from '../../global/bcrypt.service';
import { UserRole, UserStatus } from '../../enums';

// 24-hex ObjectId strings so convertStringToObjectId() does not throw.
const ID_A = 'a'.repeat(24);
const ID_B = 'b'.repeat(24);

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;
  let bcrypt: { hash: jest.Mock; compare: jest.Mock };

  beforeEach(async () => {
    userModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      exists: jest.fn(),
      create: jest.fn(),
      deleteOne: jest.fn(),
    };
    bcrypt = {
      hash: jest.fn().mockResolvedValue('HASHED'),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: BcryptService, useValue: bcrypt },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  // Helper: a find() chain ending in .lean() resolving to `records`.
  const mockFindChain = (records: any[]) => {
    const chain: any = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(records),
    };
    userModel.find.mockReturnValue(chain);
    return chain;
  };

  describe('list', () => {
    it('builds a keyword $or via parseKeyword (regex-escaped) and returns pagination shape', async () => {
      const records = [{ name: 'An', password: 'should-not-be-here-but-projection-is-DB-side' }];
      mockFindChain(records);
      userModel.countDocuments.mockResolvedValue(1);

      // "a.b" → "." is escaped to "\." by parseKeyword.
      const res = await service.list({ keyword: 'a.b', page: 1, pageSize: 10 } as any);

      const query = userModel.find.mock.calls[0][0];
      expect(query.$or).toEqual([
        { name: { $regex: 'a\\.b', $options: 'i' } },
        { email: { $regex: 'a\\.b', $options: 'i' } },
      ]);
      expect(res).toMatchObject({ records, total: 1, current: 1, pageSize: 10 });
    });

    it('omits $or when keyword is empty and applies role/status filters', async () => {
      mockFindChain([]);
      userModel.countDocuments.mockResolvedValue(0);

      await service.list({ role: UserRole.Teacher, status: UserStatus.Active } as any);

      const query = userModel.find.mock.calls[0][0];
      expect(query.$or).toBeUndefined();
      expect(query.role).toBe(UserRole.Teacher);
      expect(query.status).toBe(UserStatus.Active);
    });
  });

  describe('create', () => {
    it('lowercases email, hashes password, and rejects duplicates', async () => {
      userModel.exists.mockResolvedValue(false);
      const created = { _id: new Types.ObjectId(ID_A) };
      userModel.create.mockResolvedValue(created);
      // findById is called at the end to return the sanitized doc.
      userModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ID_A, name: 'An' }) });

      const res = await service.create({
        name: 'An',
        email: 'AN@Example.COM',
        password: 'secret123',
      } as any);

      expect(userModel.exists).toHaveBeenCalledWith({ email: 'an@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('secret123');
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'an@example.com', password: 'HASHED' }),
      );
      // sanitize: findById uses .lean() projection; password not surfaced here.
      expect(res).not.toHaveProperty('password');
    });

    it('throws ConflictException when email already exists', async () => {
      userModel.exists.mockResolvedValue(true);
      await expect(
        service.create({ name: 'An', email: 'a@b.com', password: 'x' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(userModel.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('writes only whitelisted fields and re-hashes a new password', async () => {
      userModel.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: ID_A, name: 'New' }),
      });

      await service.update(ID_A, {
        name: 'New',
        email: 'UP@X.COM',
        password: 'newpass',
        // extraneous field must be dropped by the whitelist (cast via `as any` below)
        hacker: 'nope',
      } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass');
      const patch = userModel.findByIdAndUpdate.mock.calls[0][1];
      expect(patch).toEqual({ name: 'New', email: 'up@x.com', password: 'HASHED' });
      expect(patch).not.toHaveProperty('hacker');
    });

    it('blocks self-demotion when currentUserId === id', async () => {
      await expect(
        service.update(ID_A, { role: UserRole.Teacher } as any, ID_A),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('blocks self-lock when currentUserId === id', async () => {
      await expect(
        service.update(ID_A, { status: UserStatus.Inactive } as any, ID_A),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('allows self-update that keeps Admin role / Active status', async () => {
      userModel.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: ID_A }),
      });
      await expect(
        service.update(ID_A, { role: UserRole.Admin, status: UserStatus.Active, name: 'Me' } as any, ID_A),
      ).resolves.toBeDefined();
    });

    it('allows demoting a DIFFERENT user', async () => {
      userModel.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: ID_B }),
      });
      await expect(
        service.update(ID_B, { role: UserRole.Student } as any, ID_A),
      ).resolves.toBeDefined();
    });

    it('throws NotFoundException when the target does not exist', async () => {
      userModel.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      await expect(service.update(ID_A, { name: 'x' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('blocks self-delete', async () => {
      await expect(service.remove(ID_A, ID_A)).rejects.toBeInstanceOf(ForbiddenException);
      expect(userModel.findById).not.toHaveBeenCalled();
    });

    it('blocks deleting the last remaining Admin', async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ role: UserRole.Admin }) }),
      });
      userModel.countDocuments.mockResolvedValue(1);

      await expect(service.remove(ID_A, ID_B)).rejects.toBeInstanceOf(ForbiddenException);
      expect(userModel.deleteOne).not.toHaveBeenCalled();
    });

    it('deletes an Admin when more than one exists', async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ role: UserRole.Admin }) }),
      });
      userModel.countDocuments.mockResolvedValue(2);
      userModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await expect(service.remove(ID_A, ID_B)).resolves.toEqual({ deleted: true });
      expect(userModel.deleteOne).toHaveBeenCalled();
    });

    it('deletes a non-admin without the admin-count check', async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ role: UserRole.Student }) }),
      });
      userModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await expect(service.remove(ID_A, ID_B)).resolves.toEqual({ deleted: true });
      expect(userModel.countDocuments).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown target', async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });
      await expect(service.remove(ID_A, ID_B)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      userModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      await expect(service.findById(ID_A)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
