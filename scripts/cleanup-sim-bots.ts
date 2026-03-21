/**
 * OpenSolve Simulation Cleanup Script
 *
 * Removes all synthetic sim-bot users (cascade deletes bots, solutions,
 * comparisons, flags, tasks, badges, activity_log) and flushes Redis.
 *
 * Usage:
 *   DATABASE_URL=postgres://opensolve:<pw>@localhost:15432/opensolve \
 *   REDIS_URL=redis://localhost:6379 \
 *   tsx scripts/cleanup-sim-bots.ts
 */

import postgres from 'postgres';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const KEYS_FILE = path.join(process.cwd(), 'scripts', '.sim-keys.json');

async function main() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = postgres(DATABASE_URL);

  // ── Count what will be deleted ──
  console.log('=== Counting sim-bot data ===\n');

  const counts = await sql`
    WITH sim_users AS (
      SELECT id FROM users WHERE email LIKE 'sim-bot-%@opensolve.test'
    ),
    sim_bots AS (
      SELECT id FROM bots WHERE owner_id IN (SELECT id FROM sim_users)
    )
    SELECT
      (SELECT COUNT(*)::int FROM sim_users) AS users,
      (SELECT COUNT(*)::int FROM sim_bots) AS bots,
      (SELECT COUNT(*)::int FROM solutions WHERE bot_id IN (SELECT id FROM sim_bots)) AS solutions,
      (SELECT COUNT(*)::int FROM comparisons WHERE voter_bot_id IN (SELECT id FROM sim_bots)) AS comparisons,
      (SELECT COUNT(*)::int FROM flags WHERE bot_id IN (SELECT id FROM sim_bots)) AS flags,
      (SELECT COUNT(*)::int FROM tasks WHERE bot_id IN (SELECT id FROM sim_bots)) AS tasks,
      (SELECT COUNT(*)::int FROM badges WHERE bot_id IN (SELECT id FROM sim_bots)) AS badges,
      (SELECT COUNT(*)::int FROM activity_log WHERE bot_id IN (SELECT id FROM sim_bots)) AS activity_log
  `;

  const c = counts[0];
  console.log(`  Users:        ${c.users}`);
  console.log(`  Bots:         ${c.bots}`);
  console.log(`  Solutions:    ${c.solutions}`);
  console.log(`  Comparisons:  ${c.comparisons}`);
  console.log(`  Flags:        ${c.flags}`);
  console.log(`  Tasks:        ${c.tasks}`);
  console.log(`  Badges:       ${c.badges}`);
  console.log(`  Activity log: ${c.activity_log}`);

  if (c.users === 0) {
    console.log('\n  No sim-bot data found. Nothing to clean up.');
    await sql.end();
    return;
  }

  // ── Delete users (FK cascades handle the rest) ──
  console.log('\n=== Deleting sim-bot users (cascade) ===');

  const deleted = await sql`
    DELETE FROM users WHERE email LIKE 'sim-bot-%@opensolve.test'
    RETURNING id
  `;
  console.log(`  Deleted ${deleted.length} users (cascade cleaned bots, solutions, etc.)`);

  // ── Recalculate problem counters ──
  console.log('\n=== Recalculating problem counters ===');

  await sql`
    UPDATE problems p SET
      solution_count = (SELECT COUNT(*)::int FROM solutions s WHERE s.problem_id = p.id),
      comparison_count = (SELECT COUNT(*)::int FROM comparisons c WHERE c.problem_id = p.id),
      green_flags = (SELECT COUNT(*)::int FROM flags f WHERE f.problem_id = p.id AND f.verdict = 'green'),
      red_flags = (SELECT COUNT(*)::int FROM flags f WHERE f.problem_id = p.id AND f.verdict = 'red')
  `;
  console.log('  Done.');

  // ── Flush Redis ──
  console.log('\n=== Flushing Redis ===');
  try {
    const redis = new Redis(REDIS_URL);
    await redis.flushall();
    console.log('  FLUSHALL complete.');
    await redis.quit();
  } catch (err) {
    console.error('  Redis flush failed (may need SSH tunnel):', (err as Error).message);
  }

  // ── Remove cached keys file ──
  if (fs.existsSync(KEYS_FILE)) {
    fs.unlinkSync(KEYS_FILE);
    console.log(`\n  Removed ${KEYS_FILE}`);
  }

  await sql.end();
  console.log('\n=== Cleanup complete ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
