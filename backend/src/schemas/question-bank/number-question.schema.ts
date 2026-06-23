import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type NumberQuestionDocument = HydratedDocument<NumberQuestion>;

/** Chi tiết câu hỏi đáp án số — tái dùng reference `number-question`. */
@Schema({ collection: 'number-questions', timestamps: true, versionKey: false })
export class NumberQuestion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true, sparse: true, ref: 'Question' })
  @ApiProperty({ type: String })
  questionId: Types.ObjectId;

  /** Các đáp án số được chấp nhận (lưu dạng chuỗi để giữ định dạng). */
  @Prop({ type: [String], required: true })
  @ApiProperty({ type: [String] })
  answers: string[];

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const NumberQuestionSchema = SchemaFactory.createForClass(NumberQuestion);
