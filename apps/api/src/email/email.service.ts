import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: Resend | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.client = apiKey ? new Resend(apiKey) : null;
  }

  /**
   * Best-effort send: a misconfigured or failing email provider must never fail the
   * caller's request (e.g. a quotation submission is already saved to the DB — that's
   * the requirement of FR-QUOTE-04, email is a secondary notification).
   */
  async sendAdminNotification(subject: string, html: string): Promise<void> {
    const to = this.config.get<string>('ADMIN_NOTIFICATION_EMAIL');
    const from = this.config.get<string>('EMAIL_FROM');

    if (!this.client || !to || !from) {
      this.logger.warn(
        `Email not sent (provider not configured): "${subject}" -> ${to ?? 'unset'}`,
      );
      return;
    }

    try {
      await this.client.emails.send({ from, to, subject, html });
    } catch (error) {
      this.logger.error(
        `Failed to send admin notification email: ${(error as Error).message}`,
      );
    }
  }
}
