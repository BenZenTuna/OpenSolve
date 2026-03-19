import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { problems, solutions, bots, users } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { redis } from '../config/redis.js';

export async function homepageRoutes(fastify: FastifyInstance) {
  // ===== SOLUTION SPOTLIGHT =====
  // Returns the #1 solution from the most active problem
  fastify.get('/spotlight', async (_request, reply) => {
    const cacheKey = 'homepage:spotlight';
    const cached = await redis.get(cacheKey);
    if (cached) return reply.send(JSON.parse(cached));

    // Find the most active problem (most comparisons, status active or mature)
    const [topProblem] = await db
      .select()
      .from(problems)
      .where(sql`${problems.status} IN ('active', 'mature')`)
      .orderBy(desc(problems.comparisonCount))
      .limit(1);

    if (!topProblem) return reply.code(204).send();

    // Get the #1 ranked solution for that problem
    const [topSolution] = await db
      .select()
      .from(solutions)
      .where(eq(solutions.problemId, topProblem.id))
      .orderBy(desc(solutions.btScore))
      .limit(1);

    if (!topSolution) return reply.code(204).send();

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

    const result = {
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

    await redis.setex(cacheKey, 300, JSON.stringify(result));
    return reply.send(result);
  });

  // ===== TOP SOLUTIONS =====
  // Returns the #1 solution from each of the top N problems (by comparison count)
  fastify.get('/top-solutions', async (request, reply) => {
    const { limit = '6' } = request.query as Record<string, string>;
    const count = Math.min(Number(limit) || 6, 12);

    const cacheKey = `homepage:top-solutions:${count}`;
    const cached = await redis.get(cacheKey);
    if (cached) return reply.send(JSON.parse(cached));

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
    const results = (rawRows as Array<Record<string, unknown>>).map(row => ({
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

    await redis.setex(cacheKey, 300, JSON.stringify(results));
    return reply.send(results);
  });

  // ===== RISING SOLUTIONS =====
  // Returns solutions that won the most matchups in the last 24 hours
  fastify.get('/rising-solutions', async (request, reply) => {
    const { limit = '3' } = request.query as Record<string, string>;
    const count = Math.min(Number(limit) || 3, 6);

    const cacheKey = `homepage:rising:${count}`;
    const cached = await redis.get(cacheKey);
    if (cached) return reply.send(JSON.parse(cached));

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Find solutions with the most wins in last 24h
    const recentWinners = await db.execute(sql`
      SELECT
        winner_id,
        count(*) as recent_wins,
        count(*)::float / NULLIF(
          (SELECT count(*) FROM comparisons c2
            WHERE (c2.solution_a_id = winner_id OR c2.solution_b_id = winner_id)
            AND c2.created_at > ${oneDayAgo}::timestamptz), 0
        ) as recent_win_rate
      FROM (
        SELECT solution_a_id as winner_id FROM comparisons
        WHERE winner = 'a' AND created_at > ${oneDayAgo}::timestamptz
        UNION ALL
        SELECT solution_b_id as winner_id FROM comparisons
        WHERE winner = 'b' AND created_at > ${oneDayAgo}::timestamptz
      ) recent_wins
      GROUP BY winner_id
      HAVING count(*) >= 3
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
        WHERE s.id = ANY(${sql.array(winnerIds, 'uuid')})
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

    const output = results.map(row => ({
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

    await redis.setex(cacheKey, 180, JSON.stringify(output));
    return reply.send(output);
  });
}
