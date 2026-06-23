import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MultipleChoiceQuestionDocument = HydratedDocument<MultipleChoiceQuestion>;

@Schema({ collection: 'multiple-choice-questions', timestamps: true, versionKey: false })
export class MultipleChoiceQuestion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true, sparse: true, ref: 'Question' })
  @ApiProperty({ type: String })
  questionId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  @ApiProperty({ type: [String] })
  options: string[];

  @Prop({
    type: [Number],
    required: true,
    validate: {
      validator: function (this: MultipleChoiceQuestion, v: number[]) {
        return (
          Array.isArray(this.options) && v.length > 0 && v.every((i) => i >= 0 && i < this.options.length)
        );
      },
      message: 'correctOptionIndices must be within the range of options',
    },
  })
  @ApiProperty({ type: [Number] })
  correctOptionIndices: number[];

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean })
  allowShuffle: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const MultipleChoiceQuestionSchema = SchemaFactory.createForClass(MultipleChoiceQuestion);
