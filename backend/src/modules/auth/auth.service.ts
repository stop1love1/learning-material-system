import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { User, UserDocument } from '../../schemas/user.schema';
import { Settings } from '../../schemas/settings.schema';
import { BcryptService } from '../../global/bcrypt.service';
import { JwtService } from '../../global/jwt.service';
import { UserRole, UserStatus } from '../../enums';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { MailService } from '../../global/mail.service';

const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 giờ
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 giờ
const OTP_TTL_MS = 5 * 60 * 1000; // 5 phút
const EMAIL_SEND_COOLDOWN_MS = 60 * 1000; // 60s chống gửi lặp
const OTP_MAX_ATTEMPTS = 5; // số lần nhập sai OTP tối đa trong một cửa sổ
const OTP_ATTEMPT_WINDOW_MS = OTP_TTL_MS; // cửa sổ đếm = thời hạn OTP (5 phút)

const forgotPasswordCooldown = new Map<string, number>();
const resendVerificationCooldown = new Map<string, number>();

const otpAttempts = new Map<string, { count: number; firstAt: number }>();

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

    const rawToken = randomBytes(32).toString('hex');
    const hashed = this.hashToken(rawToken);

    await this.userModel.create({
      name: dto.name,
      email,
      password,
      role: UserRole.Student,
      status: UserStatus.Active,
      passwordChangedAt: new Date(),
      emailVerified: false,
      provider: 'local',
      verifyToken: hashed,
      verifyExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${frontendUrl}/xac-thuc-email?token=${rawToken}`;
    const delivered = await this.mail.sendVerification(email, verifyLink);

    return {
      ok: true,
      needsVerification: true,
      ...(delivered ? {} : { devVerifyLink: verifyLink }),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+password +failedLoginAttempts +lockUntil +passwordChangedAt');

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

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

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastActiveAt = new Date();
    await user.save();

    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    // Tài khoản local chưa xác thực email không được cấp token. `=== false` để
    // không chặn người dùng cũ/legacy (emailVerified undefined).
    if (user.provider !== 'google' && user.emailVerified === false) {
      throw new ForbiddenException(
        'Email chưa được xác thực. Vui lòng kiểm tra hộp thư hoặc gửi lại liên kết xác thực.',
      );
    }

    const security = await this.getSecurity();

    if (
      user.provider !== 'google' &&
      security.passwordRotationDays > 0 &&
      user.passwordChangedAt &&
      user.passwordChangedAt.getTime() + security.passwordRotationDays * 86400000 < Date.now()
    ) {
      throw new UnauthorizedException(
        'Mật khẩu đã hết hạn theo chính sách bảo mật. Vui lòng dùng "Quên mật khẩu" để đặt lại.',
      );
    }

    if (security.twoFactor === true && user.provider !== 'google') {
      const code = String(randomInt(100000, 1000000));
      user.otpCode = this.hashToken(code);
      user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
      await user.save();

      const delivered = await this.mail.sendOtp(user.email, code);
      return {
        needs2fa: true as const,
        email: user.email,
        ...(delivered ? {} : { devOtp: code }),
      };
    }

    return this.issue(user);
  }

  async verify2fa(dto: Verify2faDto) {
    const email = dto.email.toLowerCase();

    // Chống dò mã: khoá bước OTP khi nhập sai quá nhiều lần trong cửa sổ.
    if (this.isOtpLocked(email)) {
      throw new UnauthorizedException(
        'Bạn đã nhập sai mã quá nhiều lần, vui lòng thử lại sau ít phút.',
      );
    }

    const user = await this.userModel
      .findOne({ email })
      .select('+otpCode +otpExpires +lockUntil');

    if (!user) {
      throw new UnauthorizedException('Mã không hợp lệ');
    }
    if (!user.otpExpires || user.otpExpires.getTime() < Date.now()) {
      throw new UnauthorizedException('Mã đã hết hạn');
    }
    if (!user.otpCode || !this.otpMatches(dto.code, user.otpCode)) {
      if (this.registerOtpFailure(email) >= OTP_MAX_ATTEMPTS) {
        user.otpCode = null;
        user.otpExpires = null;
        await user.save();
      }
      throw new UnauthorizedException('Mã không đúng');
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(
        'Tài khoản tạm khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau ít phút.',
      );
    }
    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    otpAttempts.delete(email);
    user.otpCode = null;
    user.otpExpires = null;
    user.lastActiveAt = new Date();
    await user.save();

    return this.issue(user);
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: { name?: string; email?: string; avatar?: string }) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException();

    if (dto.name) user.name = dto.name;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;

    let verifyLink: string | undefined;
    let verificationDelivered = true;
    if (dto.email) {
      const email = dto.email.toLowerCase();
      if (await this.userModel.exists({ email, _id: { $ne: userId } })) {
        throw new ConflictException('Email đã được sử dụng');
      }
      const emailChanged = email !== user.email;
      user.email = email;
      // Đổi email trên tài khoản local buộc xác thực lại: hạ emailVerified và gửi
      // liên kết mới (login gate dùng `emailVerified === false`). Tài khoản google
      // đã được Google xác thực nên giữ nguyên.
      if (emailChanged && user.provider !== 'google') {
        const rawToken = randomBytes(32).toString('hex');
        user.emailVerified = false;
        user.verifyToken = this.hashToken(rawToken);
        user.verifyExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        verifyLink = `${frontendUrl}/xac-thuc-email?token=${rawToken}`;
        verificationDelivered = await this.mail.sendVerification(email, verifyLink);
      }
    }

    await user.save();
    const result = this.sanitize(user);
    if (verifyLink && !verificationDelivered) {
      (result as Record<string, unknown>).devVerifyLink = verifyLink;
    }
    return result;
  }

  logout() {
    return { ok: true };
  }

  async refresh(userId: string) {
    const user = await this.userModel.findById(userId).select('+lockUntil');
    if (!user) throw new UnauthorizedException();
    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();

    const user = await this.userModel.findOne({ email });
    if (!user) {
      return { ok: true };
    }

    const last = forgotPasswordCooldown.get(email);
    if (last && Date.now() - last < EMAIL_SEND_COOLDOWN_MS) {
      return { ok: true };
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashed = this.hashToken(rawToken);
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/dat-lai-mat-khau?token=${rawToken}`;
    const delivered = await this.mail.sendPasswordReset(email, resetLink);
    forgotPasswordCooldown.set(email, Date.now());

    return { ok: true, ...(delivered ? {} : { devToken: rawToken, devResetLink: resetLink }) };
  }

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

  async verifyEmail(dto: VerifyEmailDto) {
    if (!dto.token || !dto.token.trim()) {
      throw new BadRequestException('Liên kết xác thực không hợp lệ');
    }
    const hashed = this.hashToken(dto.token);
    const user = await this.userModel
      .findOne({ verifyToken: hashed })
      .select('+verifyToken +verifyExpires');

    if (!user) {
      throw new BadRequestException('Liên kết xác thực không hợp lệ');
    }
    if (!user.verifyExpires || user.verifyExpires.getTime() < Date.now()) {
      throw new UnauthorizedException('Liên kết xác thực đã hết hạn');
    }
    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    user.emailVerified = true;
    user.verifyToken = null;
    user.verifyExpires = null;
    await user.save();

    return { ok: true, ...this.issue(user) };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.toLowerCase();
    const user = await this.userModel.findOne({ email });
    if (!user || user.emailVerified === true) {
      return { ok: true };
    }

    const last = resendVerificationCooldown.get(email);
    if (last && Date.now() - last < EMAIL_SEND_COOLDOWN_MS) {
      return { ok: true };
    }

    const rawToken = randomBytes(32).toString('hex');
    user.verifyToken = this.hashToken(rawToken);
    user.verifyExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${frontendUrl}/xac-thuc-email?token=${rawToken}`;
    const delivered = await this.mail.sendVerification(email, verifyLink);
    resendVerificationCooldown.set(email, Date.now());

    return { ok: true, ...(delivered ? {} : { devVerifyLink: verifyLink }) };
  }

  async googleLogin(dto: GoogleLoginDto) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || !clientId.trim()) {
      throw new ServiceUnavailableException('Đăng nhập Google chưa được cấu hình');
    }

    const client = new OAuth2Client(clientId);
    let payload: import('google-auth-library').TokenPayload | undefined;
    try {
      const ticket = await client.verifyIdToken({ idToken: dto.idToken, audience: clientId });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token Google không hợp lệ');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Token Google không hợp lệ');
    }

    const email = payload.email.toLowerCase();
    let user = await this.userModel.findOne({ email });

    if (user) {
      // Google đã xác thực email — mở khoá gate xác thực. Không ghi đè provider của
      // tài khoản local; chỉ điền avatar nếu đang trống.
      user.emailVerified = true;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      user.lastActiveAt = new Date();
      await user.save();
    } else {
      user = await this.userModel.create({
        name: payload.name || email,
        email,
        password: null,
        role: UserRole.Student,
        status: UserStatus.Active,
        emailVerified: true,
        provider: 'google',
        avatar: payload.picture || null,
        passwordChangedAt: null,
      });
    }

    return this.issue(user);
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Constant-time comparison of a raw OTP against its stored SHA-256 hash.
   * Hashing first guarantees equal-length hex buffers for timingSafeEqual.
   */
  private otpMatches(raw: string, storedHash: string): boolean {
    const a = Buffer.from(this.hashToken(raw), 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  private isOtpLocked(email: string): boolean {
    const entry = otpAttempts.get(email);
    if (!entry) return false;
    if (Date.now() - entry.firstAt >= OTP_ATTEMPT_WINDOW_MS) {
      otpAttempts.delete(email);
      return false;
    }
    return entry.count >= OTP_MAX_ATTEMPTS;
  }

  private registerOtpFailure(email: string): number {
    const now = Date.now();
    const entry = otpAttempts.get(email);
    if (!entry || now - entry.firstAt >= OTP_ATTEMPT_WINDOW_MS) {
      otpAttempts.set(email, { count: 1, firstAt: now });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }

  private async getSecurity(): Promise<{
    lockoutThreshold: number;
    allowSelfRegister: boolean;
    twoFactor: boolean;
    passwordRotationDays: number;
  }> {
    const fallback = {
      lockoutThreshold: 5,
      allowSelfRegister: true,
      twoFactor: false,
      passwordRotationDays: 0,
    };
    try {
      const settings = await this.settingsModel.findOne({ key: 'system' }).lean();
      const security = (settings as any)?.security;
      if (!security) return fallback;
      return {
        lockoutThreshold:
          typeof security.lockoutThreshold === 'number' ? security.lockoutThreshold : 5,
        allowSelfRegister:
          typeof security.allowSelfRegister === 'boolean' ? security.allowSelfRegister : true,
        twoFactor: typeof security.twoFactor === 'boolean' ? security.twoFactor : false,
        passwordRotationDays:
          typeof security.passwordRotationDays === 'number' ? security.passwordRotationDays : 0,
      };
    } catch {
      return fallback;
    }
  }

  private async registerFailedLogin(user: UserDocument): Promise<void> {
    const { lockoutThreshold } = await this.getSecurity();
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

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
    delete obj.verifyToken;
    delete obj.verifyExpires;
    delete obj.otpCode;
    delete obj.otpExpires;
    return obj;
  }
}
