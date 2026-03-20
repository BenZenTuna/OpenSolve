import { redis } from '../config/redis.js';
import { db } from '../config/database.js';
import { bots } from '../db/schema.js';
import { sql } from 'drizzle-orm';

const KEYS = {
  activeSet: 'bot:traffic:active',
  hourlyHits: 'bot:traffic:hourly',
  concurrent: 'bot:traffic:concurrent',
  peakPrefix: 'bot:traffic:peak:',
};

export async function trackBotRequest(botId: string): Promise<void> {
  try {
    const now = Date.now();
    const hourKey = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH

    const pipeline = redis.pipeline();
    pipeline.zadd(KEYS.activeSet, now, botId);
    pipeline.zremrangebyscore(KEYS.activeSet, '-inf', now - 5 * 60 * 1000);
    pipeline.hincrby(KEYS.hourlyHits, hourKey, 1);
    await pipeline.exec();
  } catch {
    // Non-blocking — silently ignore Redis failures
  }
}

export async function incrementConcurrent(): Promise<void> {
  try {
    const val = await redis.incr(KEYS.concurrent);
    const dateKey = new Date().toISOString().slice(0, 10);
    const peakKey = KEYS.peakPrefix + dateKey;

    const peak = await redis.get(peakKey);
    if (!peak || val > parseInt(peak, 10)) {
      await redis.set(peakKey, String(val), 'EX', 172800); // 48hr TTL
    }
  } catch {
    // Non-blocking
  }
}

export async function decrementConcurrent(): Promise<void> {
  try {
    const val = await redis.decr(KEYS.concurrent);
    if (val < 0) await redis.set(KEYS.concurrent, '0');
  } catch {
    // Non-blocking
  }
}

export interface BotTrafficStats {
  activeBots1m: number;
  activeBots5m: number;
  activeBotNames1m: string[];
  activeBotNames5m: string[];
  dailyHits: number;
  hourlyHits: { hour: string; count: number }[];
  currentConcurrent: number;
  peakConcurrent: number;
  status: 'green' | 'yellow' | 'orange' | 'red';
  thresholds: { green: string; yellow: string; orange: string; red: string };
}

export async function getTrafficStats(): Promise<BotTrafficStats> {
  const now = Date.now();
  const dateKey = new Date().toISOString().slice(0, 10);

  // Active bots (sorted set: member=botId, score=timestamp)
  const active1m = await redis.zrangebyscore(KEYS.activeSet, now - 60 * 1000, '+inf');
  const active5m = await redis.zrangebyscore(KEYS.activeSet, now - 5 * 60 * 1000, '+inf');

  // Hourly hits for last 24 hours
  const allHourly = await redis.hgetall(KEYS.hourlyHits);
  const hourlyHits: { hour: string; count: number }[] = [];
  let dailyTotal = 0;

  for (let i = 23; i >= 0; i--) {
    const d = new Date(now - i * 60 * 60 * 1000);
    const hourKey = d.toISOString().slice(0, 13);
    const count = parseInt(allHourly[hourKey] || '0', 10);
    hourlyHits.push({ hour: hourKey, count });
    dailyTotal += count;
  }

  // Clean up old hourly keys (older than 48h)
  const cutoff = new Date(now - 48 * 60 * 60 * 1000).toISOString().slice(0, 13);
  const keysToDelete = Object.keys(allHourly).filter((k) => k < cutoff);
  if (keysToDelete.length > 0) {
    redis.hdel(KEYS.hourlyHits, ...keysToDelete).catch(() => {});
  }

  // Concurrent
  const concurrent = parseInt(await redis.get(KEYS.concurrent) || '0', 10);
  const peak = parseInt(await redis.get(KEYS.peakPrefix + dateKey) || '0', 10);

  // Status based on daily hits
  let status: 'green' | 'yellow' | 'orange' | 'red' = 'green';
  if (dailyTotal > 2000) status = 'red';
  else if (dailyTotal > 1500) status = 'orange';
  else if (dailyTotal > 1000) status = 'yellow';

  return {
    activeBots1m: new Set(active1m).size,
    activeBots5m: new Set(active5m).size,
    activeBotNames1m: [...new Set(active1m)],
    activeBotNames5m: [...new Set(active5m)],
    dailyHits: dailyTotal,
    hourlyHits,
    currentConcurrent: Math.max(concurrent, 0),
    peakConcurrent: Math.max(peak, 0),
    status,
    thresholds: {
      green: '0-1,000 daily hits',
      yellow: '1,001-1,500 daily hits',
      orange: '1,501-2,000 daily hits',
      red: '2,001+ daily hits',
    },
  };
}

/**
 * Reconcile the concurrent_bots counter with the database.
 * Resets the Redis counter to the true count of bots active in the last 60 seconds.
 * Called every 60s to prevent permanent upward drift from connection aborts.
 */
export async function reconcileConcurrentBots(): Promise<void> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bots)
    .where(sql`${bots.lastActiveAt} > ${oneMinuteAgo}::timestamptz`);
  const trueCount = result?.count ?? 0;
  await redis.set(KEYS.concurrent, String(trueCount));
}
