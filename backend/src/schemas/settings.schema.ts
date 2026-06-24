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

  // Nội dung trang chủ công khai (admin tự chỉnh thay vì fix cứng trong code).
  @Prop({
    type: {
      badge: { type: String, default: 'TÀI NGUYÊN NGỮ VĂN · MIỄN PHÍ' },
      heroTitle: { type: String, default: 'Học Văn nhẹ nhàng, tài liệu mở cho tất cả.' },
      heroSubtitle: {
        type: String,
        default:
          'Mình chia sẻ miễn phí kho tài liệu, đề thi, bài giảng và bài tập Ngữ văn Tiểu học — ai cũng có thể đọc, luyện tập và tải về.',
      },
      ctaLabel: { type: String, default: 'Khám phá' },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  homepage: { badge: string; heroTitle: string; heroSubtitle: string; ctaLabel: string };

  // Thông tin SEO cho trang công khai.
  @Prop({
    type: {
      title: { type: String, default: 'Vườn Văn — Học liệu Ngữ văn / Tiếng Việt Tiểu học' },
      description: {
        type: String,
        default:
          'Hệ thống LMS — học liệu, đề thi, bài giảng và bài tập môn Ngữ văn / Tiếng Việt Tiểu học.',
      },
      keywords: { type: [String], default: ['ngữ văn', 'tiếng việt', 'tiểu học', 'học liệu', 'đề thi'] },
      ogImage: { type: String, default: null },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  seo: { title: string; description: string; keywords: string[]; ogImage: string | null };

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
