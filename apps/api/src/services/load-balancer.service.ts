import { redis } from '../config/redis.js';

const HOURLY_KEY = 'global:activity:hourly';
const HOURLY_TOTAL_KEY = 'global:activity:hourly:total';
const MAX_TRAFFIC_PERCENT = 30;
const ACTIVITY_TTL = 3600; // 1 hour
const PROBLEM_ACTIVITY_PREFIX = 'problem:activity:';

export class LoadBalancerService {
  /**
   * Check if a problem can receive more bot traffic this hour.
   * Enforces the 30% max traffic constraint.
   */
  async canAssign(problemId: string | null): Promise<boolean> {
    if (!problemId) return true;

    const [hourlyCount, totalRaw] = await Promise.all([
      redis.hget(HOURLY_KEY, problemId),
      redis.get(HOURLY_TOTAL_KEY),
    ]);

    const problemCount = parseInt(hourlyCount || '0', 10);
    const totalCount = parseInt(totalRaw || '0', 10);

    // If total is very low, don't restrict
    if (totalCount < 10) return true;

    // Check 30% constraint
    const trafficPercent = (problemCount / totalCount) * 100;
    return trafficPercent < MAX_TRAFFIC_PERCENT;
  }

  /**
   * Record a task assignment for load tracking.
   */
  async recordAssignment(problemId: string | null): Promise<void> {
    if (!problemId) return;

    const key = `${PROBLEM_ACTIVITY_PREFIX}${problemId}`;
    const now = Date.now();
    const cutoff = now - 30 * 60 * 1000;

    await Promise.all([
      redis.hincrby(HOURLY_KEY, problemId, 1)
        .then(() => redis.expire(HOURLY_KEY, ACTIVITY_TTL)),
      redis.incr(HOURLY_TOTAL_KEY)
        .then(() => redis.expire(HOURLY_TOTAL_KEY, ACTIVITY_TTL)),
      redis.zadd(key, now, `${now}`)
        .then(() => redis.expire(key, ACTIVITY_TTL))
        .then(() => redis.zremrangebyscore(key, 0, cutoff)),
    ]);
  }

  /**
   * Get recent activity count for a problem (last 30 minutes).
   */
  async getRecentActivity(problemId: string): Promise<number> {
    const key = `${PROBLEM_ACTIVITY_PREFIX}${problemId}`;
    const cutoff = Date.now() - 30 * 60 * 1000;
    return redis.zcount(key, cutoff, '+inf');
  }

  /**
   * Calculate attention score for a problem.
   * AttentionScore = (NeedWeight * Deficit) / (1 + RecentActivity)
   */
  async calculateAttentionScore(
    problemId: string,
    isHumanAuthored: boolean,
    currentSolutions: number,
    targetSolutions: number,
    createdAt: Date
  ): Promise<number> {
    const needWeight = isHumanAuthored ? 2.0 : 1.0;
    const deficit = Math.max(0, targetSolutions - currentSolutions);
    const recentActivity = await this.getRecentActivity(problemId);

    let score = (needWeight * deficit) / (1 + recentActivity);

    // New problem boost (< 2 hours old)
    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (ageHours < 2) {
      score *= 1.5;
    }

    return score;
  }

  /**
   * Reset hourly counters (called by scheduled job).
   */
  async resetHourlyCounters(): Promise<void> {
    await redis.del(HOURLY_KEY, HOURLY_TOTAL_KEY);
  }
}
