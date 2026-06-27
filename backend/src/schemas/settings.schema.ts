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

  // Cấu hình đánh giá (thang điểm, ngưỡng đạt, làm tròn…).
  @Prop({
    type: {
      scoreScale: { type: Number, default: 10 },
      passThreshold: { type: Number, default: 5 },
      rounding: { type: String, default: 'none' }, // 'none' | 'half' | 'integer'
      allowResubmit: { type: Boolean, default: false },
      showScoreImmediately: { type: Boolean, default: true },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  academic: {
    scoreScale: number;
    passThreshold: number;
    rounding: string;
    allowResubmit: boolean;
    showScoreImmediately: boolean;
  };

  // Bảo mật & đăng nhập.
  @Prop({
    type: {
      twoFactor: { type: Boolean, default: false },
      passwordRotationDays: { type: Number, default: 0 }, // 0 = không bắt buộc
      lockoutThreshold: { type: Number, default: 5 },
      allowSelfRegister: { type: Boolean, default: true },
      ssoEnabled: { type: Boolean, default: false },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  security: {
    twoFactor: boolean;
    passwordRotationDays: number;
    lockoutThreshold: number;
    allowSelfRegister: boolean;
    ssoEnabled: boolean;
  };

  // Thông báo hệ thống.
  @Prop({
    type: {
      emailOnSubmit: { type: Boolean, default: true },
      remindUngraded: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  notifications: { emailOnSubmit: boolean; remindUngraded: boolean; weeklyDigest: boolean };

  // Tích hợp (SMTP, lưu trữ, API key).
  @Prop({
    type: {
      smtpHost: { type: String, default: null },
      smtpPort: { type: Number, default: null },
      smtpUser: { type: String, default: null },
      smtpFrom: { type: String, default: null },
      storageProvider: { type: String, default: 'external' },
      apiKey: { type: String, default: null },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  integration: {
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpFrom: string | null;
    storageProvider: string;
    apiKey: string | null;
  };

  // Dữ liệu & sao lưu.
  @Prop({
    type: {
      autoBackup: { type: Boolean, default: false },
      backupFrequency: { type: String, default: 'weekly' }, // 'daily' | 'weekly' | 'monthly'
      encryptBackups: { type: Boolean, default: false },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  data: { autoBackup: boolean; backupFrequency: string; encryptBackups: boolean };

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
