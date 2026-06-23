import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type SingleChoiceQuestionDocument = HydratedDocument<SingleChoiceQuestion>;

@Schema({ collection: 'single-choice-questions', timestamps: true, versionKey: false })
export class SingleChoiceQuestion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true, sparse: true, ref: 'Question' })
  @ApiProperty({ type: String })
  questionId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  @ApiProperty({ type: [String] })
  options: string[];

  @Prop({
    type: Number,
    required: true,
    validate: {
      validator: function (this: SingleChoiceQuestion, v: number) {
        return Array.isArray(this.options) && v >= 0 && v < this.options.length;
      },
      message: 'correctOptionIndex must be within the range of options',
    },
  })
  @ApiProperty({ type: Number })
  correctOptionIndex: number;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean })
  allowShuffle: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const SingleChoiceQuestionSchema = SchemaFactory.createForClass(SingleChoiceQuestion);
