import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { EnrollmentStatus } from '../../enums';

export type EnrollmentDocument = HydratedDocument<Enrollment>;

@Schema({ collection: 'enrollments', timestamps: true, versionKey: false })
export class Enrollment {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Class' })
  @ApiProperty({ type: String })
  classId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  studentId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(EnrollmentStatus), default: EnrollmentStatus.Active, index: true })
  @ApiProperty({ enum: EnrollmentStatus })
  status: EnrollmentStatus;

  @Prop({ type: Date, default: Date.now })
  @ApiProperty({ type: Date })
  joinedAt: Date;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
// Một học viên chỉ có một bản ghi ghi danh cho mỗi lớp.
EnrollmentSchema.index({ classId: 1, studentId: 1 }, { unique: true });
