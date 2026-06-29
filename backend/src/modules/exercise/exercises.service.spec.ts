import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ExercisesService } from './exercises.service';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { ExerciseQuestion } from '../../schemas/exercise/exercise-question.schema';
import { Question } from '../../schemas/question-bank/question.schema';
import { Attempt } from '../../schemas/exercise/attempt.schema';
import { Participant } from '../../schemas/exercise/participant.schema';
import { Submission } from '../../schemas/exercise/submission.schema';
import { StudentQuestion } from '../../schemas/exercise/student-question.schema';
import { Enrollment } from '../../schemas/class/enrollment.schema';
import { EnrollmentStatus, UserRole } from '../../enums';

/**
 * Unit tests for ExercisesService — focused on list() viewer filtering (the
 * Class/Enrollment-driven scoping) plus create/update persisting classId.
 * No live MongoDB: every model is a jest.fn() bag; chainable query builders
 * are emulated with a thenable lean chain.
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

describe('ExercisesService', () => {
  let service: ExercisesService;
  let exerciseModel: any;
  let exerciseQuestionModel: any;
  let questionModel: any;
  let attemptModel: any;
  let participantModel: any;
  let submissionModel: any;
  let studentQuestionModel: any;
  let enrollmentModel: any;

  beforeEach(async () => {
    exerciseModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
      deleteOne: jest.fn(),
    };
    exerciseQuestionModel = {
      find: jest.fn(),
      aggregate: jest.fn(),
      exists: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      deleteOne: jest.fn(),
    };
    questionModel = { find: jest.fn(), updateOne: jest.fn() };
    attemptModel = { find: jest.fn(), aggregate: jest.fn(), deleteMany: jest.fn() };
    participantModel = { deleteMany: jest.fn() };
    submissionModel = { deleteMany: jest.fn() };
    studentQuestionModel = { deleteMany: jest.fn() };
    enrollmentModel = { find: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        { provide: getModelToken(Exercise.name), useValue: exerciseModel },
        { provide: getModelToken(ExerciseQuestion.name), useValue: exerciseQuestionModel },
        { provide: getModelToken(Question.name), useValue: questionModel },
        { provide: getModelToken(Attempt.name), useValue: attemptModel },
        { provide: getModelToken(Participant.name), useValue: participantModel },
        { provide: getModelToken(Submission.name), useValue: submissionModel },
        { provide: getModelToken(StudentQuestion.name), useValue: studentQuestionModel },
        { provide: getModelToken(Enrollment.name), useValue: enrollmentModel },
      ],
    }).compile();

    service = moduleRef.get<ExercisesService>(ExercisesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // list() viewer filtering
  // ---------------------------------------------------------------------------
  describe('list viewer filtering', () => {
    beforeEach(() => {
      exerciseModel.find.mockReturnValue(leanChain([]));
      exerciseModel.countDocuments.mockResolvedValue(0);
      exerciseQuestionModel.aggregate.mockResolvedValue([]);
      attemptModel.aggregate.mockResolvedValue([]);
    });

    it('anonymous (no viewer) → only public exercises (classId null)', async () => {
      await service.list({} as any, undefined);

      const query = exerciseModel.find.mock.calls[0][0];
      expect(query.classId).toBeNull();
      expect(query.$or).toBeUndefined();
      expect(enrollmentModel.find).not.toHaveBeenCalled();
    });

    it('anonymous (viewer present but no userId/role) → classId null', async () => {
      await service.list({} as any, {} as any);

      const query = exerciseModel.find.mock.calls[0][0];
      expect(query.classId).toBeNull();
      expect(enrollmentModel.find).not.toHaveBeenCalled();
    });

    it('student → classId null OR classId in Active-enrolled class ids', async () => {
      const userId = new Types.ObjectId().toString();
      const c1 = oid();
      const c2 = oid();
      enrollmentModel.find.mockReturnValue(leanChain([{ classId: c1 }, { classId: c2 }]));

      await service.list({} as any, { userId, role: UserRole.Student });

      // Enrollment lookup is scoped to this student + Active.
      const enrollQuery = enrollmentModel.find.mock.calls[0][0];
      expect(enrollQuery.studentId.toString()).toBe(userId);
      expect(enrollQuery.status).toBe(EnrollmentStatus.Active);

      // THE key assertion: the exercise query restricts to public OR enrolled class ids.
      const query = exerciseModel.find.mock.calls[0][0];
      expect(query.$or).toEqual([{ classId: null }, { classId: { $in: [c1, c2] } }]);
      // Must NOT carry a bare classId:null alongside the $or.
      expect(query.classId).toBeUndefined();
    });

    it('student with no enrollments → public OR classId in [] (only public effectively)', async () => {
      enrollmentModel.find.mockReturnValue(leanChain([]));

      await service.list({} as any, { userId: oid().toString(), role: UserRole.Student });

      const query = exerciseModel.find.mock.calls[0][0];
      expect(query.$or).toEqual([{ classId: null }, { classId: { $in: [] } }]);
    });

    it('a viewer with a userId but undefined role is treated as a student (enrollment-scoped)', async () => {
      const c1 = oid();
      enrollmentModel.find.mockReturnValue(leanChain([{ classId: c1 }]));

      await service.list({} as any, { userId: oid().toString() });

      const query = exerciseModel.find.mock.calls[0][0];
      expect(query.$or).toEqual([{ classId: null }, { classId: { $in: [c1] } }]);
    });

    it('teacher → no class restriction (sees all, including private)', async () => {
      await service.list({} as any, { userId: oid().toString(), role: UserRole.Teacher });

      const query = exerciseModel.find.mock.calls[0][0];
      expect(query.classId).toBeUndefined();
      expect(query.$or).toBeUndefined();
      expect(enrollmentModel.find).not.toHaveBeenCalled();
    });

    it('admin → no class restriction', async () => {
      await service.list({} as any, { userId: oid().toString(), role: UserRole.Admin });

      const query = exerciseModel.find.mock.calls[0][0];
      expect(query.classId).toBeUndefined();
      expect(query.$or).toBeUndefined();
      expect(enrollmentModel.find).not.toHaveBeenCalled();
    });

    it('combines other filters (type/status/subject/grade) with the student class scope', async () => {
      enrollmentModel.find.mockReturnValue(leanChain([]));

      await service.list(
        { type: 'quiz', status: 'open', subject: 'Văn', grade: '5' } as any,
        { userId: oid().toString(), role: UserRole.Student },
      );

      const query = exerciseModel.find.mock.calls[0][0];
      expect(query.type).toBe('quiz');
      expect(query.status).toBe('open');
      expect(query.subject).toBe('Văn');
      expect(query.grade).toBe('5');
      expect(query.$or).toBeDefined();
    });

    it('attaches questionCount / attemptCount / learnerCount from aggregations', async () => {
      const e1 = oid();
      exerciseModel.find.mockReturnValue(leanChain([{ _id: e1, classId: null }]));
      exerciseModel.countDocuments.mockResolvedValue(1);
      exerciseQuestionModel.aggregate.mockResolvedValue([{ _id: e1, n: 4 }]);
      attemptModel.aggregate.mockResolvedValue([{ _id: e1, attempts: 9, learners: 3 }]);

      const res: any = await service.list({} as any, { userId: oid().toString(), role: UserRole.Admin });

      expect(res.records[0]).toMatchObject({ questionCount: 4, attemptCount: 9, learnerCount: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  // create — persists classId
  // ---------------------------------------------------------------------------
  describe('create persists classId', () => {
    it('converts a provided classId to an ObjectId', async () => {
      const userId = new Types.ObjectId().toString();
      const classId = new Types.ObjectId().toString();
      const newId = oid();
      exerciseModel.create.mockResolvedValue({ _id: newId });
      // create() calls findOne() at the end (via findOne pipeline) → stub it.
      exerciseModel.findById.mockReturnValue(leanChain({ _id: newId, userId: new Types.ObjectId(userId) }));
      exerciseQuestionModel.find.mockReturnValue(leanChain([]));
      questionModel.find.mockReturnValue(leanChain([]));

      await service.create({ title: 'Bài 1', classId } as any, userId);

      const arg = exerciseModel.create.mock.calls[0][0];
      expect(arg.classId).toBeInstanceOf(Types.ObjectId);
      expect(arg.classId.toString()).toBe(classId);
    });

    it('persists classId = null when explicitly cleared (empty string)', async () => {
      const userId = new Types.ObjectId().toString();
      const newId = oid();
      exerciseModel.create.mockResolvedValue({ _id: newId });
      exerciseModel.findById.mockReturnValue(leanChain({ _id: newId, userId: new Types.ObjectId(userId) }));
      exerciseQuestionModel.find.mockReturnValue(leanChain([]));
      questionModel.find.mockReturnValue(leanChain([]));

      await service.create({ title: 'Bài 2', classId: '' } as any, userId);

      const arg = exerciseModel.create.mock.calls[0][0];
      expect(arg.classId).toBeNull();
    });

    it('omits classId from the create payload when not provided', async () => {
      const userId = new Types.ObjectId().toString();
      const newId = oid();
      exerciseModel.create.mockResolvedValue({ _id: newId });
      exerciseModel.findById.mockReturnValue(leanChain({ _id: newId, userId: new Types.ObjectId(userId) }));
      exerciseQuestionModel.find.mockReturnValue(leanChain([]));
      questionModel.find.mockReturnValue(leanChain([]));

      await service.create({ title: 'Bài 3' } as any, userId);

      const arg = exerciseModel.create.mock.calls[0][0];
      expect('classId' in arg).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // update — persists classId
  // ---------------------------------------------------------------------------
  describe('update persists classId', () => {
    it('converts a provided classId to an ObjectId in the patch', async () => {
      const classId = new Types.ObjectId().toString();
      exerciseModel.findOneAndUpdate.mockReturnValue(leanChain({ _id: oid() }));

      await service.update(oid().toString(), { classId } as any, oid().toString(), UserRole.Admin);

      const patch = exerciseModel.findOneAndUpdate.mock.calls[0][1];
      expect(patch.classId).toBeInstanceOf(Types.ObjectId);
      expect(patch.classId.toString()).toBe(classId);
    });

    it('sets patch.classId = null when cleared', async () => {
      exerciseModel.findOneAndUpdate.mockReturnValue(leanChain({ _id: oid() }));

      await service.update(oid().toString(), { classId: '' } as any, oid().toString(), UserRole.Admin);

      const patch = exerciseModel.findOneAndUpdate.mock.calls[0][1];
      expect(patch.classId).toBeNull();
    });

    it('leaves classId out of the patch when not in the dto', async () => {
      exerciseModel.findOneAndUpdate.mockReturnValue(leanChain({ _id: oid() }));

      await service.update(oid().toString(), { title: 'rename' } as any, oid().toString(), UserRole.Admin);

      const patch = exerciseModel.findOneAndUpdate.mock.calls[0][1];
      expect('classId' in patch).toBe(false);
    });

    it('scopes the update to ownerId for a teacher and throws NotFound when unmatched', async () => {
      const userId = new Types.ObjectId().toString();
      exerciseModel.findOneAndUpdate.mockReturnValue(leanChain(null));

      await expect(
        service.update(oid().toString(), { title: 'x' } as any, userId, UserRole.Teacher),
      ).rejects.toBeInstanceOf(NotFoundException);

      const filter = exerciseModel.findOneAndUpdate.mock.calls[0][0];
      expect(filter.userId.toString()).toBe(userId);
    });
  });
});
