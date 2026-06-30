import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ collection: 'notifications', timestamps: true, versionKey: false })
export class Notification {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String, description: 'Người nhận (recipient)' })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String })
  title: string;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  body: string | null;

  @Prop({ type: String, default: '' })
  @ApiProperty({ type: String, example: 'Bài tập' })
  tag: string;

  @Prop({ type: String, default: '' })
  @ApiProperty({ type: String, example: 'assign' })
  icon: string;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true, example: '/luyen-tap/<id>' })
  link: string | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  @ApiProperty({ type: String, nullable: true, description: 'Id của bài tập/bài viết liên quan' })
  refId: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true, example: 'exercise' })
  refType: string | null;

  @Prop({ type: Boolean, default: false, index: true })
  @ApiProperty({ type: Boolean })
  isRead: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
