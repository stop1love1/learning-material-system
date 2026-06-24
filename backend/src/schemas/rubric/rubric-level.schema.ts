import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RubricLevelDocument = HydratedDocument<RubricLevel>;

@Schema({ collection: 'rubric-levels', timestamps: true, versionKey: false })
export class RubricLevel {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Rubric' })
  @ApiProperty({ type: String })
  rubricId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String })
  name: string;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  @ApiProperty({ type: Number })
  percentage: number;

  @Prop({ type: Number, default: 0 })
  @ApiProperty({ type: Number })
  order: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const RubricLevelSchema = SchemaFactory.createForClass(RubricLevel);
