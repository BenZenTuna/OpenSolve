import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { db } from '../config/database.js';
import { bots, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { trackBotRequest, incrementConcurrent } from '../services/bot-traffic.service.js';

// ── In-memory auth cache ─────────────────────────────────────────────────────
// Avoids 2-3 DB queries + bcrypt on every bot request (≈100ms saved per hit).
// TTL: 5 minutes. Invalidated on API key revocation and bot status changes.

interface CacheEntry {
  apiKeyHash: string;
  bot: {
    id: string; ownerId: string; name: string; status: string;
    description: string | null; totalPoints: number; totalSolutions: number;
    totalVotes: number; totalFlags: number; globalElo: number;
  };
  cachedAt: number;
}
const AUTH_CACHE = new Map<string, CacheEntry>();
const AUTH_CACHE_TTL_MS = 300_000; // 5 minutes

export function invalidateBotAuthCache(prefix: string): void {
  AUTH_CACHE.delete(prefix);
}

// ─────────────────────────────────────────────────────────────────────────────

export async function botAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer os_key_')) {
    return reply.code(401).send({ error: 'Invalid API key format. Expected: Bearer os_key_...' });
  }

  const apiKey = authHeader.slice(7);
  const prefix16 = apiKey.slice(0, 16);
  const prefix8 = apiKey.slice(0, 8);

  // ── Cache check ──────────────────────────────────────────────────────────
  const cached = AUTH_CACHE.get(prefix16);
  if (cached && Date.now() - cached.cachedAt < AUTH_CACHE_TTL_MS) {
    request.bot = { ...cached.bot };
    request.log.debug({ prefix: prefix16 }, 'bot-auth: cache hit');
    trackBotRequest(request.bot.id).catch(() => {});
    incrementConcurrent().catch(() => {});
    return;
  }
  // Stale entry — remove it
  if (cached) AUTH_CACHE.delete(prefix16);

  // ── Full auth flow ───────────────────────────────────────────────────────

  // Try 16-char prefix first (new keys), fall back to 8-char (legacy keys)
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.apiKeyPrefix, prefix16))
    .limit(1);

  if (!user || !user.apiKeyHash) {
    // Fallback: try legacy 8-char prefix
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.apiKeyPrefix, prefix8))
      .limit(1);
  }

  if (!user || !user.apiKeyHash) {
    return reply.code(401).send({ error: 'Invalid API key' });
  }

  const isValid = await bcrypt.compare(apiKey, user.apiKeyHash);
  if (!isValid) {
    return reply.code(401).send({ error: 'Invalid API key' });
  }

  const [bot] = await db
    .select()
    .from(bots)
    .where(eq(bots.ownerId, user.id))
    .limit(1);

  if (!bot) {
    return reply.code(403).send({ error: 'No bot profile configured. Set a bot name in Settings first.' });
  }

  if (bot.status !== 'active') {
    return reply.code(403).send({ error: `Bot is ${bot.status}` });
  }

  const botData = {
    id: bot.id,
    ownerId: user.id,
    name: bot.name,
    status: bot.status,
    description: bot.description,
    totalPoints: bot.totalPoints,
    totalSolutions: bot.totalSolutions,
    totalVotes: bot.totalVotes,
    totalFlags: bot.totalFlags,
    globalElo: bot.globalElo,
  };

  request.bot = botData;

  // Cache successful auth — keyed on prefix16 even for legacy fallback matches
  AUTH_CACHE.set(prefix16, {
    apiKeyHash: user.apiKeyHash,
    bot: { ...botData },
    cachedAt: Date.now(),
  });

  trackBotRequest(request.bot.id).catch(() => {});
  incrementConcurrent().catch(() => {});
}
