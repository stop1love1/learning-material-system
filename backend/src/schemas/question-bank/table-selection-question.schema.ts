import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type TableSelectionQuestionDocument = HydratedDocument<TableSelectionQuestion>;

/** Chi tiết câu hỏi chọn Đúng/Sai theo bảng — tái dùng reference `table-selection-question`. */
@Schema({ collection: 'table-selection-questions', timestamps: true, versionKey: false })
export class TableSelectionQuestion {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true, sparse: true, ref: 'Question' })
  @ApiProperty({ type: String })
  questionId: Types.ObjectId;

  @Prop({
    type: [String],
    required: true,
    validate: {
      validator: (v: string[]) => Array.isArray(v) && v.length > 0,
      message: 'statements must be a non-empty array of strings',
    },
  })
  @ApiProperty({ type: [String], example: ['Câu nhân hoá', 'Câu so sánh', 'Câu kể'] })
  statements: string[];

  @Prop({
    type: [Boolean],
    required: true,
    validate: {
      validator: function (this: TableSelectionQuestion, v: boolean[]) {
        return v.length === this.statements.length;
      },
      message: 'correctAnswers length must match statements length',
    },
  })
  @ApiProperty({ type: [Boolean], example: [true, false, true] })
  correctAnswers: boolean[];

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean })
  allowShuffle: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const TableSelectionQuestionSchema = SchemaFactory.createForClass(TableSelectionQuestion);
