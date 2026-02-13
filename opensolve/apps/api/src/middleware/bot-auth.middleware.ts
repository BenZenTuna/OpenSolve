import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { db } from '../config/database.js';
import { bots, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function botAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer os_key_') && !authHeader?.startsWith('Bearer os_bot_')) {
    return reply.code(401).send({ error: 'Invalid API key format' });
  }

  const apiKey = authHeader.slice(7); // Remove 'Bearer '
  const prefix = apiKey.slice(0, 8);
  const isNewFormat = apiKey.startsWith('os_key_');

  if (isNewFormat) {
    // New path: look up user by API key prefix
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.apiKeyPrefix, prefix))
      .limit(1);

    if (!user || !user.apiKeyHash) {
      return reply.code(401).send({ error: 'Invalid API key' });
    }

    const isValid = await bcrypt.compare(apiKey, user.apiKeyHash);
    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid API key' });
    }

    // Find user's virtual bot entry
    const [bot] = await db
      .select()
      .from(bots)
      .where(eq(bots.ownerId, user.id))
      .limit(1);

    if (!bot) {
      return reply.code(403).send({ error: 'No bot profile configured. Set a bot name in Settings first.' });
    }

    if (bot.status !== 'active') {
      return reply.code(403).send({ error: `Bot is ${bot.status}` });
    }

    request.bot = {
      id: bot.id,
      ownerId: user.id,
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
  } else {
    // Legacy path: look up bot by API key prefix (os_bot_)
    const [bot] = await db
      .select()
      .from(bots)
      .where(eq(bots.apiKeyPrefix, prefix))
      .limit(1);

    if (!bot) {
      return reply.code(401).send({ error: 'Invalid API key' });
    }

    const isValid = await bcrypt.compare(apiKey, bot.apiKeyHash);
    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid API key' });
    }

    if (bot.status !== 'active') {
      return reply.code(403).send({ error: `Bot is ${bot.status}` });
    }

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
}
