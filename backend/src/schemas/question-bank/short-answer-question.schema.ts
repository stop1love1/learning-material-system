import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { QuestionMatchMode } from '../../enums';

export type ShortAnswerQuestionDocument = HydratedDocument<ShortAnswerQuestion>;

/** Chi tiết câu hỏi Điền khuyết / trả lời ngắn. */
@Schema({ collection: 'short-answer-questions', timestamps: true, versionKey: false })
export class ShortAnswerQuestion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true, sparse: true, ref: 'Question' })
  @ApiProperty({ type: String })
  questionId: Types.ObjectId;

  /** Các đáp án được chấp nhận. */
  @Prop({ type: [String], required: true })
  @ApiProperty({ type: [String] })
  answers: string[];

  @Prop({ type: String, enum: Object.values(QuestionMatchMode), default: QuestionMatchMode.Caseless })
  @ApiProperty({ enum: QuestionMatchMode })
  matchMode: QuestionMatchMode;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const ShortAnswerQuestionSchema = SchemaFactory.createForClass(ShortAnswerQuestion);
