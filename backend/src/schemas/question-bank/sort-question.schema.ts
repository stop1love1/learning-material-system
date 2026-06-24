import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type SortQuestionDocument = HydratedDocument<SortQuestion>;

@Schema({ collection: 'sort-questions', timestamps: true, versionKey: false })
export class SortQuestion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true, sparse: true, ref: 'Question' })
  @ApiProperty({ type: String })
  questionId: Types.ObjectId;

  @Prop({ type: [String], required: true })
  @ApiProperty({ type: [String] })
  options: string[];

  /** Thứ tự đúng (mảng chỉ số trỏ vào options). */
  @Prop({
    type: [Number],
    required: true,
    validate: {
      validator: function (this: SortQuestion, v: number[]) {
        return Array.isArray(this.options) && v.length > 0 && v.every((i) => i >= 0 && i < this.options.length);
      },
      message: 'correctOrder must be within the range of options',
    },
  })
  @ApiProperty({ type: [Number] })
  correctOrder: number[];

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean })
  allowShuffle: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const SortQuestionSchema = SchemaFactory.createForClass(SortQuestion);
