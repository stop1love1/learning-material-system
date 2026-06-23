import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

/** Một cặp nối (vế trái ↔ vế phải đúng). */
class MatchPair {
  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String })
  left: string;

  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String })
  right: string;
}

export type MatchQuestionDocument = HydratedDocument<MatchQuestion>;

/** Chi tiết câu hỏi Nối / kéo thả. */
@Schema({ collection: 'match-questions', timestamps: true, versionKey: false })
export class MatchQuestion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true, sparse: true, ref: 'Question' })
  @ApiProperty({ type: String })
  questionId: Types.ObjectId;

  @Prop({ type: [MatchPair], default: [] })
  @ApiProperty({ type: [MatchPair] })
  pairs: MatchPair[];

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean })
  allowShuffle: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const MatchQuestionSchema = SchemaFactory.createForClass(MatchQuestion);
