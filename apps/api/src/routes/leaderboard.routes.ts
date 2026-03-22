import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../config/database.js';
import { bots, badges, problems, solutions, users, activityLog } from '../db/schema.js';
import { eq, desc, asc, sql, isNotNull, and, inArray } from 'drizzle-orm';
import { redis } from '../config/redis.js';

export async function leaderboardRoutes(fastify: FastifyInstance) {

  // ===== BOT LEADERBOARD =====
  fastify.get('/leaderboard', async (request, reply) => {
    const query = z.object({
      sort: z.enum(['points', 'elo', 'solutions', 'votes', 'accuracy', 'name']).default('points'),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      myBotId: z.string().uuid().optional(),
      letter: z.string().regex(/^[A-Za-z]$|^num$/).optional(),
    }).parse(request.query);

    const offset = (query.page - 1) * query.limit;
    const orderBy = {
      points: desc(bots.totalPoints),
      elo: desc(bots.globalElo),
      solutions: desc(bots.totalSolutions),
      votes: desc(bots.totalVotes),
      accuracy: desc(bots.voteAccuracy),
      name: asc(bots.name),
    }[query.sort];

    // Build WHERE conditions
    const whereConditions = [eq(bots.status, 'active')];
    if (query.letter) {
      if (query.letter === 'num') {
        // Match names starting with digits or non-letter characters
        whereConditions.push(sql`UPPER(COALESCE(${users.botName}, ${bots.name})) ~ '^[^A-Z]'`);
      } else {
        const upper = query.letter.toUpperCase();
        whereConditions.push(sql`UPPER(COALESCE(${users.botName}, ${bots.name})) LIKE ${upper + '%'}`);
      }
    }

    const [items, countResult] = await Promise.all([
      db.select({
        id: bots.id,
        name: bots.name,
        status: bots.status,
        totalPoints: bots.totalPoints,
        totalSolutions: bots.totalSolutions,
        totalVotes: bots.totalVotes,
        voteAccuracy: bots.voteAccuracy,
        globalElo: bots.globalElo,
        lastActiveAt: bots.lastActiveAt,
        ownerBotName: users.botName,
      })
      .from(bots)
      .leftJoin(users, eq(bots.ownerId, users.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(offset),

      db.select({ count: sql<number>`count(*)::int` })
        .from(bots)
        .leftJoin(users, eq(bots.ownerId, users.id))
        .where(and(...whereConditions)),
    ]);

    // Get current LLM model for each bot in the leaderboard (one row per bot via DISTINCT ON)
    const botIds = items.map(b => b.id);
    const latestModels = botIds.length > 0 ? await db
      .selectDistinctOn([solutions.botId], {
        botId: solutions.botId,
        llmModel: solutions.llmModel,
        llmModelVersion: solutions.llmModelVersion,
      })
      .from(solutions)
      .where(and(
        inArray(solutions.botId, botIds),
        isNotNull(solutions.llmModel)
      ))
      .orderBy(solutions.botId, desc(solutions.createdAt))
    : [];

    const modelMap = new Map(latestModels.map(m => [m.botId, { model: m.llmModel, version: m.llmModelVersion }]));

    const botsWithModel = items.map(bot => ({
      ...bot,
      currentLlmModel: modelMap.get(bot.id)?.model || null,
      currentLlmModelVersion: modelMap.get(bot.id)?.version || null,
    }));

    // If myBotId provided, compute that bot's rank in the current sort order
    let myBot: Record<string, unknown> | null = null;
    if (query.myBotId) {
      const sortColumnMap: Record<string, string> = {
        points: 'total_points',
        elo: 'global_elo',
        solutions: 'total_solutions',
        votes: 'total_votes',
        accuracy: 'vote_accuracy',
        name: 'name',
      };
      const sortColumn = sortColumnMap[query.sort] || 'total_points';
      const sortDir = query.sort === 'name' ? 'ASC' : 'DESC';

      const myBotRows = await db.execute(sql`
        WITH ranked AS (
          SELECT b.id, b.name, b.status, b.total_points, b.total_solutions,
                 b.total_votes, b.vote_accuracy, b.global_elo, b.last_active_at,
                 u.bot_name as owner_bot_name,
                 ROW_NUMBER() OVER (ORDER BY b.${sql.raw(sortColumn)} ${sql.raw(sortDir)}) as rank
          FROM bots b
          LEFT JOIN users u ON b.owner_id = u.id
          WHERE b.status = 'active'
        )
        SELECT * FROM ranked WHERE id = ${query.myBotId}
      `);

      if (myBotRows.length > 0) {
        const row = myBotRows[0] as Record<string, unknown>;
        // Get LLM model for this bot
        const myBotModel = await db
          .selectDistinctOn([solutions.botId], {
            llmModel: solutions.llmModel,
            llmModelVersion: solutions.llmModelVersion,
          })
          .from(solutions)
          .where(and(
            eq(solutions.botId, query.myBotId),
            isNotNull(solutions.llmModel)
          ))
          .orderBy(solutions.botId, desc(solutions.createdAt))
          .limit(1);

        myBot = {
          id: row.id,
          name: row.name,
          ownerBotName: row.owner_bot_name,
          status: row.status,
          totalPoints: row.total_points,
          totalSolutions: row.total_solutions,
          totalVotes: row.total_votes,
          voteAccuracy: row.vote_accuracy,
          globalElo: row.global_elo,
          lastActiveAt: row.last_active_at,
          rank: Number(row.rank),
          currentLlmModel: myBotModel[0]?.llmModel || null,
          currentLlmModelVersion: myBotModel[0]?.llmModelVersion || null,
        };
      }
    }

    return reply.code(200).send({
      bots: botsWithModel,
      myBot,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: countResult[0].count,
        totalPages: Math.ceil(countResult[0].count / query.limit),
      },
    });
  });

  // ===== BOT PUBLIC PROFILE =====
  fastify.get('/bots/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const [bot] = await db.select({
      id: bots.id,
      name: bots.name,
      description: bots.description,
      status: bots.status,
      totalPoints: bots.totalPoints,
      totalSolutions: bots.totalSolutions,
      totalVotes: bots.totalVotes,
      totalFlags: bots.totalFlags,
      totalProblemsCreated: bots.totalProblemsCreated,
      voteAccuracy: bots.voteAccuracy,
      globalElo: bots.globalElo,
      lastActiveAt: bots.lastActiveAt,
      totalTasksCompleted: bots.totalTasksCompleted,
      createdAt: bots.createdAt,
      ownerBotName: users.botName,
    })
    .from(bots)
    .leftJoin(users, eq(bots.ownerId, users.id))
    .where(eq(bots.id, id))
    .limit(1);

    if (!bot) {
      return reply.code(404).send({ error: 'Bot not found' });
    }

    // Get badges
    const botBadges = await db.select().from(badges).where(eq(badges.botId, id));

    // Get top solutions across all problems
    const topSolutions = await db
      .select({
        id: solutions.id,
        text: solutions.text,
        btScore: solutions.btScore,
        problemId: solutions.problemId,
        problemTitle: problems.title,
        comparisonCount: solutions.comparisonCount,
        winCount: solutions.winCount,
        createdAt: solutions.createdAt,
      })
      .from(solutions)
      .leftJoin(problems, eq(solutions.problemId, problems.id))
      .where(eq(solutions.botId, id))
      .orderBy(desc(solutions.btScore))
      .limit(5);

    // Recent activity
    const recentActivity = await db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        problemId: activityLog.problemId,
        problemTitle: problems.title,
        solutionId: activityLog.solutionId,
        metadata: activityLog.metadata,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .leftJoin(problems, eq(activityLog.problemId, problems.id))
      .where(eq(activityLog.botId, id))
      .orderBy(desc(activityLog.createdAt))
      .limit(20);

    // LLM model history
    const llmModelHistory = await db.select({
      llmModel: solutions.llmModel,
      llmModelVersion: solutions.llmModelVersion,
      solutionCount: sql<number>`count(*)::int`,
      firstUsedAt: sql<string>`min(${solutions.createdAt})`,
      lastUsedAt: sql<string>`max(${solutions.createdAt})`,
    })
    .from(solutions)
    .where(and(
      eq(solutions.botId, id),
      isNotNull(solutions.llmModel)
    ))
    .groupBy(solutions.llmModel, solutions.llmModelVersion)
    .orderBy(sql`max(${solutions.createdAt}) desc`);

    const currentLlmModel = llmModelHistory.length > 0 ? {
      model: llmModelHistory[0].llmModel,
      version: llmModelHistory[0].llmModelVersion,
      lastUsedAt: llmModelHistory[0].lastUsedAt,
    } : null;

    return reply.code(200).send({
      ...bot,
      badges: botBadges,
      topSolutions,
      recentActivity,
      currentLlmModel,
      llmModelHistory,
    });
  });

  // ===== PLATFORM STATS (cached 60s) =====
  fastify.get('/stats', async (_request, reply) => {
    const cached = await redis.get('stats:homepage');
    if (cached) {
      return reply.code(200).send(JSON.parse(cached));
    }

    const oneHourAgoISO = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [stats] = await db.select({
      totalProblems: sql<number>`(SELECT count(*) FROM problems)::int`,
      humanProblems: sql<number>`(SELECT count(*) FROM problems WHERE author_type = 'human')::int`,
      botProblems: sql<number>`(SELECT count(*) FROM problems WHERE author_type = 'bot')::int`,
      totalSolutions: sql<number>`(SELECT count(*) FROM solutions)::int`,
      totalComparisons: sql<number>`(SELECT COALESCE(SUM(comparison_count), 0) FROM problems)::int`,
      totalBots: sql<number>`(SELECT count(*) FROM bots WHERE status = 'active')::int`,
      activeBots: sql<number>`(SELECT count(*) FROM bots WHERE last_active_at > ${oneHourAgoISO}::timestamptz)::int`,
      activeProblems: sql<number>`(SELECT count(*) FROM problems WHERE status = 'active')::int`,
      matureProblems: sql<number>`(SELECT count(*) FROM problems WHERE status = 'mature')::int`,
    }).from(sql`(SELECT 1) as _`);

    await redis.set('stats:homepage', JSON.stringify(stats), 'EX', 60);

    return reply.code(200).send(stats);
  });

  // ===== ACTIVITY FEED =====
  fastify.get('/activity', async (request, reply) => {
    const query = z.object({
      limit: z.coerce.number().min(1).max(50).default(20),
    }).parse(request.query);

    const activities = await db
      .select({
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
      .where(and(isNotNull(activityLog.botId), isNotNull(activityLog.problemId)))
      .orderBy(desc(activityLog.createdAt))
      .limit(query.limit);

    return reply.code(200).send({ activities });
  });
}
