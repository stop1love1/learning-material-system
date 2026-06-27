import { Injectable, Logger } from '@nestjs/common';

/**
 * Dev-mode mail service. SMTP is not configured for this project, so instead of
 * sending a real email we LOG the message via the Nest Logger. Returns whether it
 * ran in dev mode so callers can decide to expose dev-only data in the response.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * "Send" a password reset email. In dev mode (no SMTP host configured) this just
   * logs the reset link. Returns `true` when running in dev mode.
   */
  sendPasswordReset(to: string, resetLink: string, smtpHost?: string | null): boolean {
    const dev = !smtpHost || !smtpHost.trim();
    if (dev) {
      this.logger.warn(
        `[DEV MAIL] Đặt lại mật khẩu cho ${to}\n  Liên kết: ${resetLink}\n  (SMTP chưa cấu hình — email không được gửi thật.)`,
      );
    } else {
      // TODO: real SMTP not implemented — no email is actually delivered even when a
      // host is configured; the caller always surfaces the dev reset link instead.
      this.logger.warn(
        `[MAIL] SMTP ${smtpHost} đã cấu hình nhưng gửi email CHƯA được triển khai — email tới ${to} KHÔNG được gửi thật.`,
      );
    }
    return dev;
  }
}
