import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AttemptDocument = HydratedDocument<Attempt>;

@Schema({ collection: 'attempts', timestamps: true, versionKey: false })
export class Attempt {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Exercise' })
  @ApiProperty({ type: String })
  exerciseId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  studentId: Types.ObjectId | null;

  @Prop({ type: String, default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  sessionId: string | null;

  @Prop({ type: Number, required: true, min: 1, default: 1 })
  @ApiProperty({ type: Number })
  attemptNumber: number;

  /** Lượt được chọn để tính điểm (khi cho phép nhiều lượt). */
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean })
  isSelected: boolean;

  @Prop({ type: Date, default: null })
  @ApiProperty({ type: Date, nullable: true })
  submittedAt: Date | null;

  /** Hết hạn dọn dẹp cho lượt làm của khách ẩn danh. */
  @Prop({ type: Date, default: null })
  @ApiProperty({ type: Date, nullable: true })
  anonymousExpiresAt: Date | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const AttemptSchema = SchemaFactory.createForClass(Attempt);
// Mỗi người dùng đăng nhập: 1 lượt/exercise theo attemptNumber.
AttemptSchema.index(
  { exerciseId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true, partialFilterExpression: { studentId: { $type: 'objectId' } } },
);
