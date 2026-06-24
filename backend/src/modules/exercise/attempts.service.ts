import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { ExerciseQuestion } from '../../schemas/exercise/exercise-question.schema';
import { Question } from '../../schemas/question-bank/question.schema';
import { Attempt } from '../../schemas/exercise/attempt.schema';
import { Participant } from '../../schemas/exercise/participant.schema';
import { Submission } from '../../schemas/exercise/submission.schema';
import { StudentQuestion } from '../../schemas/exercise/student-question.schema';
import { buildPagination, convertStringToObjectId, getPagination } from '../../common/utils';
import { QuestionType } from '../../enums';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { GradeAttemptDto } from './dto/grade-attempt.dto';
import { ListAttemptsDto } from './dto/list-attempts.dto';

@Injectable()
export class AttemptsService {
  constructor(
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<Exercise>,
    @InjectModel(ExerciseQuestion.name) private readonly exerciseQuestionModel: Model<ExerciseQuestion>,
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
    @InjectModel(Attempt.name) private readonly attemptModel: Model<Attempt>,
    @InjectModel(Participant.name) private readonly participantModel: Model<Participant>,
    @InjectModel(Submission.name) private readonly submissionModel: Model<Submission>,
    @InjectModel(StudentQuestion.name) private readonly studentQuestionModel: Model<StudentQuestion>,
  ) {}

  async start(dto: StartAttemptDto, userId: string) {
    const exerciseId = convertStringToObjectId(dto.exerciseId);
    const exercise = await this.exerciseModel.findById(exerciseId).lean();
    if (!exercise) throw new NotFoundException('Không tìm thấy bài tập');

    const studentId = convertStringToObjectId(userId);
    const existing = await this.attemptModel.countDocuments({ exerciseId, studentId });

    const maxAttempts = exercise.maxAttempts ?? 1;
    if (existing >= maxAttempts) {
      throw new ConflictException(`Bạn đã dùng hết ${maxAttempts} lượt làm cho bài tập này`);
    }

    const attempt = await this.attemptModel.create({
      exerciseId,
      studentId,
      attemptNumber: existing + 1,
    });

    await this.participantModel.create({
      attemptId: attempt._id,
      studentId,
      startedAt: new Date(),
    });

    return attempt.toObject();
  }

  async submit(attemptId: string, dto: SubmitAttemptDto, userId: string) {
    const id = convertStringToObjectId(attemptId);
    const studentId = convertStringToObjectId(userId);
    const attempt = await this.attemptModel.findById(id);
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm');
    if (!attempt.studentId || attempt.studentId.toString() !== studentId.toString()) {
      throw new ForbiddenException('Không có quyền nộp lượt làm này');
    }

    // Determine which questions of this exercise are essays, so essay points are
    // bucketed into essayGrades (not multipleChoiceGrades) and counted.
    const links = await this.exerciseQuestionModel
      .find({ exerciseId: attempt.exerciseId })
      .select('questionId')
      .lean();
    const qIds = links.map((l) => l.questionId);
    const essayDocs = await this.questionModel
      .find({ _id: { $in: qIds }, type: QuestionType.Essay })
      .select('_id')
      .lean();
    const essayIds = new Set(essayDocs.map((q) => String(q._id)));

    let correct = 0;
    let wrong = 0;
    let notComplete = 0;
    let waitingGrades = 0;
    let numberOfEssays = 0;
    let multipleChoiceGrades = 0;
    let essayGrades: number | null = null;

    for (const ans of dto.answers) {
      const questionId = convertStringToObjectId(ans.questionId);
      const isCorrect = ans.isCorrect === undefined ? null : ans.isCorrect;
      const grades = ans.grades === undefined ? null : ans.grades;

      await this.studentQuestionModel.findOneAndUpdate(
        { attemptId: id, questionId },
        {
          attemptId: id,
          questionId,
          studentId,
          answer: ans.answer ?? null,
          isCorrect,
          grades,
        },
        { upsert: true, new: true },
      );

      if (isCorrect === true) correct += 1;
      else if (isCorrect === false) wrong += 1;
      else notComplete += 1;

      const isEssay = essayIds.has(String(questionId));
      if (isEssay) {
        numberOfEssays += 1;
        if (grades !== null) essayGrades = (essayGrades ?? 0) + grades;
        else waitingGrades += 1;
      } else if (grades !== null) {
        multipleChoiceGrades += grades;
      } else if (isCorrect === null) {
        waitingGrades += 1;
      }
    }

    const submission = await this.submissionModel.findOneAndUpdate(
      { attemptId: id },
      {
        $set: {
          attemptId: id,
          correct,
          wrong,
          notComplete,
          waitingGrades,
          numberOfEssays,
          multipleChoiceGrades,
          essayGrades,
          submittedAt: new Date(),
        },
        $inc: { submissionCount: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    attempt.submittedAt = new Date();
    await attempt.save();

    await this.participantModel.findOneAndUpdate(
      { attemptId: id },
      { isFinished: true, endedAt: new Date() },
    );

    return submission.toObject();
  }

  async result(attemptId: string, userId: string) {
    const id = convertStringToObjectId(attemptId);
    const attempt = await this.attemptModel.findById(id).lean();
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm');

    // Allow the owning student OR the exercise's author/teacher.
    const isOwner = attempt.studentId && attempt.studentId.toString() === userId;
    if (!isOwner) {
      const exercise = await this.exerciseModel.findById(attempt.exerciseId).select('userId').lean();
      const isAuthor = exercise && exercise.userId?.toString() === userId;
      if (!isAuthor) throw new ForbiddenException('Không có quyền xem kết quả này');
    }

    const [submission, studentQuestions] = await Promise.all([
      this.submissionModel.findOne({ attemptId: id }).lean(),
      this.studentQuestionModel.find({ attemptId: id }).lean(),
    ]);

    return { attempt, submission, studentQuestions };
  }

  async grade(attemptId: string, dto: GradeAttemptDto, graderId: string) {
    const id = convertStringToObjectId(attemptId);
    const attempt = await this.attemptModel.findById(id).lean();
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm');

    for (const ans of dto.answers) {
      const questionId = convertStringToObjectId(ans.questionId);
      const patch: Record<string, unknown> = {};
      if (ans.grades !== undefined) patch.grades = ans.grades;
      if (ans.isCorrect !== undefined) patch.isCorrect = ans.isCorrect;
      if (ans.feedback !== undefined) patch.feedback = ans.feedback;
      if (Object.keys(patch).length === 0) continue;
      await this.studentQuestionModel.updateOne({ attemptId: id, questionId }, { $set: patch });
    }

    const studentQuestions = await this.studentQuestionModel.find({ attemptId: id }).lean();
    const links = await this.exerciseQuestionModel
      .find({ exerciseId: attempt.exerciseId })
      .select('questionId')
      .lean();
    const essayDocs = await this.questionModel
      .find({ _id: { $in: links.map((l) => l.questionId) }, type: QuestionType.Essay })
      .select('_id')
      .lean();
    const essayIds = new Set(essayDocs.map((q) => String(q._id)));

    let correct = 0;
    let wrong = 0;
    let notComplete = 0;
    let waitingGrades = 0;
    let numberOfEssays = 0;
    let multipleChoiceGrades = 0;
    let essayGrades: number | null = null;

    for (const sq of studentQuestions) {
      if (sq.isCorrect === true) correct += 1;
      else if (sq.isCorrect === false) wrong += 1;
      else notComplete += 1;

      const isEssay = essayIds.has(String(sq.questionId));
      if (isEssay) {
        numberOfEssays += 1;
        if (sq.grades !== null && sq.grades !== undefined) essayGrades = (essayGrades ?? 0) + sq.grades;
        else waitingGrades += 1;
      } else if (sq.grades !== null && sq.grades !== undefined) {
        multipleChoiceGrades += sq.grades;
      } else if (sq.isCorrect === null || sq.isCorrect === undefined) {
        waitingGrades += 1;
      }
    }

    const set: Record<string, unknown> = {
      correct,
      wrong,
      notComplete,
      waitingGrades,
      numberOfEssays,
      multipleChoiceGrades,
      essayGrades,
      isGraded: true,
      gradedBy: convertStringToObjectId(graderId),
      gradedAt: new Date(),
    };
    if (dto.totalScore !== undefined) set.totalScore = dto.totalScore;
    if (dto.percent !== undefined) set.percent = dto.percent;
    if (dto.feedback !== undefined) set.feedback = dto.feedback;

    const submission = await this.submissionModel.findOneAndUpdate(
      { attemptId: id },
      { $set: set },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return submission ? submission.toObject() : null;
  }

  async listForGrading(dto: ListAttemptsDto) {
    const { page, pageSize } = getPagination(undefined, dto.page, dto.pageSize);
    const query: Record<string, any> = {
      ...(dto.exerciseId ? { exerciseId: convertStringToObjectId(dto.exerciseId) } : {}),
      ...(dto.studentId ? { studentId: convertStringToObjectId(dto.studentId) } : {}),
      submittedAt: { $ne: null },
    };

    // pendingOnly: loại các lượt đã có submission đã chấm — đưa vào query TRƯỚC khi
    // phân trang để total + số bản ghi mỗi trang đều chính xác.
    if (dto.pendingOnly === 'true') {
      const gradedSubs = await this.submissionModel.find({ isGraded: true }).select('attemptId').lean();
      const gradedIds = gradedSubs.map((s: any) => s.attemptId).filter(Boolean);
      if (gradedIds.length) query._id = { $nin: gradedIds };
    }

    const [attempts, total] = await Promise.all([
      this.attemptModel
        .find(query)
        .sort({ submittedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate({ path: 'studentId', select: 'name email avatar' })
        .populate({ path: 'exerciseId', select: 'title type points' })
        .lean(),
      this.attemptModel.countDocuments(query),
    ]);

    const attemptIds = attempts.map((a: any) => a._id);
    const submissions = await this.submissionModel.find({ attemptId: { $in: attemptIds } }).lean();
    const subMap = new Map(submissions.map((s: any) => [s.attemptId.toString(), s]));

    const records = attempts.map((a: any) => {
      const submission = subMap.get(a._id.toString()) ?? null;
      return {
        ...a,
        submission,
        status: submission ? (submission.isGraded ? 'graded' : 'submitted') : 'submitted',
      };
    });

    return buildPagination(records, total, page, pageSize);
  }

  async listMine(userId: string) {
    const studentId = convertStringToObjectId(userId);
    const attempts = await this.attemptModel.find({ studentId }).sort({ createdAt: -1 }).lean();
    if (!attempts.length) return [];
    const submissions = await this.submissionModel
      .find({ attemptId: { $in: attempts.map((a: any) => a._id) } })
      .lean();
    const subMap = new Map(submissions.map((s: any) => [s.attemptId.toString(), s]));
    return attempts.map((a: any) => {
      const submission = subMap.get(a._id.toString()) ?? null;
      const status = a.submittedAt
        ? submission && submission.isGraded
          ? 'graded'
          : 'submitted'
        : 'in-progress';
      return {
        _id: a._id,
        exerciseId: a.exerciseId,
        attemptNumber: a.attemptNumber,
        submittedAt: a.submittedAt ?? null,
        status,
        totalScore: submission ? submission.totalScore ?? null : null,
        percent: submission ? submission.percent ?? null : null,
      };
    });
  }
}
