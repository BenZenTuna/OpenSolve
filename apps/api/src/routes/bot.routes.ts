import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { botAuthMiddleware } from '../middleware/bot-auth.middleware.js';
import { sanitizeMiddleware } from '../middleware/sanitize.middleware.js';
import { registerBotRateLimit } from '../middleware/rate-limit.middleware.js';
import { db } from '../config/database.js';
import { bots, tasks, solutions, problems, flags } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { DispatcherService } from '../services/dispatcher.service.js';
import { BradleyTerryService } from '../services/bradley-terry.service.js';
import { ModerationService } from '../services/moderation.service.js';
import { GamificationService } from '../services/gamification.service.js';
import { LlmLeaderboardService } from '../services/llm-leaderboard.service.js';
import { handleZodError } from '../utils/errors.js';
import { detectPromptInjection } from '../utils/security.js';
import { logger } from '../utils/logger.js';
import { revalidateForProblem, revalidateForSolution, revalidateForVote, revalidateForFlag } from '../services/revalidate.service.js';

const dispatcher = new DispatcherService();
const bt = new BradleyTerryService();
const moderation = new ModerationService();
const gamification = new GamificationService();
const llmLeaderboard = new LlmLeaderboardService();

// LLM model name validation pattern
const LLM_MODEL_PATTERN = /^[a-z0-9][a-z0-9._-]{0,98}[a-z0-9]$/;

// Validation schemas
const CATEGORY_SLUGS = [
  'technology', 'science_nature', 'health', 'business_finance',
  'education_career', 'society_culture', 'philosophy_ideas', 'lifestyle',
] as const;

const flagSubmitSchema = z.object({
  verdict: z.enum(['green', 'red']),
  category: z.enum(['sexual', 'drugs', 'weapons', 'criminal', 'ethical', 'hate_speech', 'harassment', 'spam', 'none']),
  suggested_category: z.enum(CATEGORY_SLUGS).nullable().optional(),
});

const solveSubmitSchema = z.object({
  solution_text: z.string().min(10).max(2000),
  llm_model: z.string().max(100).optional(),
  llm_model_version: z.string().max(50).optional(),
});

const voteSubmitSchema = z.object({
  winner: z.enum(['a', 'b', 'skip']),
});

const VALID_FLAG_CATEGORIES = ['sexual', 'drugs', 'weapons', 'criminal', 'ethical', 'hate_speech', 'harassment', 'spam', 'none'];

const FLAG_CATEGORY_MAP: Record<string, string> = {
  spam_gibberish: 'spam', gibberish: 'spam', spam_content: 'spam', junk: 'spam',
  nonsense: 'spam', keyboard_mash: 'spam', prompt_injection: 'spam', advertisement: 'spam',
  ads: 'spam', lorem_ipsum: 'spam', garbage: 'spam', unintelligible: 'spam', incoherent: 'spam',
  sexually_explicit: 'sexual', sexual_content: 'sexual', pornography: 'sexual', nsfw: 'sexual', explicit: 'sexual',
  drug: 'drugs', drug_manufacturing: 'drugs', drug_use: 'drugs', illegal_drugs: 'drugs',
  narcotics: 'drugs', substance_abuse: 'drugs',
  weapon: 'weapons', weapon_creation: 'weapons', violence: 'weapons', attack: 'weapons',
  crime: 'criminal', illegal: 'criminal', illegal_activity: 'criminal', criminal_activity: 'criminal', solicitation: 'criminal',
  manipulation: 'ethical', exploitation: 'ethical', deception: 'ethical', unethical: 'ethical',
  hate: 'hate_speech', hateful: 'hate_speech', racist: 'hate_speech', discrimination: 'hate_speech', bigotry: 'hate_speech',
  harassing: 'harassment', bullying: 'harassment', cyberbullying: 'harassment', targeting: 'harassment', abuse: 'harassment',
};

function normalizeFlagCategory(raw: string | null | undefined): string {
  if (!raw) return 'none';
  const n = raw.toLowerCase().trim().replace(/[\s/\-_]+/g, '_');
  if (VALID_FLAG_CATEGORIES.includes(n)) return n;
  if (FLAG_CATEGORY_MAP[n]) return FLAG_CATEGORY_MAP[n];
  for (const valid of VALID_FLAG_CATEGORIES) {
    if (n.includes(valid)) return valid;
  }
  return 'none';
}

const SUGGESTED_CATEGORY_MAP: Record<string, string> = {
  tech: 'technology', science: 'science_nature', nature: 'science_nature',
  medical: 'health', healthcare: 'health', medicine: 'health', wellness: 'health',
  business: 'business_finance', finance: 'business_finance', economics: 'business_finance', economy: 'business_finance',
  education: 'education_career', career: 'education_career', careers: 'education_career', learning: 'education_career',
  society: 'society_culture', culture: 'society_culture', politics: 'society_culture', social: 'society_culture',
  philosophy: 'philosophy_ideas', ideas: 'philosophy_ideas', ethics: 'philosophy_ideas',
  life: 'lifestyle', personal: 'lifestyle', daily_life: 'lifestyle', everyday: 'lifestyle',
  home: 'lifestyle', cooking: 'lifestyle', fitness: 'lifestyle', travel: 'lifestyle', relationships: 'lifestyle',
};

function normalizeSuggestedCategory(raw: string | null | undefined): string | null {
  if (!raw || raw === 'null' || raw === 'undefined' || raw === 'none' || raw === 'N/A') return null;
  const n = raw.toLowerCase().trim().replace(/[\s-]+/g, '_');
  const validCategories = CATEGORY_SLUGS as readonly string[];
  if (validCategories.includes(n)) return n;
  if (SUGGESTED_CATEGORY_MAP[n]) return SUGGESTED_CATEGORY_MAP[n];
  for (const valid of validCategories) {
    if (n.includes(valid) || valid.includes(n)) return valid;
  }
  return null;
}

const MAX_FAILED_FLAG_ATTEMPTS = 5;

async function trackFailedFlagAttempt(problemId: string): Promise<void> {
  try {
    const [problem] = await db.update(problems)
      .set({
        failedFlagAttempts: sql`${problems.failedFlagAttempts} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(problems.id, problemId))
      .returning({
        id: problems.id,
        failedFlagAttempts: problems.failedFlagAttempts,
        status: problems.status,
      });

    if (problem && problem.failedFlagAttempts >= MAX_FAILED_FLAG_ATTEMPTS && problem.status === 'pending') {
      await db.update(problems)
        .set({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: 'rejected' as any,
          updatedAt: new Date(),
        })
        .where(and(
          eq(problems.id, problemId),
          eq(problems.status, 'pending'),
        ));
      logger.warn({ problemId, attempts: problem.failedFlagAttempts },
        'Auto-rejected problem after repeated flag failures');
    }
  } catch (err) {
    logger.error({ err, problemId }, 'Failed to track flag attempt');
  }
}

const createSubmitSchema = z.object({
  problem_title: z.string().min(5).max(200),
  problem_description: z.string().min(20).max(1000),
  category: z.enum(CATEGORY_SLUGS),
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

    const query = request.query as Record<string, string>;
    const brief = query?.brief === 'true';
    const instruct = query?.instruct || 'full';
    const categoriesMode = query?.categories || 'full'; // 'full' | 'slim'

    // Resolve instruction mode: instruct=none overrides brief
    const instructMode: 'full' | 'brief' | 'none' = instruct === 'none' ? 'none' : (brief ? 'brief' : 'full');

    const task = await dispatcher.getNextTask({
      id: bot.id,
      ownerId: bot.ownerId as string,
    }, instructMode, categoriesMode);

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
          const normalizedBody: Record<string, unknown> = {
            ...body,
            category: normalizeFlagCategory(body.category as string | null | undefined),
            suggested_category: normalizeSuggestedCategory(body.suggested_category as string | null | undefined),
          };
          if (normalizedBody.verdict === 'red' && normalizedBody.category === 'none') {
            normalizedBody.category = 'spam';
          }
          const parsed = flagSubmitSchema.parse(normalizedBody);
          // Store the flag with suggested_category
          await db.insert(flags).values({
            problemId: task.problemId!,
            botId: bot.id,
            verdict: parsed.verdict,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            category: parsed.category as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            suggestedCategory: parsed.suggested_category as any,
          });
          const moderationResult = await moderation.processFlag(
            task.problemId!, bot.id, parsed.verdict, parsed.category
          );
          await gamification.onFlag(bot.id, parsed.verdict, moderationResult.newStatus, task.problemId!);
          revalidateForFlag();
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

          // Validate and normalize LLM model name
          let llmModel: string | null = null;
          let llmModelVersion: string | null = null;
          if (parsed.llm_model) {
            const normalized = parsed.llm_model.trim().toLowerCase();
            if (LLM_MODEL_PATTERN.test(normalized)) {
              llmModel = normalized;
              if (parsed.llm_model_version) {
                llmModelVersion = parsed.llm_model_version.trim().slice(0, 50);
              }
            }
          }

          // Create solution — blind, bot never sees other solutions
          const solutionValues: Record<string, unknown> = {
            problemId: task.problemId!,
            botId: bot.id,
            text: parsed.solution_text,
          };
          if (llmModel) solutionValues.llmModel = llmModel;
          if (llmModelVersion) solutionValues.llmModelVersion = llmModelVersion;

          let solution;
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [solution] = await db.insert(solutions).values(solutionValues as any).returning();
          } catch (insertErr: any) {
            if (insertErr.code === '23505') {
              // Bot already solved this problem — mark task completed, don't award duplicate points
              await db.update(tasks).set({
                status: 'completed',
                completedAt: new Date(),
                result: JSON.stringify({ duplicate: true }),
              }).where(eq(tasks.id, taskId));
              return reply.code(200).send({
                success: true,
                message: 'Solution already submitted for this problem. Task completed.',
                duplicate: true,
              });
            }
            throw insertErr;
          }

          // Update problem solution count
          await db.update(problems)
            .set({
              solutionCount: sql`${problems.solutionCount} + 1`,
              lastBotActivityAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(problems.id, task.problemId!));

          await gamification.onSolve(bot.id, solution.id, task.problemId!);

          // Record LLM model usage
          if (llmModel) {
            llmLeaderboard.recordModel(llmModel, llmModelVersion, bot.id).catch(err => {
              logger.warn({ err, llmModel }, 'Failed to record LLM model');
            });
          }

          revalidateForSolution();
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
          await gamification.onVote(bot.id, parsed.winner, task.problemId!);
          revalidateForVote();
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
          let problem;
          try {
            [problem] = await db.insert(problems).values({
              authorType: 'bot',
              botAuthorId: bot.id,
              title: parsed.problem_title,
              description: parsed.problem_description,
              status: 'pending',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              category: parsed.category as any,
            }).returning();
          } catch (insertErr: any) {
            if (insertErr.code === '23505') {
              // Duplicate title — mark task completed, no new problem
              await db.update(tasks).set({
                status: 'completed',
                completedAt: new Date(),
                result: JSON.stringify({ duplicate: true }),
              }).where(eq(tasks.id, taskId));
              return reply.code(200).send({
                success: true,
                message: 'Duplicate title — problem already exists. Task completed.',
                duplicate: true,
              });
            }
            throw insertErr;
          }
          await gamification.onCreate(bot.id, problem.id);
          revalidateForProblem();
          result = { problem_id: problem.id };
          break;
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Mark task as failed so bot doesn't get stuck retrying the same task
      try {
        await db.update(tasks)
          .set({
            status: 'failed',
            completedAt: new Date(),
            result: JSON.stringify({ error: String(err.message || err) }),
          })
          .where(eq(tasks.id, taskId));
      } catch (updateErr) {
        request.log.error({ updateErr, taskId }, 'Failed to mark task as failed');
      }

      // Track failed flag attempts — auto-reject poison problems
      if (task.taskType === 'flag' && task.problemId) {
        await trackFailedFlagAttempt(task.problemId);
      }

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
