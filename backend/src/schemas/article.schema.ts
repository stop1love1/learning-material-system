import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ArticleDocument = HydratedDocument<Article>;

/** Bài viết / blog — tái dùng reference `article`. */
@Schema({ collection: 'articles', timestamps: true, versionKey: false })
export class Article {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String })
  title: string;

  @Prop({ type: String, default: null, trim: true, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  slug: string | null;

  @Prop({ type: String, default: '' })
  @ApiProperty({ type: String })
  excerpt: string;

  @Prop({ type: String, default: '' })
  @ApiProperty({ type: String })
  content: string;

  @Prop({ type: [String], default: [] })
  @ApiProperty({ type: [String] })
  images: string[];

  @Prop({ type: String, default: null, trim: true, index: true })
  @ApiProperty({ type: String, nullable: true, example: 'Tập làm văn' })
  category: string | null;

  /** Khóa màu bìa hoặc URL ảnh bìa. */
  @Prop({ type: String, default: 'clay' })
  @ApiProperty({ type: String })
  cover: string;

  @Prop({ type: [String], default: [], index: true })
  @ApiProperty({ type: [String] })
  tags: string[];

  @Prop({ type: Boolean, default: true, index: true })
  @ApiProperty({ type: Boolean })
  isPublished: boolean;

  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean })
  isFeatured: boolean;

  @Prop({ type: Number, default: 0, min: 0 })
  @ApiProperty({ type: Number })
  viewCount: number;

  @Prop({ type: Number, default: 4, min: 0 })
  @ApiProperty({ type: Number, example: 5 })
  readMinutes: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
