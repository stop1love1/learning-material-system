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

  @Prop({
    type: {
      smtpHost: { type: String, default: null },
      smtpPort: { type: Number, default: null },
      smtpUser: { type: String, default: null },
      smtpFrom: { type: String, default: null },
      storageProvider: { type: String, default: 'external' },
      apiKey: { type: String, default: null },
      // Google OAuth Client ID + Drive/Picker API Key. Đây là giá trị CÔNG KHAI phía
      // client (Google Picker/Sign-In chạy trên trình duyệt) nên KHÔNG bị redact ở GET
      // /settings — cho phép cấu hình runtime, đổi khoá không cần build lại.
      googleClientId: { type: String, default: null },
      googleApiKey: { type: String, default: null },
      // Link tới Gemini Gem (trợ lý AI góp ý bài viết). Công khai phía client (chỉ là URL
      // deep-link mở tab mới) nên KHÔNG redact và có mặt trong public view. Trống → ẩn nút.
      aiGemUrl: { type: String, default: 'https://gemini.google.com/gem/35bda094c89a?usp=sharing' },
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
    googleClientId: string | null;
    googleApiKey: string | null;
    aiGemUrl: string | null;
  };

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

  @Prop({
    type: {
      badge: { type: String, default: 'TÀI NGUYÊN HỌC TẬP · MIỄN PHÍ' },
      heroTitle: { type: String, default: 'Học Tiếng Việt nhẹ nhàng, kho học liệu mở cho tất cả.' },
      heroSubtitle: {
        type: String,
        default:
          'Mình chia sẻ miễn phí kho học liệu và bài tập môn Tiếng Việt Tiểu học — ai cũng có thể đọc, luyện tập và tải về.',
      },
      ctaLabel: { type: String, default: 'Khám phá' },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  homepage: { badge: string; heroTitle: string; heroSubtitle: string; ctaLabel: string };

  @Prop({
    type: {
      title: { type: String, default: 'Vườn Văn — Nền tảng học liệu' },
      description: {
        type: String,
        default:
          'Hệ thống LMS — học liệu và bài tập môn Tiếng Việt Tiểu học.',
      },
      keywords: { type: [String], default: ['học liệu', 'tiểu học', 'tiếng việt', 'bài tập', 'lms'] },
      ogImage: { type: String, default: null },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  seo: { title: string; description: string; keywords: string[]; ogImage: string | null };

  // Nội dung các trang tĩnh trong footer (admin soạn ở Cài đặt → Trang nội dung).
  // Mỗi trang: { title, content(HTML) }.
  @Prop({
    type: {
      about: {
        title: { type: String, default: 'Giới thiệu' },
        content: {
          type: String,
          default:
            '<p><strong>Vườn Văn</strong> là kho học liệu mở, miễn phí cho môn Tiếng Việt tiểu học (lớp 4–5). Ở đây tập hợp phiếu học tập, đề bài, ngữ liệu đọc, sơ đồ tư duy và bảng tiêu chí đánh giá được biên soạn bám sát chương trình GDPT 2018 (bộ Kết nối tri thức với cuộc sống).</p><p>Mọi tài liệu đều có thể đọc, luyện tập và tải về mà không cần đăng nhập. Chúng tôi mong muốn học liệu tốt đến được với mọi học sinh, phụ huynh và thầy cô.</p>',
        },
      },
      guide: {
        title: { type: String, default: 'Hướng dẫn sử dụng' },
        content: {
          type: String,
          default:
            '<p>Bạn có thể bắt đầu từ bốn khu vực chính:</p><ul><li><strong>Kho học liệu</strong> — tìm và đọc tài liệu theo thư mục hoặc từ khoá; bấm “Tải về” để lưu bản trên Google Drive.</li><li><strong>Luyện tập</strong> — làm các bài trắc nghiệm; câu khách quan được chấm ngay, câu viết đoạn do giáo viên chấm.</li><li><strong>Tự đánh giá</strong> — dùng bảng tiêu chí (rubric) để tự chấm bài viết của mình.</li><li><strong>Bài viết</strong> — đọc các bài chia sẻ về phương pháp học Tiếng Việt.</li></ul>',
        },
      },
      contact: {
        title: { type: String, default: 'Liên hệ' },
        content: {
          type: String,
          default:
            '<p>Nếu bạn cần hỗ trợ, góp ý hoặc muốn chia sẻ học liệu, hãy liên hệ với tác giả qua thông tin bên dưới. Rất mong nhận được ý kiến đóng góp để Vườn Văn ngày càng hữu ích.</p><ul><li><strong>Tác giả:</strong> Trần Phương Thanh</li><li><strong>Điện thoại:</strong> <a href="tel:0972421266">0972 421 266</a></li><li><strong>Email:</strong> <a href="mailto:tpthanh@daihocthudo.edu.vn">tpthanh@daihocthudo.edu.vn</a></li></ul>',
        },
      },
      terms: {
        title: { type: String, default: 'Điều khoản' },
        content: {
          type: String,
          default:
            '<p>Học liệu trên Vườn Văn được chia sẻ miễn phí cho mục đích học tập. Bạn có thể sử dụng, in và tải về cho việc dạy và học cá nhân.</p><p>Vui lòng ghi nguồn khi sử dụng lại và không dùng cho mục đích thương mại nếu chưa được cho phép. Một số tài liệu được dẫn từ Google Drive; bản quyền thuộc về tác giả gốc.</p>',
        },
      },
    },
    default: {},
    _id: false,
  })
  @ApiProperty({ type: Object })
  pages: {
    about: { title: string; content: string };
    guide: { title: string; content: string };
    contact: { title: string; content: string };
    terms: { title: string; content: string };
  };

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
