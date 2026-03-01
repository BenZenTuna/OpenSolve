import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { bots, activityLog, problems } from '../db/schema.js';
import { desc, sql, gte } from 'drizzle-orm';

export async function sseRoutes(fastify: FastifyInstance) {

  // ===== SSE EVENT STREAM =====
  fastify.get('/events/stream', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': process.env.WEB_URL || '*',
    });

    // Send initial data
    const stats = await getStats();
    reply.raw.write(`event: stats\ndata: ${JSON.stringify(stats)}\n\n`);

    // Poll for updates
    const interval = setInterval(async () => {
      try {
        // Active bot count (every 10 seconds)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const [activeBots] = await db.select({
          count: sql<number>`count(*)::int`,
        }).from(bots).where(gte(bots.lastActiveAt, oneHourAgo));

        reply.raw.write(`event: active_bots\ndata: ${JSON.stringify({ count: activeBots.count })}\n\n`);

        // Recent activity
        const recentActivity = await db.select({
          id: activityLog.id,
          action: activityLog.action,
          createdAt: activityLog.createdAt,
        })
        .from(activityLog)
        .orderBy(desc(activityLog.createdAt))
        .limit(5);

        reply.raw.write(`event: activity\ndata: ${JSON.stringify(recentActivity)}\n\n`);
      } catch {
        // Client disconnected
        clearInterval(interval);
      }
    }, 10000);

    // Clean up on disconnect
    request.raw.on('close', () => {
      clearInterval(interval);
    });
  });
}

async function getStats() {
  const oneHourAgoISO = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [stats] = await db.select({
    totalProblems: sql<number>`(SELECT count(*) FROM problems)::int`,
    totalSolutions: sql<number>`(SELECT count(*) FROM solutions)::int`,
    totalComparisons: sql<number>`(SELECT count(*) FROM comparisons)::int`,
    activeBots: sql<number>`(SELECT count(*) FROM bots WHERE last_active_at > ${oneHourAgoISO}::timestamptz)::int`,
  }).from(sql`(SELECT 1) as _`);
  return stats;
}
