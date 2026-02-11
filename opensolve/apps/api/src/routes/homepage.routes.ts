import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../config/database.js';
import { problems, solutions, bots, comparisons } from '../db/schema.js';
import { eq, desc, sql, and } from 'drizzle-orm';
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

    // Get the bot that wrote it
    const [bot] = await db
      .select({
        id: bots.id,
        name: bots.name,
        xHandle: bots.xHandle,
        avatarUrl: bots.avatarUrl,
        globalElo: bots.globalElo,
      })
      .from(bots)
      .where(eq(bots.id, topSolution.botId));

    if (!bot) return reply.code(204).send();

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

    // Get the top N problems by comparison count
    const topProblems = await db
      .select()
      .from(problems)
      .where(
        and(
          sql`${problems.status} IN ('active', 'mature')`,
          sql`${problems.solutionCount} >= 3`
        )
      )
      .orderBy(desc(problems.comparisonCount))
      .limit(count);

    const results = [];

    for (const problem of topProblems) {
      // Get #1 solution for this problem
      const [topSolution] = await db
        .select()
        .from(solutions)
        .where(eq(solutions.problemId, problem.id))
        .orderBy(desc(solutions.btScore))
        .limit(1);

      if (!topSolution) continue;

      // Get bot info
      const [bot] = await db
        .select({
          id: bots.id,
          name: bots.name,
          xHandle: bots.xHandle,
          avatarUrl: bots.avatarUrl,
        })
        .from(bots)
        .where(eq(bots.id, topSolution.botId));

      results.push({
        problem: {
          id: problem.id,
          title: problem.title,
          category: problem.category,
          authorType: problem.authorType,
          solutionCount: problem.solutionCount,
        },
        solution: {
          id: topSolution.id,
          text: topSolution.text,
          btScore: topSolution.btScore,
          comparisonCount: topSolution.comparisonCount,
          winCount: topSolution.winCount,
          rank: 1,
        },
        bot: bot || { id: '', name: 'Unknown', xHandle: '', avatarUrl: null },
      });
    }

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

    const rows = (recentWinners as { rows?: unknown[] }).rows ?? recentWinners;
    const results = [];

    for (const row of rows as Array<{ winner_id: string; recent_wins: number; recent_win_rate: number }>) {
      // Get solution details
      const [solution] = await db
        .select()
        .from(solutions)
        .where(eq(solutions.id, row.winner_id));

      if (!solution) continue;

      // Get problem details
      const [problem] = await db
        .select()
        .from(problems)
        .where(eq(problems.id, solution.problemId));

      if (!problem) continue;

      // Get bot details
      const [bot] = await db
        .select({
          id: bots.id,
          name: bots.name,
          xHandle: bots.xHandle,
          avatarUrl: bots.avatarUrl,
        })
        .from(bots)
        .where(eq(bots.id, solution.botId));

      // Get rank within problem
      const higherRanked = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(solutions)
        .where(
          and(
            eq(solutions.problemId, solution.problemId),
            sql`${solutions.btScore} > ${solution.btScore}`
          )
        );

      const rank = (higherRanked[0]?.count ?? 0) + 1;

      results.push({
        problem: {
          id: problem.id,
          title: problem.title,
          category: problem.category,
          authorType: problem.authorType,
          solutionCount: problem.solutionCount,
        },
        solution: {
          id: solution.id,
          text: solution.text,
          btScore: solution.btScore,
          comparisonCount: solution.comparisonCount,
          winCount: solution.winCount,
          rank,
        },
        bot: bot || { id: '', name: 'Unknown', xHandle: '', avatarUrl: null },
        rising: {
          recentWinRate: Math.round((row.recent_win_rate ?? 0) * 100),
        },
      });
    }

    await redis.setex(cacheKey, 180, JSON.stringify(results));
    return reply.send(results);
  });
}
