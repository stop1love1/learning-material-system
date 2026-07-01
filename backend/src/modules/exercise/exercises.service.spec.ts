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
import { UserRole } from '../../enums';

/**
 * Unit tests for ExercisesService — list() query building + enrichment counts
 * (questionCount / attemptCount / learnerCount / submittedCount / gradedCount)
 * plus create/update persistence. No live MongoDB: every model is a jest.fn()
 * bag; chainable query builders are emulated with a thenable lean chain.
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
    submissionModel = { deleteMany: jest.fn(), aggregate: jest.fn() };
    studentQuestionModel = { deleteMany: jest.fn() };
    exerciseModel.findOne.mockReturnValue(leanChain(null));

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

  describe('list query building', () => {
    beforeEach(() => {
      exerciseModel.find.mockReturnValue(leanChain([]));
      exerciseModel.countDocuments.mockResolvedValue(0);
      exerciseQuestionModel.aggregate.mockResolvedValue([]);
      attemptModel.aggregate.mockResolvedValue([]);
      submissionModel.aggregate.mockResolvedValue([]);
    });

    it('no longer applies any class/enrollment scoping (no classId in query)', async () => {
      await service.list({} as any, undefined);

      const query = exerciseModel.find.mock.calls[0][0];
      expect(query.classId).toBeUndefined();
      expect(query.$or).toBeUndefined();
    });

    it('anonymous, student, teacher and admin all get the same unscoped query', async () => {
      await service.list({} as any, { userId: oid().toString(), role: UserRole.Student });
      await service.list({} as any, { userId: oid().toString(), role: UserRole.Teacher });
      await service.list({} as any, { userId: oid().toString(), role: UserRole.Admin });

      for (const call of exerciseModel.find.mock.calls) {
        expect(call[0].classId).toBeUndefined();
        expect(call[0].$or).toBeUndefined();
      }
    });

    it('combines other filters (type/status/subject/grade)', async () => {
      await service.list(
        { type: 'quiz', status: 'open', subject: 'Văn', grade: '5' } as any,
        { userId: oid().toString(), role: UserRole.Student },
      );

      const query = exerciseModel.find.mock.calls[0][0];
      expect(query.type).toBe('quiz');
      expect(query.status).toBe('open');
      expect(query.subject).toBe('Văn');
      expect(query.grade).toBe('5');
    });

    it('attaches questionCount / attemptCount / learnerCount / submittedCount / gradedCount', async () => {
      const e1 = oid();
      exerciseModel.find.mockReturnValue(leanChain([{ _id: e1 }]));
      exerciseModel.countDocuments.mockResolvedValue(1);
      exerciseQuestionModel.aggregate.mockResolvedValue([{ _id: e1, n: 4 }]);
      attemptModel.aggregate
        .mockResolvedValueOnce([{ _id: e1, attempts: 9, learners: 3, submitted: 6 }])
        .mockResolvedValueOnce([{ _id: e1, graded: 2 }]);

      const res: any = await service.list({} as any, { userId: oid().toString(), role: UserRole.Admin });

      expect(res.records[0]).toMatchObject({
        questionCount: 4,
        attemptCount: 9,
        learnerCount: 3,
        submittedCount: 6,
        gradedCount: 2,
      });
    });

    it('defaults submittedCount / gradedCount to 0 when there are no attempts/submissions', async () => {
      const e1 = oid();
      exerciseModel.find.mockReturnValue(leanChain([{ _id: e1 }]));
      exerciseModel.countDocuments.mockResolvedValue(1);
      exerciseQuestionModel.aggregate.mockResolvedValue([]);
      attemptModel.aggregate.mockResolvedValue([]);
      submissionModel.aggregate.mockResolvedValue([]);

      const res: any = await service.list({} as any, { userId: oid().toString(), role: UserRole.Admin });

      expect(res.records[0]).toMatchObject({
        questionCount: 0,
        attemptCount: 0,
        learnerCount: 0,
        submittedCount: 0,
        gradedCount: 0,
      });
    });
  });

  describe('create', () => {
    const stubFindOnePipeline = (newId: any, userId: string) => {
      exerciseModel.findById.mockReturnValue(leanChain({ _id: newId, userId: new Types.ObjectId(userId) }));
      exerciseQuestionModel.find.mockReturnValue(leanChain([]));
      questionModel.find.mockReturnValue(leanChain([]));
    };

    it('creates the exercise and returns it via findOne (owner view)', async () => {
      const userId = new Types.ObjectId().toString();
      const newId = oid();
      exerciseModel.create.mockResolvedValue({ _id: newId });
      stubFindOnePipeline(newId, userId);

      await service.create({ title: 'Bài 1' } as any, userId);

      const arg = exerciseModel.create.mock.calls[0][0];
      expect(arg.title).toBe('Bài 1');
      expect(arg.userId).toBeInstanceOf(Types.ObjectId);
      expect('classId' in arg).toBe(false);
    });
  });

  describe('update', () => {
    it('applies a simple patch and returns the updated doc', async () => {
      exerciseModel.findOneAndUpdate.mockReturnValue(leanChain({ _id: oid(), title: 'renamed' }));

      const res: any = await service.update(oid().toString(), { title: 'renamed' } as any, oid().toString(), UserRole.Admin);

      const patch = exerciseModel.findOneAndUpdate.mock.calls[0][1];
      expect(patch.title).toBe('renamed');
      expect('classId' in patch).toBe(false);
      expect(res.title).toBe('renamed');
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
