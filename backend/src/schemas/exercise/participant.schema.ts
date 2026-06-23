import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ParticipantDocument = HydratedDocument<Participant>;

/** Người tham gia một lượt làm (trạng thái phiên làm bài). */
@Schema({ collection: 'participants', timestamps: true, versionKey: false })
export class Participant {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  studentId: Types.ObjectId | null;

  @Prop({ type: String, default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  sessionId: string | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true, ref: 'Attempt' })
  @ApiProperty({ type: String })
  attemptId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  @ApiProperty({ type: Date })
  joinedAt: Date;

  @Prop({ type: Date, default: null })
  @ApiProperty({ type: Date, nullable: true })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  @ApiProperty({ type: Date, nullable: true })
  endedAt: Date | null;

  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean })
  isFinished: boolean;

  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean })
  isBanned: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);
