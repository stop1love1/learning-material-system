import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, randomBytes } from 'crypto';
import { User, UserDocument } from '../../schemas/user.schema';
import { Settings } from '../../schemas/settings.schema';
import { BcryptService } from '../../global/bcrypt.service';
import { JwtService } from '../../global/jwt.service';
import { UserRole, UserStatus } from '../../enums';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './mail.service';

const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 giờ

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Settings.name) private readonly settingsModel: Model<Settings>,
    private readonly bcrypt: BcryptService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const security = await this.getSecurity();
    if (security.allowSelfRegister === false) {
      throw new ForbiddenException('Đăng ký đang tạm khoá');
    }
    const email = dto.email.toLowerCase();
    if (await this.userModel.exists({ email })) {
      throw new ConflictException('Email đã được sử dụng');
    }
    const password = await this.bcrypt.hash(dto.password);
    const user = await this.userModel.create({
      name: dto.name,
      email,
      password,
      role: UserRole.Student,
      status: UserStatus.Active,
      passwordChangedAt: new Date(),
    });
    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+password +failedLoginAttempts +lockUntil');

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tài khoản đang bị tạm khoá?
    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(
        'Tài khoản tạm khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau ít phút.',
      );
    }

    const ok = !!user.password && (await this.bcrypt.compare(dto.password, user.password));
    if (!ok) {
      await this.registerFailedLogin(user);
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Mật khẩu đúng: reset bộ đếm + mở khoá NGAY (kể cả tài khoản inactive — tránh để
    // lại bộ đếm cũ), rồi mới kiểm tra trạng thái.
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastActiveAt = new Date();
    await user.save();

    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    return this.issue(user);
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: { name?: string; email?: string; avatar?: string }) {
    const patch: Record<string, unknown> = {};
    if (dto.name) patch.name = dto.name;
    if (dto.email) {
      const email = dto.email.toLowerCase();
      if (await this.userModel.exists({ email, _id: { $ne: userId } })) {
        throw new ConflictException('Email đã được sử dụng');
      }
      patch.email = email;
    }
    if (dto.avatar !== undefined) patch.avatar = dto.avatar;
    const user = await this.userModel.findByIdAndUpdate(userId, patch, { new: true });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  /** Best-effort logout. Tokens are stateless JWTs so there is nothing to revoke server-side. */
  logout() {
    return { ok: true };
  }

  /** Re-issue a fresh JWT for the current (already authenticated) user. */
  async refresh(userId: string) {
    const user = await this.userModel.findById(userId).select('+lockUntil');
    if (!user) throw new UnauthorizedException();
    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }
    // Tài khoản đang bị tạm khoá không được cấp token mới.
    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(
        'Tài khoản tạm khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau ít phút.',
      );
    }
    const accessToken = this.jwt.sign({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    });
    return { accessToken };
  }

  /**
   * Always returns 200 to avoid user enumeration. Generates a reset token, stores its
   * SHA-256 hash + expiry on the user, and "sends" the email (dev mode = logs the link).
   * In dev mode (SMTP not configured) also returns the raw token + link.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const smtpHost = await this.getSmtpHost();

    const user = await this.userModel.findOne({ email });
    if (!user) {
      // No enumeration: pretend success without doing anything.
      return { ok: true };
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashed = this.hashToken(rawToken);
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/dat-lai-mat-khau?token=${rawToken}`;
    this.mail.sendPasswordReset(email, resetLink, smtpHost);

    // TODO: real SMTP not implemented — always surface dev link so the reset token is
    // never silently lost (no real email is delivered even when smtpHost is set).
    return { ok: true, devToken: rawToken, devResetLink: resetLink };
  }

  /** Verify the reset token (hash + not expired), set a new password, clear token fields. */
  async resetPassword(dto: ResetPasswordDto) {
    if (!dto.token || !dto.token.trim()) {
      throw new BadRequestException('Token không hợp lệ');
    }
    const hashed = this.hashToken(dto.token);
    const user = await this.userModel
      .findOne({ resetPasswordToken: hashed })
      .select('+resetPasswordToken +resetPasswordExpires +password');

    if (!user) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }
    if (!user.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now()) {
      throw new UnauthorizedException('Token đã hết hạn');
    }
    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    user.password = await this.bcrypt.hash(dto.password);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.passwordChangedAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    return { ok: true };
  }

  // ---- helpers -------------------------------------------------------------

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /** Read the `security` group from the `system` settings doc, defensively. */
  private async getSecurity(): Promise<{ lockoutThreshold: number; allowSelfRegister: boolean }> {
    const fallback = { lockoutThreshold: 5, allowSelfRegister: true };
    try {
      const settings = await this.settingsModel.findOne({ key: 'system' }).lean();
      const security = (settings as any)?.security;
      if (!security) return fallback;
      return {
        lockoutThreshold:
          typeof security.lockoutThreshold === 'number' ? security.lockoutThreshold : 5,
        allowSelfRegister:
          typeof security.allowSelfRegister === 'boolean' ? security.allowSelfRegister : true,
      };
    } catch {
      return fallback;
    }
  }

  private async getSmtpHost(): Promise<string | null> {
    try {
      const settings = await this.settingsModel.findOne({ key: 'system' }).lean();
      const host = (settings as any)?.integration?.smtpHost;
      return typeof host === 'string' ? host : null;
    } catch {
      return null;
    }
  }

  /** Increment failed-login counter and lock the account when the threshold is reached. */
  private async registerFailedLogin(user: UserDocument): Promise<void> {
    const { lockoutThreshold } = await this.getSecurity();
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // 0 (or negative) = lockout disabled.
    if (lockoutThreshold > 0 && user.failedLoginAttempts >= lockoutThreshold) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      await user.save();
      throw new UnauthorizedException(
        'Tài khoản tạm khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau ít phút.',
      );
    }
    await user.save();
  }

  private issue(user: UserDocument) {
    const accessToken = this.jwt.sign({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    });
    return { accessToken, user: this.sanitize(user) };
  }

  private sanitize(user: UserDocument) {
    const obj = user.toObject() as unknown as Record<string, unknown>;
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.failedLoginAttempts;
    delete obj.lockUntil;
    return obj;
  }
}
