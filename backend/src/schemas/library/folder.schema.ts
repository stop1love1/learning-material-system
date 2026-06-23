import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Model, Types } from 'mongoose';

export type FolderDocument = HydratedDocument<Folder>;

/**
 * Thư mục trong Kho tài liệu (Giáo án, Tập đọc, Thơ, Đề thi…). Cây phân cấp theo
 * materialized-path (ancestors + depth) như reference `item`/`topic`.
 */
@Schema({ collection: 'folders', timestamps: true, versionKey: false })
export class Folder {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, index: true })
  @ApiProperty({ type: String })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  parentId: Types.ObjectId | null;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Folder', default: [], index: true })
  @ApiProperty({ type: [String] })
  ancestors: Types.ObjectId[];

  @Prop({ type: Number, default: 0, index: true })
  @ApiProperty({ type: Number })
  depth: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  userId: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean })
  isPublic: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);

// Cập nhật ancestors/depth từ parentId khi lưu.
FolderSchema.pre('save', async function (this: FolderDocument) {
  if (!this.isModified('parentId')) return;
  if (!this.parentId) {
    this.ancestors = [];
    this.depth = 0;
    return;
  }
  const model = this.constructor as Model<FolderDocument>;
  const parent = await model.findById(this.parentId).select('_id ancestors depth').lean();
  if (!parent) throw new Error('Parent folder not found');
  this.ancestors = [...(parent.ancestors || []), parent._id];
  this.depth = (parent.depth || 0) + 1;
});
