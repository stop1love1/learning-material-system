import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { ExerciseStatus, ExerciseType } from '../../enums';

export type ExerciseDocument = HydratedDocument<Exercise>;

@Schema({ collection: 'exercises', timestamps: true, versionKey: false })
export class Exercise {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String })
  title: string;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @Prop({ type: String, required: true, enum: Object.values(ExerciseType), index: true })
  @ApiProperty({ enum: ExerciseType })
  type: ExerciseType;

  @Prop({ type: String, enum: Object.values(ExerciseStatus), default: ExerciseStatus.Open, index: true })
  @ApiProperty({ enum: ExerciseStatus })
  status: ExerciseStatus;

  @Prop({ type: String, default: 'Tiếng Việt', trim: true, index: true })
  @ApiProperty({ type: String })
  subject: string;

  @Prop({ type: String, default: null, trim: true, index: true })
  @ApiProperty({ type: String, nullable: true, example: 'Lớp 5' })
  grade: string | null;

  @Prop({ type: Date, default: null, index: true })
  @ApiProperty({ type: Date, nullable: true })
  dueDate: Date | null;

  @Prop({ type: Number, default: 10, min: 0 })
  @ApiProperty({ type: Number })
  points: number;

  @Prop({ type: Number, default: 0, min: 0 })
  @ApiProperty({ type: Number, description: 'phút · 0 = không giới hạn' })
  durationMinutes: number;

  @Prop({ type: Number, default: 1, min: 1 })
  @ApiProperty({ type: Number })
  maxAttempts: number;

  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean })
  shuffleQuestions: boolean;

  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean })
  showAnswer: boolean;

  /** Rubric gắn cho bài tập (dùng khi chấm tự luận theo rubric). */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Rubric', default: null, index: true })
  @ApiProperty({ type: String, nullable: true })
  rubricId: Types.ObjectId | null;

  /** Hướng dẫn / mô tả chi tiết hiển thị cho người dùng khi làm bài. */
  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  instructions: string | null;

  /** Phạm vi giao bài (nhãn lớp / nhóm tự do, ví dụ "Lớp 5A"). */
  @Prop({ type: String, default: null, trim: true })
  @ApiProperty({ type: String, nullable: true, example: 'Lớp 5A' })
  scope: string | null;

  /** Cho phép nộp muộn sau dueDate. */
  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean })
  allowLateSubmit: boolean;

  /** Hiển thị điểm cho người dùng ngay sau khi nộp. */
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean })
  showScoreAfter: boolean;

  /** Gửi thông báo khi giao bài. */
  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean })
  notifyOnAssign: boolean;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'FileItem', default: [] })
  @ApiProperty({ type: [String] })
  materialIds: Types.ObjectId[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseFolder', default: null, index: true })
  @ApiProperty({ type: String, nullable: true })
  folderId: Types.ObjectId | null;

  /** Số lượt mở xem bài tập (tăng mỗi lần GET /exercises/:id) — hiển thị như "lượt xem". */
  @Prop({ type: Number, default: 0, min: 0 })
  @ApiProperty({ type: Number })
  viewCount: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
