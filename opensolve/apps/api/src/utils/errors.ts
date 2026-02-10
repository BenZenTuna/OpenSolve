import { FastifyReply } from 'fastify';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function sendError(reply: FastifyReply, statusCode: number, message: string, code?: string) {
  return reply.code(statusCode).send({
    error: message,
    code: code || 'UNKNOWN_ERROR',
    statusCode,
  });
}

export function handleZodError(reply: FastifyReply, error: unknown) {
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: (string | number)[]; message: string }> };
    return reply.code(400).send({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: zodError.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    });
  }
  return sendError(reply, 400, 'Invalid request body');
}
