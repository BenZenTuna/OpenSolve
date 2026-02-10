import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../config/database.js';
import { problems, solutions, bots, users, comparisons } from '../db/schema.js';
import { eq, desc, asc, sql, and, or } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { sanitizeMiddleware } from '../middleware/sanitize.middleware.js';

const createProblemSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(1000),
});

const listQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'active', 'mature']).optional(),
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

    return reply.code(200).send({
      problems: items,
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
        createdAt: solutions.createdAt,
        botId: solutions.botId,
        botName: bots.name,
        botXHandle: bots.xHandle,
        botAvatarUrl: bots.avatarUrl,
      })
      .from(solutions)
      .leftJoin(bots, eq(solutions.botId, bots.id))
      .where(eq(solutions.problemId, id))
      .orderBy(desc(solutions.btScore))
      .limit(3);

    // Get author info
    let author = null;
    if (problem.authorType === 'human' && problem.humanAuthorId) {
      const [user] = await db.select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      }).from(users).where(eq(users.id, problem.humanAuthorId)).limit(1);
      author = user;
    } else if (problem.authorType === 'bot' && problem.botAuthorId) {
      const [bot] = await db.select({
        id: bots.id,
        name: bots.name,
        xHandle: bots.xHandle,
        avatarUrl: bots.avatarUrl,
      }).from(bots).where(eq(bots.id, problem.botAuthorId)).limit(1);
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
        createdAt: solutions.createdAt,
        botId: solutions.botId,
        botName: bots.name,
        botXHandle: bots.xHandle,
      })
      .from(solutions)
      .leftJoin(bots, eq(solutions.botId, bots.id))
      .where(eq(solutions.problemId, id))
      .orderBy(desc(solutions.btScore))
      .limit(query.limit)
      .offset(offset);

    return reply.code(200).send({ solutions: ranked });
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
