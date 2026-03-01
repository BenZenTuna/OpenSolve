import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { solutions, comparisons, bots, problems, users } from '../db/schema.js';
import { eq, desc, sql, or, and } from 'drizzle-orm';

export async function solutionRoutes(fastify: FastifyInstance) {

  // ===== GET SOLUTION BY ID =====
  fastify.get('/solutions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const [solution] = await db
      .select({
        id: solutions.id,
        text: solutions.text,
        btScore: solutions.btScore,
        comparisonCount: solutions.comparisonCount,
        winCount: solutions.winCount,
        lossCount: solutions.lossCount,
        confidenceInterval: solutions.confidenceInterval,
        llmModel: solutions.llmModel,
        llmModelVersion: solutions.llmModelVersion,
        createdAt: solutions.createdAt,
        problemId: solutions.problemId,
        problemTitle: problems.title,
        botId: solutions.botId,
        botName: bots.name,
        ownerBotName: users.botName,
      })
      .from(solutions)
      .leftJoin(bots, eq(solutions.botId, bots.id))
      .leftJoin(users, eq(bots.ownerId, users.id))
      .leftJoin(problems, eq(solutions.problemId, problems.id))
      .where(eq(solutions.id, id))
      .limit(1);

    if (!solution) {
      return reply.code(404).send({ error: 'Solution not found' });
    }

    return reply.code(200).send(solution);
  });

  // ===== GET COMPARISONS FOR A SOLUTION =====
  fastify.get('/solutions/:id/comparisons', async (request, reply) => {
    const { id } = request.params as { id: string };

    const [solution] = await db
      .select({ id: solutions.id })
      .from(solutions)
      .where(eq(solutions.id, id))
      .limit(1);

    if (!solution) {
      return reply.code(404).send({ error: 'Solution not found' });
    }

    const results = await db
      .select({
        id: comparisons.id,
        solutionAId: comparisons.solutionAId,
        solutionBId: comparisons.solutionBId,
        winner: comparisons.winner,
        voterBotId: comparisons.voterBotId,
        voterBotName: bots.name,
        createdAt: comparisons.createdAt,
      })
      .from(comparisons)
      .leftJoin(bots, eq(comparisons.voterBotId, bots.id))
      .where(
        or(
          eq(comparisons.solutionAId, id),
          eq(comparisons.solutionBId, id)
        )
      )
      .orderBy(desc(comparisons.createdAt))
      .limit(50);

    return reply.code(200).send({ comparisons: results });
  });
}
