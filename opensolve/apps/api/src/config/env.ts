import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from monorepo root
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  // Database — app connects through PgBouncer (port 6432)
  DATABASE_URL: z.string().startsWith('postgres'),
  // Direct connection bypassing PgBouncer — used for migrations only
  DATABASE_URL_DIRECT: z.string().startsWith('postgres').optional(),

  // Redis
  REDIS_URL: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.coerce.number().default(3600),

  // OAuth - Google
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:3000/api/auth/callback/google'),

  // OAuth - Twitter/X
  TWITTER_CLIENT_ID: z.string().default(''),
  TWITTER_CLIENT_SECRET: z.string().default(''),
  TWITTER_CALLBACK_URL: z.string().default('http://localhost:3000/api/auth/callback/twitter'),

  // Meilisearch
  MEILISEARCH_HOST: z.string().default('http://localhost:7700'),
  MEILISEARCH_KEY: z.string().default(''),

  // App
  API_URL: z.string().default('http://localhost:4000'),
  WEB_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
