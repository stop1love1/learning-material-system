import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Real SMTP mail service (nodemailer). When SMTP is not configured (SMTP_HOST empty)
 * it falls back to dev mode: it logs the message instead of sending, and returns `false`
 * so callers can surface a dev link/code. `send` never throws — a failed delivery must
 * not lose the verify/reset/OTP token.
 *
 * Provided by GlobalModule (@Global) so any feature module can inject it.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  /** SMTP is considered configured when a host is set. */
  isConfigured(): boolean {
    return !!(process.env.SMTP_HOST && process.env.SMTP_HOST.trim());
  }

  /** Lazily create + cache the nodemailer transporter. */
  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }
    return this.transporter;
  }

  /**
   * Generic send. Returns `true` when really delivered, `false` otherwise
   * (not configured, or send error). Never throws.
   */
  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.warn(
        `[DEV MAIL] "${subject}" → ${to} (SMTP chưa cấu hình — email không được gửi thật).`,
      );
      return false;
    }
    try {
      await this.getTransporter().sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
      });
      return true;
    } catch (err) {
      this.logger.error(`Gửi email tới ${to} thất bại: ${(err as Error)?.message ?? err}`);
      return false;
    }
  }

  private wrap(title: string, bodyHtml: string): string {
    return `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
        <h2 style="color:#0f766e">${title}</h2>
        ${bodyHtml}
      </div>`;
  }

  /** Send the email-verification link. Returns whether it was really delivered. */
  async sendVerification(to: string, link: string): Promise<boolean> {
    const html = this.wrap(
      'Xác thực địa chỉ email',
      `<p>Xin chào,</p>
       <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Vườn Văn</strong>. Vui lòng nhấn nút bên dưới để xác thực email:</p>
       <p style="text-align:center;margin:24px 0">
         <a href="${link}" style="background:#0f766e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block">Xác thực email</a>
       </p>
       <p>Hoặc sao chép liên kết: <a href="${link}" style="word-break:break-all">${link}</a></p>
       <p style="color:#6b7280;font-size:13px">Liên kết có hiệu lực trong 24 giờ. Nếu bạn không đăng ký, hãy bỏ qua email.</p>`,
    );
    return this.sendMail(to, 'Xác thực email — Vườn Văn', html);
  }

  /** Send the password-reset link. Returns whether it was really delivered. */
  async sendPasswordReset(to: string, link: string): Promise<boolean> {
    const html = this.wrap(
      'Đặt lại mật khẩu',
      `<p>Xin chào,</p>
       <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn nút bên dưới để tiếp tục:</p>
       <p style="text-align:center;margin:24px 0">
         <a href="${link}" style="background:#0f766e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block">Đặt lại mật khẩu</a>
       </p>
       <p>Hoặc sao chép liên kết: <a href="${link}" style="word-break:break-all">${link}</a></p>
       <p style="color:#6b7280;font-size:13px">Liên kết có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
    );
    return this.sendMail(to, 'Đặt lại mật khẩu — Vườn Văn', html);
  }

  /** Send a 2FA one-time code. Returns whether it was really delivered. */
  async sendOtp(to: string, code: string): Promise<boolean> {
    const html = this.wrap(
      'Mã xác thực đăng nhập',
      `<p>Mã xác thực (2FA) của bạn là:</p>
       <p style="text-align:center;margin:20px 0">
         <span style="font-size:30px;font-weight:bold;letter-spacing:6px;color:#0f766e">${code}</span>
       </p>
       <p style="color:#6b7280;font-size:13px">Mã có hiệu lực trong 5 phút. Không chia sẻ mã cho bất kỳ ai.</p>`,
    );
    return this.sendMail(to, 'Mã đăng nhập — Vườn Văn', html);
  }
}
