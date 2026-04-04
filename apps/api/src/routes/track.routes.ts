import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { incrementPageView } from '../services/visit-tracking.service.js';

const pageviewSchema = z.object({
  path: z.string().min(1).max(500),
});

export async function trackRoutes(fastify: FastifyInstance) {
  // Rate limit: 60 requests/min per IP
  await fastify.register(import('@fastify/rate-limit'), {
    max: 60,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
  });

  fastify.post('/pageview', async (request, reply) => {
    const parsed = pageviewSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid path' });
    }

    // Fire-and-forget — don't block the response
    incrementPageView(parsed.data.path).catch(() => {});

    return reply.code(204).send();
  });
}
