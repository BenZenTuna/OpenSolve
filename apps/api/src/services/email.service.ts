import { Resend } from 'resend';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import {
  importantMessageTemplate,
  newsletterTemplate,
  newsletterConfirmTemplate,
  unsubscribeConfirmTemplate,
} from '../email/templates.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class EmailService {
  private resend: Resend | null = null;
  private from: string;

  constructor() {
    const { RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME, NODE_ENV } = env;

    if (!RESEND_API_KEY) {
      if (NODE_ENV === 'production') {
        throw new Error('RESEND_API_KEY is required in production');
      }
      logger.warn('RESEND_API_KEY not set — email sending is disabled');
    } else {
      this.resend = new Resend(RESEND_API_KEY);
    }

    this.from = RESEND_FROM_NAME
      ? `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`
      : RESEND_FROM_EMAIL;

    logger.info('EmailService initialized');
  }

  async sendImportantMessage(params: {
    to: string;
    toName: string;
    subject: string;
    bodyHtml: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = importantMessageTemplate({
      subject: params.subject,
      bodyHtml: params.bodyHtml,
      username: params.toName,
    });

    try {
      if (!this.resend) {
        logger.warn({ to: params.to }, 'Email skipped — Resend not configured');
        return { success: false, error: 'Resend not configured' };
      }

      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html,
      });

      if (error) {
        logger.error({ error, to: params.to }, 'Failed to send important message');
        return { success: false, error: error.message };
      }

      logger.info({ messageId: data?.id, to: params.to }, 'Important message sent');
      return { success: true, messageId: data?.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, to: params.to }, 'Failed to send important message');
      return { success: false, error: message };
    }
  }

  async sendNewsletterBroadcast(params: {
    recipients: Array<{ email: string; username: string; unsubscribeToken: string }>;
    subject: string;
    bodyHtml: string;
    baseUrl: string;
  }): Promise<{ sent: number; failed: number; errors: string[] }> {
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Scale note: individual sends with 50ms delay works well up to ~200 subscribers
    // (~10 seconds). At 500+ subscribers consider migrating to Resend Batch API
    // (resend.com/docs/api-reference/emails/send-batch) or a background job queue.
    // Revisit when subscriber count approaches 300.
    for (const recipient of params.recipients) {
      const unsubscribeUrl = `${params.baseUrl}/unsubscribe?token=${recipient.unsubscribeToken}`;
      const html = newsletterTemplate({
        subject: params.subject,
        bodyHtml: params.bodyHtml,
        username: recipient.username,
        unsubscribeUrl,
      });

      try {
        if (!this.resend) {
          failed++;
          errors.push(`${recipient.email}: Resend not configured`);
          continue;
        }

        const { error } = await this.resend.emails.send({
          from: this.from,
          to: recipient.email,
          subject: params.subject,
          html,
        });

        if (error) {
          failed++;
          errors.push(`${recipient.email}: ${error.message}`);
        } else {
          sent++;
        }
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${recipient.email}: ${message}`);
      }

      // Rate-limit: 50ms delay between sends to avoid Resend rate limits
      await sleep(50);
    }

    logger.info({ sent, failed, total: params.recipients.length }, 'Newsletter broadcast complete');
    return { sent, failed, errors };
  }

  async sendNewsletterConfirm(params: {
    to: string;
    username: string;
    confirmUrl: string;
  }): Promise<{ success: boolean; error?: string }> {
    const html = newsletterConfirmTemplate({
      username: params.username,
      confirmUrl: params.confirmUrl,
    });

    try {
      if (!this.resend) {
        logger.warn({ to: params.to }, 'Email skipped — Resend not configured');
        return { success: false, error: 'Resend not configured' };
      }

      const { error } = await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: 'Confirm your OpenSolve newsletter subscription',
        html,
      });

      if (error) {
        logger.error({ error, to: params.to }, 'Failed to send newsletter confirmation');
        return { success: false, error: error.message };
      }

      logger.info({ to: params.to }, 'Newsletter confirmation sent');
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, to: params.to }, 'Failed to send newsletter confirmation');
      return { success: false, error: message };
    }
  }

  async sendUnsubscribeConfirm(params: {
    to: string;
    username: string;
  }): Promise<{ success: boolean; error?: string }> {
    const html = unsubscribeConfirmTemplate({
      username: params.username,
    });

    try {
      if (!this.resend) {
        logger.warn({ to: params.to }, 'Email skipped — Resend not configured');
        return { success: false, error: 'Resend not configured' };
      }

      const { error } = await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: "You've been unsubscribed from OpenSolve",
        html,
      });

      if (error) {
        logger.error({ error, to: params.to }, 'Failed to send unsubscribe confirmation');
        return { success: false, error: error.message };
      }

      logger.info({ to: params.to }, 'Unsubscribe confirmation sent');
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, to: params.to }, 'Failed to send unsubscribe confirmation');
      return { success: false, error: message };
    }
  }
}
