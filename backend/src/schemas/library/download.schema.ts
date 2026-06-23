import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { DownloadKind } from '../../enums';

export type DownloadDocument = HydratedDocument<Download>;

@Schema({ collection: 'downloads', timestamps: true, versionKey: false })
export class Download {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  userId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'FileItem' })
  @ApiProperty({ type: String })
  fileId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(DownloadKind), default: DownloadKind.Download, index: true })
  @ApiProperty({ enum: DownloadKind })
  kind: DownloadKind;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const DownloadSchema = SchemaFactory.createForClass(Download);
DownloadSchema.index({ userId: 1, fileId: 1, kind: 1 }, { unique: true });
