import { redis } from '../config/redis.js';
import { db } from '../config/database.js';
import { dailyVisitStats } from '../db/schema.js';
import { sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

// Dynamic route segments from apps/web/src/app/:
// /problems/[id], /bots/[id], /users/[id], /llm-leaderboard/[modelName]
const DYNAMIC_ROUTES: Array<{ prefix: string; param: string }> = [
  { prefix: '/problems/', param: '[id]' },
  { prefix: '/bots/', param: '[id]' },
  { prefix: '/users/', param: '[id]' },
  { prefix: '/llm-leaderboard/', param: '[modelName]' },
];

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

export function normalizePath(rawPath: string): string {
  // Strip query params and hash
  let path = rawPath.split('?')[0].split('#')[0];

  // Strip trailing slash (except for '/')
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  // Normalize dynamic route segments
  for (const route of DYNAMIC_ROUTES) {
    if (path.startsWith(route.prefix) && path.length > route.prefix.length) {
      path = route.prefix + route.param;
      break;
    }
  }

  // Truncate to 255 chars
  if (path.length > 255) {
    path = path.slice(0, 255);
  }

  return path || '/';
}

export async function incrementPageView(rawPath: string): Promise<void> {
  try {
    const path = normalizePath(rawPath);
    const key = `visits:web:${getTodayDateString()}:${path}`;
    await redis.incr(key);
    await redis.expire(key, 172800); // 48h TTL safety net
  } catch (err) {
    logger.error({ err }, 'Failed to increment page view');
  }
}

export async function incrementBotRequest(): Promise<void> {
  try {
    const key = `visits:bot:${getTodayDateString()}`;
    await redis.incr(key);
    await redis.expire(key, 172800);
  } catch (err) {
    logger.error({ err }, 'Failed to increment bot request');
  }
}

export async function getTodayStats(): Promise<{
  paths: Array<{ path: string; views: number }>;
  totalPageViews: number;
  botRequests: number;
}> {
  try {
    const today = getTodayDateString();
    const prefix = `visits:web:${today}:`;

    // Scan for all web keys for today
    const paths: Array<{ path: string; views: number }> = [];
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        const values = await redis.mget(...keys);
        for (let i = 0; i < keys.length; i++) {
          const path = keys[i].slice(prefix.length);
          const views = parseInt(values[i] || '0', 10);
          if (views > 0) paths.push({ path, views });
        }
      }
    } while (cursor !== '0');

    paths.sort((a, b) => b.views - a.views);
    const totalPageViews = paths.reduce((sum, p) => sum + p.views, 0);

    const botKey = `visits:bot:${today}`;
    const botRequests = parseInt(await redis.get(botKey) || '0', 10);

    return { paths, totalPageViews, botRequests };
  } catch (err) {
    logger.error({ err }, 'Failed to get today visit stats');
    return { paths: [], totalPageViews: 0, botRequests: 0 };
  }
}

export async function flushVisitStatsToDb(): Promise<void> {
  const today = getTodayDateString();
  let flushedWeb = 0;
  let flushedBot = 0;

  try {
    // Scan for ALL web visit keys
    let cursor = '0';
    const webKeys: string[] = [];
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'visits:web:*', 'COUNT', 100);
      cursor = nextCursor;
      webKeys.push(...keys);
    } while (cursor !== '0');

    for (const key of webKeys) {
      // Parse: visits:web:YYYY-MM-DD:/path
      const parts = key.match(/^visits:web:(\d{4}-\d{2}-\d{2}):(.+)$/);
      if (!parts) continue;
      const [, dateStr, path] = parts;

      // Skip today's keys — still accumulating
      if (dateStr === today) continue;

      const views = parseInt(await redis.get(key) || '0', 10);
      if (views <= 0) {
        await redis.del(key);
        continue;
      }

      await db.insert(dailyVisitStats)
        .values({ date: dateStr, path, pageViews: views })
        .onConflictDoUpdate({
          target: [dailyVisitStats.date, dailyVisitStats.path],
          set: { pageViews: sql`${dailyVisitStats.pageViews} + ${views}` },
        });

      await redis.del(key);
      flushedWeb++;
    }

    // Scan for ALL bot visit keys
    cursor = '0';
    const botKeys: string[] = [];
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'visits:bot:*', 'COUNT', 100);
      cursor = nextCursor;
      botKeys.push(...keys);
    } while (cursor !== '0');

    for (const key of botKeys) {
      const parts = key.match(/^visits:bot:(\d{4}-\d{2}-\d{2})$/);
      if (!parts) continue;
      const [, dateStr] = parts;

      if (dateStr === today) continue;

      const requests = parseInt(await redis.get(key) || '0', 10);
      if (requests <= 0) {
        await redis.del(key);
        continue;
      }

      await db.insert(dailyVisitStats)
        .values({ date: dateStr, path: '_bot_total', botRequests: requests })
        .onConflictDoUpdate({
          target: [dailyVisitStats.date, dailyVisitStats.path],
          set: { botRequests: sql`${dailyVisitStats.botRequests} + ${requests}` },
        });

      await redis.del(key);
      flushedBot++;
    }

    if (flushedWeb > 0 || flushedBot > 0) {
      logger.info({ flushedWeb, flushedBot }, 'Visit stats flushed from Redis to DB');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to flush visit stats to DB');
  }
}
