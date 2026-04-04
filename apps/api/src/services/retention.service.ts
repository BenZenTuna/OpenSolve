import { db } from '../config/database.js';
import { activityLog, tasks, problems } from '../db/schema.js';
import { flushVisitStatsToDb } from './visit-tracking.service.js';
import { and, eq, lt, inArray, SQL } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import {
  RETENTION_ACTIVITY_LOG_DAYS,
  RETENTION_COMPLETED_TASKS_DAYS,
  RETENTION_EXPIRED_TASKS_DAYS,
  RETENTION_REJECTED_PROBLEMS_DAYS,
} from '@opensolve/shared';
import type { PgTable } from 'drizzle-orm/pg-core';

const BATCH_SIZE = 500;
const BATCH_PAUSE_MS = 100;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Delete rows in batches of BATCH_SIZE with a 100ms pause between batches
 * to avoid sustained lock pressure on high-traffic tables.
 */
async function batchDelete(
  table: PgTable & { id: unknown },
  condition: SQL,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  idColumn: any,
): Promise<number> {
  let totalDeleted = 0;
  let batchDeleted: number;
  do {
    const idsToDelete = await db
      .select({ id: idColumn })
      .from(table)
      .where(condition)
      .limit(BATCH_SIZE);

    if (idsToDelete.length === 0) break;

    await db.delete(table)
      .where(inArray(idColumn, idsToDelete.map(r => r.id)));

    batchDeleted = idsToDelete.length;
    totalDeleted += batchDeleted;

    if (batchDeleted === BATCH_SIZE) {
      await new Promise(resolve => setTimeout(resolve, BATCH_PAUSE_MS));
    }
  } while (batchDeleted === BATCH_SIZE);
  return totalDeleted;
}

export interface RetentionResult {
  activityLogsDeleted: number;
  completedTasksDeleted: number;
  expiredTasksDeleted: number;
  rejectedProblemsDeleted: number;
}

export async function runRetentionCleanup(): Promise<RetentionResult> {
  logger.info('GDPR retention cleanup started');

  // Flush yesterday's visit stats from Redis to PostgreSQL before cleanup
  try {
    await flushVisitStatsToDb();
  } catch (err) {
    logger.error({ err }, 'Visit stats flush failed (continuing with retention)');
  }

  try {
    // Activity logs older than 90 days
    const activityLogsDeleted = await batchDelete(
      activityLog,
      lt(activityLog.createdAt, daysAgo(RETENTION_ACTIVITY_LOG_DAYS)),
      activityLog.id,
    );

    // Completed tasks older than 30 days
    const completedTasksDeleted = await batchDelete(
      tasks,
      and(
        eq(tasks.status, 'completed'),
        lt(tasks.completedAt, daysAgo(RETENTION_COMPLETED_TASKS_DAYS)),
      )!,
      tasks.id,
    );

    // Expired tasks older than 7 days
    const expiredTasksDeleted = await batchDelete(
      tasks,
      and(
        eq(tasks.status, 'expired'),
        lt(tasks.expiresAt, daysAgo(RETENTION_EXPIRED_TASKS_DAYS)),
      )!,
      tasks.id,
    );

    // Rejected problems older than 30 days (cascade deletes related flags)
    const rejectedProblemsDeleted = await batchDelete(
      problems,
      and(
        eq(problems.status, 'rejected'),
        lt(problems.updatedAt, daysAgo(RETENTION_REJECTED_PROBLEMS_DAYS)),
      )!,
      problems.id,
    );

    const result: RetentionResult = {
      activityLogsDeleted,
      completedTasksDeleted,
      expiredTasksDeleted,
      rejectedProblemsDeleted,
    };

    logger.info(
      { activityLogsDeleted, completedTasksDeleted, expiredTasksDeleted, rejectedProblemsDeleted },
      'GDPR retention cleanup complete',
    );

    return result;
  } catch (err) {
    logger.error({ err }, 'GDPR retention cleanup failed');
    throw err;
  }
}
