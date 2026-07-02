import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from '../../schemas/question-bank/question.schema';
import { Topic } from '../../schemas/question-bank/topic.schema';
import { SingleChoiceQuestion } from '../../schemas/question-bank/single-choice-question.schema';
import { MultipleChoiceQuestion } from '../../schemas/question-bank/multiple-choice-question.schema';
import { TrueFalseQuestion } from '../../schemas/question-bank/true-false-question.schema';
import { ShortAnswerQuestion } from '../../schemas/question-bank/short-answer-question.schema';
import { EssayQuestion } from '../../schemas/question-bank/essay-question.schema';
import { MatchQuestion } from '../../schemas/question-bank/match-question.schema';
import { NumberQuestion } from '../../schemas/question-bank/number-question.schema';
import { SortQuestion } from '../../schemas/question-bank/sort-question.schema';
import { TableSelectionQuestion } from '../../schemas/question-bank/table-selection-question.schema';
import { buildPagination, convertStringToObjectId, getPagination } from '../../common/utils';
import { QuestionModel, QuestionType, UserRole } from '../../enums';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ListQuestionsDto } from './dto/list-questions.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
    @InjectModel(Topic.name) private readonly topicModel: Model<Topic>,
    @InjectModel(SingleChoiceQuestion.name) private readonly singleChoiceModel: Model<SingleChoiceQuestion>,
    @InjectModel(MultipleChoiceQuestion.name) private readonly multipleChoiceModel: Model<MultipleChoiceQuestion>,
    @InjectModel(TrueFalseQuestion.name) private readonly trueFalseModel: Model<TrueFalseQuestion>,
    @InjectModel(ShortAnswerQuestion.name) private readonly shortAnswerModel: Model<ShortAnswerQuestion>,
    @InjectModel(EssayQuestion.name) private readonly essayModel: Model<EssayQuestion>,
    @InjectModel(MatchQuestion.name) private readonly matchModel: Model<MatchQuestion>,
    @InjectModel(NumberQuestion.name) private readonly numberModel: Model<NumberQuestion>,
    @InjectModel(SortQuestion.name) private readonly sortModel: Model<SortQuestion>,
    @InjectModel(TableSelectionQuestion.name) private readonly tableSelectionModel: Model<TableSelectionQuestion>,
  ) {}

  private resolveDetail(type: QuestionType): { model: Model<any>; questionModel: QuestionModel } {
    switch (type) {
      case QuestionType.Single:
        return { model: this.singleChoiceModel, questionModel: QuestionModel.SingleChoice };
      case QuestionType.Multi:
        return { model: this.multipleChoiceModel, questionModel: QuestionModel.MultipleChoice };
      case QuestionType.TrueFalse:
        return { model: this.trueFalseModel, questionModel: QuestionModel.TrueFalse };
      case QuestionType.Fill:
        return { model: this.shortAnswerModel, questionModel: QuestionModel.ShortAnswer };
      case QuestionType.Essay:
        return { model: this.essayModel, questionModel: QuestionModel.Essay };
      case QuestionType.Match:
        return { model: this.matchModel, questionModel: QuestionModel.Match };
      case QuestionType.Number:
        return { model: this.numberModel, questionModel: QuestionModel.Number };
      case QuestionType.Sort:
        return { model: this.sortModel, questionModel: QuestionModel.Sort };
      case QuestionType.TableSelection:
        return { model: this.tableSelectionModel, questionModel: QuestionModel.TableSelection };
      default:
        throw new BadRequestException('Loại câu hỏi không hợp lệ');
    }
  }

  private modelByQuestionModel(questionModel: QuestionModel): Model<any> {
    switch (questionModel) {
      case QuestionModel.SingleChoice:
        return this.singleChoiceModel;
      case QuestionModel.MultipleChoice:
        return this.multipleChoiceModel;
      case QuestionModel.TrueFalse:
        return this.trueFalseModel;
      case QuestionModel.ShortAnswer:
        return this.shortAnswerModel;
      case QuestionModel.Essay:
        return this.essayModel;
      case QuestionModel.Match:
        return this.matchModel;
      case QuestionModel.Number:
        return this.numberModel;
      case QuestionModel.Sort:
        return this.sortModel;
      case QuestionModel.TableSelection:
        return this.tableSelectionModel;
      default:
        throw new BadRequestException('Loại câu hỏi không hợp lệ');
    }
  }

  async list(userId: string, dto: ListQuestionsDto) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    // keyword is already regex-escaped by PaginationQueryDto's @Transform(parseKeyword);
    // escaping again here double-escapes metacharacters and breaks the search.
    const query: Record<string, any> = {
      userId: convertStringToObjectId(userId),
      ...(keyword
        ? {
            $or: [
              { title: { $regex: keyword, $options: 'i' } },
              { content: { $regex: keyword, $options: 'i' } },
            ],
          }
        : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.level ? { level: dto.level } : {}),
      ...(dto.topicId ? { topicId: convertStringToObjectId(dto.topicId) } : {}),
    };
    const [records, total] = await Promise.all([
      this.questionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate({ path: 'userId', select: 'name avatar' })
        .lean(),
      this.questionModel.countDocuments(query),
    ]);
    return buildPagination(records, total, page, pageSize);
  }

  async findOne(id: string, userId: string, role?: UserRole) {
    // Scope to owner (Admin sees all) so students can't read other teachers'
    // questions including correct answers — mirrors update()/remove().
    const question = await this.questionModel.findOne(this.ownerFilter(id, userId, role)).lean();
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    let detail: any = null;
    if (question.questionModel && question.questionDetail) {
      const detailModel = this.modelByQuestionModel(question.questionModel);
      detail = await detailModel.findById(question.questionDetail).lean();
    }
    return { question, detail };
  }

  async create(userId: string, dto: CreateQuestionDto) {
    const base = await this.questionModel.create({
      userId: convertStringToObjectId(userId),
      type: dto.type,
      ...(dto.level ? { level: dto.level } : {}),
      topicId: dto.topicId ? convertStringToObjectId(dto.topicId) : null,
      title: dto.title ?? null,
      content: dto.content,
      tags: dto.tags ?? [],
      ...(dto.subject ? { subject: dto.subject } : {}),
      grade: dto.grade ?? null,
    });

    const { model: detailModel, questionModel } = this.resolveDetail(dto.type);

    let detail: any;
    try {
      // Roll back base row if detail validation fails (no Mongo transaction).
      detail = await detailModel.create({ questionId: base._id, ...dto.detail });
    } catch (err) {
      await this.questionModel.deleteOne({ _id: base._id });
      throw err;
    }

    base.questionDetail = detail._id;
    base.questionModel = questionModel;
    await base.save();

    const question = await this.questionModel.findById(base._id).lean();
    return { question, detail: detail.toObject() };
  }

  private ownerFilter(id: string, userId: string, role?: UserRole): Record<string, any> {
    const owner = role === UserRole.Admin ? {} : { userId: convertStringToObjectId(userId) };
    return { _id: convertStringToObjectId(id), ...owner };
  }

  // Restrict a $set to the detail schema's own fields so arbitrary client keys
  // can't be blind-merged into the polymorphic detail row.
  private pickDetailFields(model: Model<any>, source: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = {};
    for (const path of Object.keys(model.schema.paths)) {
      if (path === '_id' || path === 'questionId' || path === 'createdAt' || path === 'updatedAt') continue;
      if (source[path] !== undefined) out[path] = source[path];
    }
    return out;
  }

  async update(id: string, dto: UpdateQuestionDto, userId: string, role?: UserRole) {
    const base = await this.questionModel.findOne(this.ownerFilter(id, userId, role));
    if (!base) throw new NotFoundException('Không tìm thấy câu hỏi');

    const typeChanged = dto.type !== undefined && dto.type !== base.type;

    if (dto.type !== undefined) base.type = dto.type;
    if (dto.level !== undefined) base.level = dto.level;
    if (dto.topicId !== undefined) base.topicId = dto.topicId ? convertStringToObjectId(dto.topicId) : null;
    if (dto.title !== undefined) base.title = dto.title;
    if (dto.content !== undefined) base.content = dto.content;
    if (dto.tags !== undefined) base.tags = dto.tags;
    if (dto.subject !== undefined) base.subject = dto.subject;
    if (dto.grade !== undefined) base.grade = dto.grade;

    let detail: any = null;

    if (typeChanged) {
      const oldQuestionModel = base.questionModel;
      const oldQuestionDetail = base.questionDetail;
      const { model: newDetailModel, questionModel: newQuestionModel } = this.resolveDetail(dto.type as QuestionType);

      const created = await newDetailModel.create({ questionId: base._id, ...(dto.detail ?? {}) });

      if (oldQuestionModel && oldQuestionDetail) {
        const oldDetailModel = this.modelByQuestionModel(oldQuestionModel);
        await oldDetailModel.deleteOne({ _id: oldQuestionDetail });
      }

      base.questionDetail = created._id;
      base.questionModel = newQuestionModel;
      await base.save();
      detail = created.toObject();
    } else {
      await base.save();

      if (base.questionModel && base.questionDetail) {
        const detailModel = this.modelByQuestionModel(base.questionModel);
        detail = await detailModel.findById(base.questionDetail).lean();
        if (dto.detail) {
          const $set = this.pickDetailFields(detailModel, dto.detail);
          detail = await detailModel
            .findByIdAndUpdate(base.questionDetail, { $set }, { new: true, runValidators: true })
            .lean();
        }
      }
    }

    const question = await this.questionModel.findById(base._id).lean();
    return { question, detail };
  }

  async remove(id: string, userId: string, role?: UserRole) {
    const base = await this.questionModel.findOne(this.ownerFilter(id, userId, role)).lean();
    if (!base) throw new NotFoundException('Không tìm thấy câu hỏi');
    if (base.questionModel && base.questionDetail) {
      const detailModel = this.modelByQuestionModel(base.questionModel);
      await detailModel.deleteOne({ _id: base.questionDetail });
    }
    await this.questionModel.deleteOne({ _id: base._id });
    return { deleted: true };
  }
}
