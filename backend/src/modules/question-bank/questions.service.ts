import { Injectable, NotFoundException } from '@nestjs/common';
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
import { QuestionModel, QuestionType } from '../../enums';
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

  /** Chọn (model chi tiết, tên QuestionModel) theo loại câu hỏi. */
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
        throw new NotFoundException('Loại câu hỏi không hợp lệ');
    }
  }

  /** Lấy model chi tiết theo giá trị QuestionModel đã lưu. */
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
        throw new NotFoundException('Loại câu hỏi không hợp lệ');
    }
  }

  async list(userId: string, dto: ListQuestionsDto) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
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
        .lean(),
      this.questionModel.countDocuments(query),
    ]);
    return buildPagination(records, total, page, pageSize);
  }

  async findOne(id: string) {
    const question = await this.questionModel.findById(convertStringToObjectId(id)).lean();
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    let detail: any = null;
    if (question.questionModel && question.questionDetail) {
      const detailModel = this.modelByQuestionModel(question.questionModel);
      detail = await detailModel.findById(question.questionDetail).lean();
    }
    return { question, detail };
  }

  async create(userId: string, dto: CreateQuestionDto) {
    // (1) Tạo bản ghi gốc.
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

    // (2) Chọn model chi tiết theo loại.
    const { model: detailModel, questionModel } = this.resolveDetail(dto.type);

    // (3) Tạo bản ghi chi tiết.
    const detail = await detailModel.create({ questionId: base._id, ...dto.detail });

    // (4) Cập nhật con trỏ chi tiết trên bản ghi gốc.
    base.questionDetail = detail._id;
    base.questionModel = questionModel;
    await base.save();

    const question = await this.questionModel.findById(base._id).lean();
    return { question, detail: detail.toObject() };
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const base = await this.questionModel.findById(convertStringToObjectId(id));
    if (!base) throw new NotFoundException('Không tìm thấy câu hỏi');

    if (dto.level !== undefined) base.level = dto.level;
    if (dto.topicId !== undefined) base.topicId = dto.topicId ? convertStringToObjectId(dto.topicId) : null;
    if (dto.title !== undefined) base.title = dto.title;
    if (dto.content !== undefined) base.content = dto.content;
    if (dto.tags !== undefined) base.tags = dto.tags;
    if (dto.subject !== undefined) base.subject = dto.subject;
    if (dto.grade !== undefined) base.grade = dto.grade;
    await base.save();

    let detail: any = null;
    if (base.questionModel && base.questionDetail) {
      const detailModel = this.modelByQuestionModel(base.questionModel);
      detail = await detailModel.findById(base.questionDetail).lean();
      if (dto.detail) {
        detail = await detailModel
          .findByIdAndUpdate(base.questionDetail, { $set: dto.detail }, { new: true })
          .lean();
      }
    }

    const question = await this.questionModel.findById(base._id).lean();
    return { question, detail };
  }

  async remove(id: string) {
    const base = await this.questionModel.findById(convertStringToObjectId(id)).lean();
    if (!base) throw new NotFoundException('Không tìm thấy câu hỏi');
    if (base.questionModel && base.questionDetail) {
      const detailModel = this.modelByQuestionModel(base.questionModel);
      await detailModel.deleteOne({ _id: base.questionDetail });
    }
    await this.questionModel.deleteOne({ _id: base._id });
    return { deleted: true };
  }
}
