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
const AUTH_CACHE_MAX_SIZE = 5000;
const AUTH_CACHE_SWEEP_INTERVAL_MS = 300_000; // 5 minutes
let authCacheSweepInterval: NodeJS.Timeout | null = null;

function startAuthCacheSweep(): void {
  if (authCacheSweepInterval) return;
  authCacheSweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of AUTH_CACHE) {
      if (now - entry.cachedAt >= AUTH_CACHE_TTL_MS) {
        AUTH_CACHE.delete(key);
      }
    }
    // Stop sweep if cache is empty
    if (AUTH_CACHE.size === 0 && authCacheSweepInterval) {
      clearInterval(authCacheSweepInterval);
      authCacheSweepInterval = null;
    }
  }, AUTH_CACHE_SWEEP_INTERVAL_MS);
  // Allow process to exit even if sweep is running
  authCacheSweepInterval.unref();
}

export function invalidateBotAuthCache(prefix: string): void {
  AUTH_CACHE.delete(prefix);
}

// ── In-flight deduplication (singleflight) ───────────────────────────────
// Prevents bcrypt storm: concurrent requests for the same bot share one
// DB lookup + bcrypt verification instead of running N in parallel.

interface BotData {
  id: string; ownerId: string; name: string; status: string;
  description: string | null; totalPoints: number; totalSolutions: number;
  totalVotes: number; totalFlags: number; globalElo: number;
}

interface AuthResult {
  botData: BotData;
  apiKeyHash: string;
}

const AUTH_IN_FLIGHT = new Map<string, Promise<AuthResult | null>>();

/**
 * Run the full auth flow: DB prefix lookup → bcrypt → bot fetch.
 * Returns AuthResult on success, null on invalid key, throws on bot errors.
 */
async function verifyApiKey(apiKey: string, prefix16: string, prefix8: string): Promise<AuthResult | null> {
  // Try 16-char prefix first (new keys), fall back to 8-char (legacy keys)
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.apiKeyPrefix, prefix16))
    .limit(1);

  if (!user || !user.apiKeyHash) {
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.apiKeyPrefix, prefix8))
      .limit(1);
  }

  if (!user || !user.apiKeyHash) return null;

  const isValid = await bcrypt.compare(apiKey, user.apiKeyHash);
  if (!isValid) return null;

  const [bot] = await db
    .select()
    .from(bots)
    .where(eq(bots.ownerId, user.id))
    .limit(1);

  if (!bot) {
    throw new Error('NO_BOT_PROFILE');
  }

  if (bot.status !== 'active') {
    throw new Error(`BOT_STATUS:${bot.status}`);
  }

  return {
    botData: {
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
    },
    apiKeyHash: user.apiKeyHash,
  };
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

  // ── 1. Cache check (fastest path) ─────────────────────────────────────
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

  // ── 2. In-flight deduplication (singleflight) ─────────────────────────
  // If another request is already verifying this key, share its result
  let authPromise = AUTH_IN_FLIGHT.get(prefix16);
  if (!authPromise) {
    // No existing verification — start one and register it
    authPromise = verifyApiKey(apiKey, prefix16, prefix8);
    AUTH_IN_FLIGHT.set(prefix16, authPromise);
    // Ensure cleanup even if the promise rejects
    void authPromise.finally(() => {
      AUTH_IN_FLIGHT.delete(prefix16);
    });
  }

  // ── 3. Await the shared result ────────────────────────────────────────
  let result: AuthResult | null;
  try {
    result = await authPromise;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NO_BOT_PROFILE') {
      return reply.code(403).send({ error: 'No bot profile configured. Set a bot name in Settings first.' });
    }
    if (msg.startsWith('BOT_STATUS:')) {
      return reply.code(403).send({ error: `Bot is ${msg.slice(11)}` });
    }
    throw err;
  }

  if (!result) {
    return reply.code(401).send({ error: 'Invalid API key' });
  }

  request.bot = { ...result.botData };

  // Hard cap: if cache is too large, clear it entirely to prevent unbounded memory growth
  if (AUTH_CACHE.size >= AUTH_CACHE_MAX_SIZE) {
    request.log.warn({ size: AUTH_CACHE.size, max: AUTH_CACHE_MAX_SIZE }, 'Auth cache hard cap reached — clearing');
    AUTH_CACHE.clear();
  }

  // Cache successful auth — keyed on prefix16 even for legacy fallback matches
  AUTH_CACHE.set(prefix16, {
    apiKeyHash: result.apiKeyHash,
    bot: { ...result.botData },
    cachedAt: Date.now(),
  });
  startAuthCacheSweep();

  trackBotRequest(request.bot.id).catch(() => {});
  incrementConcurrent().catch(() => {});
}
