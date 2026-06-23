import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RubricDocument = HydratedDocument<Rubric>;

/** Bộ tiêu chí chấm điểm — tái dùng reference `rubric` (tách levels/criterions). */
@Schema({ collection: 'rubrics', timestamps: true, versionKey: false })
export class Rubric {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  userId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'RubricGroup', default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  groupId: Types.ObjectId | null;

  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String })
  name: string;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean })
  isChecklist: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean })
  useGrades: boolean;

  /** Số lần được dùng để chấm. */
  @Prop({ type: Number, default: 0, min: 0 })
  @ApiProperty({ type: Number })
  usedCount: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const RubricSchema = SchemaFactory.createForClass(Rubric);
