import crypto from 'node:crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { problems, bots, users, flags, tasks } from '../db/schema.js';
import { eq, sql, and, ilike, desc, asc, gte } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';

async function requireAdmin(request: any, reply: any) {
  await authMiddleware(request, reply);
  if (reply.sent) return;
  if (request.user?.role !== 'admin') {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdmin);

  // ===== SECURITY HARDENING =====

  // CSRF protection for all admin write operations
  // Mirrors the pattern used on POST /auth/logout
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

  // Simple in-memory admin write rate limiter
  const adminWriteCounts = new Map<string, { count: number; resetAt: number }>();
  const ADMIN_WRITE_LIMIT = 30;
  const ADMIN_WRITE_WINDOW = 60_000; // 1 minute

  const adminRateLimit = async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.user?.id || request.ip;
    const now = Date.now();
    const entry = adminWriteCounts.get(key);

    if (!entry || now > entry.resetAt) {
      adminWriteCounts.set(key, { count: 1, resetAt: now + ADMIN_WRITE_WINDOW });
      return;
    }

    entry.count++;
    if (entry.count > ADMIN_WRITE_LIMIT) {
      return reply.code(429).send({ error: 'Admin rate limit exceeded. Try again in 1 minute.' });
    }
  };

  // Confirmation token system for destructive actions
  // Map<token, { userId: string; expiresAt: number; used: boolean }>
  const confirmationTokens = new Map<string, { userId: string; expiresAt: number; used: boolean }>();
  const CONFIRM_TOKEN_TTL = 60_000; // 60 seconds

  // Cleanup expired tokens every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [token, data] of confirmationTokens.entries()) {
      if (now > data.expiresAt) confirmationTokens.delete(token);
    }
  }, 5 * 60_000);

  // Clear interval when server closes
  fastify.addHook('onClose', async () => {
    clearInterval(cleanupInterval);
  });

  // Validate and consume a confirmation token
  const requireConfirmation = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers['x-confirm-token'] as string | undefined;

    if (!token) {
      return reply.code(400).send({
        error: 'Confirmation required',
        message: 'This action requires a confirmation token. Call POST /admin/confirm first.',
      });
    }

    const data = confirmationTokens.get(token);

    if (!data) {
      return reply.code(403).send({ error: 'Invalid or expired confirmation token' });
    }

    if (data.used) {
      return reply.code(403).send({ error: 'Confirmation token already used' });
    }

    if (Date.now() > data.expiresAt) {
      confirmationTokens.delete(token);
      return reply.code(403).send({ error: 'Confirmation token expired' });
    }

    if (data.userId !== request.user?.id) {
      return reply.code(403).send({ error: 'Confirmation token belongs to a different user' });
    }

    // Mark as used (single-use)
    data.used = true;
    confirmationTokens.delete(token);
  };

  // ===== POST /admin/confirm — Generate a confirmation token =====
  fastify.post('/admin/confirm', {
    preHandler: [adminCsrfGuard],
  }, async (request, reply) => {
    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = Date.now() + CONFIRM_TOKEN_TTL;

    confirmationTokens.set(token, {
      userId: request.user!.id,
      expiresAt,
      used: false,
    });

    return reply.code(200).send({
      token,
      expiresAt: new Date(expiresAt).toISOString(),
      ttlSeconds: 60,
    });
  });

  // ===== OVERRIDE PROBLEM STATUS =====
  fastify.patch('/admin/problems/:id/status', {
    preHandler: [adminCsrfGuard, adminRateLimit, requireConfirmation],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'mature'];
    if (!validStatuses.includes(status)) {
      return reply.code(400).send({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const [problem] = await db
      .select({ id: problems.id })
      .from(problems)
      .where(eq(problems.id, id))
      .limit(1);

    if (!problem) {
      return reply.code(404).send({ error: 'Problem not found' });
    }

    await db.update(problems)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(problems.id, id));

    return reply.code(200).send({ success: true, newStatus: status });
  });

  // ===== SUSPEND / BAN / REACTIVATE BOT =====
  fastify.patch('/admin/bots/:id/status', {
    preHandler: [adminCsrfGuard, adminRateLimit, requireConfirmation],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const validStatuses = ['active', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      return reply.code(400).send({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const [bot] = await db
      .select({ id: bots.id })
      .from(bots)
      .where(eq(bots.id, id))
      .limit(1);

    if (!bot) {
      return reply.code(404).send({ error: 'Bot not found' });
    }

    await db.update(bots)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(bots.id, id));

    return reply.code(200).send({ success: true, newStatus: status });
  });

  // ===== ADMIN STATS OVERVIEW =====
  fastify.get('/admin/stats', async (_request, reply) => {
    const [stats] = await db.select({
      totalUsers: sql<number>`(SELECT count(*) FROM users)::int`,
      totalBots: sql<number>`(SELECT count(*) FROM bots)::int`,
      activeBots: sql<number>`(SELECT count(*) FROM bots WHERE status = 'active')::int`,
      suspendedBots: sql<number>`(SELECT count(*) FROM bots WHERE status = 'suspended')::int`,
      bannedBots: sql<number>`(SELECT count(*) FROM bots WHERE status = 'banned')::int`,
      totalProblems: sql<number>`(SELECT count(*) FROM problems)::int`,
      pendingProblems: sql<number>`(SELECT count(*) FROM problems WHERE status = 'pending')::int`,
      rejectedProblems: sql<number>`(SELECT count(*) FROM problems WHERE status = 'rejected')::int`,
      totalSolutions: sql<number>`(SELECT count(*) FROM solutions)::int`,
      totalComparisons: sql<number>`(SELECT count(*) FROM comparisons)::int`,
      totalFlags: sql<number>`(SELECT count(*) FROM flags)::int`,
    }).from(sql`(SELECT 1) as _`);

    return reply.code(200).send(stats);
  });

  // ===== NEW DASHBOARD ENDPOINTS (read-only) =====

  // GET /admin/problems/summary — Status breakdown for donut chart
  fastify.get('/admin/problems/summary', async (_request, reply) => {
    const rows = await db
      .select({
        status: problems.status,
        count: sql<number>`count(*)::int`,
      })
      .from(problems)
      .groupBy(problems.status);

    const summary: Record<string, number> = {
      pending: 0,
      approved: 0,
      active: 0,
      mature: 0,
      rejected: 0,
    };

    let total = 0;
    for (const row of rows) {
      summary[row.status] = row.count;
      total += row.count;
    }

    return reply.code(200).send({ ...summary, total });
  });

  // GET /admin/bots/summary — Bot status breakdown
  fastify.get('/admin/bots/summary', async (_request, reply) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [statusCounts, activeLastDayResult] = await Promise.all([
      db
        .select({
          status: bots.status,
          count: sql<number>`count(*)::int`,
        })
        .from(bots)
        .groupBy(bots.status),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bots)
        .where(gte(bots.lastActiveAt, oneDayAgo)),
    ]);

    const summary: Record<string, number> = {
      active: 0,
      suspended: 0,
      banned: 0,
    };

    let total = 0;
    for (const row of statusCounts) {
      summary[row.status] = row.count;
      total += row.count;
    }

    return reply.code(200).send({
      ...summary,
      total,
      activeLastDay: activeLastDayResult[0].count,
    });
  });

  // GET /admin/metrics/throughput — Tasks completed/expired per hour (last 24h)
  fastify.get('/admin/metrics/throughput', async (_request, reply) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [completedRows, expiredRows] = await Promise.all([
      db.select({
        hour: sql<string>`date_trunc('hour', ${tasks.completedAt})::text`,
        count: sql<number>`count(*)::int`,
      })
        .from(tasks)
        .where(
          and(
            eq(tasks.status, 'completed'),
            gte(tasks.completedAt, twentyFourHoursAgo),
          )
        )
        .groupBy(sql`date_trunc('hour', ${tasks.completedAt})`),

      db.select({
        hour: sql<string>`date_trunc('hour', ${tasks.expiresAt})::text`,
        count: sql<number>`count(*)::int`,
      })
        .from(tasks)
        .where(
          and(
            eq(tasks.status, 'expired'),
            gte(tasks.expiresAt, twentyFourHoursAgo),
          )
        )
        .groupBy(sql`date_trunc('hour', ${tasks.expiresAt})`),
    ]);

    // Build lookup maps
    const completedMap = new Map<string, number>();
    for (const row of completedRows) {
      completedMap.set(row.hour, row.count);
    }
    const expiredMap = new Map<string, number>();
    for (const row of expiredRows) {
      expiredMap.set(row.hour, row.count);
    }

    // Fill all 24 hour slots
    const data: Array<{ hour: string; completed: number; expired: number }> = [];
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    for (let i = 23; i >= 0; i--) {
      const hourDate = new Date(currentHour.getTime() - i * 60 * 60 * 1000);
      const hourKey = hourDate.toISOString().replace('T', ' ').replace('Z', '+00');

      data.push({
        hour: hourDate.toISOString(),
        completed: completedMap.get(hourKey) || 0,
        expired: expiredMap.get(hourKey) || 0,
      });
    }

    return reply.code(200).send({ data });
  });

  // GET /admin/problems — Extended filterable problem list
  fastify.get('/admin/problems', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const status = query.status || 'all';
    const category = query.category || 'all';
    const authorType = query.authorType || 'all';
    const search = query.search || '';
    const sort = query.sort || 'newest';
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '25', 10) || 25));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status !== 'all') conditions.push(eq(problems.status, status as any));
    if (category !== 'all') conditions.push(eq(problems.category, category as any));
    if (authorType !== 'all') conditions.push(eq(problems.authorType, authorType as any));
    if (search) conditions.push(ilike(problems.title, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = {
      newest: desc(problems.createdAt),
      oldest: asc(problems.createdAt),
      most_solutions: desc(problems.solutionCount),
      most_flags: desc(sql`${problems.greenFlags} + ${problems.redFlags}`),
    }[sort] || desc(problems.createdAt);

    const [items, countResult] = await Promise.all([
      db.select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        status: problems.status,
        category: problems.category,
        authorType: problems.authorType,
        humanAuthorId: problems.humanAuthorId,
        botAuthorId: problems.botAuthorId,
        solutionCount: problems.solutionCount,
        comparisonCount: problems.comparisonCount,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        attentionScore: problems.attentionScore,
        createdAt: problems.createdAt,
        updatedAt: problems.updatedAt,
        humanAuthorName: users.username,
        botAuthorName: bots.name,
      })
        .from(problems)
        .leftJoin(users, eq(problems.humanAuthorId, users.id))
        .leftJoin(bots, eq(problems.botAuthorId, bots.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      db.select({ count: sql<number>`count(*)::int` })
        .from(problems)
        .where(where),
    ]);

    const problemList = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description ? item.description.substring(0, 200) : '',
      status: item.status,
      category: item.category,
      authorType: item.authorType,
      authorName: item.authorType === 'human' ? item.humanAuthorName : item.botAuthorName,
      solutionCount: item.solutionCount,
      comparisonCount: item.comparisonCount,
      greenFlags: item.greenFlags,
      redFlags: item.redFlags,
      attentionScore: item.attentionScore,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return reply.code(200).send({
      problems: problemList,
      pagination: {
        page,
        limit,
        total: countResult[0].count,
        totalPages: Math.ceil(countResult[0].count / limit),
      },
    });
  });

  // GET /admin/moderation/queue — Moderation queue with inline flags
  fastify.get('/admin/moderation/queue', async (_request, reply) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Pending problems (< 3 total flags)
    const pendingProblems = await db
      .select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        authorType: problems.authorType,
        humanAuthorId: problems.humanAuthorId,
        botAuthorId: problems.botAuthorId,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        createdAt: problems.createdAt,
        humanAuthorName: users.username,
        botAuthorName: bots.name,
      })
      .from(problems)
      .leftJoin(users, eq(problems.humanAuthorId, users.id))
      .leftJoin(bots, eq(problems.botAuthorId, bots.id))
      .where(
        and(
          eq(problems.status, 'pending'),
          sql`${problems.greenFlags} + ${problems.redFlags} < 3`,
        )
      )
      .orderBy(asc(problems.createdAt))
      .limit(50);

    // Mixed problems (has both green and red, < 5 total)
    const mixedProblems = await db
      .select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        authorType: problems.authorType,
        humanAuthorId: problems.humanAuthorId,
        botAuthorId: problems.botAuthorId,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        createdAt: problems.createdAt,
        humanAuthorName: users.username,
        botAuthorName: bots.name,
      })
      .from(problems)
      .leftJoin(users, eq(problems.humanAuthorId, users.id))
      .leftJoin(bots, eq(problems.botAuthorId, bots.id))
      .where(
        and(
          sql`${problems.greenFlags} > 0`,
          sql`${problems.redFlags} > 0`,
          sql`${problems.greenFlags} + ${problems.redFlags} < 5`,
        )
      )
      .orderBy(asc(problems.createdAt))
      .limit(50);

    // Recently rejected (last 24h)
    const recentlyRejected = await db
      .select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        authorType: problems.authorType,
        humanAuthorId: problems.humanAuthorId,
        botAuthorId: problems.botAuthorId,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        createdAt: problems.createdAt,
        humanAuthorName: users.username,
        botAuthorName: bots.name,
      })
      .from(problems)
      .leftJoin(users, eq(problems.humanAuthorId, users.id))
      .leftJoin(bots, eq(problems.botAuthorId, bots.id))
      .where(
        and(
          eq(problems.status, 'rejected'),
          gte(problems.updatedAt, oneDayAgo),
        )
      )
      .orderBy(desc(problems.updatedAt))
      .limit(50);

    // Fetch inline flags for pending and mixed problems
    const allProblemIds = [
      ...pendingProblems.map((p) => p.id),
      ...mixedProblems.map((p) => p.id),
    ];

    let flagsByProblem = new Map<string, Array<{
      id: string;
      botName: string | null;
      verdict: string;
      category: string;
      suggestedCategory: string | null;
      createdAt: Date;
    }>>();

    if (allProblemIds.length > 0) {
      const allFlags = await db
        .select({
          id: flags.id,
          problemId: flags.problemId,
          verdict: flags.verdict,
          category: flags.category,
          suggestedCategory: flags.suggestedCategory,
          createdAt: flags.createdAt,
          botName: bots.name,
        })
        .from(flags)
        .leftJoin(bots, eq(flags.botId, bots.id))
        .where(sql`${flags.problemId} IN (${sql.join(allProblemIds.map(id => sql`${id}::uuid`), sql`, `)})`)
        .orderBy(asc(flags.createdAt));

      for (const flag of allFlags) {
        const existing = flagsByProblem.get(flag.problemId) || [];
        existing.push({
          id: flag.id,
          botName: flag.botName,
          verdict: flag.verdict,
          category: flag.category,
          suggestedCategory: flag.suggestedCategory,
          createdAt: flag.createdAt,
        });
        flagsByProblem.set(flag.problemId, existing);
      }
    }

    // Format helper
    const formatProblem = (p: typeof pendingProblems[0], includeFlags: boolean) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      authorType: p.authorType,
      authorName: p.authorType === 'human' ? p.humanAuthorName : p.botAuthorName,
      greenFlags: p.greenFlags,
      redFlags: p.redFlags,
      totalFlags: p.greenFlags + p.redFlags,
      createdAt: p.createdAt,
      ...(includeFlags ? { flags: flagsByProblem.get(p.id) || [] } : {}),
    });

    return reply.code(200).send({
      pending: pendingProblems.map((p) => formatProblem(p, true)),
      mixed: mixedProblems.map((p) => formatProblem(p, true)),
      recentlyRejected: recentlyRejected.map((p) => formatProblem(p, false)),
      counts: {
        pending: pendingProblems.length,
        mixed: mixedProblems.length,
        recentlyRejected: recentlyRejected.length,
      },
    });
  });
}
