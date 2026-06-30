import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ClassDocument = HydratedDocument<Class>;

@Schema({ collection: 'classes', timestamps: true, versionKey: false })
export class Class {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  @ApiProperty({ type: String })
  name: string;

  @Prop({ type: String, default: null, trim: true })
  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  /** Khối, ví dụ "5". */
  @Prop({ type: String, default: null, trim: true })
  @ApiProperty({ type: String, nullable: true, example: '5' })
  grade: string | null;

  /** Mã tham gia lớp (tùy chọn, unique theo sparse index). */
  @Prop({ type: String, default: null, trim: true })
  @ApiProperty({ type: String, nullable: true })
  code: string | null;

  /** Giáo viên sở hữu lớp. */
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  ownerId: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean })
  isArchived: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const ClassSchema = SchemaFactory.createForClass(Class);
// Mã lớp duy nhất khi có giá trị (sparse → cho phép nhiều lớp không có mã).
ClassSchema.index({ code: 1 }, { unique: true, sparse: true });
