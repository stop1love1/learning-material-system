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
import { convertStringToObjectId } from '../../common/utils';
import { QuestionType } from '../../enums';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

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
}
