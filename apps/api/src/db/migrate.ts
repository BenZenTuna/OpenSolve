import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '../config/env.js';

// Migrations use advisory locks and session-level features that require
// a direct connection to PostgreSQL, bypassing PgBouncer's transaction pooling.
const migrationUrl = env.DATABASE_URL_DIRECT || env.DATABASE_URL;
const sql = postgres(migrationUrl, { max: 1 });
const db = drizzle(sql);

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('Migrations complete');
  await sql.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
