import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../config/database.js';
import { problems, solutions, bots, users } from '../db/schema.js';
import { eq, desc, asc, sql, and, isNotNull, inArray } from 'drizzle-orm';
import { CATEGORIES, CATEGORY_GROUP_DEFINITIONS, getCategoriesByGroup } from '@opensolve/shared/categories.js';
import type { CategoryGroup } from '@opensolve/shared/categories.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { sanitizeMiddleware } from '../middleware/sanitize.middleware.js';

const createProblemSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(1000),
});

const CATEGORY_SLUGS = [
  // Everyday Questions
  'everyday_life', 'tech_help', 'health_wellness', 'entertainment_leisure',
  'relationships_social', 'learning_career', 'finance_personal',
  'creative_projects', 'parenting_family',
  // Society & World
  'environment_climate', 'governance_policy', 'society_culture',
  'urban_infrastructure', 'food_agriculture', 'safety_security',
  'communication_media', 'space_exploration',
  // Science & Professional
  'science_technology', 'health_medicine', 'business_economics', 'education_learning',
] as const;

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'active', 'mature'] as const;

const listQuerySchema = z.object({
  category: z.enum(CATEGORY_SLUGS).optional(),
  group: z.enum(['everyday', 'world', 'professional']).optional(),
  status: z.string().optional().transform((val) => {
    if (!val || val === 'all') return undefined;
    if ((VALID_STATUSES as readonly string[]).includes(val)) return val as typeof VALID_STATUSES[number];
    return undefined;
  }),
  author_type: z.enum(['human', 'bot']).optional(),
  sort: z.enum(['newest', 'oldest', 'most_solutions', 'most_votes']).default('newest'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function problemRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', sanitizeMiddleware);

  // ===== LIST PROBLEMS =====
  fastify.get('/problems', async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    const offset = (query.page - 1) * query.limit;

    const conditions = [];
    if (query.category) {
      conditions.push(eq(problems.category, query.category));
    } else if (query.group) {
      const groupSlugs = getCategoriesByGroup(query.group as CategoryGroup).map(c => c.slug) as typeof CATEGORY_SLUGS[number][];
      if (groupSlugs.length > 0) {
        conditions.push(inArray(problems.category, groupSlugs));
      }
    }
    if (query.status) conditions.push(eq(problems.status, query.status));
    if (query.author_type) conditions.push(eq(problems.authorType, query.author_type));

    const orderBy = {
      newest: desc(problems.createdAt),
      oldest: asc(problems.createdAt),
      most_solutions: desc(problems.solutionCount),
      most_votes: desc(problems.comparisonCount),
    }[query.sort];

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, countResult] = await Promise.all([
      db.select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        status: problems.status,
        category: problems.category,
        authorType: problems.authorType,
        solutionCount: problems.solutionCount,
        comparisonCount: problems.comparisonCount,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        createdAt: problems.createdAt,
      })
      .from(problems)
      .where(where)
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(offset),

      db.select({ count: sql<number>`count(*)::int` })
        .from(problems)
        .where(where),
    ]);

    // Batch-fetch top solution (highest BT score) per problem
    const problemIds = items.map(p => p.id);
    const topSolutionMap = new Map<string, { text: string; btScore: number; botName: string | null }>();

    if (problemIds.length > 0) {
      const topSolutions = await db
        .select({
          problemId: solutions.problemId,
          text: solutions.text,
          btScore: solutions.btScore,
          botName: bots.name,
        })
        .from(solutions)
        .leftJoin(bots, eq(solutions.botId, bots.id))
        .where(inArray(solutions.problemId, problemIds))
        .orderBy(desc(solutions.btScore));

      for (const sol of topSolutions) {
        if (!topSolutionMap.has(sol.problemId)) {
          topSolutionMap.set(sol.problemId, {
            text: sol.text,
            btScore: sol.btScore,
            botName: sol.botName,
          });
        }
      }
    }

    const enrichedProblems = items.map(p => ({
      ...p,
      topSolution: topSolutionMap.get(p.id) || null,
    }));

    return reply.code(200).send({
      problems: enrichedProblems,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: countResult[0].count,
        totalPages: Math.ceil(countResult[0].count / query.limit),
      },
    });
  });

  // ===== GET PROBLEM BY ID =====
  fastify.get('/problems/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const [problem] = await db.select().from(problems).where(eq(problems.id, id)).limit(1);
    if (!problem) {
      return reply.code(404).send({ error: 'Problem not found' });
    }

    // Get top 3 solutions with bot info
    const topSolutions = await db
      .select({
        id: solutions.id,
        text: solutions.text,
        btScore: solutions.btScore,
        comparisonCount: solutions.comparisonCount,
        winCount: solutions.winCount,
        lossCount: solutions.lossCount,
        confidenceInterval: solutions.confidenceInterval,
        llmModel: solutions.llmModel,
        createdAt: solutions.createdAt,
        botId: solutions.botId,
        botName: bots.name,
        ownerBotName: users.botName,
      })
      .from(solutions)
      .leftJoin(bots, eq(solutions.botId, bots.id))
      .leftJoin(users, eq(bots.ownerId, users.id))
      .where(eq(solutions.problemId, id))
      .orderBy(desc(solutions.btScore))
      .limit(3);

    // Get author info
    let author = null;
    if (problem.authorType === 'human' && problem.humanAuthorId) {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
      }).from(users).where(eq(users.id, problem.humanAuthorId)).limit(1);
      author = user;
    } else if (problem.authorType === 'bot' && problem.botAuthorId) {
      const [bot] = await db.select({
        id: bots.id,
        name: bots.name,
        ownerBotName: users.botName,
      }).from(bots)
        .leftJoin(users, eq(bots.ownerId, users.id))
        .where(eq(bots.id, problem.botAuthorId)).limit(1);
      author = bot;
    }

    return reply.code(200).send({
      ...problem,
      author,
      topSolutions,
    });
  });

  // ===== GET RANKED SOLUTIONS FOR PROBLEM =====
  fastify.get('/problems/:id/solutions', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(50),
    }).parse(request.query);

    const offset = (query.page - 1) * query.limit;

    const [problem] = await db.select({ id: problems.id }).from(problems).where(eq(problems.id, id)).limit(1);
    if (!problem) {
      return reply.code(404).send({ error: 'Problem not found' });
    }

    const ranked = await db
      .select({
        id: solutions.id,
        text: solutions.text,
        btScore: solutions.btScore,
        comparisonCount: solutions.comparisonCount,
        winCount: solutions.winCount,
        lossCount: solutions.lossCount,
        confidenceInterval: solutions.confidenceInterval,
        llmModel: solutions.llmModel,
        createdAt: solutions.createdAt,
        botId: solutions.botId,
        botName: bots.name,
        ownerBotName: users.botName,
      })
      .from(solutions)
      .leftJoin(bots, eq(solutions.botId, bots.id))
      .leftJoin(users, eq(bots.ownerId, users.id))
      .where(eq(solutions.problemId, id))
      .orderBy(desc(solutions.btScore))
      .limit(query.limit)
      .offset(offset);

    return reply.code(200).send({ solutions: ranked });
  });

  // ===== LIST CATEGORIES WITH COUNTS =====
  fastify.get('/categories', async (request, reply) => {
    const { grouped, group } = request.query as { grouped?: string; group?: string };

    const categoryCounts = await db
      .select({
        category: problems.category,
        count: sql<number>`count(*)::int`,
        activeCount: sql<number>`count(*) FILTER (WHERE ${problems.status} = 'active')::int`,
      })
      .from(problems)
      .where(isNotNull(problems.category))
      .groupBy(problems.category);

    const categoriesWithCounts = CATEGORIES
      .filter(cat => !group || cat.group === group)
      .map(cat => {
        const counts = categoryCounts.find((c: { category: string | null }) => c.category === cat.slug);
        return {
          slug: cat.slug,
          displayName: cat.displayName,
          icon: cat.icon,
          description: cat.description,
          group: cat.group,
          totalProblems: counts?.count ?? 0,
          activeProblems: counts?.activeCount ?? 0,
        };
      });

    if (grouped === 'true') {
      return reply.code(200).send({
        groups: CATEGORY_GROUP_DEFINITIONS.map(g => ({
          id: g.id,
          label: g.label,
          tagline: g.tagline,
          description: g.description,
          categories: categoriesWithCounts.filter(c => c.group === g.id),
        })),
      });
    }

    return reply.code(200).send(categoriesWithCounts);
  });

  // ===== CREATE PROBLEM (human only) =====
  fastify.post('/problems', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.id;
    const body = createProblemSchema.parse(request.body);

    const [problem] = await db.insert(problems).values({
      authorType: 'human',
      humanAuthorId: userId,
      title: body.title,
      description: body.description,
      status: 'pending',
    }).returning();

    return reply.code(201).send({ problem });
  });
}
