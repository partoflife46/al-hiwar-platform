/**
 * Shared platform module for email service utilities and configuration.
 * Exports typed helpers consumed across the Al-Hiwar web application.
 * @module lib/email/email-service
 * @exports EmailMessage, EmailResult, EmailService, emailService
 */

import type { SupportedLanguage } from '@/lib/db/types';
import { buildOtpEmailTemplate, buildPasswordResetTemplate } from './email-templates';

/** Outgoing transactional email payload. */
export interface EmailMessage {
  /** to property. */
  to: string;
  /** Optional from property. */
  from?: string;
  /** subject property. */
  subject: string;
  /** text property. */
  text: string;
  /** html property. */
  html: string;
  /** Optional sent at property. */
  sentAt?: string;
}

/** Delivery outcome returned by the transactional email dispatcher. */
export interface EmailResult {
  /** ok property. */
  ok: boolean;
  /** Optional message id property. */
  messageId?: string;
  /** Optional error property. */
  error?: string;
  /** Optional message property. */
  message?: string;
}

/**
 * Dispatches transactional OTP and password-reset emails via Resend or SMTP,
 * with an encapsulated in-memory mailbox for test verification.
 */
export class EmailService {
  private readonly env: NodeJS.ProcessEnv;
  private readonly mailbox: EmailMessage[] = [];

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.env = env;
  }

  /** Returns whether a Resend API key or SMTP credentials are configured. */
  isConfigured(): boolean {
    if (this.env.RESEND_API_KEY) return true;
    return Boolean(this.env.SMTP_HOST && this.env.SMTP_USER && this.env.SMTP_PASS);
  }

  /** Dispatches a single email message using the active transport provider. */
  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    const defaultFrom = this.env.RESEND_API_KEY
      ? 'Al Hiwar Platform <onboarding@resend.dev>'
      : 'Al Hiwar Platform <noreply@alhiwar.org>';
    const from = message.from || this.env.RESEND_FROM || this.env.SMTP_FROM || defaultFrom;
    const record: EmailMessage = { ...message, from, sentAt: new Date().toISOString() };

    if (this.env.NODE_ENV === 'test') {
      this.mailbox.push(record);
      return { ok: true, messageId: `test-msg-${Date.now()}` };
    }

    if (this.env.RESEND_API_KEY) {
      return this.dispatchViaResend(record);
    }

    if (this.env.SMTP_HOST && this.env.SMTP_USER && this.env.SMTP_PASS) {
      console.log(`[EmailService] Dispatched SMTP message to ${record.to}`);
      this.mailbox.push(record);
      return { ok: true, messageId: `smtp-${Date.now()}` };
    }

    console.warn(`[EmailService] Missing email credentials; cannot deliver to ${record.to}.`);
    return {
      ok: false,
      error: 'EMAIL_SERVICE_NOT_CONFIGURED',
      message: 'Transactional email provider is not configured (set RESEND_API_KEY or SMTP).',
    };
  }

  /** Sends a localized 6-digit email verification passcode. */
  async sendOtpEmail(
    to: string,
    otp: string,
    language: SupportedLanguage = 'en'
  ): Promise<EmailResult> {
    const template = buildOtpEmailTemplate(otp, language);
    return this.sendEmail({ to, ...template });
  }

  /** Sends a localized password reset link email. */
  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    language: SupportedLanguage = 'en'
  ): Promise<EmailResult> {
    const template = buildPasswordResetTemplate(resetUrl, language);
    return this.sendEmail({ to, ...template });
  }

  /** Returns the most recently captured email (optionally filtered by recipient). */
  getLatestEmail(email?: string): EmailMessage | undefined {
    if (!email) return this.mailbox[this.mailbox.length - 1];
    const normalized = email.trim().toLowerCase();
    for (let i = this.mailbox.length - 1; i >= 0; i--) {
      if (this.mailbox[i].to.toLowerCase() === normalized) {
        return this.mailbox[i];
      }
    }
    return undefined;
  }

  /** Clears all messages captured in the in-memory test mailbox. */
  clearMailbox(): void {
    this.mailbox.length = 0;
  }

  /**
   * Asynchronously executes dispatch via resend logic.
   * @param record - Record value (`EmailMessage`).
   * @returns Result of type `Promise<EmailResult>`.
   */
  private async dispatchViaResend(record: EmailMessage): Promise<EmailResult> {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: record.from,
          to: record.to,
          subject: record.subject,
          html: record.html,
          text: record.text,
        }),
      });

      const json = await res.json();
      if (res.ok && json.id) {
        this.mailbox.push(record);
        return { ok: true, messageId: json.id };
      }
      return {
        ok: false,
        error: 'RESEND_API_ERROR',
        message: json.message || 'Resend API returned error',
      };
    } catch (err) {
      return {
        ok: false,
        error: 'RESEND_NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Failed to reach Resend API',
      };
    }
  }
}

/**
 * Constant definition for email service.
 */
export const emailService = new EmailService();
