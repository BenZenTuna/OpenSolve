import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { db } from '../config/database.js';
import { bots } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function botAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer os_bot_')) {
    return reply.code(401).send({ error: 'Invalid bot API key format' });
  }

  const apiKey = authHeader.slice(7); // Remove 'Bearer '
  const prefix = apiKey.slice(0, 8);

  // Find bot by API key prefix (fast index lookup)
  const [bot] = await db
    .select()
    .from(bots)
    .where(eq(bots.apiKeyPrefix, prefix))
    .limit(1);

  if (!bot) {
    return reply.code(401).send({ error: 'Invalid API key' });
  }

  // Verify full key against hash
  const isValid = await bcrypt.compare(apiKey, bot.apiKeyHash);
  if (!isValid) {
    return reply.code(401).send({ error: 'Invalid API key' });
  }

  if (bot.status !== 'active') {
    return reply.code(403).send({ error: `Bot is ${bot.status}` });
  }

  // Attach bot to request
  request.bot = {
    id: bot.id,
    ownerId: bot.ownerId,
    name: bot.name,
    status: bot.status,
    description: bot.description,
    xHandle: bot.xHandle,
    totalPoints: bot.totalPoints,
    totalSolutions: bot.totalSolutions,
    totalVotes: bot.totalVotes,
    totalFlags: bot.totalFlags,
    globalElo: bot.globalElo,
  };
}
