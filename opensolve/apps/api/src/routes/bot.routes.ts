import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { botAuthMiddleware } from '../middleware/bot-auth.middleware.js';
import { sanitizeMiddleware } from '../middleware/sanitize.middleware.js';
import { registerBotRateLimit } from '../middleware/rate-limit.middleware.js';
import { db } from '../config/database.js';
import { bots, tasks, solutions, problems } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { DispatcherService } from '../services/dispatcher.service.js';
import { BradleyTerryService } from '../services/bradley-terry.service.js';
import { ModerationService } from '../services/moderation.service.js';
import { GamificationService } from '../services/gamification.service.js';
import { handleZodError } from '../utils/errors.js';
import { detectPromptInjection } from '../utils/security.js';
import { logger } from '../utils/logger.js';

const dispatcher = new DispatcherService();
const bt = new BradleyTerryService();
const moderation = new ModerationService();
const gamification = new GamificationService();

// Validation schemas
const flagSubmitSchema = z.object({
  verdict: z.enum(['green', 'red']),
  category: z.enum(['sexual', 'drugs', 'weapons', 'criminal', 'ethical', 'hate_speech', 'harassment', 'none']),
});

const solveSubmitSchema = z.object({
  solution_text: z.string().min(10).max(2000),
});

const voteSubmitSchema = z.object({
  winner: z.enum(['a', 'b', 'skip']),
});

const createSubmitSchema = z.object({
  problem_title: z.string().min(5).max(200),
  problem_description: z.string().min(20).max(1000),
});

export async function botRoutes(fastify: FastifyInstance) {
  // Bot-specific rate limit: 60 requests/hour per bot ID
  await registerBotRateLimit(fastify);

  // All bot routes require bot authentication
  fastify.addHook('preHandler', botAuthMiddleware);
  fastify.addHook('preHandler', sanitizeMiddleware);

  // ===== GET NEXT TASK =====
  fastify.get('/tasks/next', async (request, reply) => {
    const bot = request.bot!;

    const task = await dispatcher.getNextTask({
      id: bot.id,
      ownerId: bot.ownerId as string,
    });

    if (!task) {
      return reply.code(204).send();
    }

    return reply.code(200).send(task);
  });

  // ===== SUBMIT TASK RESULT =====
  fastify.post('/tasks/:taskId/submit', async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const bot = request.bot!;

    // Get the task
    const [task] = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.botId, bot.id)
        )
      )
      .limit(1);

    if (!task) {
      return reply.code(404).send({ error: 'Task not found or expired' });
    }
    if (task.status !== 'assigned') {
      return reply.code(409).send({ error: 'Task already completed' });
    }

    const payload = JSON.parse(task.payload || '{}');
    const body = request.body as Record<string, unknown>;
    let result: Record<string, unknown> = {};

    try {
      switch (task.taskType) {
        case 'flag': {
          const parsed = flagSubmitSchema.parse(body);
          const moderationResult = await moderation.processFlag(
            task.problemId!, bot.id, parsed.verdict, parsed.category
          );
          await gamification.onFlag(bot.id, parsed.verdict, moderationResult.newStatus);
          result = { ...parsed, problem_new_status: moderationResult.newStatus };
          break;
        }

        case 'solve': {
          const parsed = solveSubmitSchema.parse(body);
          // Check for prompt injection patterns (log only, don't block)
          if (detectPromptInjection(parsed.solution_text)) {
            logger.warn(
              {
                event: 'prompt_injection_detected',
                field: 'solution_text',
                botId: bot.id,
                taskId: taskId,
                endpoint: 'tasks/:taskId/submit (solve)',
                snippet: parsed.solution_text.slice(0, 200),
              },
              'Prompt injection pattern detected in solution_text'
            );
          }
          // Create solution — blind, bot never sees other solutions
          const [solution] = await db.insert(solutions).values({
            problemId: task.problemId!,
            botId: bot.id,
            text: parsed.solution_text,
          }).returning();

          // Update problem solution count
          await db.update(problems)
            .set({
              solutionCount: sql`${problems.solutionCount} + 1`,
              lastBotActivityAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(problems.id, task.problemId!));

          await gamification.onSolve(bot.id, solution.id, task.problemId!);
          result = { solution_id: solution.id };
          break;
        }

        case 'vote': {
          const parsed = voteSubmitSchema.parse(body);
          const btResult = await bt.processVote(
            task.problemId!,
            payload.solution_a_id as string,
            payload.solution_b_id as string,
            parsed.winner,
            bot.id
          );
          await gamification.onVote(bot.id, parsed.winner);
          result = btResult;
          break;
        }

        case 'create': {
          const parsed = createSubmitSchema.parse(body);
          // Check for prompt injection patterns (log only, don't block)
          const fieldsToCheck: Record<string, string> = {
            problem_title: parsed.problem_title,
            problem_description: parsed.problem_description,
          };
          for (const [field, value] of Object.entries(fieldsToCheck)) {
            if (detectPromptInjection(value)) {
              logger.warn(
                {
                  event: 'prompt_injection_detected',
                  field,
                  botId: bot.id,
                  taskId: taskId,
                  endpoint: 'tasks/:taskId/submit (create)',
                  snippet: value.slice(0, 200),
                },
                `Prompt injection pattern detected in ${field}`
              );
            }
          }
          const [problem] = await db.insert(problems).values({
            authorType: 'bot',
            botAuthorId: bot.id,
            title: parsed.problem_title,
            description: parsed.problem_description,
            status: 'pending',
          }).returning();
          await gamification.onCreate(bot.id, problem.id);
          result = { problem_id: problem.id };
          break;
        }
      }
    } catch (err: any) {
      if (err.issues) {
        return handleZodError(reply, err);
      }
      throw err;
    }

    // Mark task as completed
    await db.update(tasks)
      .set({
        status: 'completed',
        result: JSON.stringify(result),
        completedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    // Update bot activity
    await db.update(bots)
      .set({
        lastActiveAt: new Date(),
        totalTasksCompleted: sql`${bots.totalTasksCompleted} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(bots.id, bot.id));

    return reply.code(200).send({ success: true, result });
  });

  // ===== BOT PROFILE =====
  fastify.get('/bot/me', async (request, reply) => {
    const bot = request.bot!;

    const [fullBot] = await db
      .select({
        id: bots.id,
        name: bots.name,
        description: bots.description,
        avatarUrl: bots.avatarUrl,
        xHandle: bots.xHandle,
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
      .where(eq(bots.id, bot.id))
      .limit(1);

    const botBadges = await gamification.getBotBadges(bot.id);

    return reply.code(200).send({ ...fullBot, badges: botBadges });
  });
}
