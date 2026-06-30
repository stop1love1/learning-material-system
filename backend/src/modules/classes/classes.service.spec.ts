import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ClassesService } from './classes.service';
import { Class } from '../../schemas/class/class.schema';
import { Enrollment } from '../../schemas/class/enrollment.schema';
import { User } from '../../schemas/user.schema';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { EnrollmentStatus, UserRole } from '../../enums';

/**
 * Unit tests for ClassesService. No live MongoDB — every Mongoose model is a
 * plain object of jest.fn()s. Chainable query builders (find().select().lean(),
 * findById().lean(), findOne().lean(), findOneAndUpdate().lean()) are emulated
 * with small thenable/chain helpers.
 */

const oid = () => new Types.ObjectId();

/** A chainable query stub whose terminal `.lean()` resolves to `value`. */
function leanChain(value: any) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(value),
  };
  return chain;
}

describe('ClassesService', () => {
  let service: ClassesService;
  let classModel: any;
  let enrollmentModel: any;
  let userModel: any;
  let exerciseModel: any;

  beforeEach(async () => {
    classModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      exists: jest.fn(),
      create: jest.fn(),
      deleteOne: jest.fn(),
    };
    enrollmentModel = {
      find: jest.fn(),
      exists: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      updateOne: jest.fn(),
      deleteMany: jest.fn(),
    };
    userModel = {
      find: jest.fn(),
    };
    exerciseModel = {
      updateMany: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: getModelToken(Class.name), useValue: classModel },
        { provide: getModelToken(Enrollment.name), useValue: enrollmentModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Exercise.name), useValue: exerciseModel },
      ],
    }).compile();

    service = moduleRef.get<ClassesService>(ClassesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('sets ownerId from the calling user and returns the plain object', async () => {
      const userId = new Types.ObjectId().toString();
      const created = { _id: oid(), name: 'Lớp 5A', toObject: jest.fn().mockReturnValue({ name: 'Lớp 5A' }) };
      classModel.create.mockResolvedValue(created);

      const result = await service.create({ name: 'Lớp 5A' } as any, userId);

      expect(classModel.create).toHaveBeenCalledTimes(1);
      const arg = classModel.create.mock.calls[0][0];
      expect(arg.name).toBe('Lớp 5A');
      expect(arg.ownerId).toBeInstanceOf(Types.ObjectId);
      expect(arg.ownerId.toString()).toBe(userId);
      expect(created.toObject).toHaveBeenCalled();
      expect(result).toEqual({ name: 'Lớp 5A' });
    });

    it('passes optional description/grade/code through when provided', async () => {
      const userId = new Types.ObjectId().toString();
      classModel.exists.mockResolvedValue(null);
      classModel.create.mockResolvedValue({ toObject: () => ({}) });

      await service.create({ name: 'L', description: 'd', grade: '5', code: 'ABC' } as any, userId);

      const arg = classModel.create.mock.calls[0][0];
      expect(arg.description).toBe('d');
      expect(arg.grade).toBe('5');
      expect(arg.code).toBe('ABC');
    });

    it('throws ConflictException when the code already exists', async () => {
      classModel.exists.mockResolvedValue({ _id: oid() });

      await expect(service.create({ name: 'L', code: 'DUP' } as any, oid().toString())).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(classModel.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // list — owner scoping
  // ---------------------------------------------------------------------------
  describe('list scoping', () => {
    beforeEach(() => {
      classModel.find.mockReturnValue(leanChain([]));
      classModel.countDocuments.mockResolvedValue(0);
      enrollmentModel.aggregate.mockResolvedValue([]);
    });

    it('Admin → no owner/enrollment filter applied', async () => {
      await service.list({} as any, oid().toString(), UserRole.Admin);

      const query = classModel.find.mock.calls[0][0];
      expect(query.ownerId).toBeUndefined();
      expect(query._id).toBeUndefined();
      // Admin must NOT need the activeClassIds lookup.
      expect(enrollmentModel.find).not.toHaveBeenCalled();
    });

    it('Teacher → restricts to own classes via ownerId', async () => {
      const userId = new Types.ObjectId().toString();
      await service.list({} as any, userId, UserRole.Teacher);

      const query = classModel.find.mock.calls[0][0];
      expect(query.ownerId).toBeInstanceOf(Types.ObjectId);
      expect(query.ownerId.toString()).toBe(userId);
      expect(query._id).toBeUndefined();
      expect(enrollmentModel.find).not.toHaveBeenCalled();
    });

    it('Student → restricts to Active-enrolled class ids only', async () => {
      const userId = new Types.ObjectId().toString();
      const c1 = oid();
      const c2 = oid();
      enrollmentModel.find.mockReturnValue(leanChain([{ classId: c1 }, { classId: c2 }]));

      await service.list({} as any, userId, UserRole.Student);

      // The enrollment lookup must filter by this student + Active.
      const enrollQuery = enrollmentModel.find.mock.calls[0][0];
      expect(enrollQuery.studentId.toString()).toBe(userId);
      expect(enrollQuery.status).toBe(EnrollmentStatus.Active);

      const query = classModel.find.mock.calls[0][0];
      expect(query._id).toEqual({ $in: [c1, c2] });
      expect(query.ownerId).toBeUndefined();
    });

    it('Student with no enrollments → _id $in [] (sees nothing)', async () => {
      enrollmentModel.find.mockReturnValue(leanChain([]));

      await service.list({} as any, oid().toString(), UserRole.Student);

      const query = classModel.find.mock.calls[0][0];
      expect(query._id).toEqual({ $in: [] });
    });

    it('applies keyword regex and grade filter', async () => {
      await service.list({ keyword: 'toán', grade: '5' } as any, oid().toString(), UserRole.Admin);

      const query = classModel.find.mock.calls[0][0];
      expect(query.$or).toEqual([
        { name: { $regex: 'toán', $options: 'i' } },
        { description: { $regex: 'toán', $options: 'i' } },
      ]);
      expect(query.grade).toBe('5');
    });

    it('attaches studentCount from the enrollment aggregation', async () => {
      const id1 = oid();
      const id2 = oid();
      classModel.find.mockReturnValue(leanChain([{ _id: id1 }, { _id: id2 }]));
      classModel.countDocuments.mockResolvedValue(2);
      enrollmentModel.aggregate.mockResolvedValue([{ _id: id1, n: 3 }]);

      const res: any = await service.list({} as any, oid().toString(), UserRole.Admin);

      const byId = new Map(res.records.map((r: any) => [r._id.toString(), r.studentCount]));
      expect(byId.get(id1.toString())).toBe(3);
      expect(byId.get(id2.toString())).toBe(0); // no aggregation row → default 0
      // aggregation only counts Active enrollments.
      const matchStage = enrollmentModel.aggregate.mock.calls[0][0][0].$match;
      expect(matchStage.status).toBe(EnrollmentStatus.Active);
    });
  });

  // ---------------------------------------------------------------------------
  // findById — authorization
  // ---------------------------------------------------------------------------
  describe('findById authorization', () => {
    it('throws NotFoundException when the class does not exist', async () => {
      classModel.findById.mockReturnValue(leanChain(null));

      await expect(service.findById(oid().toString(), oid().toString(), UserRole.Admin)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('allows the owner without an enrollment check', async () => {
      const userId = new Types.ObjectId().toString();
      classModel.findById.mockReturnValue(leanChain({ _id: oid(), ownerId: new Types.ObjectId(userId) }));
      enrollmentModel.countDocuments.mockResolvedValue(4);

      const res: any = await service.findById(oid().toString(), userId, UserRole.Teacher);

      expect(enrollmentModel.exists).not.toHaveBeenCalled();
      expect(res.studentCount).toBe(4);
    });

    it('allows Admin even when not the owner and not enrolled', async () => {
      classModel.findById.mockReturnValue(leanChain({ _id: oid(), ownerId: oid() }));
      enrollmentModel.countDocuments.mockResolvedValue(0);

      await expect(
        service.findById(oid().toString(), oid().toString(), UserRole.Admin),
      ).resolves.toMatchObject({ studentCount: 0 });
      expect(enrollmentModel.exists).not.toHaveBeenCalled();
    });

    it('allows an Active-enrolled student (non-owner)', async () => {
      classModel.findById.mockReturnValue(leanChain({ _id: oid(), ownerId: oid() }));
      enrollmentModel.exists.mockResolvedValue({ _id: oid() });
      enrollmentModel.countDocuments.mockResolvedValue(7);

      const res: any = await service.findById(oid().toString(), oid().toString(), UserRole.Student);

      expect(enrollmentModel.exists).toHaveBeenCalledTimes(1);
      const existsArg = enrollmentModel.exists.mock.calls[0][0];
      expect(existsArg.status).toBe(EnrollmentStatus.Active);
      expect(res.studentCount).toBe(7);
    });

    it('rejects a non-owner, non-admin, non-enrolled user with ForbiddenException', async () => {
      classModel.findById.mockReturnValue(leanChain({ _id: oid(), ownerId: oid() }));
      enrollmentModel.exists.mockResolvedValue(null);

      await expect(
        service.findById(oid().toString(), oid().toString(), UserRole.Student),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // update — owner scoped
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('Teacher update is scoped to ownerId in the filter', async () => {
      const userId = new Types.ObjectId().toString();
      classModel.findOneAndUpdate.mockReturnValue(leanChain({ _id: oid(), name: 'New' }));

      await service.update(oid().toString(), { name: 'New' } as any, userId, UserRole.Teacher);

      const [filter, patch] = classModel.findOneAndUpdate.mock.calls[0];
      expect(filter.ownerId.toString()).toBe(userId);
      expect(patch.name).toBe('New');
    });

    it('Admin update filter omits ownerId (bypass)', async () => {
      classModel.findOneAndUpdate.mockReturnValue(leanChain({ _id: oid() }));

      await service.update(oid().toString(), { name: 'X' } as any, oid().toString(), UserRole.Admin);

      const filter = classModel.findOneAndUpdate.mock.calls[0][0];
      expect(filter.ownerId).toBeUndefined();
    });

    it('throws NotFoundException when nothing matched the owner filter', async () => {
      classModel.findOneAndUpdate.mockReturnValue(leanChain(null));

      await expect(
        service.update(oid().toString(), { name: 'X' } as any, oid().toString(), UserRole.Teacher),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('clearing the code sets patch.code = null', async () => {
      classModel.findOneAndUpdate.mockReturnValue(leanChain({ _id: oid() }));

      await service.update(oid().toString(), { code: '' } as any, oid().toString(), UserRole.Admin);

      const patch = classModel.findOneAndUpdate.mock.calls[0][1];
      expect(patch.code).toBeNull();
    });

    it('throws ConflictException when a new code clashes with another class', async () => {
      classModel.exists.mockResolvedValue({ _id: oid() });

      await expect(
        service.update(oid().toString(), { code: 'DUP' } as any, oid().toString(), UserRole.Admin),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(classModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // remove — owner scoped + CASCADE
  // ---------------------------------------------------------------------------
  describe('remove (cascade)', () => {
    it('throws NotFoundException when the class is not owned by the teacher', async () => {
      classModel.findOne.mockReturnValue(leanChain(null));

      await expect(
        service.remove(oid().toString(), oid().toString(), UserRole.Teacher),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(classModel.deleteOne).not.toHaveBeenCalled();
      expect(enrollmentModel.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes the class, its enrollments, and nulls exercise.classId', async () => {
      const id = new Types.ObjectId().toString();
      classModel.findOne.mockReturnValue(leanChain({ _id: new Types.ObjectId(id) }));
      classModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
      enrollmentModel.deleteMany.mockResolvedValue({ deletedCount: 5 });
      exerciseModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

      const res = await service.remove(id, oid().toString(), UserRole.Admin);

      expect(res).toEqual({ deleted: true });
      // class deleted by _id
      expect(classModel.deleteOne).toHaveBeenCalledWith({ _id: expect.any(Types.ObjectId) });
      // enrollments cascaded
      const enrollFilter = enrollmentModel.deleteMany.mock.calls[0][0];
      expect(enrollFilter.classId.toString()).toBe(id);
      // exercises un-linked (classId set null)
      const [exFilter, exPatch] = exerciseModel.updateMany.mock.calls[0];
      expect(exFilter.classId.toString()).toBe(id);
      expect(exPatch).toEqual({ $set: { classId: null } });
    });

    it('Teacher remove scopes the ownership lookup by ownerId', async () => {
      const userId = new Types.ObjectId().toString();
      classModel.findOne.mockReturnValue(leanChain({ _id: oid() }));
      classModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
      enrollmentModel.deleteMany.mockResolvedValue({});
      exerciseModel.updateMany.mockResolvedValue({});

      await service.remove(oid().toString(), userId, UserRole.Teacher);

      const filter = classModel.findOne.mock.calls[0][0];
      expect(filter.ownerId.toString()).toBe(userId);
    });
  });

  // ---------------------------------------------------------------------------
  // addStudents — idempotent upsert / reactivation
  // ---------------------------------------------------------------------------
  describe('addStudents', () => {
    it('throws NotFoundException when caller does not manage the class', async () => {
      classModel.findOne.mockReturnValue(leanChain(null));

      await expect(
        service.addStudents(oid().toString(), { studentIds: [oid().toString()] } as any, oid().toString(), UserRole.Teacher),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(enrollmentModel.updateOne).not.toHaveBeenCalled();
    });

    it('upserts an Active enrollment per student (reactivating Removed rows)', async () => {
      const classId = new Types.ObjectId().toString();
      const s1 = new Types.ObjectId().toString();
      const s2 = new Types.ObjectId().toString();
      classModel.findOne.mockReturnValue(leanChain({ _id: new Types.ObjectId(classId) }));
      enrollmentModel.updateOne.mockResolvedValue({ upsertedCount: 1 });
      enrollmentModel.countDocuments.mockResolvedValue(2);

      const res = await service.addStudents(classId, { studentIds: [s1, s2] } as any, oid().toString(), UserRole.Admin);

      expect(enrollmentModel.updateOne).toHaveBeenCalledTimes(2);
      // Each call must be an upsert that sets status Active (reactivation) and
      // only sets classId/studentId/joinedAt on insert (idempotent).
      for (const call of enrollmentModel.updateOne.mock.calls) {
        const [filter, update, options] = call;
        expect(filter.classId.toString()).toBe(classId);
        expect(update.$set.status).toBe(EnrollmentStatus.Active);
        expect(update.$setOnInsert).toMatchObject({ classId: expect.any(Types.ObjectId) });
        expect(options).toEqual({ upsert: true });
      }
      expect(res).toEqual({ added: 2, activeCount: 2 });
    });
  });

  // ---------------------------------------------------------------------------
  // removeStudent — soft removal
  // ---------------------------------------------------------------------------
  describe('removeStudent', () => {
    it('sets the enrollment status to Removed', async () => {
      const classId = new Types.ObjectId().toString();
      const studentId = new Types.ObjectId().toString();
      classModel.findOne.mockReturnValue(leanChain({ _id: new Types.ObjectId(classId) }));
      enrollmentModel.updateOne.mockResolvedValue({ matchedCount: 1 });

      const res = await service.removeStudent(classId, studentId, oid().toString(), UserRole.Admin);

      const [filter, update] = enrollmentModel.updateOne.mock.calls[0];
      expect(filter.classId.toString()).toBe(classId);
      expect(filter.studentId.toString()).toBe(studentId);
      expect(update).toEqual({ $set: { status: EnrollmentStatus.Removed } });
      expect(res).toEqual({ removed: true });
    });

    it('throws NotFoundException when the student is not in the class', async () => {
      classModel.findOne.mockReturnValue(leanChain({ _id: oid() }));
      enrollmentModel.updateOne.mockResolvedValue({ matchedCount: 0 });

      await expect(
        service.removeStudent(oid().toString(), oid().toString(), oid().toString(), UserRole.Admin),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // join — by code
  // ---------------------------------------------------------------------------
  describe('join (by code)', () => {
    it('throws NotFoundException for an empty/blank code', async () => {
      await expect(service.join({ code: '   ' } as any, oid().toString())).rejects.toBeInstanceOf(NotFoundException);
      expect(classModel.findOne).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when no class has the code', async () => {
      classModel.findOne.mockReturnValue(leanChain(null));

      await expect(service.join({ code: 'NOPE' } as any, oid().toString())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when the class is archived', async () => {
      classModel.findOne.mockReturnValue(leanChain({ _id: oid(), isArchived: true, name: 'L' }));

      await expect(service.join({ code: 'ABC' } as any, oid().toString())).rejects.toBeInstanceOf(ForbiddenException);
      expect(enrollmentModel.updateOne).not.toHaveBeenCalled();
    });

    it('enrolls the caller Active via upsert on a valid code', async () => {
      const classId = oid();
      const userId = new Types.ObjectId().toString();
      classModel.findOne.mockReturnValue(leanChain({ _id: classId, isArchived: false, name: 'Lớp 5A' }));
      enrollmentModel.updateOne.mockResolvedValue({ upsertedCount: 1 });

      const res = await service.join({ code: 'ABC' } as any, userId);

      const [filter, update, options] = enrollmentModel.updateOne.mock.calls[0];
      expect(filter.classId).toBe(classId);
      expect(filter.studentId.toString()).toBe(userId);
      expect(update.$set.status).toBe(EnrollmentStatus.Active);
      expect(options).toEqual({ upsert: true });
      expect(res).toEqual({ joined: true, classId, name: 'Lớp 5A' });
    });

    it('trims the code before looking it up', async () => {
      classModel.findOne.mockReturnValue(leanChain({ _id: oid(), isArchived: false, name: 'L' }));
      enrollmentModel.updateOne.mockResolvedValue({});

      await service.join({ code: '  ABC  ' } as any, oid().toString());

      expect(classModel.findOne).toHaveBeenCalledWith({ code: 'ABC' });
    });
  });

  // ---------------------------------------------------------------------------
  // listStudents — joins User info
  // ---------------------------------------------------------------------------
  describe('listStudents', () => {
    it('throws NotFoundException when caller does not manage the class', async () => {
      classModel.findOne.mockReturnValue(leanChain(null));

      await expect(
        service.listStudents(oid().toString(), oid().toString(), UserRole.Teacher),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns Active enrollments joined with User name/email', async () => {
      const classId = new Types.ObjectId().toString();
      const studentA = oid();
      const studentB = oid();
      classModel.findOne.mockReturnValue(leanChain({ _id: new Types.ObjectId(classId) }));
      enrollmentModel.find.mockReturnValue(
        leanChain([
          { _id: oid(), classId: new Types.ObjectId(classId), studentId: studentA, status: EnrollmentStatus.Active, joinedAt: new Date() },
          { _id: oid(), classId: new Types.ObjectId(classId), studentId: studentB, status: EnrollmentStatus.Active, joinedAt: new Date() },
        ]),
      );
      userModel.find.mockReturnValue(
        leanChain([
          { _id: studentA, name: 'An', email: 'an@x.vn' },
          { _id: studentB, name: 'Bình', email: 'binh@x.vn' },
        ]),
      );

      const res: any = await service.listStudents(classId, oid().toString(), UserRole.Admin);

      // enrollment query restricted to Active.
      const enrollQuery = enrollmentModel.find.mock.calls[0][0];
      expect(enrollQuery.status).toBe(EnrollmentStatus.Active);
      expect(res).toHaveLength(2);
      const byId = new Map(res.map((r: any) => [r.studentId.toString(), r.student]));
      expect(byId.get(studentA.toString())).toMatchObject({ name: 'An', email: 'an@x.vn' });
      expect(byId.get(studentB.toString())).toMatchObject({ name: 'Bình' });
    });

    it('returns student=null when the User row is missing', async () => {
      const orphan = oid();
      classModel.findOne.mockReturnValue(leanChain({ _id: oid() }));
      enrollmentModel.find.mockReturnValue(
        leanChain([{ _id: oid(), classId: oid(), studentId: orphan, status: EnrollmentStatus.Active, joinedAt: new Date() }]),
      );
      userModel.find.mockReturnValue(leanChain([]));

      const res: any = await service.listStudents(oid().toString(), oid().toString(), UserRole.Admin);

      expect(res[0].student).toBeNull();
    });
  });
});
