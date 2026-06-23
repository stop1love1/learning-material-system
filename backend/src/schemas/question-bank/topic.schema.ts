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
  if (!this.parentId) {
    this.ancestors = [];
    this.depth = 0;
    return;
  }
  const model = this.constructor as Model<TopicDocument>;
  const parent = await model.findById(this.parentId).select('_id ancestors depth').lean();
  if (!parent) throw new Error('Parent topic not found');
  this.ancestors = [...(parent.ancestors || []), parent._id];
  this.depth = (parent.depth || 0) + 1;
});
