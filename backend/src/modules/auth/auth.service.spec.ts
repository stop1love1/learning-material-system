import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';

import { AuthService } from './auth.service';
import { User } from '../../schemas/user.schema';
import { Settings } from '../../schemas/settings.schema';
import { BcryptService } from '../../global/bcrypt.service';
import { JwtService } from '../../global/jwt.service';
import { MailService } from '../../global/mail.service';
import { UserRole, UserStatus } from '../../enums';

// AuthService does `new OAuth2Client(clientId)` then `client.verifyIdToken(...)`.
// We mock the constructor so each test can control the returned ticket/payload.
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

const sha256 = (raw: string) => createHash('sha256').update(raw).digest('hex');

/**
 * Build a fake user "document": a plain object with a jest-mocked `save()` and a
 * `toObject()` that returns a shallow copy (so sanitize() can delete fields without
 * mutating the test fixture).
 */
function makeUser(overrides: Record<string, any> = {}) {
  const base: Record<string, any> = {
    _id: { toString: () => 'user-id-1' },
    name: 'Học Sinh',
    email: 'student@vuonvan.vn',
    password: 'hashed-pw',
    role: UserRole.Student,
    status: UserStatus.Active,
    provider: 'local',
    emailVerified: true,
    avatar: null,
    failedLoginAttempts: 0,
    lockUntil: null,
    passwordChangedAt: new Date(),
    resetPasswordToken: null,
    resetPasswordExpires: null,
    verifyToken: null,
    verifyExpires: null,
    otpCode: null,
    otpExpires: null,
    lastActiveAt: null,
    ...overrides,
  };
  base.save = jest.fn().mockResolvedValue(base);
  base.toObject = jest.fn(() => ({ ...base }));
  return base;
}

/** A findOne(...).select(...) chain that resolves (await-able) to `result`. */
function findOneSelect(result: any) {
  const select = jest.fn().mockResolvedValue(result);
  return { select };
}

describe('AuthService', () => {
  let service: AuthService;

  // model + collaborator mocks (re-created each test)
  let userModel: any;
  let settingsModel: any;
  let bcrypt: { hash: jest.Mock; compare: jest.Mock };
  let jwt: { sign: jest.Mock };
  let mail: {
    sendVerification: jest.Mock;
    sendPasswordReset: jest.Mock;
    sendOtp: jest.Mock;
  };

  // default security group returned by settingsModel.findOne(...).lean()
  let securityValue: Record<string, any> | null;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockVerifyIdToken.mockReset();

    securityValue = null; // => getSecurity() returns its fallback defaults

    userModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      create: jest.fn(),
      exists: jest.fn(),
    };

    settingsModel = {
      findOne: jest.fn(() => ({
        lean: jest.fn().mockResolvedValue(
          securityValue === null ? null : { security: securityValue },
        ),
      })),
    };

    bcrypt = {
      hash: jest.fn().mockResolvedValue('hashed-pw'),
      compare: jest.fn().mockResolvedValue(true),
    };
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
    mail = {
      sendVerification: jest.fn().mockResolvedValue(true),
      sendPasswordReset: jest.fn().mockResolvedValue(true),
      sendOtp: jest.fn().mockResolvedValue(true),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Settings.name), useValue: settingsModel },
        { provide: BcryptService, useValue: bcrypt },
        { provide: JwtService, useValue: jwt },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
  });

  /** Helper to set the security settings the service will read. */
  const setSecurity = (sec: Record<string, any>) => {
    securityValue = sec;
  };

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('issues a token + sanitized user on success and resets failure counters', async () => {
      const user = makeUser({ failedLoginAttempts: 3, lockUntil: new Date(Date.now() - 1000) });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      bcrypt.compare.mockResolvedValue(true);

      const res = await service.login({ email: 'Student@Vuonvan.VN', password: 'pw' } as any);

      // email lower-cased in the query
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'student@vuonvan.vn' });
      // counters reset + saved before token issued
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockUntil).toBeNull();
      expect(user.save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-id-1', email: 'student@vuonvan.vn' }),
      );
      expect(res).toEqual({ accessToken: 'signed.jwt.token', user: expect.any(Object) });
      // sanitized: no secrets leaked
      expect((res as any).user.password).toBeUndefined();
      expect((res as any).user.otpCode).toBeUndefined();
    });

    it('rejects an unknown email with Unauthorized (no enumeration)', async () => {
      userModel.findOne.mockReturnValue(findOneSelect(null));
      await expect(
        service.login({ email: 'nobody@x.vn', password: 'pw' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('blocks a currently-locked account before checking the password', async () => {
      const user = makeUser({ lockUntil: new Date(Date.now() + 60_000) });
      userModel.findOne.mockReturnValue(findOneSelect(user));

      await expect(
        service.login({ email: 'student@vuonvan.vn', password: 'pw' } as any),
      ).rejects.toThrow(/tạm khoá/i);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('increments failedLoginAttempts on a wrong password', async () => {
      const user = makeUser({ failedLoginAttempts: 1 });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      bcrypt.compare.mockResolvedValue(false);
      setSecurity({ lockoutThreshold: 5 });

      await expect(
        service.login({ email: 'student@vuonvan.vn', password: 'bad' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(user.failedLoginAttempts).toBe(2);
      expect(user.lockUntil).toBeNull(); // below threshold => not locked
      expect(user.save).toHaveBeenCalled();
    });

    it('locks the account once failedLoginAttempts reaches lockoutThreshold', async () => {
      const user = makeUser({ failedLoginAttempts: 4 });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      bcrypt.compare.mockResolvedValue(false);
      setSecurity({ lockoutThreshold: 5 });

      await expect(
        service.login({ email: 'student@vuonvan.vn', password: 'bad' } as any),
      ).rejects.toThrow(/tạm khoá/i);

      expect(user.failedLoginAttempts).toBe(5);
      expect(user.lockUntil).toBeInstanceOf(Date);
      expect((user.lockUntil as Date).getTime()).toBeGreaterThan(Date.now());
    });

    it('does not lock when lockoutThreshold <= 0 (lockout disabled)', async () => {
      const user = makeUser({ failedLoginAttempts: 99 });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      bcrypt.compare.mockResolvedValue(false);
      setSecurity({ lockoutThreshold: 0 });

      await expect(
        service.login({ email: 'student@vuonvan.vn', password: 'bad' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(user.lockUntil).toBeNull();
    });

    it('blocks an inactive/banned account (after resetting counters)', async () => {
      const user = makeUser({ status: UserStatus.Inactive });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      bcrypt.compare.mockResolvedValue(true);

      await expect(
        service.login({ email: 'student@vuonvan.vn', password: 'pw' } as any),
      ).rejects.toThrow(/bị khóa/i);
      expect(jwt.sign).not.toHaveBeenCalled();
      // counters were reset + saved before the status check
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.save).toHaveBeenCalled();
    });

    it('blocks an unverified local account', async () => {
      const user = makeUser({ emailVerified: false });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      bcrypt.compare.mockResolvedValue(true);

      await expect(
        service.login({ email: 'student@vuonvan.vn', password: 'pw' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('allows a google account even with emailVerified false', async () => {
      const user = makeUser({ provider: 'google', emailVerified: false });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      bcrypt.compare.mockResolvedValue(true);

      const res = await service.login({ email: 'student@vuonvan.vn', password: 'pw' } as any);
      expect((res as any).accessToken).toBe('signed.jwt.token');
    });

    it('rejects login when the password has expired (rotation policy)', async () => {
      const old = new Date(Date.now() - 200 * 86400000);
      const user = makeUser({ passwordChangedAt: old });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      bcrypt.compare.mockResolvedValue(true);
      setSecurity({ passwordRotationDays: 90 });

      await expect(
        service.login({ email: 'student@vuonvan.vn', password: 'pw' } as any),
      ).rejects.toThrow(/hết hạn/i);
    });

    it('triggers email-OTP 2FA (no token) when twoFactor is enabled', async () => {
      const user = makeUser();
      userModel.findOne.mockReturnValue(findOneSelect(user));
      bcrypt.compare.mockResolvedValue(true);
      setSecurity({ twoFactor: true });
      mail.sendOtp.mockResolvedValue(true);

      const res = await service.login({ email: 'student@vuonvan.vn', password: 'pw' } as any);

      expect(res).toEqual({ needs2fa: true, email: 'student@vuonvan.vn' });
      expect(jwt.sign).not.toHaveBeenCalled();
      // OTP hashed (not raw) and an expiry set
      expect(typeof user.otpCode).toBe('string');
      expect(user.otpCode).toMatch(/^[a-f0-9]{64}$/);
      expect(user.otpExpires).toBeInstanceOf(Date);
      expect(mail.sendOtp).toHaveBeenCalled();
    });

    it('exposes devOtp when 2FA email delivery fails', async () => {
      const user = makeUser();
      userModel.findOne.mockReturnValue(findOneSelect(user));
      bcrypt.compare.mockResolvedValue(true);
      setSecurity({ twoFactor: true });
      mail.sendOtp.mockResolvedValue(false);

      const res: any = await service.login({
        email: 'student@vuonvan.vn',
        password: 'pw',
      } as any);
      expect(res.needs2fa).toBe(true);
      expect(typeof res.devOtp).toBe('string');
      expect(res.devOtp).toMatch(/^\d{6}$/);
    });
  });

  describe('register', () => {
    const dto = { name: 'Tân Sinh', email: 'New@Vuonvan.VN', password: 'pw123456' } as any;

    it('creates an unverified local user and sends verification', async () => {
      userModel.exists.mockResolvedValue(false);
      userModel.create.mockResolvedValue(makeUser());
      mail.sendVerification.mockResolvedValue(true);

      const res = await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('pw123456');
      const created = userModel.create.mock.calls[0][0];
      expect(created.email).toBe('new@vuonvan.vn');
      expect(created.emailVerified).toBe(false);
      expect(created.role).toBe(UserRole.Student);
      expect(created.provider).toBe('local');
      // verifyToken stored hashed, plus an expiry
      expect(created.verifyToken).toMatch(/^[a-f0-9]{64}$/);
      expect(created.verifyExpires).toBeInstanceOf(Date);
      expect(mail.sendVerification).toHaveBeenCalled();
      expect(res).toEqual({ ok: true, needsVerification: true });
    });

    it('returns devVerifyLink when verification email is not delivered', async () => {
      userModel.exists.mockResolvedValue(false);
      userModel.create.mockResolvedValue(makeUser());
      mail.sendVerification.mockResolvedValue(false);

      const res: any = await service.register(dto);
      expect(res.devVerifyLink).toContain('/xac-thuc-email?token=');
    });

    it('rejects a duplicate email with Conflict', async () => {
      userModel.exists.mockResolvedValue(true);
      await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it('rejects when self-registration is disabled', async () => {
      setSecurity({ allowSelfRegister: false });
      await expect(service.register(dto)).rejects.toBeInstanceOf(ForbiddenException);
      expect(userModel.exists).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('rejects an empty token', async () => {
      await expect(service.verifyEmail({ token: '  ' } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an unknown token', async () => {
      userModel.findOne.mockReturnValue(findOneSelect(null));
      await expect(service.verifyEmail({ token: 'abc' } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an expired token', async () => {
      const user = makeUser({ verifyExpires: new Date(Date.now() - 1000) });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      await expect(service.verifyEmail({ token: 'abc' } as any)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the account is not active', async () => {
      const user = makeUser({
        verifyExpires: new Date(Date.now() + 1000),
        status: UserStatus.Inactive,
      });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      await expect(service.verifyEmail({ token: 'abc' } as any)).rejects.toThrow(/bị khóa/i);
    });

    it('looks the user up by HASHED token, activates, clears fields, and issues a token', async () => {
      const raw = 'raw-verify-token';
      const user = makeUser({
        emailVerified: false,
        verifyToken: sha256(raw),
        verifyExpires: new Date(Date.now() + 1000),
      });
      userModel.findOne.mockReturnValue(findOneSelect(user));

      const res = await service.verifyEmail({ token: raw } as any);

      // queried by the hash, never the raw token
      expect(userModel.findOne).toHaveBeenCalledWith({ verifyToken: sha256(raw) });
      expect(user.emailVerified).toBe(true);
      expect(user.verifyToken).toBeNull();
      expect(user.verifyExpires).toBeNull();
      expect(user.save).toHaveBeenCalled();
      expect(res).toEqual({
        ok: true,
        accessToken: 'signed.jwt.token',
        user: expect.any(Object),
      });
    });
  });

  describe('forgotPassword', () => {
    it('returns 200 with no work when the user does not exist (no enumeration)', async () => {
      userModel.findOne.mockResolvedValue(null);
      const res = await service.forgotPassword({ email: 'ghost@x.vn' } as any);
      expect(res).toEqual({ ok: true });
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('stores a HASHED reset token + expiry and sends the email', async () => {
      const email = `forgot-${Date.now()}@vuonvan.vn`;
      const user = makeUser({ email });
      userModel.findOne.mockResolvedValue(user);
      mail.sendPasswordReset.mockResolvedValue(true);

      const res = await service.forgotPassword({ email } as any);

      expect(user.resetPasswordToken).toMatch(/^[a-f0-9]{64}$/);
      expect(user.resetPasswordExpires).toBeInstanceOf(Date);
      expect(user.save).toHaveBeenCalled();
      expect(mail.sendPasswordReset).toHaveBeenCalled();
      expect(res).toEqual({ ok: true });
    });

    it('returns devToken when reset email is not delivered', async () => {
      const email = `forgot-dev-${Date.now()}@vuonvan.vn`;
      const user = makeUser({ email });
      userModel.findOne.mockResolvedValue(user);
      mail.sendPasswordReset.mockResolvedValue(false);

      const res: any = await service.forgotPassword({ email } as any);
      expect(res.devToken).toMatch(/^[a-f0-9]{64}$/);
      expect(res.devResetLink).toContain('/dat-lai-mat-khau?token=');
    });

    it('honours the 60s cooldown: a second immediate request is a no-op', async () => {
      const email = `forgot-cool-${Date.now()}@vuonvan.vn`;
      const user = makeUser({ email });
      userModel.findOne.mockResolvedValue(user);
      mail.sendPasswordReset.mockResolvedValue(true);

      await service.forgotPassword({ email } as any);
      mail.sendPasswordReset.mockClear();
      const res = await service.forgotPassword({ email } as any);

      expect(res).toEqual({ ok: true });
      expect(mail.sendPasswordReset).not.toHaveBeenCalled(); // cooled down
    });
  });

  describe('resetPassword', () => {
    it('rejects an empty token', async () => {
      await expect(
        service.resetPassword({ token: '', password: 'new' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an unknown token', async () => {
      userModel.findOne.mockReturnValue(findOneSelect(null));
      await expect(
        service.resetPassword({ token: 'abc', password: 'new' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an expired token', async () => {
      const user = makeUser({ resetPasswordExpires: new Date(Date.now() - 1000) });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      await expect(
        service.resetPassword({ token: 'abc', password: 'new' } as any),
      ).rejects.toThrow(/hết hạn/i);
    });

    it('rejects when the account is not active', async () => {
      const user = makeUser({
        resetPasswordExpires: new Date(Date.now() + 1000),
        status: UserStatus.Inactive,
      });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      await expect(
        service.resetPassword({ token: 'abc', password: 'new' } as any),
      ).rejects.toThrow(/bị khóa/i);
    });

    it('looks up by HASHED token, sets a new password, and clears reset + lock state', async () => {
      const raw = 'raw-reset-token';
      const user = makeUser({
        resetPasswordToken: sha256(raw),
        resetPasswordExpires: new Date(Date.now() + 1000),
        failedLoginAttempts: 4,
        lockUntil: new Date(Date.now() + 1000),
      });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      bcrypt.hash.mockResolvedValue('new-hashed-pw');

      const res = await service.resetPassword({ token: raw, password: 'new-pw' } as any);

      expect(userModel.findOne).toHaveBeenCalledWith({ resetPasswordToken: sha256(raw) });
      expect(bcrypt.hash).toHaveBeenCalledWith('new-pw');
      expect(user.password).toBe('new-hashed-pw');
      expect(user.resetPasswordToken).toBeNull();
      expect(user.resetPasswordExpires).toBeNull();
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockUntil).toBeNull();
      expect(user.passwordChangedAt).toBeInstanceOf(Date);
      expect(res).toEqual({ ok: true });
    });
  });

  describe('resendVerification', () => {
    it('is a 200 no-op when the user does not exist', async () => {
      userModel.findOne.mockResolvedValue(null);
      const res = await service.resendVerification({ email: 'ghost@x.vn' } as any);
      expect(res).toEqual({ ok: true });
      expect(mail.sendVerification).not.toHaveBeenCalled();
    });

    it('is a 200 no-op when the user is already verified', async () => {
      userModel.findOne.mockResolvedValue(makeUser({ emailVerified: true }));
      const res = await service.resendVerification({ email: 'student@vuonvan.vn' } as any);
      expect(res).toEqual({ ok: true });
      expect(mail.sendVerification).not.toHaveBeenCalled();
    });

    it('regenerates a HASHED verify token and resends for an unverified user', async () => {
      const email = `resend-${Date.now()}@vuonvan.vn`;
      const user = makeUser({ email, emailVerified: false });
      userModel.findOne.mockResolvedValue(user);
      mail.sendVerification.mockResolvedValue(true);

      const res = await service.resendVerification({ email } as any);
      expect(user.verifyToken).toMatch(/^[a-f0-9]{64}$/);
      expect(user.verifyExpires).toBeInstanceOf(Date);
      expect(mail.sendVerification).toHaveBeenCalled();
      expect(res).toEqual({ ok: true });
    });

    it('uses a SEPARATE cooldown map from forgotPassword (does not block each other)', async () => {
      const email = `shared-${Date.now()}@vuonvan.vn`;
      const user = makeUser({ email, emailVerified: false });
      userModel.findOne.mockResolvedValue(user);
      mail.sendPasswordReset.mockResolvedValue(true);
      mail.sendVerification.mockResolvedValue(true);

      // forgot-password trips its own cooldown...
      await service.forgotPassword({ email } as any);
      // ...but resend-verification must still go through (different map)
      const res = await service.resendVerification({ email } as any);
      expect(res).toEqual({ ok: true });
      expect(mail.sendVerification).toHaveBeenCalledTimes(1);
    });

    it('honours its own 60s cooldown on repeat resends', async () => {
      const email = `resend-cool-${Date.now()}@vuonvan.vn`;
      const user = makeUser({ email, emailVerified: false });
      userModel.findOne.mockResolvedValue(user);
      mail.sendVerification.mockResolvedValue(true);

      await service.resendVerification({ email } as any);
      mail.sendVerification.mockClear();
      await service.resendVerification({ email } as any);
      expect(mail.sendVerification).not.toHaveBeenCalled();
    });
  });

  describe('verify2fa', () => {
    const otpExpires = () => new Date(Date.now() + 60_000);

    it('rejects an unknown email', async () => {
      const email = `2fa-unknown-${Date.now()}@vuonvan.vn`;
      userModel.findOne.mockReturnValue(findOneSelect(null));
      await expect(
        service.verify2fa({ email, code: '123456' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an expired OTP', async () => {
      const email = `2fa-exp-${Date.now()}@vuonvan.vn`;
      const user = makeUser({ otpCode: sha256('123456'), otpExpires: new Date(Date.now() - 1) });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      await expect(service.verify2fa({ email, code: '123456' } as any)).rejects.toThrow(
        /hết hạn/i,
      );
    });

    it('verifies a correct OTP (constant-time match), clears OTP, and issues a token', async () => {
      const email = `2fa-ok-${Date.now()}@vuonvan.vn`;
      const code = '654321';
      const user = makeUser({ otpCode: sha256(code), otpExpires: otpExpires() });
      userModel.findOne.mockReturnValue(findOneSelect(user));

      const res = await service.verify2fa({ email, code } as any);

      expect(user.otpCode).toBeNull();
      expect(user.otpExpires).toBeNull();
      expect(user.lastActiveAt).toBeInstanceOf(Date);
      expect(res).toEqual({ accessToken: 'signed.jwt.token', user: expect.any(Object) });
    });

    it('re-checks account lock after a correct OTP and refuses a locked account', async () => {
      const email = `2fa-locked-${Date.now()}@vuonvan.vn`;
      const code = '111111';
      const user = makeUser({
        otpCode: sha256(code),
        otpExpires: otpExpires(),
        lockUntil: new Date(Date.now() + 60_000),
      });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      await expect(service.verify2fa({ email, code } as any)).rejects.toThrow(/tạm khoá/i);
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('re-checks status after a correct OTP and refuses an inactive account', async () => {
      const email = `2fa-inactive-${Date.now()}@vuonvan.vn`;
      const code = '222222';
      const user = makeUser({
        otpCode: sha256(code),
        otpExpires: otpExpires(),
        status: UserStatus.Inactive,
      });
      userModel.findOne.mockReturnValue(findOneSelect(user));
      await expect(service.verify2fa({ email, code } as any)).rejects.toThrow(/bị khóa/i);
    });

    it('locks the OTP step after 5 wrong codes and invalidates the stored OTP', async () => {
      const email = `2fa-brute-${Date.now()}@vuonvan.vn`;
      const code = '999999';
      const user = makeUser({ otpCode: sha256(code), otpExpires: otpExpires() });
      // every call returns a fresh select chain pointing at the same user object
      userModel.findOne.mockImplementation(() => findOneSelect(user));

      // 5 wrong attempts -> each throws "Mã không đúng"
      for (let i = 0; i < 5; i++) {
        await expect(
          service.verify2fa({ email, code: '000000' } as any),
        ).rejects.toThrow(/không đúng/i);
      }
      // on the 5th failure the OTP is wiped
      expect(user.otpCode).toBeNull();
      expect(user.otpExpires).toBeNull();

      // 6th attempt: now the step is LOCKED out (different message), even with the right code
      await expect(
        service.verify2fa({ email, code } as any),
      ).rejects.toThrow(/Nhập sai mã quá nhiều lần/i);
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('tracks OTP brute-force per-email (one email lockout does not affect another)', async () => {
      const bad = `2fa-iso-bad-${Date.now()}@vuonvan.vn`;
      const good = `2fa-iso-good-${Date.now()}@vuonvan.vn`;
      const badUser = makeUser({ otpCode: sha256('555555'), otpExpires: otpExpires() });
      const goodCode = '424242';
      const goodUser = makeUser({ otpCode: sha256(goodCode), otpExpires: otpExpires() });

      userModel.findOne.mockImplementation((q: any) =>
        findOneSelect(q.email === bad ? badUser : goodUser),
      );

      // lock out the "bad" email
      for (let i = 0; i < 6; i++) {
        await service.verify2fa({ email: bad, code: '000000' } as any).catch(() => {});
      }
      // the "good" email is unaffected and succeeds
      const res = await service.verify2fa({ email: good, code: goodCode } as any);
      expect((res as any).accessToken).toBe('signed.jwt.token');
    });
  });

  describe('googleLogin', () => {
    const ORIGINAL_ENV = process.env.GOOGLE_CLIENT_ID;
    afterEach(() => {
      process.env.GOOGLE_CLIENT_ID = ORIGINAL_ENV;
    });

    it('throws ServiceUnavailable when GOOGLE_CLIENT_ID is not configured', async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      await expect(
        service.googleLogin({ idToken: 'tok' } as any),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('verifies the id token with the configured audience (client id)', async () => {
      process.env.GOOGLE_CLIENT_ID = 'my-client-id.apps.googleusercontent.com';
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ email: 'g@vuonvan.vn', name: 'G User', picture: null }),
      });
      userModel.findOne.mockResolvedValue(makeUser({ provider: 'google' }));

      await service.googleLogin({ idToken: 'tok' } as any);

      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: 'tok',
        audience: 'my-client-id.apps.googleusercontent.com',
      });
    });

    it('rejects an invalid Google token (verify throws)', async () => {
      process.env.GOOGLE_CLIENT_ID = 'cid';
      mockVerifyIdToken.mockRejectedValue(new Error('bad sig'));
      await expect(
        service.googleLogin({ idToken: 'tok' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a token whose payload has no email', async () => {
      process.env.GOOGLE_CLIENT_ID = 'cid';
      mockVerifyIdToken.mockResolvedValue({ getPayload: () => ({ name: 'No Email' }) });
      await expect(
        service.googleLogin({ idToken: 'tok' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('logs in an existing user, marking the email verified and issuing a token', async () => {
      process.env.GOOGLE_CLIENT_ID = 'cid';
      const user = makeUser({ provider: 'local', emailVerified: false, avatar: null });
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ email: user.email, picture: 'http://pic/x.png' }),
      });
      userModel.findOne.mockResolvedValue(user);

      const res = await service.googleLogin({ idToken: 'tok' } as any);

      expect(user.emailVerified).toBe(true);
      expect(user.avatar).toBe('http://pic/x.png'); // backfilled because it was empty
      expect(user.save).toHaveBeenCalled();
      expect((res as any).accessToken).toBe('signed.jwt.token');
    });

    it('auto-creates a new google user when none exists', async () => {
      process.env.GOOGLE_CLIENT_ID = 'cid';
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ email: 'Brand@New.VN', name: 'Brand New', picture: 'http://p' }),
      });
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue(makeUser({ provider: 'google' }));

      await service.googleLogin({ idToken: 'tok' } as any);

      const created = userModel.create.mock.calls[0][0];
      expect(created.email).toBe('brand@new.vn');
      expect(created.provider).toBe('google');
      expect(created.emailVerified).toBe(true);
      expect(created.password).toBeNull();
    });
  });

  describe('sanitize / me', () => {
    it('strips every secret/internal field from the returned user', async () => {
      const user = makeUser({
        password: 'secret',
        resetPasswordToken: 'r',
        resetPasswordExpires: new Date(),
        failedLoginAttempts: 3,
        lockUntil: new Date(),
        verifyToken: 'v',
        verifyExpires: new Date(),
        otpCode: 'o',
        otpExpires: new Date(),
      });
      userModel.findById.mockResolvedValue(user);

      const res: any = await service.me('user-id-1');

      for (const field of [
        'password',
        'resetPasswordToken',
        'resetPasswordExpires',
        'failedLoginAttempts',
        'lockUntil',
        'verifyToken',
        'verifyExpires',
        'otpCode',
        'otpExpires',
      ]) {
        expect(res[field]).toBeUndefined();
      }
      // non-secret fields survive
      expect(res.email).toBe(user.email);
      expect(res.name).toBe(user.name);
    });

    it('throws Unauthorized when the user is gone', async () => {
      userModel.findById.mockResolvedValue(null);
      await expect(service.me('missing')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
