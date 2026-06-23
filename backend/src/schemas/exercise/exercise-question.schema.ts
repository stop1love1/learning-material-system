import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ExerciseQuestionDocument = HydratedDocument<ExerciseQuestion>;

@Schema({ collection: 'exercise-questions', timestamps: true, versionKey: false })
export class ExerciseQuestion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Exercise' })
  @ApiProperty({ type: String })
  exerciseId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Question' })
  @ApiProperty({ type: String })
  questionId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  @ApiProperty({ type: Number })
  order: number;

  @Prop({ type: Number, min: 0, default: null })
  @ApiProperty({ type: Number, nullable: true })
  grades: number | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const ExerciseQuestionSchema = SchemaFactory.createForClass(ExerciseQuestion);
ExerciseQuestionSchema.index({ exerciseId: 1, questionId: 1 }, { unique: true });
