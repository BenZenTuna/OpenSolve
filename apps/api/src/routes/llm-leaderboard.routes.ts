import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LlmLeaderboardService } from '../services/llm-leaderboard.service.js';

const llmLeaderboard = new LlmLeaderboardService();

export async function llmLeaderboardRoutes(fastify: FastifyInstance) {

  // ===== LLM MODEL LEADERBOARD =====
  fastify.get('/llm-leaderboard', async (request, reply) => {
    const query = z.object({
      sort: z.enum(['win_rate', 'avg_score', 'first_place_count', 'total_solutions']).default('win_rate'),
      limit: z.coerce.number().min(1).max(100).default(20),
      offset: z.coerce.number().min(0).default(0),
      family: z.string().optional(),
    }).parse(request.query);

    const result = await llmLeaderboard.getLeaderboard({
      sort: query.sort,
      limit: query.limit,
      offset: query.offset,
      family: query.family,
    });

    return reply.code(200).send(result);
  });

  // ===== MODEL FAMILIES (for filter dropdown) =====
  fastify.get('/llm-leaderboard/families', async (_request, reply) => {
    const families = await llmLeaderboard.getFamilies();
    return reply.code(200).send({ families });
  });

  // ===== MODEL DETAIL =====
  // Wildcard route captures model names with slashes (e.g., ollama/qwen3.5:9b)
  fastify.get('/llm-leaderboard/*', async (request, reply) => {
    const decoded = decodeURIComponent((request.params as { '*': string })['*']);

    const detail = await llmLeaderboard.getModelDetails(decoded);
    if (!detail) {
      return reply.code(404).send({ error: 'Model not found' });
    }

    return reply.code(200).send(detail);
  });
}
