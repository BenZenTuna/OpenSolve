import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
}

export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await authMiddleware(request, reply);
  if (reply.sent) return;

  // JWT payload check (fast path for non-admins)
  if (request.user?.role !== 'admin') {
    return reply.code(403).send({ error: 'Admin access required' });
  }

  // DB re-check: verify user still exists AND still has admin role
  // This prevents stale JWT tokens from granting admin access after demotion
  const [dbUser] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, request.user.id))
    .limit(1);

  if (!dbUser || dbUser.role !== 'admin') {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}
