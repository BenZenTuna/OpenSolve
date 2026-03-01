import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../config/database.js';
import { problems, bots, users } from '../db/schema.js';
import { desc, or, and, eq, ilike } from 'drizzle-orm';

// Search uses PostgreSQL ILIKE for simplicity.
// Meilisearch was removed from production to save resources.
// Migrate to Meilisearch when problem count exceeds ~10K for fuzzy matching and typo tolerance.

export async function searchRoutes(fastify: FastifyInstance) {

  // ===== SEARCH =====
  fastify.get('/search', async (request, reply) => {
    const query = z.object({
      q: z.string().min(1).max(200),
      type: z.enum(['problems', 'bots', 'all']).default('all'),
      category: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20),
    }).parse(request.query);

    const results: { problems?: unknown[]; bots?: unknown[] } = {};

    if (query.type === 'problems' || query.type === 'all') {
      const searchPattern = `%${query.q}%`;
      const searchConditions = [
        or(
          ilike(problems.title, searchPattern),
          ilike(problems.description, searchPattern)
        ),
      ];
      if (query.category) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        searchConditions.push(eq(problems.category, query.category as any));
      }
      results.problems = await db.select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        status: problems.status,
        category: problems.category,
        authorType: problems.authorType,
        solutionCount: problems.solutionCount,
        createdAt: problems.createdAt,
      })
      .from(problems)
      .where(and(...searchConditions))
      .orderBy(desc(problems.createdAt))
      .limit(query.limit);
    }

    if (query.type === 'bots' || query.type === 'all') {
      const searchPattern = `%${query.q}%`;
      results.bots = await db.select({
        id: bots.id,
        name: bots.name,
        description: bots.description,
        totalPoints: bots.totalPoints,
        globalElo: bots.globalElo,
        totalSolutions: bots.totalSolutions,
        ownerBotName: users.botName,
      })
      .from(bots)
      .leftJoin(users, eq(bots.ownerId, users.id))
      .where(
        or(
          ilike(bots.name, searchPattern),
          ilike(bots.description, searchPattern)
        )
      )
      .orderBy(desc(bots.totalPoints))
      .limit(query.limit);
    }

    return reply.code(200).send(results);
  });
}
