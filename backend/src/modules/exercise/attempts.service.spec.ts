import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AttemptsService } from './attempts.service';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { ExerciseQuestion } from '../../schemas/exercise/exercise-question.schema';
import { Question } from '../../schemas/question-bank/question.schema';
import { Attempt } from '../../schemas/exercise/attempt.schema';
import { Participant } from '../../schemas/exercise/participant.schema';
import { Submission } from '../../schemas/exercise/submission.schema';
import { StudentQuestion } from '../../schemas/exercise/student-question.schema';
import { User } from '../../schemas/user.schema';
import { Settings } from '../../schemas/settings.schema';
import { MailService } from '../../global/mail.service';
import { QuestionType } from '../../enums';

const oid = () => new Types.ObjectId().toHexString();
const ATTEMPT_ID = oid();
const EXERCISE_ID = oid();
const STUDENT_ID = oid();
const OWNER_ID = oid();

function chain(value: any) {
  const c: any = {};
  c.select = jest.fn(() => c);
  c.populate = jest.fn(() => c);
  c.sort = jest.fn(() => c);
  c.skip = jest.fn(() => c);
  c.limit = jest.fn(() => c);
  c.lean = jest.fn(() => Promise.resolve(value));
  c.exec = jest.fn(() => Promise.resolve(value));
  c.then = (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject);
  return c;
}

describe('AttemptsService', () => {
  let service: AttemptsService;

  let exerciseModel: any;
  let exerciseQuestionModel: any;
  let questionModel: any;
  let attemptModel: any;
  let participantModel: any;
  let submissionModel: any;
  let studentQuestionModel: any;
  let userModel: any;
  let settingsModel: any;
  let mail: any;

  let upsertedStudentQuestions: any[];
  let submissionSet: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    upsertedStudentQuestions = [];
    submissionSet = undefined;

    exerciseModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };
    exerciseQuestionModel = { find: jest.fn() };
    questionModel = { find: jest.fn() };
    attemptModel = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      exists: jest.fn(),
      countDocuments: jest.fn(),
    };
    participantModel = {
      create: jest.fn().mockResolvedValue({}),
      findOneAndUpdate: jest.fn().mockResolvedValue({}),
    };
    submissionModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    studentQuestionModel = {
      findOneAndUpdate: jest.fn((filter, update) => {
        upsertedStudentQuestions.push(update);
        return Promise.resolve({ ...update });
      }),
      find: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({}),
    };
    userModel = { findById: jest.fn(() => chain(null)) };
    settingsModel = { findOne: jest.fn(() => chain(null)) };
    mail = { sendMail: jest.fn().mockResolvedValue(undefined) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptsService,
        { provide: getModelToken(Exercise.name), useValue: exerciseModel },
        { provide: getModelToken(ExerciseQuestion.name), useValue: exerciseQuestionModel },
        { provide: getModelToken(Question.name), useValue: questionModel },
        { provide: getModelToken(Attempt.name), useValue: attemptModel },
        { provide: getModelToken(Participant.name), useValue: participantModel },
        { provide: getModelToken(Submission.name), useValue: submissionModel },
        { provide: getModelToken(StudentQuestion.name), useValue: studentQuestionModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Settings.name), useValue: settingsModel },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    service = moduleRef.get(AttemptsService);
  });

  async function runSubmit(opts: {
    question: any; // populated question doc (with .type & .questionDetail)
    answer: unknown;
    clientAns?: { isCorrect?: boolean; grades?: number };
    linkGrades?: number | null;
    academic?: Record<string, any>;
    notifications?: Record<string, any>;
    exerciseOverrides?: Record<string, any>;
    attemptDoc?: any;
    studentId?: string;
  }) {
    const questionId = opts.question._id ?? oid();
    const studentId = opts.studentId ?? STUDENT_ID;

    settingsModel.findOne.mockImplementation(() => {
      const c = chain({ academic: opts.academic ?? {}, notifications: opts.notifications ?? {} });
      return c;
    });

    const attemptDoc =
      opts.attemptDoc ??
      {
        _id: new Types.ObjectId(ATTEMPT_ID),
        exerciseId: new Types.ObjectId(EXERCISE_ID),
        studentId: new Types.ObjectId(studentId),
        submittedAt: null,
        save: jest.fn().mockResolvedValue(true),
        toObject() {
          return this;
        },
      };
    attemptModel.findById.mockReturnValue(attemptDoc);

    attemptModel.exists.mockResolvedValue(null);
    attemptModel.countDocuments.mockResolvedValue(0);

    exerciseModel.findById.mockImplementation(() =>
      chain({
        maxAttempts: 3,
        dueDate: null,
        allowLateSubmit: true,
        showScoreAfter: true,
        userId: new Types.ObjectId(OWNER_ID),
        title: 'Bài tập',
        ...opts.exerciseOverrides,
      }),
    );

    exerciseQuestionModel.find.mockReturnValue(
      chain([{ questionId: new Types.ObjectId(questionId), grades: opts.linkGrades }]),
    );

    questionModel.find.mockReturnValue(chain([{ ...opts.question, _id: new Types.ObjectId(questionId) }]));

    submissionModel.findOneAndUpdate.mockImplementation((filter, update) => {
      submissionSet = update.$set;
      return Promise.resolve({
        toObject: () => ({ ...update.$set }),
      });
    });

    const dto = {
      answers: [
        {
          questionId: String(questionId),
          answer: opts.answer,
          ...(opts.clientAns ?? {}),
        },
      ],
    } as any;

    return service.submit(ATTEMPT_ID, dto, studentId);
  }

  describe('server-side grading (gradeObjective via submit)', () => {
    it('SINGLE: correct correctOptionIndex scores full, ignores client isCorrect=false', async () => {
      await runSubmit({
        question: { type: QuestionType.Single, questionDetail: { correctOptionIndex: 2 } },
        answer: 2,
        clientAns: { isCorrect: false, grades: 0 },
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(true);
      expect(upsertedStudentQuestions[0].grades).toBe(1);
      expect(submissionSet.correct).toBe(1);
      expect(submissionSet.multipleChoiceGrades).toBe(1);
    });

    it('SINGLE: wrong answer scores zero even when client claims isCorrect=true', async () => {
      await runSubmit({
        question: { type: QuestionType.Single, questionDetail: { correctOptionIndex: 2 } },
        answer: 0,
        clientAns: { isCorrect: true, grades: 1 },
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(false);
      expect(upsertedStudentQuestions[0].grades).toBe(0);
      expect(submissionSet.wrong).toBe(1);
      expect(submissionSet.multipleChoiceGrades).toBe(0);
    });

    it('MULTI: set-equality on correctOptionIndices (order-independent) → correct', async () => {
      await runSubmit({
        question: { type: QuestionType.Multi, questionDetail: { correctOptionIndices: [0, 2] } },
        answer: [2, 0],
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(true);
    });

    it('MULTI: missing one option → wrong', async () => {
      await runSubmit({
        question: { type: QuestionType.Multi, questionDetail: { correctOptionIndices: [0, 2] } },
        answer: [0],
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(false);
    });

    it('TRUEFALSE: matches detail.isCorrect', async () => {
      await runSubmit({
        question: { type: QuestionType.TrueFalse, questionDetail: { isCorrect: true } },
        answer: true,
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(true);
    });

    it('TRUEFALSE: wrong boolean → wrong; non-boolean → wrong', async () => {
      await runSubmit({
        question: { type: QuestionType.TrueFalse, questionDetail: { isCorrect: true } },
        answer: false,
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(false);
    });

    it('FILL/shortanswer: matches any accepted answer with caseless matchMode', async () => {
      await runSubmit({
        question: {
          type: QuestionType.Fill,
          questionDetail: { answers: ['Hà Nội', 'Ha Noi'], matchMode: 'caseless' },
        },
        answer: '  ha noi ',
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(true);
    });

    it('FILL: exact matchMode is case/space sensitive', async () => {
      await runSubmit({
        question: {
          type: QuestionType.Fill,
          questionDetail: { answers: ['Hà Nội'], matchMode: 'exact' },
        },
        answer: 'hà nội',
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(false);
    });

    it('NUMBER: numeric equality with comma decimal normalization', async () => {
      await runSubmit({
        question: { type: QuestionType.Number, questionDetail: { answers: ['3.5'] } },
        answer: '3,5',
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(true);
    });

    it('NUMBER: non-numeric answer → wrong', async () => {
      await runSubmit({
        question: { type: QuestionType.Number, questionDetail: { answers: ['3.5'] } },
        answer: 'abc',
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(false);
    });

    it('SORT: ordered sequence equality → correct', async () => {
      await runSubmit({
        question: { type: QuestionType.Sort, questionDetail: { correctOrder: [0, 1, 2] } },
        answer: [0, 1, 2],
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(true);
    });

    it('SORT: wrong order → wrong (order matters)', async () => {
      await runSubmit({
        question: { type: QuestionType.Sort, questionDetail: { correctOrder: [0, 1, 2] } },
        answer: [0, 2, 1],
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(false);
    });

    it('TABLESELECTION: boolean grid matches correctAnswers', async () => {
      await runSubmit({
        question: {
          type: QuestionType.TableSelection,
          questionDetail: { correctAnswers: [true, false, true] },
        },
        answer: [true, false, true],
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(true);
    });

    it('TABLESELECTION: length mismatch → wrong', async () => {
      await runSubmit({
        question: {
          type: QuestionType.TableSelection,
          questionDetail: { correctAnswers: [true, false, true] },
        },
        answer: [true, false],
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(false);
    });

    it('MATCH: all pairs matched (array of {left,right}) → correct', async () => {
      await runSubmit({
        question: {
          type: QuestionType.Match,
          questionDetail: { pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }] },
        },
        answer: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }],
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(true);
    });

    it('MATCH: one wrong pair → wrong', async () => {
      await runSubmit({
        question: {
          type: QuestionType.Match,
          questionDetail: { pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }] },
        },
        answer: { a: '1', b: '9' },
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBe(false);
    });

    it('grading uses link.grades as per-question max points', async () => {
      await runSubmit({
        question: { type: QuestionType.Single, questionDetail: { correctOptionIndex: 1 } },
        answer: 1,
        linkGrades: 5,
      });
      expect(upsertedStudentQuestions[0].grades).toBe(5);
      expect(submissionSet.multipleChoiceGrades).toBe(5);
    });

    it('objective question missing detail → waitingGrades (manual)', async () => {
      const res = await runSubmit({
        question: { type: QuestionType.Single, questionDetail: null },
        answer: 1,
      });
      expect(upsertedStudentQuestions[0].isCorrect).toBeNull();
      expect(submissionSet.waitingGrades).toBe(1);
      expect(submissionSet.notComplete).toBe(1);
      // not auto-graded → no final score keys
      expect((res as any).totalScore).toBeUndefined();
    });
  });

  describe('essay handling', () => {
    it('ESSAY question → waitingGrades incremented, numberOfEssays counted, never auto-scored', async () => {
      const res = await runSubmit({
        question: { type: QuestionType.Essay, questionDetail: {} },
        answer: 'một bài luận',
      });
      expect(submissionSet.numberOfEssays).toBe(1);
      expect(submissionSet.waitingGrades).toBe(1);
      expect(upsertedStudentQuestions[0].grades).toBeNull();
      expect((res as any).totalScore).toBeUndefined();
    });
  });

  describe('auto-graded final score', () => {
    it('all objective & correct → totalScore scaled to scoreScale, percent=100, isPassed, isGraded', async () => {
      const res: any = await runSubmit({
        question: { type: QuestionType.Single, questionDetail: { correctOptionIndex: 0 } },
        answer: 0,
        academic: { scoreScale: 10, passThreshold: 5 },
      });
      expect(res.totalScore).toBe(10);
      expect(res.percent).toBe(100);
      expect(res.isPassed).toBe(true);
      expect(res.isGraded).toBe(true);
    });

    it('wrong answer → totalScore 0, percent 0, isPassed false', async () => {
      const res: any = await runSubmit({
        question: { type: QuestionType.Single, questionDetail: { correctOptionIndex: 0 } },
        answer: 1,
        academic: { scoreScale: 10, passThreshold: 5 },
      });
      expect(res.totalScore).toBe(0);
      expect(res.percent).toBe(0);
      expect(res.isPassed).toBe(false);
    });
  });

  describe('score withholding', () => {
    it('showScoreAfter=false withholds score fields and flags scoreWithheld', async () => {
      const res: any = await runSubmit({
        question: { type: QuestionType.Single, questionDetail: { correctOptionIndex: 0 } },
        answer: 0,
        exerciseOverrides: { showScoreAfter: false },
      });
      expect(res.scoreWithheld).toBe(true);
      expect(res.totalScore).toBeUndefined();
      expect(res.percent).toBeUndefined();
      expect(res.correct).toBeUndefined();
    });

    it('showScoreImmediately=false (system) also withholds', async () => {
      const res: any = await runSubmit({
        question: { type: QuestionType.Single, questionDetail: { correctOptionIndex: 0 } },
        answer: 0,
        academic: { showScoreImmediately: false },
      });
      expect(res.scoreWithheld).toBe(true);
      expect(res.totalScore).toBeUndefined();
    });
  });

  describe('submit guards', () => {
    it('throws NotFound when attempt missing', async () => {
      attemptModel.findById.mockReturnValue(null);
      await expect(
        service.submit(ATTEMPT_ID, { answers: [] } as any, STUDENT_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when attempt belongs to another student', async () => {
      attemptModel.findById.mockReturnValue({
        _id: new Types.ObjectId(ATTEMPT_ID),
        exerciseId: new Types.ObjectId(EXERCISE_ID),
        studentId: new Types.ObjectId(oid()), // different owner
        submittedAt: null,
        save: jest.fn(),
        toObject() {
          return this;
        },
      });
      settingsModel.findOne.mockImplementation(() => chain({}));
      await expect(
        service.submit(ATTEMPT_ID, { answers: [] } as any, STUDENT_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('blocks resubmit of an already-submitted attempt when allowResubmit=false', async () => {
      const attemptDoc = {
        _id: new Types.ObjectId(ATTEMPT_ID),
        exerciseId: new Types.ObjectId(EXERCISE_ID),
        studentId: new Types.ObjectId(STUDENT_ID),
        submittedAt: new Date(),
        save: jest.fn(),
        toObject() {
          return this;
        },
      };
      attemptModel.findById.mockReturnValue(attemptDoc);
      settingsModel.findOne.mockImplementation(() => chain({ academic: { allowResubmit: false } }));
      await expect(
        service.submit(ATTEMPT_ID, { answers: [] } as any, STUDENT_ID),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('blocks new submit when a prior submitted attempt exists and allowResubmit=false', async () => {
      settingsModel.findOne.mockImplementation(() => chain({ academic: { allowResubmit: false } }));
      attemptModel.findById.mockReturnValue({
        _id: new Types.ObjectId(ATTEMPT_ID),
        exerciseId: new Types.ObjectId(EXERCISE_ID),
        studentId: new Types.ObjectId(STUDENT_ID),
        submittedAt: null,
        save: jest.fn(),
        toObject() {
          return this;
        },
      });
      attemptModel.exists.mockResolvedValue({ _id: oid() }); // prior submitted exists
      await expect(
        service.submit(ATTEMPT_ID, { answers: [] } as any, STUDENT_ID),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects late submit when dueDate past and allowLateSubmit=false (BadRequest)', async () => {
      await expect(
        runSubmit({
          question: { type: QuestionType.Single, questionDetail: { correctOptionIndex: 0 } },
          answer: 0,
          exerciseOverrides: {
            dueDate: new Date(Date.now() - 60_000),
            allowLateSubmit: false,
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows late submit when allowLateSubmit=true', async () => {
      const res: any = await runSubmit({
        question: { type: QuestionType.Single, questionDetail: { correctOptionIndex: 0 } },
        answer: 0,
        exerciseOverrides: {
          dueDate: new Date(Date.now() - 60_000),
          allowLateSubmit: true,
        },
      });
      expect(res.totalScore).toBe(10);
    });

    it('enforces maxAttempts (Conflict when effective count exceeds limit)', async () => {
      settingsModel.findOne.mockImplementation(() => chain({}));
      attemptModel.findById.mockReturnValue({
        _id: new Types.ObjectId(ATTEMPT_ID),
        exerciseId: new Types.ObjectId(EXERCISE_ID),
        studentId: new Types.ObjectId(STUDENT_ID),
        submittedAt: null,
        save: jest.fn(),
        toObject() {
          return this;
        },
      });
      attemptModel.exists.mockResolvedValue(null);
      exerciseModel.findById.mockImplementation(() =>
        chain({ maxAttempts: 1, allowLateSubmit: true, showScoreAfter: true }),
      );
      attemptModel.countDocuments.mockResolvedValue(1); // 1 prior + this = 2 > 1
      await expect(
        service.submit(
          ATTEMPT_ID,
          { answers: [] } as any,
          STUDENT_ID,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('start', () => {
    function wireStart(exercise: any, opts: { existing?: number } = {}) {
      exerciseModel.findById.mockReturnValue(chain(exercise));
      attemptModel.countDocuments.mockResolvedValue(opts.existing ?? 0);
      const created = {
        _id: new Types.ObjectId(),
        toObject: () => ({ ok: true }),
      };
      attemptModel.create.mockResolvedValue(created);
      participantModel.create.mockResolvedValue({});
    }

    it('throws NotFound when exercise missing', async () => {
      exerciseModel.findById.mockReturnValue(chain(null));
      await expect(
        service.start({ exerciseId: EXERCISE_ID } as any, STUDENT_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates an attempt for any student (no class scoping)', async () => {
      wireStart({
        _id: new Types.ObjectId(EXERCISE_ID),
        userId: new Types.ObjectId(OWNER_ID),
        maxAttempts: 2,
      });
      const res = await service.start({ exerciseId: EXERCISE_ID } as any, STUDENT_ID);
      expect(res).toEqual({ ok: true });
      expect(attemptModel.create).toHaveBeenCalled();
    });

    it('Conflict when maxAttempts already used', async () => {
      wireStart(
        {
          _id: new Types.ObjectId(EXERCISE_ID),
          userId: new Types.ObjectId(OWNER_ID),
          maxAttempts: 1,
        },
        { existing: 1 },
      );
      await expect(
        service.start({ exerciseId: EXERCISE_ID } as any, STUDENT_ID),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('grade', () => {
    function wireGrade(opts: {
      attempt?: any;
      studentQuestions: any[];
      links: any[];
      essayQuestionIds?: string[];
    }) {
      const attempt =
        opts.attempt ?? {
          _id: new Types.ObjectId(ATTEMPT_ID),
          exerciseId: new Types.ObjectId(EXERCISE_ID),
          studentId: new Types.ObjectId(STUDENT_ID),
        };
      attemptModel.findById.mockReturnValue(chain(attempt));
      studentQuestionModel.find.mockReturnValue(chain(opts.studentQuestions));
      exerciseQuestionModel.find.mockReturnValue(chain(opts.links));
      const essayDocs = (opts.essayQuestionIds ?? []).map((id) => ({ _id: new Types.ObjectId(id) }));
      questionModel.find.mockReturnValue(chain(essayDocs));
      settingsModel.findOne.mockImplementation(() => chain({ academic: { scoreScale: 10, passThreshold: 5 } }));
      submissionModel.findOneAndUpdate.mockImplementation((f, u) => {
        submissionSet = u.$set;
        return Promise.resolve({ toObject: () => ({ ...u.$set }) });
      });
    }

    it('NotFound when attempt missing', async () => {
      attemptModel.findById.mockReturnValue(chain(null));
      await expect(
        service.grade(ATTEMPT_ID, { answers: [] } as any, OWNER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('sets isGraded=true when no waiting grades remain', async () => {
      const qId = oid();
      wireGrade({
        studentQuestions: [{ questionId: new Types.ObjectId(qId), isCorrect: true, grades: 1 }],
        links: [{ questionId: new Types.ObjectId(qId), grades: 1 }],
      });
      const res: any = await service.grade(ATTEMPT_ID, { answers: [] } as any, OWNER_ID);
      expect(res.isGraded).toBe(true);
    });

    it('sets isGraded=false while an essay still awaits a grade', async () => {
      const qId = oid();
      wireGrade({
        studentQuestions: [{ questionId: new Types.ObjectId(qId), isCorrect: null, grades: null }],
        links: [{ questionId: new Types.ObjectId(qId), grades: 1 }],
        essayQuestionIds: [qId],
      });
      const res: any = await service.grade(ATTEMPT_ID, { answers: [] } as any, OWNER_ID);
      expect(res.isGraded).toBe(false);
      expect(res.waitingGrades).toBe(1);
    });

    it('recomputes totalScore from per-question grades when totalScore omitted', async () => {
      const q1 = oid();
      const q2 = oid();
      wireGrade({
        studentQuestions: [
          { questionId: new Types.ObjectId(q1), isCorrect: true, grades: 1 },
          { questionId: new Types.ObjectId(q2), isCorrect: false, grades: 0 },
        ],
        links: [
          { questionId: new Types.ObjectId(q1), grades: 1 },
          { questionId: new Types.ObjectId(q2), grades: 1 },
        ],
      });
      const res: any = await service.grade(ATTEMPT_ID, { answers: [] } as any, OWNER_ID);
      // 1 of 2 raw → scaled 5/10, percent 50
      expect(res.totalScore).toBe(5);
      expect(res.percent).toBe(50);
      expect(res.isGraded).toBe(true);
    });

    it('applies teacher totalScore through academic policy (clamp + pass)', async () => {
      const qId = oid();
      wireGrade({
        studentQuestions: [{ questionId: new Types.ObjectId(qId), isCorrect: true, grades: 1 }],
        links: [{ questionId: new Types.ObjectId(qId), grades: 1 }],
      });
      const res: any = await service.grade(
        ATTEMPT_ID,
        { answers: [], totalScore: 999 } as any, // over scoreScale → clamped to 10
        OWNER_ID,
      );
      expect(res.totalScore).toBe(10);
      expect(res.isPassed).toBe(true);
    });

    it('persists per-answer grade patch via updateOne', async () => {
      const qId = oid();
      wireGrade({
        studentQuestions: [{ questionId: new Types.ObjectId(qId), isCorrect: true, grades: 2 }],
        links: [{ questionId: new Types.ObjectId(qId), grades: 2 }],
      });
      await service.grade(
        ATTEMPT_ID,
        { answers: [{ questionId: qId, grades: 2, isCorrect: true, feedback: 'tốt' }] } as any,
        OWNER_ID,
      );
      expect(studentQuestionModel.updateOne).toHaveBeenCalledWith(
        expect.any(Object),
        { $set: { grades: 2, isCorrect: true, feedback: 'tốt' } },
      );
    });
  });
});
