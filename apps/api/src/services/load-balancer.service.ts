import { redis } from '../config/redis.js';

const HOURLY_KEY = 'global:activity:hourly';
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

    const hourlyCount = await redis.hget(HOURLY_KEY, problemId);
    const totalHourly = await redis.hlen(HOURLY_KEY);

    // If no activity yet, always allow
    if (!totalHourly || totalHourly === 0) return true;

    const problemCount = parseInt(hourlyCount || '0', 10);
    const totalCount = await this.getTotalHourlyCount();

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

    // Increment hourly counter
    await redis.hincrby(HOURLY_KEY, problemId, 1);
    await redis.expire(HOURLY_KEY, ACTIVITY_TTL);

    // Record in problem-specific activity set (timestamps)
    const key = `${PROBLEM_ACTIVITY_PREFIX}${problemId}`;
    const now = Date.now();
    await redis.zadd(key, now, `${now}`);
    await redis.expire(key, ACTIVITY_TTL);

    // Prune old entries (older than 30 minutes)
    const cutoff = now - 30 * 60 * 1000;
    await redis.zremrangebyscore(key, 0, cutoff);
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
   * Get total count of all hourly assignments.
   */
  private async getTotalHourlyCount(): Promise<number> {
    const allCounts = await redis.hvals(HOURLY_KEY);
    return allCounts.reduce((sum, val) => sum + parseInt(val, 10), 0);
  }

  /**
   * Reset hourly counters (called by scheduled job).
   */
  async resetHourlyCounters(): Promise<void> {
    await redis.del(HOURLY_KEY);
  }
}
