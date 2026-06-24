import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type StudentQuestionDocument = HydratedDocument<StudentQuestion>;

@Schema({ collection: 'student-questions', timestamps: true, versionKey: false })
export class StudentQuestion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Attempt' })
  @ApiProperty({ type: String })
  attemptId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Question' })
  @ApiProperty({ type: String })
  questionId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  studentId: Types.ObjectId | null;

  @Prop({ type: String, default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  sessionId: string | null;

  /**
   * Đáp án học viên chọn/nhập — shape tùy loại câu hỏi:
   *  single: number · multi: number[] · truefalse: boolean
   *  fill: string[] · essay: { text, fileUrls[] } · match: { left: right }[]
   */
  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  @ApiProperty()
  answer: unknown;

  @Prop({ type: Boolean, default: null })
  @ApiProperty({ type: Boolean, nullable: true })
  isCorrect: boolean | null;

  @Prop({ type: Number, min: 0, default: null })
  @ApiProperty({ type: Number, nullable: true })
  grades: number | null;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  feedback: string | null;

  @Prop({ type: [Number], default: [] })
  @ApiProperty({ type: [Number] })
  shuffledOptionIndices: number[];

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const StudentQuestionSchema = SchemaFactory.createForClass(StudentQuestion);
StudentQuestionSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });
