import { BadRequestException } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Model, Types } from 'mongoose';

export type ExerciseFolderDocument = HydratedDocument<ExerciseFolder>;

/**
 * Thư mục cây cho "Bài tập" + "Kho đề thi" (cùng một cây). Phân cấp theo
 * materialized-path (ancestors + depth) — mô phỏng `library/folder.schema`.
 */
@Schema({ collection: 'exercise_folders', timestamps: true, versionKey: false })
export class ExerciseFolder {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, index: true })
  @ApiProperty({ type: String })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseFolder', default: null, index: true, sparse: true })
  @ApiProperty({ type: String, nullable: true })
  parentId: Types.ObjectId | null;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'ExerciseFolder', default: [], index: true })
  @ApiProperty({ type: [String] })
  ancestors: Types.ObjectId[];

  @Prop({ type: Number, default: 0, index: true })
  @ApiProperty({ type: Number })
  depth: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' })
  @ApiProperty({ type: String })
  userId: Types.ObjectId;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const ExerciseFolderSchema = SchemaFactory.createForClass(ExerciseFolder);

ExerciseFolderSchema.pre('save', async function (this: ExerciseFolderDocument) {
  this.$locals.parentChanged = this.isModified('parentId');
  if (!this.isModified('parentId')) return;
  if (!this.parentId) {
    this.ancestors = [];
    this.depth = 0;
    return;
  }
  // Không cho phép tự làm cha của chính nó.
  if (this.parentId.equals(this._id)) {
    throw new BadRequestException('Thư mục không thể là cha của chính nó');
  }
  const model = this.constructor as Model<ExerciseFolderDocument>;
  const parent = await model.findById(this.parentId).select('_id ancestors depth').lean();
  if (!parent) throw new BadRequestException('Không tìm thấy thư mục cha');
  // Chống chu trình: cha mới không được nằm trong cây con. Kiểm tra trực tiếp trên DB
  // (ancestors của cha chứa node này) để bắt cả các cây con sâu / chuỗi ancestor cũ.
  if ((parent.ancestors || []).some((a) => a.equals(this._id)) || parent._id.equals(this._id)) {
    throw new BadRequestException('Không thể di chuyển thư mục vào trong thư mục con của nó');
  }
  const descendant = await model.exists({ ancestors: this._id, _id: this.parentId });
  if (descendant) {
    throw new BadRequestException('Không thể di chuyển thư mục vào trong thư mục con của nó');
  }
  this.ancestors = [...(parent.ancestors || []), parent._id];
  this.depth = (parent.depth || 0) + 1;
});

ExerciseFolderSchema.post('save', async function (this: ExerciseFolderDocument) {
  if (!this.$locals.parentChanged) return;
  const model = this.constructor as Model<ExerciseFolderDocument>;
  const descendants = await model.find({ ancestors: this._id }).select('_id ancestors').lean();
  const baseAncestors = [...(this.ancestors || []), this._id];
  for (const d of descendants) {
    const idx = (d.ancestors || []).findIndex((a) => a.equals(this._id));
    const tail = idx >= 0 ? (d.ancestors || []).slice(idx + 1) : [];
    const newAncestors = [...baseAncestors, ...tail];
    await model.updateOne({ _id: d._id }, { ancestors: newAncestors, depth: newAncestors.length });
  }
});
