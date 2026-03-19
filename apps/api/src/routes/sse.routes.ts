import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { bots, activityLog, problems, users } from '../db/schema.js';
import { desc, sql, gte, eq } from 'drizzle-orm';
import { env } from '../config/env.js';
import type { ServerResponse } from 'node:http';
import { logger } from '../utils/logger.js';

// ── Shared broadcast state ───────────────────────────────────────────────────
// A single polling loop runs the 2 DB queries every 10 seconds and broadcasts
// results to ALL connected SSE clients. The loop starts when the first client
// connects and stops when the last client disconnects.

const MAX_SSE_CLIENTS = 200;
const BROADCAST_INTERVAL_MS = 10_000;

const clients = new Set<ServerResponse>();
let broadcastInterval: NodeJS.Timeout | null = null;

function broadcast(event: string, data: string): void {
  const message = `event: ${event}\ndata: ${data}\n\n`;
  for (const res of clients) {
    try {
      res.write(message);
    } catch {
      // Client gone — will be cleaned up by its 'close' handler
    }
  }
}

async function runBroadcastCycle(): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [activeBots] = await db.select({
      count: sql<number>`count(*)::int`,
    }).from(bots).where(gte(bots.lastActiveAt, oneHourAgo));

    broadcast('active_bots', JSON.stringify({ count: activeBots.count }));

    const recentActivity = await db.select({
      id: activityLog.id,
      action: activityLog.action,
      botId: activityLog.botId,
      botName: bots.name,
      ownerBotName: users.botName,
      problemId: activityLog.problemId,
      problemTitle: problems.title,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .leftJoin(bots, eq(activityLog.botId, bots.id))
    .leftJoin(users, eq(bots.ownerId, users.id))
    .leftJoin(problems, eq(activityLog.problemId, problems.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(5);

    broadcast('activity', JSON.stringify(recentActivity));
  } catch (err) {
    logger.error(err, 'SSE broadcast cycle failed');
  }
}

function startBroadcastLoop(): void {
  if (broadcastInterval) return;
  broadcastInterval = setInterval(runBroadcastCycle, BROADCAST_INTERVAL_MS);
}

function stopBroadcastLoop(): void {
  if (broadcastInterval && clients.size === 0) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function sseRoutes(fastify: FastifyInstance) {

  // ===== SSE EVENT STREAM =====
  fastify.get('/events/stream', async (request, reply) => {
    // Connection cap
    if (clients.size >= MAX_SSE_CLIENTS) {
      logger.warn({ current: clients.size, max: MAX_SSE_CLIENTS }, 'SSE connection cap reached');
      return reply.code(503).send({ error: 'Too many live connections. Try again later.' });
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': env.WEB_URL,
    });

    // Send initial data to the new client
    const stats = await getStats();
    reply.raw.write(`event: stats\ndata: ${JSON.stringify(stats)}\n\n`);

    // Register this client for broadcasts
    clients.add(reply.raw);
    startBroadcastLoop();

    // Clean up on disconnect
    request.raw.on('close', () => {
      clients.delete(reply.raw);
      stopBroadcastLoop();
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
