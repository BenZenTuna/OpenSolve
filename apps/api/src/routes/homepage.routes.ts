import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { problems, solutions, bots, users } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { redis } from '../config/redis.js';

/**
 * Cache-aside with mutex to prevent stampede on TTL expiry.
 * One request wins the SET NX lock and rebuilds; others wait 200ms and retry.
 * Safety valve: if cache is still empty after retry, build anyway (never hang).
 */
async function withCacheMutex<T>(
  cacheKey: string,
  ttl: number,
  buildFn: () => Promise<T>,
): Promise<T> {
  // Fast path: cache hit
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as T;

  // Try to acquire rebuild lock
  const mutexKey = `${cacheKey}:rebuilding`;
  const acquired = await redis.set(mutexKey, '1', 'EX', 5, 'NX');

  if (!acquired) {
    // Another request is rebuilding — wait and retry cache
    await new Promise(resolve => setTimeout(resolve, 200));
    const retried = await redis.get(cacheKey);
    if (retried) return JSON.parse(retried) as T;
    // Safety valve: cache still empty after retry — build anyway
  }

  const result = await buildFn();
  await redis.setex(cacheKey, ttl, JSON.stringify(result));
  await redis.del(mutexKey);
  return result;
}

export async function homepageRoutes(fastify: FastifyInstance) {
  // ===== SOLUTION SPOTLIGHT =====
  // Returns the #1 solution from the most active problem
  fastify.get('/spotlight', async (_request, reply) => {
    const result = await withCacheMutex('homepage:spotlight', 300, async () => {
      // Find the most active problem (most comparisons, status active or mature)
      const [topProblem] = await db
        .select()
        .from(problems)
        .where(sql`${problems.status} IN ('active', 'mature')`)
        .orderBy(desc(problems.comparisonCount))
        .limit(1);

      if (!topProblem) return null;

      // Get the #1 ranked solution for that problem
      const [topSolution] = await db
        .select()
        .from(solutions)
        .where(eq(solutions.problemId, topProblem.id))
        .orderBy(desc(solutions.btScore))
        .limit(1);

      if (!topSolution) return null;

      // Get the bot that wrote it (may be null if bot was deleted)
      let bot: { id: string; name: string; globalElo: number; ownerBotName: string | null } | null = null;
      if (topSolution.botId) {
        const [foundBot] = await db
          .select({
            id: bots.id,
            name: bots.name,
            globalElo: bots.globalElo,
            ownerBotName: users.botName,
          })
          .from(bots)
          .leftJoin(users, eq(bots.ownerId, users.id))
          .where(eq(bots.id, topSolution.botId));
        bot = foundBot ?? null;
      }

      return {
        problem: {
          id: topProblem.id,
          title: topProblem.title,
          category: topProblem.category,
          authorType: topProblem.authorType,
          solutionCount: topProblem.solutionCount,
          comparisonCount: topProblem.comparisonCount,
        },
        solution: {
          id: topSolution.id,
          text: topSolution.text,
          btScore: topSolution.btScore,
          comparisonCount: topSolution.comparisonCount,
          winCount: topSolution.winCount,
          confidenceInterval: topSolution.confidenceInterval,
        },
        bot,
      };
    });

    if (!result) return reply.code(204).send();
    return reply.send(result);
  });

  // ===== TOP SOLUTIONS =====
  // Returns the #1 solution from each of the top N problems (by comparison count)
  fastify.get('/top-solutions', async (request, reply) => {
    const { limit = '6' } = request.query as Record<string, string>;
    const count = Math.min(Number(limit) || 6, 12);
    const cacheKey = `homepage:top-solutions:${count}`;

    const results = await withCacheMutex(cacheKey, 300, async () => {
      // Single query: #1 solution per problem, joined with bot info
      const rows = await db.execute(sql`
        SELECT
          p.id AS problem_id, p.title AS problem_title, p.category AS problem_category,
          p.author_type AS problem_author_type, p.solution_count AS problem_solution_count,
          s.id AS solution_id, s.text AS solution_text, s.bt_score, s.comparison_count AS sol_comparison_count,
          s.win_count,
          b.id AS bot_id, b.name AS bot_name, u.bot_name AS owner_bot_name
        FROM (
          SELECT DISTINCT ON (s2.problem_id) s2.*
          FROM solutions s2
          JOIN problems p2 ON s2.problem_id = p2.id
          WHERE p2.status IN ('active', 'mature') AND p2.solution_count >= 3
          ORDER BY s2.problem_id, s2.bt_score DESC
        ) s
        JOIN problems p ON s.problem_id = p.id
        LEFT JOIN bots b ON s.bot_id = b.id
        LEFT JOIN users u ON b.owner_id = u.id
        ORDER BY p.comparison_count DESC
        LIMIT ${count}
      `);

      const rawRows = (rows as { rows?: unknown[] }).rows ?? rows;
      return (rawRows as Array<Record<string, unknown>>).map(row => ({
        problem: {
          id: row.problem_id,
          title: row.problem_title,
          category: row.problem_category,
          authorType: row.problem_author_type,
          solutionCount: Number(row.problem_solution_count),
        },
        solution: {
          id: row.solution_id,
          text: row.solution_text,
          btScore: Number(row.bt_score),
          comparisonCount: Number(row.sol_comparison_count),
          winCount: Number(row.win_count),
          rank: 1,
        },
        bot: row.bot_id
          ? { id: row.bot_id, name: row.owner_bot_name || row.bot_name, ownerBotName: row.owner_bot_name }
          : { id: '', name: 'Unknown' },
      }));
    });

    return reply.send(results);
  });

  // ===== RISING SOLUTIONS =====
  // Returns solutions that won the most matchups in the last 24 hours
  fastify.get('/rising-solutions', async (request, reply) => {
    const { limit = '3' } = request.query as Record<string, string>;
    const count = Math.min(Number(limit) || 3, 6);
    const cacheKey = `homepage:rising:${count}`;

    const output = await withCacheMutex(cacheKey, 180, async () => {
      // Find solutions with the highest win rates (all-time).
      // Prefers recent activity but always returns results regardless of
      // how long ago the last vote happened — the section stays visible.
      const recentWinners = await db.execute(sql`
        SELECT
          winner_id,
          count(*) as recent_wins,
          count(*)::float / NULLIF(
            (SELECT count(*) FROM comparisons c2
              WHERE (c2.solution_a_id = winner_id OR c2.solution_b_id = winner_id)), 0
          ) as recent_win_rate
        FROM (
          SELECT solution_a_id as winner_id FROM comparisons
          WHERE winner = 'a'
          UNION ALL
          SELECT solution_b_id as winner_id FROM comparisons
          WHERE winner = 'b'
        ) recent_wins
        GROUP BY winner_id
        HAVING count(*) >= 2
        ORDER BY count(*) DESC
        LIMIT ${count}
      `);

      const winnerRows = (recentWinners as { rows?: unknown[] }).rows ?? recentWinners;
      const winnerIds = (winnerRows as Array<{ winner_id: string; recent_wins: number; recent_win_rate: number }>)
        .map(r => r.winner_id);

      // Single joined query for all rising solution details + rank
      let results: Array<Record<string, unknown>> = [];
      if (winnerIds.length > 0) {
        const detailRows = await db.execute(sql`
          SELECT
            s.id AS solution_id, s.text AS solution_text, s.bt_score, s.comparison_count AS sol_comparison_count,
            s.win_count,
            p.id AS problem_id, p.title AS problem_title, p.category AS problem_category,
            p.author_type AS problem_author_type, p.solution_count AS problem_solution_count,
            b.id AS bot_id, b.name AS bot_name, u.bot_name AS owner_bot_name,
            (SELECT count(*) + 1 FROM solutions s2
             WHERE s2.problem_id = s.problem_id AND s2.bt_score > s.bt_score)::int AS rank
          FROM solutions s
          JOIN problems p ON s.problem_id = p.id
          LEFT JOIN bots b ON s.bot_id = b.id
          LEFT JOIN users u ON b.owner_id = u.id
          WHERE s.id = ANY(ARRAY[${sql.join(winnerIds.map(id => sql`${id}::uuid`), sql`, `)}])
            AND p.status IN ('active', 'mature')
        `);
        const rawDetail = (detailRows as { rows?: unknown[] }).rows ?? detailRows;
        results = rawDetail as Array<Record<string, unknown>>;
      }

      // Build a lookup for win rate from the original query
      const winRateMap = new Map(
        (winnerRows as Array<{ winner_id: string; recent_win_rate: number }>)
          .map(r => [r.winner_id, r.recent_win_rate ?? 0])
      );

      return results.map(row => ({
        problem: {
          id: row.problem_id,
          title: row.problem_title,
          category: row.problem_category,
          authorType: row.problem_author_type,
          solutionCount: Number(row.problem_solution_count),
        },
        solution: {
          id: row.solution_id,
          text: row.solution_text,
          btScore: Number(row.bt_score),
          comparisonCount: Number(row.sol_comparison_count),
          winCount: Number(row.win_count),
          rank: Number(row.rank),
        },
        bot: row.bot_id
          ? { id: row.bot_id, name: row.owner_bot_name || row.bot_name, ownerBotName: row.owner_bot_name }
          : { id: '', name: 'Unknown' },
        rising: {
          recentWinRate: Math.round((winRateMap.get(row.solution_id as string) ?? 0) * 100),
        },
      }));
    });

    return reply.send(output);
  });

  // ===== TRENDING PROBLEMS =====
  // Returns problems with the most activity, ranked by a hotness score
  fastify.get('/trending-problems', async (_request, reply) => {
    const results = await withCacheMutex('homepage:trending-problems', 180, async () => {
      const rows = await db.execute(sql`
        SELECT
          p.id,
          p.title,
          p.category,
          p.author_type,
          p.solution_count,
          p.comparison_count,
          p.created_at,
          COALESCE(
            CASE WHEN p.author_type = 'human' THEN hu.username
                 ELSE hb.name
            END,
            'Anonymous'
          ) AS author_name,
          top_bot.bot_name AS top_bot_name
        FROM problems p
        LEFT JOIN users hu ON p.human_author_id = hu.id
        LEFT JOIN bots hb ON p.bot_author_id = hb.id
        LEFT JOIN LATERAL (
          SELECT COALESCE(u.bot_name, b.name) AS bot_name
          FROM solutions s
          JOIN bots b ON s.bot_id = b.id
          LEFT JOIN users u ON b.owner_id = u.id
          WHERE s.problem_id = p.id
          ORDER BY s.bt_score DESC
          LIMIT 1
        ) top_bot ON true
        WHERE p.status IN ('active', 'mature')
          AND p.solution_count >= 1
        ORDER BY
          (p.solution_count * 2 + p.comparison_count)::float
          / power(EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600 + 2, 0.5)
          DESC
        LIMIT 4
      `);

      const rawRows = (rows as { rows?: unknown[] }).rows ?? rows;
      return (rawRows as Array<Record<string, unknown>>).map(row => ({
        id: row.id,
        title: row.title,
        category: row.category,
        authorType: row.author_type,
        authorName: row.author_name ?? 'Anonymous',
        solutionCount: Number(row.solution_count),
        comparisonCount: Number(row.comparison_count),
        createdAt: row.created_at,
        topBotName: row.top_bot_name ?? null,
      }));
    });

    return reply.send(results);
  });
}
