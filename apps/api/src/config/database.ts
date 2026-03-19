import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env.js';
import * as schema from '../db/schema.js';

const sql = postgres(env.DATABASE_URL, {
  max: 50,
  idle_timeout: 30,
  connect_timeout: 15,
});
export const db = drizzle(sql, { schema });
export { sql as pgClient };
