import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Real SMTP mail service (nodemailer). When SMTP is not configured (SMTP_HOST empty)
 * it falls back to dev mode: it logs the message instead of sending, and returns `false`
 * so callers can surface a dev link. `send` never throws — a failed delivery must not
 * lose the verify/reset token.
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
   * Send an email. Returns `true` when really delivered, `false` otherwise
   * (not configured, or send error). Never throws.
   */
  private async send(to: string, subject: string, html: string): Promise<boolean> {
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

  /** Send the email-verification link. Returns whether it was really delivered. */
  async sendVerification(to: string, link: string): Promise<boolean> {
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
        <h2 style="color:#0f766e">Xác thực địa chỉ email</h2>
        <p>Xin chào,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Vườn Văn</strong>. Vui lòng nhấn vào nút bên dưới để xác thực địa chỉ email của bạn:</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${link}" style="background:#0f766e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block">Xác thực email</a>
        </p>
        <p>Hoặc sao chép liên kết sau vào trình duyệt:</p>
        <p style="word-break:break-all"><a href="${link}">${link}</a></p>
        <p style="color:#6b7280;font-size:13px">Liên kết có hiệu lực trong 24 giờ. Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email.</p>
      </div>`;
    return this.send(to, 'Xác thực email — Vườn Văn', html);
  }

  /** Send the password-reset link. Returns whether it was really delivered. */
  async sendPasswordReset(to: string, link: string): Promise<boolean> {
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
        <h2 style="color:#0f766e">Đặt lại mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tiếp tục:</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${link}" style="background:#0f766e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block">Đặt lại mật khẩu</a>
        </p>
        <p>Hoặc sao chép liên kết sau vào trình duyệt:</p>
        <p style="word-break:break-all"><a href="${link}">${link}</a></p>
        <p style="color:#6b7280;font-size:13px">Liên kết có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
      </div>`;
    return this.send(to, 'Đặt lại mật khẩu — Vườn Văn', html);
  }
}
