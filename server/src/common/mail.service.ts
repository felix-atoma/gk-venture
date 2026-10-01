import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly from: string;
  readonly notifyEmail: string;

  constructor(config: ConfigService) {
    this.from = config.get('MAIL_FROM', 'G|K Ventures <no-reply@kadawalegalservices.com>');
    this.notifyEmail = config.get('NOTIFY_EMAIL', 'gilbertadawa@gmail.com');
    const host = config.get<string>('SMTP_HOST');
    if (host) {
      const port = Number(config.get('SMTP_PORT', 587));
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') },
      });
    } else {
      this.logger.warn('SMTP_HOST not set - emails will be logged instead of sent.');
    }
  }

  /** Never throws: a mail outage must not fail the user's request. */
  async send(message: MailMessage): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log(`[mail:dev] to=${message.to} subject="${message.subject}"\n${stripHtml(message.html)}`);
      return true;
    }
    try {
      await this.transporter.sendMail({ from: this.from, ...message });
      return true;
    } catch (err) {
      this.logger.error(`Failed to send "${message.subject}" to ${message.to}`, err as Error);
      return false;
    }
  }
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

const stripHtml = (s: string) => s.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '');

/** Minimal branded email wrapper (navy/gold). */
export function emailLayout(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e0d0">
  <div style="background:#22283A;color:#fff;padding:18px 24px;font-family:Georgia,serif;font-size:20px">G<span style="color:#B8923A">|</span>K VENTURES</div>
  <div style="padding:24px;color:#333;line-height:1.6"><h2 style="color:#22283A;font-family:Georgia,serif;margin-top:0">${escapeHtml(title)}</h2>${body}</div>
  <div style="background:#F6F3EA;padding:14px 24px;font-size:12px;color:#5B5B5B">Commission for Oaths and Paralegal Service in ADR Centre - Under the ADR Act, 2010 (Act 798)<br>P. O. Box AN 5765, Accra-North, Ghana &middot; +233 545 032 058 / +233 544 997 355</div>
</div>`;
}
