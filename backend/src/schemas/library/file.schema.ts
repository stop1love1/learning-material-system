import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { FileSource, FileType } from '../../enums';

export type FileItemDocument = HydratedDocument<FileItem>;

@Schema({ collection: 'files', timestamps: true, versionKey: false })
export class FileItem {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, index: true })
  @ApiProperty({ type: String })
  name: string;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @Prop({ type: String, required: true, enum: Object.values(FileType), default: FileType.Link, index: true })
  @ApiProperty({ enum: FileType })
  fileType: FileType;

  @Prop({ type: String, required: true, enum: Object.values(FileSource), default: FileSource.External, index: true })
  @ApiProperty({ enum: FileSource })
  source: FileSource;

  @Prop({ type: String, trim: true, default: null, match: [/^https?:\/\/.+/i, 'url must be a valid http(s) link'] })
  @ApiProperty({ type: String, nullable: true, example: 'https://drive.google.com/file/d/.../view' })
  url: string | null;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  fileKey: string | null;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  thumbnailUrl: string | null;

  @Prop({ type: Number, default: null, min: 0 })
  @ApiProperty({ type: Number, nullable: true, description: 'bytes' })
  size: number | null;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true, example: '2,4 MB' })
  sizeLabel: string | null;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  mimeType: string | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  folderId: Types.ObjectId | null;

  @Prop({ type: String, default: 'Tiếng Việt', trim: true })
  @ApiProperty({ type: String })
  subject: string;

  @Prop({ type: String, default: null, trim: true })
  @ApiProperty({ type: String, nullable: true, example: 'Lớp 5' })
  grade: string | null;

  @Prop({ type: [String], default: [], index: true })
  @ApiProperty({ type: [String] })
  tags: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  userId: Types.ObjectId;

  @Prop({ type: Boolean, default: true, index: true })
  @ApiProperty({ type: Boolean })
  isPublic: boolean;

  @Prop({ type: Number, default: 0, min: 0 })
  @ApiProperty({ type: Number })
  downloadCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  @ApiProperty({ type: Number })
  viewCount: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const FileItemSchema = SchemaFactory.createForClass(FileItem);

FileItemSchema.pre('validate', function (this: FileItemDocument) {
  if (this.source === FileSource.External && !this.url) {
    throw new Error('A file with source=external requires a `url`.');
  }
  if (this.source === FileSource.Internal && !this.fileKey) {
    throw new Error('A file with source=internal requires a `fileKey`.');
  }
});

FileItemSchema.index({ name: 'text', tags: 'text' });
