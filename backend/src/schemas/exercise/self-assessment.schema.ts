import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { SelfAssessmentSource } from '../../enums';

export type SelfAssessmentDocument = HydratedDocument<SelfAssessment>;

@Schema({ collection: 'self-assessments', timestamps: true, versionKey: false })
export class SelfAssessment {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  userId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Rubric' })
  @ApiProperty({ type: String })
  rubricId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: Object.values(SelfAssessmentSource), default: SelfAssessmentSource.Text })
  @ApiProperty({ enum: SelfAssessmentSource })
  source: SelfAssessmentSource;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'FileItem', default: null, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  fileId: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', default: null, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  exerciseId: Types.ObjectId | null;

  /** Nội dung bài tự đánh giá khi source = text. */
  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  text: string | null;

  @Prop({
    type: [
      {
        criterionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RubricCriterion' },
        levelId: { type: mongoose.Schema.Types.ObjectId, ref: 'RubricLevel', default: null },
        percent: { type: Number, min: 0, max: 100, default: 0 },
      },
    ],
    default: [],
    _id: false,
  })
  @ApiProperty({ isArray: true, type: Object })
  scores: { criterionId: Types.ObjectId; levelId: Types.ObjectId | null; percent: number }[];

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  @ApiProperty({ type: Number })
  totalPercent: number;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  note: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const SelfAssessmentSchema = SchemaFactory.createForClass(SelfAssessment);
