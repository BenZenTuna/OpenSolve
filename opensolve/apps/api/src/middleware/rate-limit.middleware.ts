import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export async function registerBotRateLimit(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 60,
    timeWindow: '1 hour',
    keyGenerator: (request) => {
      return request.bot?.id || 'anonymous';
    },
  });
}
