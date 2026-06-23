import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { QuestionLevel, QuestionModel, QuestionType } from '../../enums';

export type QuestionDocument = HydratedDocument<Question>;

/**
 * Câu hỏi (bản ghi gốc, đa hình). Mỗi câu = 1 dòng `questions` (metadata chung)
 * + 1 dòng ở bảng chi tiết theo loại, trỏ qua `questionDetail` (refPath
 * `questionModel`) — tái dùng cấu trúc reference `question`.
 */
@Schema({ collection: 'questions', timestamps: true, versionKey: false })
export class Question {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  userId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  topicId: Types.ObjectId | null;

  /** Tiêu đề ngắn để tìm kiếm/liệt kê. */
  @Prop({ type: String, default: null, trim: true, index: true })
  @ApiProperty({ type: String, nullable: true })
  title: string | null;

  /** Nội dung đề bài (stem). */
  @Prop({ type: String, required: true })
  @ApiProperty({ type: String })
  content: string;

  @Prop({ type: String, required: true, enum: Object.values(QuestionType), index: true })
  @ApiProperty({ enum: QuestionType })
  type: QuestionType;

  @Prop({ type: String, enum: Object.values(QuestionLevel), default: QuestionLevel.Easy, index: true })
  @ApiProperty({ enum: QuestionLevel })
  level: QuestionLevel;

  @Prop({ type: [String], default: [], index: true })
  @ApiProperty({ type: [String] })
  tags: string[];

  /** Trỏ tới bản ghi chi tiết theo loại. */
  @Prop({ type: mongoose.Schema.Types.ObjectId, refPath: 'questionModel', default: null })
  @ApiProperty({ type: String, nullable: true })
  questionDetail: Types.ObjectId | null;

  /** Tên collection chi tiết (SingleChoiceQuestion, EssayQuestion…). */
  @Prop({ type: String, enum: Object.values(QuestionModel), default: null })
  @ApiProperty({ enum: QuestionModel, nullable: true })
  questionModel: QuestionModel | null;

  @Prop({ type: String, default: 'Tiếng Việt', trim: true })
  @ApiProperty({ type: String })
  subject: string;

  @Prop({ type: String, default: null, trim: true })
  @ApiProperty({ type: String, nullable: true })
  grade: string | null;

  /** Số lần được dùng trong các bài tập. */
  @Prop({ type: Number, default: 0, min: 0 })
  @ApiProperty({ type: Number })
  uses: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
