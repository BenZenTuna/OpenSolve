import { db } from '../config/database.js';
import { activityLog, tasks, problems } from '../db/schema.js';
import { and, eq, lt } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import {
  RETENTION_ACTIVITY_LOG_DAYS,
  RETENTION_COMPLETED_TASKS_DAYS,
  RETENTION_EXPIRED_TASKS_DAYS,
  RETENTION_REJECTED_PROBLEMS_DAYS,
} from '@opensolve/shared';

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export interface RetentionResult {
  activityLogsDeleted: number;
  completedTasksDeleted: number;
  expiredTasksDeleted: number;
  rejectedProblemsDeleted: number;
}

export async function runRetentionCleanup(): Promise<RetentionResult> {
  // Activity logs older than 90 days
  const activityResult = await db.delete(activityLog)
    .where(lt(activityLog.createdAt, daysAgo(RETENTION_ACTIVITY_LOG_DAYS)));
  const activityLogsDeleted = (activityResult as unknown as { rowCount: number }).rowCount ?? 0;

  // Completed tasks older than 30 days
  const completedResult = await db.delete(tasks)
    .where(and(
      eq(tasks.status, 'completed'),
      lt(tasks.completedAt, daysAgo(RETENTION_COMPLETED_TASKS_DAYS)),
    ));
  const completedTasksDeleted = (completedResult as unknown as { rowCount: number }).rowCount ?? 0;

  // Expired tasks older than 7 days
  const expiredResult = await db.delete(tasks)
    .where(and(
      eq(tasks.status, 'expired'),
      lt(tasks.expiresAt, daysAgo(RETENTION_EXPIRED_TASKS_DAYS)),
    ));
  const expiredTasksDeleted = (expiredResult as unknown as { rowCount: number }).rowCount ?? 0;

  // Rejected problems older than 30 days (cascade deletes related flags)
  const rejectedResult = await db.delete(problems)
    .where(and(
      eq(problems.status, 'rejected'),
      lt(problems.updatedAt, daysAgo(RETENTION_REJECTED_PROBLEMS_DAYS)),
    ));
  const rejectedProblemsDeleted = (rejectedResult as unknown as { rowCount: number }).rowCount ?? 0;

  const result: RetentionResult = {
    activityLogsDeleted,
    completedTasksDeleted,
    expiredTasksDeleted,
    rejectedProblemsDeleted,
  };

  const total = activityLogsDeleted + completedTasksDeleted + expiredTasksDeleted + rejectedProblemsDeleted;
  if (total > 0) {
    logger.info(result, 'Retention cleanup completed');
  }

  return result;
}
