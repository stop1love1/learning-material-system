import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';

export type SettingsDocument = HydratedDocument<Settings>;

@Schema({ collection: 'settings', timestamps: true, versionKey: false })
export class Settings {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, default: 'system' })
  @ApiProperty({ type: String })
  key: string;

  @Prop({
    type: {
      name: { type: String, default: 'Vườn Văn' },
      domain: { type: String, default: null },
      logoUrl: { type: String, default: null },
      timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  org: { name: string; domain: string | null; logoUrl: string | null; timezone: string };

  @Prop({
    type: {
      accent: { type: String, default: 'grass' },
      headingFont: { type: String, default: 'baloo' },
      dark: { type: Boolean, default: false },
      density: { type: String, default: 'regular' },
      railWide: { type: Boolean, default: false },
      assignFlow: { type: String, default: 'wizard' },
      rubricStyle: { type: String, default: 'matrix' },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  appearance: {
    accent: string;
    headingFont: string;
    dark: boolean;
    density: string;
    railWide: boolean;
    assignFlow: string;
    rubricStyle: string;
  };

  @Prop({
    type: { allowGoogleLogin: { type: Boolean, default: true } },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  misc: { allowGoogleLogin: boolean };

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
