import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RubricCriterionDocument = HydratedDocument<RubricCriterion>;

@Schema({ collection: 'rubric-criterions', timestamps: true, versionKey: false })
export class RubricCriterion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Rubric' })
  @ApiProperty({ type: String })
  rubricId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'RubricLevel', default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  levelId: Types.ObjectId | null;

  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String })
  name: string;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  note: string | null;

  /** Trọng số (% trên tổng — các tiêu chí nên cộng = 100). */
  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  @ApiProperty({ type: Number })
  weight: number;

  @Prop({ type: [String], default: [] })
  @ApiProperty({ type: [String] })
  items: string[];

  @Prop({ type: Number, default: 0 })
  @ApiProperty({ type: Number })
  order: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const RubricCriterionSchema = SchemaFactory.createForClass(RubricCriterion);
