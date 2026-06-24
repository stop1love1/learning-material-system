import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { ExerciseQuestion } from '../../schemas/exercise/exercise-question.schema';
import { Question } from '../../schemas/question-bank/question.schema';
import { buildPagination, convertStringToObjectId, getPagination } from '../../common/utils';
import { UserRole } from '../../enums';
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
  ) {}

  async list(dto: ListExercisesDto) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    const query: Record<string, any> = {
      ...(keyword ? { title: { $regex: keyword, $options: 'i' } } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.subject ? { subject: dto.subject } : {}),
      ...(dto.grade ? { grade: dto.grade } : {}),
    };
    const [records, total] = await Promise.all([
      this.exerciseModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.exerciseModel.countDocuments(query),
    ]);

    // Attach a questionCount per exercise (single aggregation over the link
    // collection — no N+1) so the frontend list can show "X câu" correctly.
    const ids = records.map((r: any) => r._id);
    const counts = await this.exerciseQuestionModel.aggregate([
      { $match: { exerciseId: { $in: ids } } },
      { $group: { _id: '$exerciseId', n: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c: any) => [c._id.toString(), c.n]));
    const withCount = records.map((r: any) => ({
      ...r,
      questionCount: countMap.get(r._id.toString()) ?? 0,
    }));
    return buildPagination(withCount, total, page, pageSize);
  }

  async findOne(id: string) {
    const exerciseId = convertStringToObjectId(id);
    const exercise = await this.exerciseModel.findById(exerciseId).lean();
    if (!exercise) throw new NotFoundException('Không tìm thấy bài tập');

    const links = await this.exerciseQuestionModel.find({ exerciseId }).sort({ order: 1 }).lean();
    const questionIds = links.map((l) => l.questionId);
    const questions = await this.questionModel.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map((q: any) => [q._id.toString(), q]));

    const items = links.map((link) => ({
      ...link,
      question: questionMap.get(link.questionId.toString()) ?? null,
    }));

    return { ...exercise, questions: items };
  }

  async create(dto: CreateExerciseDto, userId: string) {
    const { materialIds, dueDate, ...rest } = dto;
    const exercise = await this.exerciseModel.create({
      ...rest,
      userId: convertStringToObjectId(userId),
      ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      ...(materialIds ? { materialIds: materialIds.map((m) => convertStringToObjectId(m)) } : {}),
    });
    return this.findOne(exercise._id.toString());
  }

  /** Bộ lọc theo chủ sở hữu (Admin bỏ qua kiểm tra). */
  private ownerFilter(id: string, userId: string, role?: UserRole): Record<string, any> {
    const owner = role === UserRole.Admin ? {} : { userId: convertStringToObjectId(userId) };
    return { _id: convertStringToObjectId(id), ...owner };
  }

  async update(id: string, dto: UpdateExerciseDto, userId: string, role?: UserRole) {
    const { materialIds, dueDate, ...rest } = dto;
    const patch: Record<string, unknown> = { ...rest };
    if (dueDate !== undefined) patch.dueDate = dueDate ? new Date(dueDate) : null;
    if (materialIds !== undefined) patch.materialIds = materialIds.map((m) => convertStringToObjectId(m));
    const exercise = await this.exerciseModel
      .findOneAndUpdate(this.ownerFilter(id, userId, role), patch, { new: true })
      .lean();
    if (!exercise) throw new NotFoundException('Không tìm thấy bài tập');
    return exercise;
  }

  async remove(id: string, userId: string, role?: UserRole) {
    const exerciseId = convertStringToObjectId(id);
    const res = await this.exerciseModel.deleteOne(this.ownerFilter(id, userId, role));
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy bài tập');
    await this.exerciseQuestionModel.deleteMany({ exerciseId });
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
