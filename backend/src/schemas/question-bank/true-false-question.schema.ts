import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type TrueFalseQuestionDocument = HydratedDocument<TrueFalseQuestion>;

/** Chi tiết câu hỏi Đúng / Sai. */
@Schema({ collection: 'true-false-questions', timestamps: true, versionKey: false })
export class TrueFalseQuestion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true, sparse: true, ref: 'Question' })
  @ApiProperty({ type: String })
  questionId: Types.ObjectId;

  @Prop({ type: Boolean, required: true })
  @ApiProperty({ type: Boolean })
  isCorrect: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const TrueFalseQuestionSchema = SchemaFactory.createForClass(TrueFalseQuestion);
