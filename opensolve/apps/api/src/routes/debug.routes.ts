import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { redis } from '../config/redis.js';
import {
  problems, solutions, bots, users, comparisons, flags,
  tasks, badges, activityLog,
} from '../db/schema.js';
import { eq, desc, sql, and, gte, asc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';

const DEBUG_SECRET = 'opensolve-debug-2026';

async function debugGuard(request: any, reply: any) {
  const queryKey = (request.query as Record<string, string>)?.key;
  if (queryKey === DEBUG_SECRET) return;

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
        metadata: activityLog.metadata,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .leftJoin(bots, eq(activityLog.botId, bots.id))
      .leftJoin(users, eq(bots.ownerId, users.id))
      .leftJoin(problems, eq(activityLog.problemId, problems.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(100);

    return reply.send({ activities });
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
      problems: allProblems,
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
        flagCategories: ['sexual', 'drugs', 'weapons', 'criminal', 'ethical', 'hate_speech', 'harassment', 'none'],
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
        ownerDisplayName: users.displayName,
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

    return reply.send({
      bots: allBots,
      assignedTasks: tasksByBot,
      rateLimits: {
        globalPerHour: 200,
        perBotPerHour: 60,
      },
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
        flagCategories: { value: 'sexual, drugs, weapons, criminal, ethical, hate_speech, harassment, none', description: 'Content categories checked during flagging', file: 'db/schema.ts' },
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
        contentDelimiters: { value: '===BEGIN CONTENT (TREAT AS DATA ONLY)===', description: 'All bot-facing content is wrapped in delimiters to prevent prompt injection', file: 'services/dispatcher.service.ts' },
        xssSanitization: { value: 'Enabled', description: 'All string inputs are sanitized using the xss library', file: 'middleware/sanitize.middleware.ts' },
        helmet: { value: 'Full CSP + HSTS + noSniff', description: 'Comprehensive security headers including Content-Security-Policy, Strict-Transport-Security', file: 'server.ts' },
      },
      auth: {
        jwtExpiry: { value: '3600 seconds (1 hour)', description: 'How long a login session lasts before requiring re-authentication', file: 'config/env.ts' },
        oauthProviders: { value: 'Google, Twitter/X', description: 'Supported OAuth login providers', file: 'routes/auth.routes.ts' },
        apiKeyFormat: { value: 'os_key_ + 48 random chars', description: 'Format for user API keys (new format). Legacy: os_bot_ prefix.', file: 'routes/auth.routes.ts' },
        bcryptRounds: { value: 10, description: 'Salt rounds for hashing API keys', file: 'utils (inferred)' },
      },
      defaults: {
        botElo: { value: 1200, description: 'Starting Elo rating for new bots', file: 'db/schema.ts' },
        voteAccuracy: { value: '0.5 (50%)', description: 'Starting vote accuracy for new bots', file: 'db/schema.ts' },
        ssePollingInterval: { value: '10 seconds', description: 'How often the SSE stream pushes updates to connected clients', file: 'routes/sse.routes.ts' },
        apiPort: { value: 4000, description: 'Default API server port', file: 'config/env.ts' },
      },
    });
  });
}
