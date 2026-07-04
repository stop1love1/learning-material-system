import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { ExerciseQuestion } from '../../schemas/exercise/exercise-question.schema';
import { Question } from '../../schemas/question-bank/question.schema';
import { Attempt } from '../../schemas/exercise/attempt.schema';
import { Participant } from '../../schemas/exercise/participant.schema';
import { Submission } from '../../schemas/exercise/submission.schema';
import { StudentQuestion } from '../../schemas/exercise/student-question.schema';
import { buildPagination, convertStringToObjectId, getPagination, parseKeyword } from '../../common/utils';
import { ExerciseStatus, UserRole } from '../../enums';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ListExercisesDto } from './dto/list-exercises.dto';
import { AddExerciseQuestionDto } from './dto/add-exercise-question.dto';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<Exercise>,
    @InjectModel(ExerciseQuestion.name) private readonly exerciseQuestionModel: Model<ExerciseQuestion>,
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
    @InjectModel(Attempt.name) private readonly attemptModel: Model<Attempt>,
    @InjectModel(Participant.name) private readonly participantModel: Model<Participant>,
    @InjectModel(Submission.name) private readonly submissionModel: Model<Submission>,
    @InjectModel(StudentQuestion.name) private readonly studentQuestionModel: Model<StudentQuestion>,
  ) {}

  async list(dto: ListExercisesDto, viewer?: { userId?: string; role?: UserRole }) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    const safeKeyword = parseKeyword(keyword);
    const query: Record<string, any> = {
      ...(safeKeyword ? { title: { $regex: safeKeyword, $options: 'i' } } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.subject ? { subject: dto.subject } : {}),
      ...(dto.grade ? { grade: dto.grade } : {}),
      ...(dto.folderId ? { folderId: convertStringToObjectId(dto.folderId) } : {}),
    };

    // Bài tập nháp (draft) chỉ chủ sở hữu / Admin được thấy — khách & người dùng bị ẩn.
    const isAdmin = viewer?.role === UserRole.Admin;
    const viewerId = viewer?.userId ? convertStringToObjectId(viewer.userId) : null;
    if (!isAdmin) {
      if (dto.status === ExerciseStatus.Draft) {
        // Lọc rõ theo 'draft': chỉ trả về draft DO MÌNH sở hữu (khách → không có gì).
        if (viewerId) query.userId = viewerId;
        else query._id = { $in: [] };
      } else if (!dto.status) {
        // Không lọc status: ẩn draft, nhưng vẫn cho chủ thấy draft của chính mình (màn giao bài).
        if (viewerId) query.$or = [{ status: { $ne: ExerciseStatus.Draft } }, { userId: viewerId }];
        else query.status = { $ne: ExerciseStatus.Draft };
      }
    }

    const SORT_FIELD: Record<string, string> = { date: 'createdAt', points: 'points', name: 'title' };
    const sortField = SORT_FIELD[dto.sortBy as string] || 'createdAt';
    const sortDir: 1 | -1 = dto.order === 'asc' ? 1 : -1;
    const listQuery = this.exerciseModel
      .find(query)
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();
    if (sortField === 'title') listQuery.collation({ locale: 'vi', strength: 1 });
    const [records, total] = await Promise.all([
      listQuery,
      this.exerciseModel.countDocuments(query),
    ]);

    const ids = records.map((r: any) => r._id);
    const counts = await this.exerciseQuestionModel.aggregate([
      { $match: { exerciseId: { $in: ids } } },
      { $group: { _id: '$exerciseId', n: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c: any) => [c._id.toString(), c.n]));

    const attemptAgg = await this.attemptModel.aggregate([
      { $match: { exerciseId: { $in: ids } } },
      {
        $group: {
          _id: '$exerciseId',
          attempts: { $sum: 1 },
          learners: { $addToSet: { $ifNull: ['$studentId', '$sessionId'] } },
          submitted: { $sum: { $cond: [{ $ne: ['$submittedAt', null] }, 1, 0] } },
        },
      },
      { $project: { attempts: 1, submitted: 1, learners: { $size: '$learners' } } },
    ]);
    const attemptMap = new Map(attemptAgg.map((a: any) => [a._id.toString(), a]));

    const gradedAgg = await this.attemptModel.aggregate([
      { $match: { exerciseId: { $in: ids } } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'attemptId',
          as: 'sub',
        },
      },
      { $unwind: '$sub' },
      { $match: { 'sub.isGraded': true } },
      { $group: { _id: '$exerciseId', graded: { $sum: 1 } } },
    ]);
    const gradedMap = new Map(gradedAgg.map((g: any) => [g._id.toString(), g.graded]));

    const withCount = records.map((r: any) => ({
      ...r,
      questionCount: countMap.get(r._id.toString()) ?? 0,
      attemptCount: attemptMap.get(r._id.toString())?.attempts ?? 0,
      learnerCount: attemptMap.get(r._id.toString())?.learners ?? 0,
      submittedCount: attemptMap.get(r._id.toString())?.submitted ?? 0,
      gradedCount: gradedMap.get(r._id.toString()) ?? 0,
    }));
    return buildPagination(withCount, total, page, pageSize);
  }

  async findOne(id: string, viewer?: { userId?: string; role?: UserRole }, countView = false) {
    const exerciseId = convertStringToObjectId(id);
    // countView=true chỉ cho GET /:id công khai (xem bài) → $inc viewCount. Các lời gọi
    // nội bộ (create trả về chi tiết) để mặc định false nên không thổi phồng lượt xem.
    const exercise = countView
      ? await this.exerciseModel.findByIdAndUpdate(exerciseId, { $inc: { viewCount: 1 } }, { returnDocument: 'after' }).lean()
      : await this.exerciseModel.findById(exerciseId).lean();
    if (!exercise) throw new NotFoundException('Không tìm thấy bài tập');

    // Chủ bài tập (hoặc Admin) được xem đáp án đúng để biên tập. Khách / người dùng / chủ
    // khác → lược bỏ field đáp án đúng trong từng câu để không lộ đáp án trước khi nộp.
    const isOwner =
      viewer?.role === UserRole.Admin ||
      (viewer?.userId != null && exercise.userId?.toString() === viewer.userId);

    const links = await this.exerciseQuestionModel.find({ exerciseId }).sort({ order: 1 }).lean();
    const questionIds = links.map((l) => l.questionId);
    const questions = await this.questionModel
      .find({ _id: { $in: questionIds } })
      .populate('questionDetail')
      .lean();
    if (!isOwner) {
      for (const q of questions as any[]) this.sanitizeDetailForViewer(q?.questionDetail);
    }
    const questionMap = new Map(questions.map((q: any) => [q._id.toString(), q]));

    const items = links.map((link) => ({
      ...link,
      question: questionMap.get(link.questionId.toString()) ?? null,
    }));

    return { ...exercise, questions: items };
  }

  /**
   * Xóa các field ĐÁP ÁN ĐÚNG khỏi bản ghi chi tiết câu hỏi (đã populate, dạng lean)
   * trước khi trả cho người KHÔNG phải chủ bài tập. Giữ lại mọi thứ người dùng cần để
   * LÀM bài: đề/options/labels/statements/thứ tự hiển thị... Bao phủ cả 9 loại câu.
   */
  private sanitizeDetailForViewer(detail: any): void {
    if (!detail || typeof detail !== 'object') return;
    delete detail.correctOptionIndex;
    delete detail.correctOptionIndices;
    delete detail.isCorrect;
    delete detail.answers;
    delete detail.correctOrder;
    delete detail.correctAnswers;
    delete detail.guideAnswer;
    // Match: giữ left + tập right có thể chọn, nhưng KHÔNG lộ cặp ghép đúng.
    if (Array.isArray(detail.pairs)) {
      const rights = detail.pairs.map((p: any) => p?.right).filter((r: any) => r != null);
      detail.lefts = detail.pairs.map((p: any) => p?.left);
      detail.rightOptions = rights;
      delete detail.pairs;
    }
  }

  async create(dto: CreateExerciseDto, userId: string) {
    const { materialIds, dueDate, folderId, rubricId, ...rest } = dto;
    const exercise = await this.exerciseModel.create({
      ...rest,
      userId: convertStringToObjectId(userId),
      ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      ...(materialIds ? { materialIds: materialIds.map((m) => convertStringToObjectId(m)) } : {}),
      ...(folderId !== undefined ? { folderId: folderId ? convertStringToObjectId(folderId) : null } : {}),
      ...(rubricId !== undefined ? { rubricId: rubricId ? convertStringToObjectId(rubricId) : null } : {}),
    });
    return this.findOne(exercise._id.toString(), { userId });
  }

  private ownerFilter(id: string, userId: string, role?: UserRole): Record<string, any> {
    const owner = role === UserRole.Admin ? {} : { userId: convertStringToObjectId(userId) };
    return { _id: convertStringToObjectId(id), ...owner };
  }

  async update(id: string, dto: UpdateExerciseDto, userId: string, role?: UserRole) {
    const { materialIds, dueDate, folderId, rubricId, ...rest } = dto;
    const patch: Record<string, unknown> = { ...rest };
    if (dueDate !== undefined) patch.dueDate = dueDate ? new Date(dueDate) : null;
    if (materialIds !== undefined) patch.materialIds = materialIds.map((m) => convertStringToObjectId(m));
    if (folderId !== undefined) patch.folderId = folderId ? convertStringToObjectId(folderId) : null;
    if (rubricId !== undefined) patch.rubricId = rubricId ? convertStringToObjectId(rubricId) : null;
    const exercise = await this.exerciseModel
      .findOneAndUpdate(this.ownerFilter(id, userId, role), patch, { returnDocument: 'after' })
      .lean();
    if (!exercise) throw new NotFoundException('Không tìm thấy bài tập');
    return exercise;
  }

  async remove(id: string, userId: string, role?: UserRole) {
    const exerciseId = convertStringToObjectId(id);
    const res = await this.exerciseModel.deleteOne(this.ownerFilter(id, userId, role));
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy bài tập');
    await this.exerciseQuestionModel.deleteMany({ exerciseId });

    const attempts = await this.attemptModel.find({ exerciseId }).select('_id').lean();
    const attemptIds = attempts.map((a) => a._id);
    if (attemptIds.length > 0) {
      await Promise.all([
        this.participantModel.deleteMany({ attemptId: { $in: attemptIds } }),
        this.submissionModel.deleteMany({ attemptId: { $in: attemptIds } }),
        this.studentQuestionModel.deleteMany({ attemptId: { $in: attemptIds } }),
      ]);
    }
    await this.attemptModel.deleteMany({ exerciseId });
    return { deleted: true };
  }

  async addQuestion(id: string, dto: AddExerciseQuestionDto, userId: string, role?: UserRole) {
    const exerciseId = convertStringToObjectId(id);
    const exercise = await this.exerciseModel.findOne(this.ownerFilter(id, userId, role)).lean();
    if (!exercise) throw new NotFoundException('Không tìm thấy bài tập');

    const questionId = convertStringToObjectId(dto.questionId);
    const exists = await this.exerciseQuestionModel.exists({ exerciseId, questionId });
    if (exists) throw new ConflictException('Câu hỏi đã thuộc bài tập này');

    const link = await this.exerciseQuestionModel.create({
      exerciseId,
      questionId,
      ...(dto.grades !== undefined ? { grades: dto.grades } : {}),
      ...(dto.order !== undefined ? { order: dto.order } : {}),
    });
    await this.questionModel.updateOne({ _id: questionId }, { $inc: { uses: 1 } });
    return link.toObject();
  }

  async removeQuestion(id: string, questionId: string, userId: string, role?: UserRole) {
    const exerciseId = convertStringToObjectId(id);
    const exercise = await this.exerciseModel.findOne(this.ownerFilter(id, userId, role)).lean();
    if (!exercise) throw new NotFoundException('Không tìm thấy bài tập');

    const qId = convertStringToObjectId(questionId);
    const res = await this.exerciseQuestionModel.deleteOne({ exerciseId, questionId: qId });
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy câu hỏi trong bài tập');
    await this.questionModel.updateOne({ _id: qId, uses: { $gt: 0 } }, { $inc: { uses: -1 } });
    return { deleted: true };
  }
}
