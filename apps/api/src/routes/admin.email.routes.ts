import crypto from 'node:crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { users, activityLog } from '../db/schema.js';
import { eq, sql, desc, and, or, ilike, isNotNull } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { EmailService } from '../services/email.service.js';

const emailService = new EmailService();

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(request, reply);
  if (reply.sent) return;
  if (request.user?.role !== 'admin') {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}

export async function adminEmailRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdmin);

  // CSRF protection for all write operations
  const adminCsrfGuard = async (request: FastifyRequest, reply: FastifyReply) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;

    const origin = request.headers.origin || '';
    const referer = request.headers.referer || '';
    const allowedOrigin = env.WEB_URL;

    const isValidOrigin = origin === allowedOrigin || referer.startsWith(allowedOrigin + '/');
    if (!isValidOrigin) {
      return reply.code(403).send({ error: 'Invalid request origin' });
    }
  };

  // Rate limiter for email send endpoints: 2 per hour per admin
  const emailSendCounts = new Map<string, { count: number; resetAt: number }>();
  const EMAIL_SEND_LIMIT = 2;
  const EMAIL_SEND_WINDOW = 60 * 60 * 1000; // 1 hour

  const emailSendRateLimit = async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.user?.id || request.ip;
    const now = Date.now();
    const entry = emailSendCounts.get(key);

    if (!entry || now > entry.resetAt) {
      emailSendCounts.set(key, { count: 1, resetAt: now + EMAIL_SEND_WINDOW });
      return;
    }

    entry.count++;
    if (entry.count > EMAIL_SEND_LIMIT) {
      return reply.code(429).send({ error: 'Email send rate limit exceeded. Try again in 1 hour.' });
    }
  };

  // Helper: validate and consume a confirmation token from Redis
  async function validateConfirmationToken(token: string, adminId: string): Promise<boolean> {
    try {
      // Decode and verify the token structure
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const payload = JSON.parse(decoded);

      if (payload.purpose !== 'admin-email-confirm') return false;
      if (payload.adminId !== adminId) return false;
      if (Date.now() > payload.exp) return false;

      // Check Redis for one-time use
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const redisKey = `admin:email:confirm:${tokenHash}`;
      const exists = await redis.get(redisKey);
      if (!exists) return false;

      // Delete key — one-time use
      await redis.del(redisKey);
      return true;
    } catch {
      return false;
    }
  }

  // ===== GET /admin/email/stats =====
  fastify.get('/admin/email/stats', async (_request, reply) => {
    const [stats] = await db.select({
      totalSubscribers: sql<number>`(SELECT count(*) FROM users WHERE newsletter_subscribed = true)::int`,
      totalUsers: sql<number>`(SELECT count(*) FROM users)::int`,
      recentSends: sql<number>`(SELECT count(*) FROM activity_log WHERE action IN ('admin_sent_important_email', 'admin_sent_newsletter_broadcast') AND created_at > NOW() - INTERVAL '30 days')::int`,
    }).from(sql`(SELECT 1) as _`);

    const subscriberPercent = stats.totalUsers > 0
      ? Math.round((stats.totalSubscribers / stats.totalUsers) * 1000) / 10
      : 0;

    return reply.code(200).send({
      totalSubscribers: stats.totalSubscribers,
      totalUsers: stats.totalUsers,
      subscriberPercent,
      recentSends: stats.recentSends,
    });
  });

  // ===== GET /admin/email/subscribers =====
  fastify.get('/admin/email/subscribers', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const [subscribers, countResult] = await Promise.all([
      db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        subscribedAt: users.newsletterSubscribedAt,
        consentMethod: users.newsletterConsentMethod,
      })
        .from(users)
        .where(eq(users.newsletterSubscribed, true))
        .orderBy(desc(users.newsletterSubscribedAt))
        .limit(limit)
        .offset(offset),

      db.select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.newsletterSubscribed, true)),
    ]);

    const total = countResult[0].count;

    // Log admin access to subscriber data
    await db.insert(activityLog).values({
      humanUserId: request.user!.id,
      action: 'admin_viewed_subscribers',
    });

    return reply.code(200).send({
      subscribers: subscribers.map(s => ({
        id: s.id,
        username: s.username,
        email: s.email,
        subscribedAt: s.subscribedAt?.toISOString() ?? null,
        consentMethod: s.consentMethod,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  });

  // ===== POST /admin/email/confirmation-token =====
  fastify.post('/admin/email/confirmation-token', {
    preHandler: [adminCsrfGuard],
  }, async (request, reply) => {
    const body = request.body as {
      action: string;
      recipientType?: string;
      recipientCount?: number;
    };

    if (!['send-important', 'broadcast'].includes(body.action)) {
      return reply.code(400).send({ error: 'Invalid action. Must be send-important or broadcast.' });
    }

    const exp = Date.now() + 10 * 60 * 1000; // 10 minutes
    const payload = {
      adminId: request.user!.id,
      action: body.action,
      purpose: 'admin-email-confirm',
      exp,
    };

    const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const redisKey = `admin:email:confirm:${tokenHash}`;

    await redis.set(redisKey, '1', 'EX', 600); // 10 min TTL

    return reply.code(200).send({
      confirmationToken: token,
      expiresIn: 600,
    });
  });

  // ===== POST /admin/email/send-important =====
  fastify.post('/admin/email/send-important', {
    preHandler: [adminCsrfGuard, emailSendRateLimit],
  }, async (request, reply) => {
    const body = request.body as {
      recipientType: string;
      recipientUserId?: string;
      subject: string;
      bodyHtml: string;
      confirmationToken: string;
    };

    // Validation
    if (!['all', 'single'].includes(body.recipientType)) {
      return reply.code(400).send({ error: 'validation_error', details: 'recipientType must be all or single' });
    }
    if (!body.subject || body.subject.length < 5 || body.subject.length > 200) {
      return reply.code(400).send({ error: 'validation_error', details: 'Subject must be 5-200 characters' });
    }
    if (!body.bodyHtml || body.bodyHtml.length < 20 || body.bodyHtml.length > 50000) {
      return reply.code(400).send({ error: 'validation_error', details: 'Body must be 20-50000 characters' });
    }
    if (!body.confirmationToken) {
      return reply.code(400).send({ error: 'invalid_confirmation_token' });
    }

    // Validate confirmation token
    const tokenValid = await validateConfirmationToken(body.confirmationToken, request.user!.id);
    if (!tokenValid) {
      return reply.code(400).send({ error: 'invalid_confirmation_token' });
    }

    // Resolve recipients
    let recipients: Array<{ id: string; email: string; username: string | null }>;

    if (body.recipientType === 'single') {
      if (!body.recipientUserId) {
        return reply.code(400).send({ error: 'validation_error', details: 'recipientUserId required for single recipient' });
      }

      const [user] = await db.select({
        id: users.id,
        email: users.email,
        username: users.username,
      })
        .from(users)
        .where(eq(users.id, body.recipientUserId))
        .limit(1);

      if (!user) {
        return reply.code(404).send({ error: 'recipient_not_found' });
      }

      recipients = [user];
    } else {
      recipients = await db.select({
        id: users.id,
        email: users.email,
        username: users.username,
      }).from(users);
    }

    // Send emails
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await emailService.sendImportantMessage({
        to: recipient.email,
        toName: recipient.username || 'User',
        subject: body.subject,
        bodyHtml: body.bodyHtml,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // 50ms delay between sends for bulk
      if (recipients.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Log to activity_log
    await db.insert(activityLog).values({
      humanUserId: request.user!.id,
      action: 'admin_sent_important_email',
      metadata: JSON.stringify({
        subject: body.subject,
        recipientType: body.recipientType,
        recipientCount: recipients.length,
        sentBy: request.user!.id,
        succeeded: sent,
        failed,
      }),
    });

    return reply.code(200).send({
      sent,
      failed,
      recipientType: body.recipientType,
    });
  });

  // ===== POST /admin/email/broadcast =====
  fastify.post('/admin/email/broadcast', {
    preHandler: [adminCsrfGuard, emailSendRateLimit],
  }, async (request, reply) => {
    const body = request.body as {
      subject: string;
      bodyHtml: string;
      confirmationToken: string;
    };

    // Validation
    if (!body.subject || body.subject.length < 5 || body.subject.length > 200) {
      return reply.code(400).send({ error: 'validation_error', details: 'Subject must be 5-200 characters' });
    }
    if (!body.bodyHtml || body.bodyHtml.length < 20 || body.bodyHtml.length > 50000) {
      return reply.code(400).send({ error: 'validation_error', details: 'Body must be 20-50000 characters' });
    }
    if (!body.confirmationToken) {
      return reply.code(400).send({ error: 'invalid_confirmation_token' });
    }

    // Validate confirmation token
    const tokenValid = await validateConfirmationToken(body.confirmationToken, request.user!.id);
    if (!tokenValid) {
      return reply.code(400).send({ error: 'invalid_confirmation_token' });
    }

    // Fetch all newsletter subscribers with unsubscribe tokens
    const subscribers = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      unsubscribeToken: users.newsletterUnsubscribeToken,
    })
      .from(users)
      .where(
        and(
          eq(users.newsletterSubscribed, true),
          isNotNull(users.newsletterUnsubscribeToken),
        )
      );

    if (subscribers.length === 0) {
      return reply.code(400).send({ error: 'no_subscribers' });
    }

    // Build recipients for EmailService
    const recipientsList = subscribers.map(s => ({
      email: s.email,
      username: s.username || 'User',
      unsubscribeToken: s.unsubscribeToken!,
    }));

    // Send broadcast
    const result = await emailService.sendNewsletterBroadcast({
      recipients: recipientsList,
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      baseUrl: env.APP_BASE_URL,
    });

    // Log to activity_log
    await db.insert(activityLog).values({
      humanUserId: request.user!.id,
      action: 'admin_sent_newsletter_broadcast',
      metadata: JSON.stringify({
        subject: body.subject,
        recipientCount: subscribers.length,
        sentBy: request.user!.id,
        succeeded: result.sent,
        failed: result.failed,
      }),
    });

    return reply.code(200).send({
      sent: result.sent,
      failed: result.failed,
      subscriberCount: subscribers.length,
    });
  });

  // ===== GET /admin/email/history =====
  fastify.get('/admin/email/history', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10) || 20));
    const offset = (page - 1) * limit;

    const emailActions = ['admin_sent_important_email', 'admin_sent_newsletter_broadcast'];

    const [rows, countResult] = await Promise.all([
      db.select({
        id: activityLog.id,
        action: activityLog.action,
        metadata: activityLog.metadata,
        createdAt: activityLog.createdAt,
      })
        .from(activityLog)
        .where(
          or(
            eq(activityLog.action, emailActions[0]),
            eq(activityLog.action, emailActions[1]),
          )
        )
        .orderBy(desc(activityLog.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ count: sql<number>`count(*)::int` })
        .from(activityLog)
        .where(
          or(
            eq(activityLog.action, emailActions[0]),
            eq(activityLog.action, emailActions[1]),
          )
        ),
    ]);

    const total = countResult[0].count;

    return reply.code(200).send({
      history: rows.map(row => ({
        id: String(row.id),
        action: row.action,
        details: row.metadata ? JSON.parse(row.metadata) : {},
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  });

  // ===== GET /admin/email/user-search =====
  // Simple user search for the send-important recipient picker
  fastify.get('/admin/email/user-search', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const q = (query.q || '').trim();

    if (!q || q.length < 2) {
      return reply.code(200).send({ users: [] });
    }

    const results = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
    })
      .from(users)
      .where(
        or(
          ilike(users.username, `%${q}%`),
          ilike(users.email, `%${q}%`),
        )
      )
      .limit(10);

    return reply.code(200).send({
      users: results.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
      })),
    });
  });
}
