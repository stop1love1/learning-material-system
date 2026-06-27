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

// Cập nhật ancestors/depth từ parentId khi lưu.
ExerciseFolderSchema.pre('save', async function (this: ExerciseFolderDocument) {
  if (!this.isModified('parentId')) return;
  if (!this.parentId) {
    this.ancestors = [];
    this.depth = 0;
    return;
  }
  // Không cho phép tự làm cha của chính nó.
  if (this.parentId.equals(this._id)) {
    throw new Error('A folder cannot be its own parent');
  }
  const model = this.constructor as Model<ExerciseFolderDocument>;
  const parent = await model.findById(this.parentId).select('_id ancestors depth').lean();
  if (!parent) throw new Error('Parent folder not found');
  // Chống chu trình: cha mới không được nằm trong cây con (ancestors của cha chứa node này).
  if ((parent.ancestors || []).some((a) => a.equals(this._id))) {
    throw new Error('A folder cannot be moved under its own descendant');
  }
  this.ancestors = [...(parent.ancestors || []), parent._id];
  this.depth = (parent.depth || 0) + 1;
});
