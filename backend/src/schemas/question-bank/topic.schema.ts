import { BadRequestException } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Model, Types } from 'mongoose';

export type TopicDocument = HydratedDocument<Topic>;

@Schema({ collection: 'topics', timestamps: true, versionKey: false })
export class Topic {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  parentId: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String })
  title: string;

  @Prop({ type: String, default: null })
  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Topic', default: [], index: true })
  @ApiProperty({ type: [String] })
  ancestors: Types.ObjectId[];

  @Prop({ type: Number, default: 0, index: true })
  @ApiProperty({ type: Number })
  depth: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

TopicSchema.pre('save', async function (this: TopicDocument) {
  if (!this.isModified('parentId')) return;
  // Đánh dấu để post('save') cascade-recompute cây con sau khi node này đổi cha.
  (this as any).$locals.parentChanged = true;
  if (!this.parentId) {
    this.ancestors = [];
    this.depth = 0;
    return;
  }
  // Không cho phép tự làm cha của chính nó.
  if (this.parentId.equals(this._id)) {
    throw new BadRequestException('Chủ đề không thể là cha của chính nó');
  }
  const model = this.constructor as Model<TopicDocument>;
  const parent = await model.findById(this.parentId).select('_id ancestors depth').lean();
  if (!parent) throw new BadRequestException('Không tìm thấy chủ đề cha');
  // Chống chu trình: cha mới không được là chính node này hoặc nằm trong cây con
  // của nó (ancestors của cha mới chứa node này).
  if ((parent.ancestors || []).some((a) => a.equals(this._id))) {
    throw new BadRequestException('Không thể di chuyển chủ đề vào trong chủ đề con của nó');
  }
  this.ancestors = [...(parent.ancestors || []), parent._id];
  this.depth = (parent.depth || 0) + 1;
});

// Sau khi đổi cha, cây con vẫn giữ ancestors/depth cũ → cascade-recompute toàn bộ
// hậu duệ (mọi node có ancestors chứa node này) theo thứ tự depth tăng dần để cha
// luôn được cập nhật trước con (mirror cách reference vật-liệu-hoá lại path).
TopicSchema.post('save', async function (this: TopicDocument) {
  if (!(this as any).$locals?.parentChanged) return;
  (this as any).$locals.parentChanged = false;

  const model = this.constructor as Model<TopicDocument>;
  const descendants = await model
    .find({ ancestors: this._id })
    .select('_id parentId')
    .sort({ depth: 1 })
    .lean();
  if (!descendants.length) return;

  // Bản đồ ancestors/depth đã biết, khởi tạo từ chính node vừa lưu.
  const known = new Map<string, { ancestors: Types.ObjectId[]; depth: number }>();
  known.set(this._id.toString(), { ancestors: this.ancestors || [], depth: this.depth || 0 });

  for (const node of descendants) {
    const parentKey = node.parentId ? node.parentId.toString() : null;
    const parent = parentKey ? known.get(parentKey) : undefined;
    // parent đã được xử lý trước (sort depth tăng dần); nếu thiếu thì bỏ qua an toàn.
    if (!parent) continue;
    const ancestors = [...parent.ancestors, node.parentId as Types.ObjectId];
    const depth = parent.depth + 1;
    known.set(node._id.toString(), { ancestors, depth });
    await model.updateOne({ _id: node._id }, { $set: { ancestors, depth } });
  }
});
