import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type SubmissionDocument = HydratedDocument<Submission>;

/** Tổng hợp kết quả một lượt làm (1 submission / 1 attempt). */
@Schema({
  collection: 'submissions',
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Submission {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true, ref: 'Attempt' })
  @ApiProperty({ type: String })
  attemptId: Types.ObjectId;

  @Prop({ type: Number, min: 0, default: 0 })
  @ApiProperty({ type: Number })
  correct: number;

  @Prop({ type: Number, min: 0, default: 0 })
  @ApiProperty({ type: Number })
  wrong: number;

  @Prop({ type: Number, min: 0, default: 0 })
  @ApiProperty({ type: Number })
  notComplete: number;

  /** Số câu tự luận đang chờ chấm. */
  @Prop({ type: Number, min: 0, default: 0 })
  @ApiProperty({ type: Number })
  waitingGrades: number;

  @Prop({ type: Number, min: 0, default: 0 })
  @ApiProperty({ type: Number })
  numberOfEssays: number;

  @Prop({ type: Number, min: 0, default: 0 })
  @ApiProperty({ type: Number })
  multipleChoiceGrades: number;

  @Prop({ type: Number, min: 0, default: null })
  @ApiProperty({ type: Number, nullable: true })
  essayGrades: number | null;

  @Prop({ type: Date, default: Date.now })
  @ApiProperty({ type: Date })
  submittedAt: Date;

  @Prop({ type: Number, min: 1, default: 1 })
  @ApiProperty({ type: Number })
  submissionCount: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);

SubmissionSchema.virtual('totalGrades').get(function (this: Submission) {
  return (this.essayGrades || 0) + (this.multipleChoiceGrades || 0);
});
