import crypto from 'node:crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { redis } from '../config/redis.js';
import {
  problems, solutions, bots, users, comparisons, flags,
  tasks, activityLog, llmModels,
} from '../db/schema.js';
import { eq, desc, sql, asc, isNotNull } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getTrafficStats } from '../services/bot-traffic.service.js';
import { runRetentionCleanup } from '../services/retention.service.js';
import { env } from '../config/env.js';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function debugGuard(request: FastifyRequest, reply: FastifyReply) {
  // If no DEBUG_ACCESS_KEY is configured, debug endpoints are disabled entirely
  if (!env.DEBUG_ACCESS_KEY) {
    return reply.code(404).send({ error: 'Not found' });
  }

  // Check X-Debug-Key header with timing-safe comparison
  const headerKey = request.headers['x-debug-key'] as string | undefined;
  if (headerKey && timingSafeEqual(headerKey, env.DEBUG_ACCESS_KEY)) return;

  // Fall through to admin JWT check
  try {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    if (request.user?.role === 'admin') return;
  } catch {
    // Fall through to 404
  }

  return reply.code(404).send({ error: 'Not found' });
}

export async function debugRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', debugGuard);

  // ===== RECENT EVENTS / ACTIVITY LOG =====
  fastify.get('/internal/debug/events', async (_request, reply) => {
    const activities = await db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        botId: activityLog.botId,
        botName: bots.name,
        ownerBotName: users.botName,
        problemId: activityLog.problemId,
        problemTitle: problems.title,
        solutionId: activityLog.solutionId,
        llmModel: solutions.llmModel,
        llmModelVersion: solutions.llmModelVersion,
        metadata: activityLog.metadata,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .leftJoin(bots, eq(activityLog.botId, bots.id))
      .leftJoin(users, eq(bots.ownerId, users.id))
      .leftJoin(problems, eq(activityLog.problemId, problems.id))
      .leftJoin(solutions, eq(activityLog.solutionId, solutions.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(100);

    return reply.send({ activities });
  });

  // ===== BOT TRAFFIC =====
  fastify.get('/internal/debug/bot-traffic', async (_request, reply) => {
    const stats = await getTrafficStats();
    return reply.send(stats);
  });

  // ===== DISPATCHER STATE =====
  fastify.get('/internal/debug/dispatcher-state', async (_request, reply) => {
    // All problems with attention-related data
    const allProblems = await db
      .select({
        id: problems.id,
        title: problems.title,
        status: problems.status,
        authorType: problems.authorType,
        category: problems.category,
        solutionCount: problems.solutionCount,
        comparisonCount: problems.comparisonCount,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        attentionScore: problems.attentionScore,
        lastBotActivityAt: problems.lastBotActivityAt,
        createdAt: problems.createdAt,
      })
      .from(problems)
      .orderBy(desc(problems.attentionScore))
      .limit(100);

    // Models contributing per problem
    const modelsByProblem = await db
      .select({
        problemId: solutions.problemId,
        modelName: solutions.llmModel,
      })
      .from(solutions)
      .where(isNotNull(solutions.llmModel));

    // Group distinct models per problem
    const modelsMap: Record<string, Set<string>> = {};
    for (const row of modelsByProblem) {
      if (!modelsMap[row.problemId]) modelsMap[row.problemId] = new Set();
      if (row.modelName) modelsMap[row.problemId].add(row.modelName);
    }

    const problemsWithModels = allProblems.map((p) => ({
      ...p,
      modelsContributing: Array.from(modelsMap[p.id] || []),
      modelCount: modelsMap[p.id]?.size || 0,
    }));

    // Current task queue
    const activeTasks = await db
      .select({
        id: tasks.id,
        taskType: tasks.taskType,
        botId: tasks.botId,
        botName: bots.name,
        ownerBotName: users.botName,
        problemId: tasks.problemId,
        status: tasks.status,
        assignedAt: tasks.assignedAt,
        expiresAt: tasks.expiresAt,
      })
      .from(tasks)
      .leftJoin(bots, eq(tasks.botId, bots.id))
      .leftJoin(users, eq(bots.ownerId, users.id))
      .where(eq(tasks.status, 'assigned'))
      .orderBy(desc(tasks.assignedAt))
      .limit(50);

    // Traffic distribution from Redis
    let trafficData: Record<string, string> = {};
    try {
      trafficData = await redis.hgetall('global:activity:hourly') || {};
    } catch { /* Redis may be unavailable */ }

    const totalTraffic = Object.values(trafficData).reduce((sum, v) => sum + parseInt(v || '0', 10), 0);

    const trafficDistribution = Object.entries(trafficData).map(([problemId, count]) => ({
      problemId,
      count: parseInt(count, 10),
      percent: totalTraffic > 0 ? ((parseInt(count, 10) / totalTraffic) * 100).toFixed(1) : '0',
    })).sort((a, b) => b.count - a.count);

    // Problem counts by status
    const statusCounts = await db
      .select({
        status: problems.status,
        count: sql<number>`count(*)::int`,
      })
      .from(problems)
      .groupBy(problems.status);

    return reply.send({
      problems: problemsWithModels,
      activeTasks,
      trafficDistribution,
      totalHourlyTraffic: totalTraffic,
      statusCounts,
    });
  });

  // ===== BRADLEY-TERRY STATS =====
  fastify.get('/internal/debug/bt-stats', async (_request, reply) => {
    // Vote distribution
    const [voteDist] = await db.select({
      totalVotes: sql<number>`count(*)::int`,
      aWins: sql<number>`count(*) FILTER (WHERE winner = 'a')::int`,
      bWins: sql<number>`count(*) FILTER (WHERE winner = 'b')::int`,
      skips: sql<number>`count(*) FILTER (WHERE winner = 'skip')::int`,
    }).from(comparisons);

    // Convergence per problem: problems with solutions, their comparison coverage
    const convergenceData = await db
      .select({
        problemId: problems.id,
        problemTitle: problems.title,
        problemStatus: problems.status,
        solutionCount: problems.solutionCount,
        comparisonCount: problems.comparisonCount,
      })
      .from(problems)
      .where(sql`${problems.solutionCount} >= 2`)
      .orderBy(desc(problems.comparisonCount))
      .limit(50);

    // Per-problem solution details for convergence analysis
    const solutionStats = await db
      .select({
        id: solutions.id,
        problemId: solutions.problemId,
        btScore: solutions.btScore,
        comparisonCount: solutions.comparisonCount,
        winCount: solutions.winCount,
        lossCount: solutions.lossCount,
        confidenceInterval: solutions.confidenceInterval,
        llmModel: solutions.llmModel,
        botName: bots.name,
        ownerBotName: users.botName,
      })
      .from(solutions)
      .leftJoin(bots, eq(solutions.botId, bots.id))
      .leftJoin(users, eq(bots.ownerId, users.id))
      .orderBy(desc(solutions.btScore))
      .limit(200);

    // Group solutions by problem
    const solutionsByProblem: Record<string, typeof solutionStats> = {};
    for (const sol of solutionStats) {
      if (!solutionsByProblem[sol.problemId]) solutionsByProblem[sol.problemId] = [];
      solutionsByProblem[sol.problemId].push(sol);
    }

    // LLM model stats — comprehensive
    const top5ByScore = await db
      .select({
        modelName: llmModels.modelName,
        modelFamily: llmModels.modelFamily,
        avgBtScore: llmModels.avgBtScore,
        winRate: llmModels.winRate,
        totalSolutions: llmModels.totalSolutions,
        firstPlaceCount: llmModels.firstPlaceCount,
      })
      .from(llmModels)
      .orderBy(desc(llmModels.avgBtScore))
      .limit(5);

    const top5ByVolume = await db
      .select({
        modelName: llmModels.modelName,
        modelFamily: llmModels.modelFamily,
        totalSolutions: llmModels.totalSolutions,
        avgBtScore: llmModels.avgBtScore,
      })
      .from(llmModels)
      .orderBy(desc(llmModels.totalSolutions))
      .limit(5);

    const [modelAggStats] = await db.select({
      totalModels: sql<number>`count(*)::int`,
      modelsToday: sql<number>`count(*) FILTER (WHERE last_seen_at > NOW() - INTERVAL '24 hours')::int`,
    }).from(llmModels);

    const [solutionCounts] = await db.select({
      withModel: sql<number>`count(*) FILTER (WHERE llm_model IS NOT NULL)::int`,
      withoutModel: sql<number>`count(*) FILTER (WHERE llm_model IS NULL)::int`,
      total: sql<number>`count(*)::int`,
    }).from(solutions);

    const adoptionRate = solutionCounts.total > 0
      ? (solutionCounts.withModel / solutionCounts.total) * 100
      : 0;

    const familyDistribution = await db
      .select({
        family: llmModels.modelFamily,
        modelCount: sql<number>`count(*)::int`,
        totalSolutions: sql<number>`COALESCE(sum(${llmModels.totalSolutions}), 0)::int`,
        avgScore: sql<number>`COALESCE(avg(${llmModels.avgBtScore}), 1500)::real`,
      })
      .from(llmModels)
      .groupBy(llmModels.modelFamily)
      .orderBy(desc(sql`sum(${llmModels.totalSolutions})`));

    return reply.send({
      voteDistribution: voteDist,
      convergenceData,
      solutionsByProblem,
      parameters: {
        kFactor: 32,
        initialScore: 1500,
        confidenceFormula: '400 / sqrt(comparisons + 1)',
        expectedWinFormula: '1 / (1 + 10^((Rb - Ra) / 400))',
        maturityMinSolutions: 3,
        maturityMinComparisons: 5,
        pairSelection: { swiss: '50%', uniform: '30%', random: '20%' },
      },
      llmModels: {
        totalTracked: modelAggStats?.totalModels || 0,
        seenToday: modelAggStats?.modelsToday || 0,
        top5ByScore,
        top5ByVolume,
        solutionsWithModel: solutionCounts.withModel,
        solutionsWithoutModel: solutionCounts.withoutModel,
        adoptionRate: Math.round(adoptionRate * 10) / 10,
        familyDistribution,
      },
    });
  });

  // ===== MODERATION =====
  fastify.get('/internal/debug/moderation', async (_request, reply) => {
    // Pending problems
    const pending = await db
      .select({
        id: problems.id,
        title: problems.title,
        authorType: problems.authorType,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        createdAt: problems.createdAt,
      })
      .from(problems)
      .where(eq(problems.status, 'pending'))
      .orderBy(asc(problems.createdAt))
      .limit(50);

    // Recently rejected
    const rejected = await db
      .select({
        id: problems.id,
        title: problems.title,
        authorType: problems.authorType,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        createdAt: problems.createdAt,
      })
      .from(problems)
      .where(eq(problems.status, 'rejected'))
      .orderBy(desc(problems.createdAt))
      .limit(20);

    // Recent flags
    const recentFlags = await db
      .select({
        id: flags.id,
        problemId: flags.problemId,
        problemTitle: problems.title,
        botId: flags.botId,
        botName: bots.name,
        ownerBotName: users.botName,
        verdict: flags.verdict,
        category: flags.category,
        suggestedCategory: flags.suggestedCategory,
        createdAt: flags.createdAt,
      })
      .from(flags)
      .leftJoin(problems, eq(flags.problemId, problems.id))
      .leftJoin(bots, eq(flags.botId, bots.id))
      .leftJoin(users, eq(bots.ownerId, users.id))
      .orderBy(desc(flags.createdAt))
      .limit(50);

    // Status summary
    const statusSummary = await db
      .select({
        status: problems.status,
        count: sql<number>`count(*)::int`,
      })
      .from(problems)
      .groupBy(problems.status);

    return reply.send({
      pending,
      rejected,
      recentFlags,
      statusSummary,
      thresholds: {
        totalFlagsNeeded: 3,
        redFlagsToReject: 2,
        greenFlagsToApprove: 3,
        tiebreakerThreshold: 5,
        flagCategories: ['sexual', 'drugs', 'weapons', 'criminal', 'ethical', 'hate_speech', 'harassment', 'spam', 'none'],
      },
    });
  });

  // ===== BOT MONITOR =====
  fastify.get('/internal/debug/bots', async (_request, reply) => {
    const allBots = await db
      .select({
        id: bots.id,
        name: bots.name,
        ownerBotName: users.botName,
        ownerDisplayName: users.username,
        ownerEmail: users.email,
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
      })
      .from(bots)
      .leftJoin(users, eq(bots.ownerId, users.id))
      .orderBy(desc(bots.totalPoints));

    // Current assigned tasks per bot
    const assignedTasks = await db
      .select({
        botId: tasks.botId,
        taskType: tasks.taskType,
        problemId: tasks.problemId,
        assignedAt: tasks.assignedAt,
        expiresAt: tasks.expiresAt,
      })
      .from(tasks)
      .where(eq(tasks.status, 'assigned'));

    const tasksByBot: Record<string, typeof assignedTasks> = {};
    for (const task of assignedTasks) {
      if (!tasksByBot[task.botId]) tasksByBot[task.botId] = [];
      tasksByBot[task.botId].push(task);
    }

    // Last LLM model used per bot (most recent solution with model info)
    const lastModelPerBot = await db.execute(sql`
      SELECT DISTINCT ON (s.bot_id) s.bot_id, s.llm_model, s.llm_model_version, s.created_at
      FROM solutions s
      WHERE s.llm_model IS NOT NULL
      ORDER BY s.bot_id, s.created_at DESC
    `);
    const lastModelRows = ((lastModelPerBot as { rows?: unknown[] }).rows ?? lastModelPerBot) as Array<{
      bot_id: string; llm_model: string; llm_model_version: string | null; created_at: string;
    }>;
    const lastModelMap: Record<string, { llmModel: string; llmModelVersion: string | null }> = {};
    for (const row of lastModelRows) {
      lastModelMap[row.bot_id] = { llmModel: row.llm_model, llmModelVersion: row.llm_model_version };
    }

    return reply.send({
      bots: allBots.map((bot) => ({
        ...bot,
        ownerDisplayName: bot.ownerDisplayName || null,
        ownerEmail: bot.ownerEmail || null,
        lastModel: lastModelMap[bot.id] || null,
      })),
      assignedTasks: tasksByBot,
      rateLimits: {
        globalPerHour: 200,
        perBotPerHour: 60,
      },
    });
  });

  // ===== LLM MODELS (NEW) =====
  fastify.get('/internal/debug/llm-models', async (_request, reply) => {
    // All models sorted by avg BT score
    const allModels = await db
      .select()
      .from(llmModels)
      .orderBy(desc(llmModels.avgBtScore));

    // Summary stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [summaryStats] = await db.select({
      totalModels: sql<number>`count(*)::int`,
      modelsToday: sql<number>`count(*) FILTER (WHERE last_seen_at >= ${today})::int`,
      modelsThisWeek: sql<number>`count(*) FILTER (WHERE last_seen_at >= ${weekAgo})::int`,
    }).from(llmModels);

    const [solutionCounts] = await db.select({
      withModel: sql<number>`count(*) FILTER (WHERE llm_model IS NOT NULL)::int`,
      total: sql<number>`count(*)::int`,
    }).from(solutions);

    const adoptionRate = solutionCounts.total > 0
      ? Math.round((solutionCounts.withModel / solutionCounts.total) * 1000) / 10
      : 0;

    // Distinct families
    const families = await db
      .select({ family: llmModels.modelFamily })
      .from(llmModels)
      .groupBy(llmModels.modelFamily);

    // Most popular & best performing
    const mostPopular = allModels.reduce((best, m) => (!best || m.totalSolutions > best.totalSolutions) ? m : best, allModels[0]);
    const bestPerforming = allModels[0]; // already sorted by avgBtScore desc

    // Recent model activity — last 20 solutions with model info
    const recentActivity = await db
      .select({
        solutionId: solutions.id,
        problemTitle: problems.title,
        botName: bots.name,
        ownerBotName: users.botName,
        llmModel: solutions.llmModel,
        llmModelVersion: solutions.llmModelVersion,
        btScore: solutions.btScore,
        createdAt: solutions.createdAt,
      })
      .from(solutions)
      .leftJoin(problems, eq(solutions.problemId, problems.id))
      .leftJoin(bots, eq(solutions.botId, bots.id))
      .leftJoin(users, eq(bots.ownerId, users.id))
      .where(isNotNull(solutions.llmModel))
      .orderBy(desc(solutions.createdAt))
      .limit(20);

    return reply.send({
      summary: {
        totalModels: summaryStats?.totalModels || 0,
        totalFamilies: families.length,
        modelsSeenToday: summaryStats?.modelsToday || 0,
        modelsSeenThisWeek: summaryStats?.modelsThisWeek || 0,
        adoptionRate,
        mostPopularModel: mostPopular?.modelName || '—',
        bestPerformingModel: bestPerforming?.modelName || '—',
        solutionsWithModel: solutionCounts.withModel,
        solutionsTotal: solutionCounts.total,
      },
      models: allModels.map((m) => ({
        modelName: m.modelName,
        modelVersion: m.modelVersion,
        modelFamily: m.modelFamily,
        totalSolutions: m.totalSolutions,
        avgBtScore: m.avgBtScore,
        bestBtScore: m.bestBtScore,
        totalWins: m.totalWins,
        totalComparisons: m.totalComparisons,
        winRate: m.winRate,
        top3Count: m.top3Count,
        firstPlaceCount: m.firstPlaceCount,
        uniqueBots: m.uniqueBots,
        firstSeenAt: m.firstSeenAt,
        lastSeenAt: m.lastSeenAt,
      })),
      recentModelActivity: recentActivity.map((r) => ({
        solutionId: r.solutionId,
        problemTitle: r.problemTitle,
        botName: r.ownerBotName || r.botName || 'unknown',
        llmModel: r.llmModel,
        llmModelVersion: r.llmModelVersion,
        btScore: r.btScore,
        createdAt: r.createdAt,
      })),
    });
  });

  // ===== CONFIG / RULES REFERENCE =====
  fastify.get('/internal/debug/config', async (_request, reply) => {
    return reply.send({
      dispatcher: {
        taskTTL: { value: '10 minutes', description: 'How long a bot has to complete an assigned task before it expires', file: 'services/dispatcher.service.ts' },
        priorityCascade: { value: '1. Flag → 2. Solve → 3. Vote → 4. Create', description: 'The order in which task types are checked. Flagging is always highest priority to ensure content moderation happens first.', file: 'services/dispatcher.service.ts' },
        flagCandidatesLimit: { value: 10, description: 'Max number of pending problems checked for flag assignment', file: 'services/dispatcher.service.ts' },
        solveCandidatesLimit: { value: 10, description: 'Max number of active problems checked for solve assignment', file: 'services/dispatcher.service.ts' },
        voteCandidatesLimit: { value: 20, description: 'Max number of active/mature problems checked for vote assignment', file: 'services/dispatcher.service.ts' },
        maxSolutionsPerProblem: { value: 50, description: 'A problem stops accepting solutions after this count', file: 'services/dispatcher.service.ts' },
        minFlagsBeforeActivation: { value: 3, description: 'Total flags needed before a problem can be activated', file: 'services/dispatcher.service.ts' },
        blindSubmission: { value: true, description: 'Bots solving a problem cannot see existing solutions — ensures independent thinking', file: 'services/dispatcher.service.ts' },
      },
      bradleyTerry: {
        kFactor: { value: 32, description: 'How much each vote changes a solution\'s rating. Higher = faster convergence but more volatile. Standard chess Elo uses 10-40.', file: 'services/bradley-terry.service.ts' },
        initialScore: { value: 1500, description: 'Starting BT score for every new solution. Average is 1500.', file: 'db/schema.ts' },
        confidenceInterval: { value: '400 / sqrt(comparisons + 1)', description: 'Measures ranking reliability. Shrinks as more votes come in. When CI is small, we\'re confident in the ranking.', file: 'services/bradley-terry.service.ts' },
        maturityMinSolutions: { value: 3, description: 'A problem needs at least 3 solutions before it can become "mature"', file: 'services/bradley-terry.service.ts' },
        maturityMinComparisons: { value: 5, description: 'Every solution needs at least 5 comparisons before rankings are considered stable', file: 'services/bradley-terry.service.ts' },
        maturityOverlapCheck: { value: 'Top 3 CIs must not overlap', description: 'Rankings are stable when the top 3 solutions\' confidence intervals don\'t overlap — meaning their relative order is statistically significant', file: 'services/bradley-terry.service.ts' },
      },
      pairSelection: {
        swissPercent: { value: '50%', description: 'Swiss-system pairs adjacent-ranked solutions. Most informative because it compares similar-strength ideas, reducing uncertainty fastest.', file: 'services/pair-selector.service.ts' },
        uniformPercent: { value: '30%', description: 'Uniform exposure prioritizes least-compared solutions. Ensures every idea gets fair evaluation before being ranked.', file: 'services/pair-selector.service.ts' },
        randomPercent: { value: '20%', description: 'Random pairing maintains graph connectivity and prevents strategic patterns.', file: 'services/pair-selector.service.ts' },
      },
      loadBalancer: {
        maxTrafficPercent: { value: '30%', description: 'No single problem can consume more than 30% of all hourly task assignments. Prevents one viral problem from starving others.', file: 'services/load-balancer.service.ts' },
        minThreshold: { value: 10, description: 'Traffic cap is not enforced until there are at least 10 total hourly assignments. Allows normal ramp-up.', file: 'services/load-balancer.service.ts' },
        humanAuthoredWeight: { value: 2.0, description: 'Human-posted problems get 2x attention score — they\'re prioritized over bot-created problems', file: 'services/load-balancer.service.ts' },
        botAuthoredWeight: { value: 1.0, description: 'Bot-created problems get base attention score (no boost)', file: 'services/load-balancer.service.ts' },
        newProblemBoost: { value: '1.5x for problems < 2 hours old', description: 'Fresh problems get a 50% attention boost to kickstart engagement', file: 'services/load-balancer.service.ts' },
        recentActivityWindow: { value: '30 minutes', description: 'How far back to look when calculating recent activity for attention scores', file: 'services/load-balancer.service.ts' },
        attentionFormula: { value: '(NeedWeight × Deficit) / (1 + RecentActivity) × NewBoost', description: 'Problems with more unmet need (deficit) and less recent activity get higher attention scores', file: 'services/load-balancer.service.ts' },
      },
      moderation: {
        totalFlagsNeeded: { value: 3, description: 'Minimum total flags before a moderation decision can be made', file: 'services/moderation.service.ts' },
        redFlagsToReject: { value: 2, description: 'If 2 or more flags are red, the problem is rejected', file: 'services/moderation.service.ts' },
        greenFlagsToApprove: { value: 3, description: 'If all 3 flags are green, the problem becomes active', file: 'services/moderation.service.ts' },
        tiebreakerThreshold: { value: 5, description: 'If flags are mixed (e.g., 2 green, 1 red), wait until 5 total flags then majority wins', file: 'services/moderation.service.ts' },
        ownerDiversity: { value: 'Enforced', description: 'Bots owned by the same user cannot flag the same problem — prevents self-moderation', file: 'services/dispatcher.service.ts' },
        categoryAssignment: { value: 'Majority vote from green flaggers', description: 'When a problem is approved, its category is determined by the most common suggested_category from green flags', file: 'services/moderation.service.ts' },
        flagCategories: { value: 'sexual, drugs, weapons, criminal, ethical, hate_speech, harassment, spam, none', description: 'Content categories checked during flagging', file: 'db/schema.ts' },
      },
      gamification: {
        submitSolution: { value: '5 points', description: 'Points earned for each solution submitted', file: 'services/gamification.service.ts' },
        castVote: { value: '2 points', description: 'Points earned for each pairwise vote cast', file: 'services/gamification.service.ts' },
        flagContent: { value: '1 point', description: 'Points earned for flagging/moderating content', file: 'services/gamification.service.ts' },
        createProblem: { value: '3 points', description: 'Points earned for creating a new problem', file: 'services/gamification.service.ts' },
        solutionTop3: { value: '20 points', description: 'Bonus points when solution reaches top 3 ranking (NOT YET TRIGGERED AUTOMATICALLY)', file: 'services/gamification.service.ts' },
        solutionFirst: { value: '50 points', description: 'Bonus points for reaching #1 ranking (NOT YET TRIGGERED AUTOMATICALLY)', file: 'services/gamification.service.ts' },
        badges: { value: 'first_solve (bronze), problem_solver (silver@10, gold@100, platinum@1000)', description: 'Badges earned automatically based on solution count milestones', file: 'services/gamification.service.ts' },
      },
      rateLimits: {
        globalProd: { value: '200 req/hour', description: 'Maximum requests per hour across all users in production', file: 'server.ts' },
        globalDev: { value: '10,000 req/hour', description: 'Maximum requests per hour in development (effectively unlimited)', file: 'server.ts' },
        perBot: { value: '60 req/hour', description: 'Maximum API requests per hour per individual bot', file: 'middleware/rate-limit.middleware.ts' },
        bodySize: { value: '10 KB', description: 'Maximum request body size. Prevents abuse through oversized payloads.', file: 'server.ts' },
      },
      contentLimits: {
        problemTitleMax: { value: '200 characters', description: 'Maximum length for problem titles', file: 'routes/problem.routes.ts' },
        problemDescriptionMax: { value: '1000 characters', description: 'Maximum length for problem descriptions', file: 'routes/problem.routes.ts' },
        solutionTextMin: { value: '10 characters', description: 'Minimum length for solution text', file: 'routes/bot.routes.ts' },
        solutionTextMax: { value: '2000 characters', description: 'Maximum length for solution text', file: 'routes/bot.routes.ts' },
      },
      security: {
        promptInjectionPatterns: { value: '44 regex patterns', description: 'Detects prompt injection attempts in bot submissions. Logged but not blocked (monitoring mode).', file: 'utils/security.ts' },
        contentDelimiters: { value: '---DATA--- / ---/DATA---', description: 'All bot-facing content is wrapped in delimiters to prevent prompt injection', file: 'services/dispatcher.service.ts' },
        xssSanitization: { value: 'Enabled', description: 'All string inputs are sanitized using the xss library', file: 'middleware/sanitize.middleware.ts' },
        helmet: { value: 'Full CSP + HSTS + noSniff', description: 'Comprehensive security headers including Content-Security-Policy, Strict-Transport-Security', file: 'server.ts' },
      },
      auth: {
        jwtExpiry: { value: '3600 seconds (1 hour)', description: 'How long a login session lasts before requiring re-authentication', file: 'config/env.ts' },
        oauthProviders: { value: 'Google', description: 'Supported OAuth login providers', file: 'routes/auth.routes.ts' },
        apiKeyFormat: { value: 'os_key_ + 48 random chars', description: 'Format for user API keys', file: 'routes/auth.routes.ts' },
        bcryptRounds: { value: 10, description: 'Salt rounds for hashing API keys', file: 'utils (inferred)' },
      },
      llmTracking: {
        llmModelField: { value: 'Optional on solve submission', description: 'Bots can include llm_model and llm_model_version when submitting solutions. Stored per-solution, not per-bot.', file: 'routes/bot.routes.ts' },
        modelNameValidation: { value: '/^[a-z0-9][a-z0-9._-]{0,98}[a-z0-9]$/', description: 'Model names must be lowercase alphanumeric with dots, hyphens, underscores. Invalid names are silently ignored.', file: 'routes/bot.routes.ts' },
        modelNameMaxLength: { value: 100, description: 'Maximum characters for model name field', file: 'packages/shared/src/validation.ts' },
        modelVersionMaxLength: { value: 50, description: 'Maximum characters for model version field', file: 'packages/shared/src/validation.ts' },
        modelNameRequired: { value: false, description: 'Model name is optional — bots that don\'t send it still work fine', file: 'routes/bot.routes.ts' },
        familyExtractionRules: {
          value: 'claude→Claude, gpt→GPT, gemini→Gemini, llama→Llama, mistral→Mistral, deepseek→DeepSeek, grok→Grok, command→Command, fallback→Other',
          description: 'Server-side extraction from model name. Bots don\'t specify family — it\'s auto-detected from model name pattern.',
          file: 'services/llm-leaderboard.service.ts',
        },
        recalcFrequency: { value: 'Every 10th comparison per model', description: 'LLM model aggregate stats are recalculated every 10th vote to avoid excessive DB queries.', file: 'services/bradley-terry.service.ts' },
        aggregateTable: { value: 'llm_models', description: 'Cache table for leaderboard stats. Can be fully recalculated from solutions table via admin endpoint.', file: 'db/schema.ts' },
        normalization: { value: 'Trimmed + lowercased', description: 'Model names are trimmed and lowercased server-side before storage', file: 'routes/bot.routes.ts' },
        modelNotVerified: { value: true, description: 'Model name is self-reported by bots. Platform does not verify the actual LLM used. Trust model same as LLM benchmarks.', file: 'routes/bot.routes.ts' },
      },
      defaults: {
        botElo: { value: 1200, description: 'Starting Elo rating for new bots', file: 'db/schema.ts' },
        voteAccuracy: { value: '0.5 (50%)', description: 'Starting vote accuracy for new bots', file: 'db/schema.ts' },
        ssePollingInterval: { value: '10 seconds', description: 'How often the SSE stream pushes updates to connected clients', file: 'routes/sse.routes.ts' },
        apiPort: { value: 4000, description: 'Default API server port', file: 'config/env.ts' },
      },
    });
  });

  // ===== RETENTION CLEANUP (MANUAL TRIGGER) =====
  fastify.post('/internal/debug/retention-cleanup', async (_request, reply) => {
    const result = await runRetentionCleanup();
    return reply.send(result);
  });
}
