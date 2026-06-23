import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { EssayGradingType } from '../../enums';

class InstructionItem {
  @Prop({ type: String, required: true })
  @ApiProperty({ type: String })
  description: string;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  @ApiProperty({ type: Number })
  percent: number;
}

export type EssayQuestionDocument = HydratedDocument<EssayQuestion>;

@Schema({ collection: 'essay-questions', timestamps: true, versionKey: false })
export class EssayQuestion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true, sparse: true, ref: 'Question' })
  @ApiProperty({ type: String })
  questionId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: Object.values(EssayGradingType), default: EssayGradingType.Manual })
  @ApiProperty({ enum: EssayGradingType })
  gradingType: EssayGradingType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Rubric', default: null })
  @ApiProperty({ type: String, nullable: true, description: 'Rubric dùng khi gradingType = rubric' })
  rubricId: Types.ObjectId | null;

  @Prop({ type: [InstructionItem], default: [] })
  @ApiProperty({ type: [InstructionItem] })
  instructions: InstructionItem[];

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  guideAnswer: string | null;

  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean })
  allowUploadFiles: boolean;

  @Prop({ type: Number, min: 0, default: 0 })
  @ApiProperty({ type: Number, description: 'KB · 0 = không giới hạn' })
  maxFileSize: number;

  @Prop({ type: Number, min: 0, default: 0 })
  @ApiProperty({ type: Number, description: '0 = không giới hạn' })
  maxFileCount: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const EssayQuestionSchema = SchemaFactory.createForClass(EssayQuestion);

EssayQuestionSchema.pre('validate', function (this: EssayQuestion) {
  if (this.gradingType === EssayGradingType.Rubric && !this.rubricId) {
    throw new Error('rubricId is required when gradingType is rubric');
  }
  if (this.gradingType === EssayGradingType.Instruction && this.instructions?.length) {
    const total = this.instructions.reduce((s, it) => s + it.percent, 0);
    if (total !== 100) throw new Error('Total percent of instructions must equal 100%');
  }
});
