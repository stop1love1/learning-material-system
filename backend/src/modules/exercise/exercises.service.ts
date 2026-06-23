import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { ExerciseQuestion } from '../../schemas/exercise/exercise-question.schema';
import { Question } from '../../schemas/question-bank/question.schema';
import { buildPagination, convertStringToObjectId, getPagination } from '../../common/utils';
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
    return buildPagination(records, total, page, pageSize);
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

  async update(id: string, dto: UpdateExerciseDto) {
    const { materialIds, dueDate, ...rest } = dto;
    const patch: Record<string, unknown> = { ...rest };
    if (dueDate !== undefined) patch.dueDate = dueDate ? new Date(dueDate) : null;
    if (materialIds !== undefined) patch.materialIds = materialIds.map((m) => convertStringToObjectId(m));
    const exercise = await this.exerciseModel
      .findByIdAndUpdate(convertStringToObjectId(id), patch, { new: true })
      .lean();
    if (!exercise) throw new NotFoundException('Không tìm thấy bài tập');
    return exercise;
  }

  async remove(id: string) {
    const exerciseId = convertStringToObjectId(id);
    const res = await this.exerciseModel.deleteOne({ _id: exerciseId });
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy bài tập');
    await this.exerciseQuestionModel.deleteMany({ exerciseId });
    return { deleted: true };
  }

  async addQuestion(id: string, dto: AddExerciseQuestionDto) {
    const exerciseId = convertStringToObjectId(id);
    const exercise = await this.exerciseModel.findById(exerciseId).lean();
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
    return link.toObject();
  }

  async removeQuestion(id: string, questionId: string) {
    const exerciseId = convertStringToObjectId(id);
    const res = await this.exerciseQuestionModel.deleteOne({
      exerciseId,
      questionId: convertStringToObjectId(questionId),
    });
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy câu hỏi trong bài tập');
    return { deleted: true };
  }
}
