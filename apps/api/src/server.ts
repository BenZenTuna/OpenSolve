import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import './config/redis.js';
import { db } from './config/database.js';
import { tasks, problems } from './db/schema.js';
import { and, eq, lt, sql } from 'drizzle-orm';
import { authRoutes } from './routes/auth.routes.js';
import { botRoutes } from './routes/bot.routes.js';
import { problemRoutes } from './routes/problem.routes.js';
import { leaderboardRoutes } from './routes/leaderboard.routes.js';
import { searchRoutes } from './routes/search.routes.js';
import { sseRoutes } from './routes/sse.routes.js';
import { solutionRoutes } from './routes/solution.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { homepageRoutes } from './routes/homepage.routes.js';
import { debugRoutes } from './routes/debug.routes.js';
import { llmLeaderboardRoutes } from './routes/llm-leaderboard.routes.js';
import { instructionRoutes } from './routes/instruction.routes.js';
import { newsletterRoutes } from './routes/newsletter.routes.js';
import { adminEmailRoutes } from './routes/admin.email.routes.js';
import { contactRoutes } from './routes/contact.routes.js';
import { decrementConcurrent } from './services/bot-traffic.service.js';
import { runRetentionCleanup } from './services/retention.service.js';
import { DispatcherService } from './services/dispatcher.service.js';
import { LIMITS } from '@opensolve/shared';
import './types/index.js';

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
  bodyLimit: 10 * 1024, // 10KB max body size
  trustProxy: true, // Behind Traefik — request.ip returns real client IP from X-Forwarded-For
});

async function buildServer() {
  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'none'"],
        styleSrc: ["'none'"],
        imgSrc: ["'none'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    hidePoweredBy: true,
  });

  // CORS
  await app.register(cors, {
    origin: env.WEB_URL,
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: LIMITS.GLOBAL_RATE_LIMIT_PER_HOUR,
    timeWindow: '1 hour',
    keyGenerator: (request) => request.ip || 'unknown',
    allowList: (request) => {
      const ip = request.ip || '';
      // Layer 1: Internal Docker traffic (web → api) — no limit
      if (ip.startsWith('10.') || ip.startsWith('172.') || ip === '127.0.0.1' || ip === '::1') return true;
      return false;
    },
  });

  // JWT
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });

  // Cookies (COOKIE_SECRET preferred; falls back to JWT_SECRET for backward compat)
  await app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET || env.JWT_SECRET,
  });

  // Decrement concurrent bot connections on response
  app.addHook('onResponse', async (request) => {
    if (request.bot) {
      decrementConcurrent().catch(() => {});
    }
  });

  // Health check with database connectivity
  app.get('/health', async (_request, reply) => {
    let dbStatus = 'ok';
    try {
      await db.execute(sql`SELECT 1`);
    } catch {
      dbStatus = 'error';
    }

    return reply.code(200).send({
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    });
  });

  // Register route modules
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(botRoutes, { prefix: '/api/v1' });
  await app.register(problemRoutes, { prefix: '/api/v1' });
  await app.register(leaderboardRoutes, { prefix: '/api/v1' });
  await app.register(searchRoutes, { prefix: '/api/v1' });
  await app.register(sseRoutes, { prefix: '/api/v1' });
  await app.register(solutionRoutes, { prefix: '/api/v1' });
  await app.register(adminRoutes, { prefix: '/api/v1' });
  await app.register(homepageRoutes, { prefix: '/api/v1' });
  await app.register(debugRoutes, { prefix: '/api/v1' });
  await app.register(llmLeaderboardRoutes, { prefix: '/api/v1' });
  await app.register(instructionRoutes, { prefix: '/api/v1' });
  await app.register(newsletterRoutes, { prefix: '/api/v1' });
  await app.register(adminEmailRoutes, { prefix: '/api/v1' });
  await app.register(contactRoutes, { prefix: '/api/v1' });

  return app;
}

async function start() {
  try {
    const server = await buildServer();

    // Task expiry sweep — runs every 30 seconds instead of per-request
    const TASK_EXPIRY_INTERVAL_MS = 30_000;
    // Dispatch counter refresh — runs every 60 seconds (counters have 300s TTL)
    const COUNTER_REFRESH_INTERVAL_MS = 60_000;
    // Retention cleanup — runs every 24 hours
    const RETENTION_INTERVAL_MS = 24 * 60 * 60 * 1000;
    const RETENTION_STARTUP_DELAY_MS = 10_000;
    const dispatcher = new DispatcherService();
    // eslint-disable-next-line prefer-const -- assigned after onClose hook captures the binding
    let expiryInterval: NodeJS.Timeout;
    // eslint-disable-next-line prefer-const -- assigned after onClose hook captures the binding
    let counterInterval: NodeJS.Timeout;
    let retentionInterval: NodeJS.Timeout;
    // eslint-disable-next-line prefer-const -- assigned after onClose hook captures the binding
    let retentionStartupTimeout: NodeJS.Timeout;

    // Register cleanup hook BEFORE listening
    server.addHook('onClose', async () => {
      clearInterval(expiryInterval);
      clearInterval(counterInterval);
      clearInterval(retentionInterval);
      clearTimeout(retentionStartupTimeout);
    });

    await server.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server running at http://localhost:${env.PORT}`);

    // Start expiry sweep AFTER listening
    expiryInterval = setInterval(async () => {
      try {
        // Find flag tasks about to expire so we can track failures
        const expiringFlagTasks = await db
          .select({ problemId: tasks.problemId })
          .from(tasks)
          .where(
            and(
              eq(tasks.status, 'assigned'),
              eq(tasks.taskType, 'flag'),
              lt(tasks.expiresAt, new Date())
            )
          );

        const result = await db.update(tasks)
          .set({ status: 'expired' })
          .where(
            and(
              eq(tasks.status, 'assigned'),
              lt(tasks.expiresAt, new Date())
            )
          );
        const expiredCount = (result as unknown as { count: number }).count;
        if (expiredCount > 0) {
          server.log.info(`Expired ${expiredCount} stale tasks`);
        }

        // Track expired flag tasks as failed attempts — auto-reject poison problems
        for (const t of expiringFlagTasks) {
          if (t.problemId) {
            try {
              const [problem] = await db.update(problems)
                .set({
                  failedFlagAttempts: sql`${problems.failedFlagAttempts} + 1`,
                  updatedAt: new Date(),
                })
                .where(eq(problems.id, t.problemId))
                .returning({ id: problems.id, failedFlagAttempts: problems.failedFlagAttempts, status: problems.status });

              if (problem && problem.failedFlagAttempts >= 5 && problem.status === 'pending') {
                await db.update(problems)
                  .set({ status: 'rejected' as any, updatedAt: new Date() })
                  .where(and(eq(problems.id, t.problemId), eq(problems.status, 'pending')));
                server.log.warn({ problemId: t.problemId, attempts: problem.failedFlagAttempts },
                  'Auto-rejected problem after repeated expired flag tasks');
              }
            } catch { /* non-critical */ }
          }
        }
      } catch (err) {
        server.log.error(err, 'Task expiry sweep failed');
      }
    }, TASK_EXPIRY_INTERVAL_MS);

    // Dispatch counter refresh — warm Redis fast-path counters
    dispatcher.refreshCounters().catch(err => {
      server.log.error(err, 'Initial dispatch counter refresh failed');
    });
    counterInterval = setInterval(async () => {
      try {
        await dispatcher.refreshCounters();
      } catch (err) {
        server.log.error(err, 'Dispatch counter refresh failed');
      }
    }, COUNTER_REFRESH_INTERVAL_MS);

    // Retention cleanup — initial run after 10s delay, then every 24 hours
    retentionStartupTimeout = setTimeout(async () => {
      try {
        await runRetentionCleanup();
      } catch (err) {
        server.log.error(err, 'Retention cleanup failed');
      }
      retentionInterval = setInterval(async () => {
        try {
          await runRetentionCleanup();
        } catch (err) {
          server.log.error(err, 'Retention cleanup failed');
        }
      }, RETENTION_INTERVAL_MS);
    }, RETENTION_STARTUP_DELAY_MS);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

void start();

export { app, buildServer };
