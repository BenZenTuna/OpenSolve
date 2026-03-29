import { db } from '../config/database.js';
import { redis } from '../config/redis.js';
import { problems, solutions, flags, bots, tasks } from '../db/schema.js';
import { eq, and, lt, sql, desc, asc, inArray } from 'drizzle-orm';
import { PairSelectorService } from './pair-selector.service.js';
import { LoadBalancerService } from './load-balancer.service.js';
import { CATEGORIES, Category } from '@opensolve/shared/categories.js';
import {
  VOTE_INSTRUCTION, VOTE_INSTRUCTION_BRIEF,
  FLAG_INSTRUCTION, FLAG_INSTRUCTION_BRIEF,
  SOLVE_INSTRUCTION, SOLVE_INSTRUCTION_BRIEF,
  CREATE_INSTRUCTION, CREATE_INSTRUCTION_BRIEF,
  LIMITS,
} from '@opensolve/shared';

interface Bot {
  id: string;
  ownerId: string;
}

interface TaskResult {
  taskType: 'flag' | 'solve' | 'vote' | 'create';
  taskId: string;
  payload: Record<string, unknown>;
}

export class DispatcherService {
  private pairSelector: PairSelectorService;
  private loadBalancer: LoadBalancerService;

  constructor() {
    this.pairSelector = new PairSelectorService();
    this.loadBalancer = new LoadBalancerService();
  }

  async getNextTask(bot: Bot, instructMode: 'full' | 'brief' | 'none' = 'full', categoriesMode: string = 'full'): Promise<TaskResult | null> {
    // Task expiry now handled by a 30s interval sweep in server.ts

    // Check if bot already has an active task
    const existingTask = await this.getActiveTask(bot.id);
    if (existingTask) return existingTask;

    // Fast-path: skip flag step if no pending problems exist
    const pendingCount = await redis.get('dispatch:pending_problems');
    if (pendingCount === null || parseInt(pendingCount) > 0) {
      const flagTask = await this.tryAssignFlagTask(bot, instructMode, categoriesMode);
      if (flagTask) return flagTask;
    }

    // Fast-path: skip solve step if no active problems exist
    const activeCount = await redis.get('dispatch:active_problems');
    if (activeCount === null || parseInt(activeCount) > 0) {
      const solveTask = await this.tryAssignSolveTask(bot, instructMode);
      if (solveTask) return solveTask;
    }

    // Fast-path: skip vote step if no votable problems exist
    const votableCount = await redis.get('dispatch:votable_problems');
    if (votableCount === null || parseInt(votableCount) > 0) {
      const voteTask = await this.tryAssignVoteTask(bot, instructMode);
      if (voteTask) return voteTask;
    }

    // Priority 4: Problem creation (always available)
    const createTask = await this.tryAssignCreateTask(bot, instructMode, categoriesMode);
    if (createTask) return createTask;

    return null;
  }

  private async tryAssignFlagTask(bot: Bot, instructMode: 'full' | 'brief' | 'none', categoriesMode: string): Promise<TaskResult | null> {
    // Parallel: bot's flagged problems + same-owner bot IDs (cached in Redis)
    const [botFlaggedProblems, sameOwnerBotIds] = await Promise.all([
      db.select({ problemId: flags.problemId }).from(flags).where(eq(flags.botId, bot.id)),
      this.getSameOwnerBotIds(bot.ownerId),
    ]);

    const flaggedIds = new Set(botFlaggedProblems.map(f => f.problemId));

    // Find pending problems with fewer than 3 flags, skip poison problems
    const candidates = await db
      .select()
      .from(problems)
      .where(
        and(
          eq(problems.status, 'pending'),
          sql`${problems.greenFlags} + ${problems.redFlags} < 3`,
          lt(problems.failedFlagAttempts, 5)
        )
      )
      .orderBy(asc(sql`CASE WHEN ${problems.authorType} = 'human' THEN 0 ELSE 1 END`), asc(problems.createdAt))
      .limit(15);

    // Batch-fetch flags for all candidates (eliminates N+1 per-iteration query)
    const candidateIds = candidates.map(p => p.id);
    const allCandidateFlags = candidateIds.length > 0
      ? await db
          .select({ problemId: flags.problemId, botId: flags.botId })
          .from(flags)
          .where(inArray(flags.problemId, candidateIds))
      : [];

    const flagsByProblem = new Map<string, string[]>();
    for (const f of allCandidateFlags) {
      if (!f.botId) continue;
      const list = flagsByProblem.get(f.problemId) ?? [];
      list.push(f.botId);
      flagsByProblem.set(f.problemId, list);
    }

    for (const problem of candidates) {
      // Skip if this bot already flagged it
      if (flaggedIds.has(problem.id)) continue;

      // Check that no same-owner bot has flagged it
      const problemFlagBotIds = flagsByProblem.get(problem.id) ?? [];
      const hasSameOwner = problemFlagBotIds.some(botId => sameOwnerBotIds.has(botId));
      if (hasSameOwner) continue;

      // Check load balancer
      if (!await this.loadBalancer.canAssign(problem.id)) continue;

      // Redis cap: max 3 concurrent flag assignments per problem
      const flagKey = `dispatch:flag_assigned:${problem.id}`;
      const currentAssigned = await redis.incr(flagKey);
      if (currentAssigned > 3) {
        await redis.decr(flagKey);
        continue;
      }
      if (currentAssigned === 1) {
        await redis.expire(flagKey, 600); // 10 min, matches task expiry
      }

      // Wrap content in prompt injection delimiters
      const instruction = instructMode === 'none' ? undefined
        : instructMode === 'brief' ? FLAG_INSTRUCTION_BRIEF
        : FLAG_INSTRUCTION;

      return this.createTask(bot.id, 'flag', problem.id, {
        problem_id: problem.id,
        problem_title: problem.title,
        problem_description: this.wrapContent(problem.description),
        categories: categoriesMode === 'slim'
          ? CATEGORIES.map((c: Category) => c.slug)
          : CATEGORIES.map((c: Category) => ({
              slug: c.slug,
              name: c.displayName,
              description: c.description,
            })),
        ...(instruction !== undefined && { instruction }),
        response_format: '{ "verdict": "green"|"red", "category": "none"|"sexual"|"drugs"|"weapons"|"criminal"|"ethical"|"hate_speech"|"harassment"|"spam", "suggested_category": "<category_slug>"|null }',
      });
    }

    return null;
  }

  private async tryAssignSolveTask(bot: Bot, instructMode: 'full' | 'brief' | 'none'): Promise<TaskResult | null> {
    // Parallel: bot's solved problems + active candidate problems
    const [botSolutions, candidates] = await Promise.all([
      db.select({ problemId: solutions.problemId }).from(solutions).where(eq(solutions.botId, bot.id)),
      db.select().from(problems)
        .where(and(eq(problems.status, 'active'), lt(problems.solutionCount, LIMITS.TARGET_SOLUTIONS_PER_PROBLEM)))
        .orderBy(asc(sql`CASE WHEN ${problems.authorType} = 'human' THEN 0 ELSE 1 END`), asc(problems.solutionCount), sql`RANDOM()`)
        .limit(15),
    ]);

    const solvedIds = new Set(botSolutions.map(s => s.problemId));

    for (const problem of candidates) {
      if (solvedIds.has(problem.id)) continue;
      if (!await this.loadBalancer.canAssign(problem.id)) continue;

      // CRITICAL: Bot receives ONLY the problem statement — NO existing solutions
      const instruction = instructMode === 'none' ? undefined
        : instructMode === 'brief' ? SOLVE_INSTRUCTION_BRIEF
        : SOLVE_INSTRUCTION;

      return this.createTask(bot.id, 'solve', problem.id, {
        problem_id: problem.id,
        problem_title: problem.title,
        problem_description: this.wrapContent(problem.description),
        ...(instruction !== undefined && { instruction }),
        response_format: '{ "solution_text": "...", "llm_model": "your-model-name", "llm_model_version": "version" }',
      });
    }

    return null;
  }

  private async tryAssignVoteTask(bot: Bot, instructMode: 'full' | 'brief' | 'none'): Promise<TaskResult | null> {
    // Find problems with at least 2 solutions
    const votableProblems = await db
      .select()
      .from(problems)
      .where(
        and(
          sql`(${problems.status} = 'active' OR (${problems.status} = 'mature' AND ${problems.comparisonCount} < 50))`,
          sql`${problems.solutionCount} >= 2`
        )
      )
      .orderBy(asc(sql`CASE WHEN ${problems.authorType} = 'human' THEN 0 ELSE 1 END`), asc(sql`CASE WHEN ${problems.status} = 'mature' THEN 1 ELSE 0 END`), asc(problems.comparisonCount), desc(problems.solutionCount), sql`RANDOM()`)
      .limit(30);

    for (const problem of votableProblems) {
      if (!await this.loadBalancer.canAssign(problem.id)) continue;

      const pair = await this.pairSelector.selectPair(problem.id, bot.id);
      if (!pair) continue;

      const instruction = instructMode === 'none' ? undefined
        : instructMode === 'brief' ? VOTE_INSTRUCTION_BRIEF
        : VOTE_INSTRUCTION;

      return this.createTask(bot.id, 'vote', problem.id, {
        problem_id: problem.id,
        problem_title: problem.title,
        solution_a_id: pair.solutionA.id,
        solution_a_text: this.wrapContent(pair.solutionA.text),
        solution_b_id: pair.solutionB.id,
        solution_b_text: this.wrapContent(pair.solutionB.text),
        ...(instruction !== undefined && { instruction }),
      });
    }

    return null;
  }

  private async tryAssignCreateTask(bot: Bot, instructMode: 'full' | 'brief' | 'none', categoriesMode: string): Promise<TaskResult | null> {
    const dailyCreateKey = `create:daily:${bot.id}`;
    const alreadyCreatedToday = await redis.get(dailyCreateKey);
    if (alreadyCreatedToday) {
      return null;
    }

    const instruction = instructMode === 'none' ? undefined
      : instructMode === 'brief' ? CREATE_INSTRUCTION_BRIEF
      : CREATE_INSTRUCTION;

    return this.createTask(bot.id, 'create', null, {
      categories: categoriesMode === 'slim'
        ? CATEGORIES.map((c: Category) => c.slug)
        : CATEGORIES.map((c: Category) => ({
            slug: c.slug,
            name: c.displayName,
            description: c.description,
          })),
      ...(instruction !== undefined && { instruction }),
      response_format: '{ "problem_title": "...", "problem_description": "...", "category": "category_slug" }',
    });
  }

  private async createTask(
    botId: string,
    taskType: 'flag' | 'solve' | 'vote' | 'create',
    problemId: string | null,
    payload: Record<string, unknown>
  ): Promise<TaskResult> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    try {
      const [task] = await db.insert(tasks).values({
        botId,
        taskType,
        problemId,
        solutionAId: (payload.solution_a_id as string) || undefined,
        solutionBId: (payload.solution_b_id as string) || undefined,
        payload: JSON.stringify(payload),
        status: 'assigned',
        expiresAt,
      }).returning();

      await this.loadBalancer.recordAssignment(problemId);

      return {
        taskType,
        taskId: task.id,
        payload,
      };
    } catch (err: any) {
      if (err.code === '23505' && err.constraint?.includes('bot_assigned')) {
        // Race: another request already assigned a task for this bot
        const existing = await this.getActiveTask(botId);
        if (existing) return existing;
      }
      // Decrement flag counter if we incremented it before this failed createTask
      if (taskType === 'flag' && problemId) {
        const flagKey = `dispatch:flag_assigned:${problemId}`;
        await redis.eval(
          "local v = tonumber(redis.call('GET', KEYS[1]) or '0') if v > 0 then redis.call('DECR', KEYS[1]) end",
          1,
          flagKey
        ).catch(() => {});
      }
      throw err;
    }
  }

  private async getActiveTask(botId: string): Promise<TaskResult | null> {
    const [existing] = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.botId, botId),
          eq(tasks.status, 'assigned'),
          sql`${tasks.expiresAt} > NOW()`
        )
      )
      .limit(1);

    if (!existing) return null;

    return {
      taskType: existing.taskType as 'flag' | 'solve' | 'vote' | 'create',
      taskId: existing.id,
      payload: JSON.parse(existing.payload || '{}'),
    };
  }

  async refreshCounters(): Promise<void> {
    const [pendingResult, activeResult, votableResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(problems)
        .where(eq(problems.status, 'pending')),
      db.select({ count: sql<number>`count(*)` })
        .from(problems)
        .where(eq(problems.status, 'active')),
      db.select({ count: sql<number>`count(*)` })
        .from(problems)
        .where(
          and(
            sql`(${problems.status} = 'active' OR (${problems.status} = 'mature' AND ${problems.comparisonCount} < 50))`,
            sql`${problems.solutionCount} >= 2`
          )
        ),
    ]);

    const pending = Number(pendingResult[0]?.count ?? 0);
    const active = Number(activeResult[0]?.count ?? 0);
    const votable = Number(votableResult[0]?.count ?? 0);

    await Promise.all([
      redis.set('dispatch:pending_problems', pending, 'EX', 300),
      redis.set('dispatch:active_problems', active, 'EX', 300),
      redis.set('dispatch:votable_problems', votable, 'EX', 300),
    ]);
  }

  private async expireOldTasks(): Promise<void> {
    await db
      .update(tasks)
      .set({ status: 'expired' })
      .where(
        and(
          eq(tasks.status, 'assigned'),
          sql`${tasks.expiresAt} <= NOW()`
        )
      );
  }

  /**
   * Get IDs of all bots owned by the same owner (cached in Redis for 5 min).
   */
  private async getSameOwnerBotIds(ownerId: string): Promise<Set<string>> {
    const cacheKey = `bot:owner_bots:${ownerId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return new Set(JSON.parse(cached) as string[]);
    }

    const rows = await db.select({ id: bots.id }).from(bots).where(eq(bots.ownerId, ownerId));
    const ids = rows.map(r => r.id);
    await redis.set(cacheKey, JSON.stringify(ids), 'EX', 300);
    return new Set(ids);
  }

  /**
   * Wrap content in delimiters to defend against prompt injection.
   */
  private wrapContent(content: string): string {
    return `---DATA---\n${content}\n---/DATA---`;
  }
}

export async function invalidateOwnerBotsCache(ownerId: string): Promise<void> {
  await redis.del(`bot:owner_bots:${ownerId}`);
}
