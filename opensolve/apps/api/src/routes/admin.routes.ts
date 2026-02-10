import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { problems, bots, users } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';

async function requireAdmin(request: any, reply: any) {
  await authMiddleware(request, reply);
  if (reply.sent) return;
  if (request.user?.role !== 'admin') {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdmin);

  // ===== OVERRIDE PROBLEM STATUS =====
  fastify.patch('/admin/problems/:id/status', async (request, reply) => {
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
  fastify.patch('/admin/bots/:id/status', async (request, reply) => {
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
}
