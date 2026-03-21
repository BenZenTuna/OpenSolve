import crypto from 'node:crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { problems, bots, users, flags, tasks, activityLog } from '../db/schema.js';
import { eq, sql, and, or, ilike, desc, asc, gte, isNotNull, isNull } from 'drizzle-orm';
import { adminMiddleware } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';
import { likeContains } from '../utils/sql-helpers.js';
import { invalidateBotAuthCache } from '../middleware/bot-auth.middleware.js';
import { redis } from '../config/redis.js';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', adminMiddleware);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(problems.id, id));

    // When activating a problem, assign category from flags if not already set
    if (status === 'active') {
      const [current] = await db.select({ category: problems.category })
        .from(problems).where(eq(problems.id, id)).limit(1);
      if (current && !current.category) {
        const flagCategories = await db.select({
          suggestedCategory: flags.suggestedCategory,
          count: sql<number>`count(*)::int`,
        })
          .from(flags)
          .where(and(eq(flags.problemId, id), eq(flags.verdict, 'green'), isNotNull(flags.suggestedCategory)))
          .groupBy(flags.suggestedCategory)
          .orderBy(desc(sql`count(*)`))
          .limit(1);

        if (flagCategories.length > 0 && flagCategories[0].suggestedCategory) {
          await db.update(problems)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .set({ category: flagCategories[0].suggestedCategory as any })
            .where(eq(problems.id, id));
        }
      }
    }

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
      .select({ id: bots.id, ownerId: bots.ownerId })
      .from(bots)
      .where(eq(bots.id, id))
      .limit(1);

    if (!bot) {
      return reply.code(404).send({ error: 'Bot not found' });
    }

    await db.update(bots)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(bots.id, id));

    // Invalidate bot auth cache when suspending or banning
    if (status === 'suspended' || status === 'banned') {
      const [owner] = await db
        .select({ apiKeyPrefix: users.apiKeyPrefix })
        .from(users)
        .where(eq(users.id, bot.ownerId))
        .limit(1);
      if (owner?.apiKeyPrefix) {
        invalidateBotAuthCache(owner.apiKeyPrefix);
      }
    }

    return reply.code(200).send({ success: true, newStatus: status });
  });

  // ===== ADMIN STATS OVERVIEW =====
  fastify.get('/admin/stats', async (_request, reply) => {
    const cached = await redis.get('stats:admin');
    if (cached) {
      return reply.code(200).send(JSON.parse(cached));
    }

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

    await redis.set('stats:admin', JSON.stringify(stats), 'EX', 30);

    return reply.code(200).send(stats);
  });

  // ===== GET /admin/users — Filterable user list =====
  fastify.get('/admin/users', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const role = query.role || 'all';
    const hasBot = query.hasBot || 'all';
    const newsletter = query.newsletter || 'all';
    const search = query.search || '';
    const sort = query.sort || 'newest';
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '25', 10) || 25));
    const offset = (page - 1) * limit;

    const conditions = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (role !== 'all') conditions.push(eq(users.role, role as any));
    if (hasBot === 'yes') conditions.push(isNotNull(users.botName));
    if (hasBot === 'no') conditions.push(isNull(users.botName));
    if (newsletter === 'subscribed') conditions.push(eq(users.newsletterSubscribed, true));
    if (newsletter === 'unsubscribed') conditions.push(eq(users.newsletterSubscribed, false));
    if (search) {
      conditions.push(
        or(
          ilike(users.username, likeContains(search)),
          ilike(users.email, likeContains(search)),
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = {
      newest: desc(users.createdAt),
      oldest: asc(users.createdAt),
      username: asc(users.username),
    }[sort] || desc(users.createdAt);

    const [items, countResult] = await Promise.all([
      db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        onboardingComplete: users.onboardingComplete,
        botName: users.botName,
        apiKeyPrefix: users.apiKeyPrefix,
        newsletterSubscribed: users.newsletterSubscribed,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
        .from(users)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      db.select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(where),
    ]);

    const userList = items.map((item) => ({
      id: item.id,
      username: item.username,
      email: item.email,
      role: item.role,
      onboardingComplete: item.onboardingComplete,
      botName: item.botName,
      hasApiKey: Boolean(item.apiKeyPrefix),
      newsletterSubscribed: item.newsletterSubscribed,
      createdAt: item.createdAt,
      lastUpdated: item.updatedAt,
    }));

    return reply.code(200).send({
      users: userList,
      pagination: {
        page,
        limit,
        total: countResult[0].count,
        totalPages: Math.ceil(countResult[0].count / limit),
      },
    });
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

  // GET /admin/bots — Extended filterable bot list
  fastify.get('/admin/bots', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const status = query.status || 'all';
    const search = query.search || '';
    const sort = query.sort || 'newest';
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '25', 10) || 25));
    const offset = (page - 1) * limit;

    const conditions = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (status !== 'all') conditions.push(eq(bots.status, status as any));
    if (search) {
      conditions.push(
        or(
          ilike(bots.name, likeContains(search)),
          ilike(users.username, likeContains(search)),
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = {
      newest: desc(bots.createdAt),
      oldest: asc(bots.createdAt),
      most_points: desc(bots.totalPoints),
      most_solutions: desc(bots.totalSolutions),
      most_votes: desc(bots.totalVotes),
      highest_elo: desc(bots.globalElo),
      last_active: desc(bots.lastActiveAt),
    }[sort] || desc(bots.createdAt);

    const [items, countResult] = await Promise.all([
      db.select({
        id: bots.id,
        name: bots.name,
        description: bots.description,
        status: bots.status,
        ownerId: bots.ownerId,
        ownerUsername: users.username,
        totalPoints: bots.totalPoints,
        totalSolutions: bots.totalSolutions,
        totalVotes: bots.totalVotes,
        totalFlags: bots.totalFlags,
        totalProblemsCreated: bots.totalProblemsCreated,
        totalTasksCompleted: bots.totalTasksCompleted,
        voteAccuracy: bots.voteAccuracy,
        globalElo: bots.globalElo,
        lastActiveAt: bots.lastActiveAt,
        createdAt: bots.createdAt,
      })
        .from(bots)
        .leftJoin(users, eq(bots.ownerId, users.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      db.select({ count: sql<number>`count(*)::int` })
        .from(bots)
        .leftJoin(users, eq(bots.ownerId, users.id))
        .where(where),
    ]);

    return reply.code(200).send({
      bots: items,
      pagination: {
        page,
        limit,
        total: countResult[0].count,
        totalPages: Math.ceil(countResult[0].count / limit),
      },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (status !== 'all') conditions.push(eq(problems.status, status as any));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (category !== 'all') conditions.push(eq(problems.category, category as any));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (authorType !== 'all') conditions.push(eq(problems.authorType, authorType as any));
    if (search) conditions.push(ilike(problems.title, likeContains(search)));

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

    const flagsByProblem = new Map<string, Array<{
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

  // ===== GET /admin/activity — Filterable activity log =====
  fastify.get('/admin/activity', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const action = query.action || 'all';
    const actorType = query.actorType || 'all';
    const search = query.search || '';
    const sort = query.sort || 'newest';
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(query.limit || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (action !== 'all') conditions.push(eq(activityLog.action, action));
    if (actorType === 'bot') conditions.push(isNotNull(activityLog.botId));
    if (actorType === 'human') {
      conditions.push(
        and(
          isNotNull(activityLog.humanUserId),
          sql`${activityLog.action} NOT LIKE 'admin_%'`,
        )!,
      );
    }
    if (actorType === 'admin') {
      conditions.push(sql`${activityLog.action} LIKE 'admin_%'`);
    }
    if (search) {
      conditions.push(
        or(
          ilike(bots.name, likeContains(search)),
          ilike(users.username, likeContains(search)),
          ilike(problems.title, likeContains(search)),
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = sort === 'oldest'
      ? asc(activityLog.createdAt)
      : desc(activityLog.createdAt);

    const baseQuery = db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        botId: activityLog.botId,
        botName: bots.name,
        humanUserId: activityLog.humanUserId,
        humanUsername: users.username,
        problemId: activityLog.problemId,
        problemTitle: problems.title,
        solutionId: activityLog.solutionId,
        metadata: activityLog.metadata,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .leftJoin(bots, eq(activityLog.botId, bots.id))
      .leftJoin(users, eq(activityLog.humanUserId, users.id))
      .leftJoin(problems, eq(activityLog.problemId, problems.id));

    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityLog)
      .leftJoin(bots, eq(activityLog.botId, bots.id))
      .leftJoin(users, eq(activityLog.humanUserId, users.id))
      .leftJoin(problems, eq(activityLog.problemId, problems.id));

    // actionCounts: cached in Redis (30s) to avoid full-table GROUP BY on every page load
    let actionCounts: Record<string, number> = {};
    const cachedCounts = await redis.get('admin:action_counts');
    if (cachedCounts) {
      actionCounts = JSON.parse(cachedCounts);
    }

    const [items, countResult] = await Promise.all([
      baseQuery
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      countQuery.where(where),
    ]);

    if (!cachedCounts) {
      const actionCountRows = await db.select({
        action: activityLog.action,
        count: sql<number>`count(*)::int`,
      })
        .from(activityLog)
        .groupBy(activityLog.action);

      for (const row of actionCountRows) {
        actionCounts[row.action] = row.count;
      }
      await redis.set('admin:action_counts', JSON.stringify(actionCounts), 'EX', 30);
    }

    return reply.code(200).send({
      activities: items.map((item) => ({
        id: item.id,
        action: item.action,
        botId: item.botId,
        botName: item.botName || null,
        humanUserId: item.humanUserId,
        humanUsername: item.humanUsername || null,
        problemId: item.problemId,
        problemTitle: item.problemTitle || null,
        solutionId: item.solutionId,
        metadata: item.metadata,
        createdAt: item.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: countResult[0].count,
        totalPages: Math.ceil(countResult[0].count / limit),
      },
      actionCounts,
    });
  });
}
