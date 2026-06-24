import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ScheduleDocument = HydratedDocument<Schedule>;

// Lịch dạy của giáo viên (widget "Lịch hôm nay" trên dashboard). Mỗi hàng là một
// buổi học lặp lại theo thứ trong tuần (dayOfWeek 0=CN..6=Thứ 7).
@Schema({ collection: 'schedules', timestamps: true, versionKey: false })
export class Schedule {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String, example: 'Tiếng Việt 5A1 — Tập đọc' })
  title: string;

  // 0 = Chủ nhật … 6 = Thứ Bảy (khớp Date.getDay()).
  @Prop({ type: Number, required: true, min: 0, max: 6, index: true })
  @ApiProperty({ type: Number, example: 1 })
  dayOfWeek: number;

  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String, example: '07:15' })
  time: string;

  @Prop({ type: String, default: '', trim: true })
  @ApiProperty({ type: String, example: '40 phút' })
  duration: string;

  @Prop({ type: String, default: '', trim: true })
  @ApiProperty({ type: String, example: 'P.305' })
  room: string;

  @Prop({ type: String, default: '', trim: true })
  @ApiProperty({ type: String, example: 'TV5A1' })
  classLabel: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
