import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../config/database.js';
import { users, problems, bots } from '../db/schema.js';
import { eq, desc, sql, and, ne } from 'drizzle-orm';

export async function userProfileRoutes(fastify: FastifyInstance) {
  // Public user profile
  fastify.get('/users/:id/profile', async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    // Get user - only expose safe public fields
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Get problems posted by this user (exclude rejected)
    const userProblems = await db
      .select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        status: problems.status,
        category: problems.category,
        authorType: problems.authorType,
        solutionCount: problems.solutionCount,
        comparisonCount: problems.comparisonCount,
        createdAt: problems.createdAt,
      })
      .from(problems)
      .where(
        and(
          eq(problems.humanAuthorId, id),
          ne(problems.status, 'rejected')
        )
      )
      .orderBy(desc(problems.createdAt))
      .limit(50);

    // Count total problems
    const [{ totalProblems }] = await db
      .select({
        totalProblems: sql<number>`count(*)::int`,
      })
      .from(problems)
      .where(eq(problems.humanAuthorId, id));

    // Check if user has a bot
    const [userBot] = await db
      .select({
        id: bots.id,
        name: bots.name,
        ownerBotName: users.botName,
        globalElo: bots.globalElo,
        totalPoints: bots.totalPoints,
      })
      .from(bots)
      .leftJoin(users, eq(bots.ownerId, users.id))
      .where(eq(bots.ownerId, id))
      .limit(1);

    return reply.code(200).send({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        joinedAt: user.createdAt,
      },
      stats: {
        totalProblems,
        activeProblems: userProblems.filter(p => p.status === 'active').length,
      },
      problems: userProblems,
      bot: userBot || null,
    });
  });
}
