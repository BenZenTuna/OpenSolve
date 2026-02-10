import { describe, it, expect } from 'vitest';

/**
 * Load Balancer unit tests.
 * Tests attention score calculation and traffic constraint logic.
 */

const MAX_TRAFFIC_PERCENT = 30;

function canAssign(
  problemCount: number,
  totalCount: number
): boolean {
  // If total is very low, always allow
  if (totalCount < 10) return true;

  // Check 30% constraint
  const trafficPercent = (problemCount / totalCount) * 100;
  return trafficPercent < MAX_TRAFFIC_PERCENT;
}

function calculateAttentionScore(
  isHumanAuthored: boolean,
  currentSolutions: number,
  targetSolutions: number,
  recentActivity: number,
  ageHours: number
): number {
  const needWeight = isHumanAuthored ? 2.0 : 1.0;
  const deficit = Math.max(0, targetSolutions - currentSolutions);
  let score = (needWeight * deficit) / (1 + recentActivity);

  // New problem boost (< 2 hours old)
  if (ageHours < 2) {
    score *= 1.5;
  }

  return score;
}

describe('Traffic Constraint (30% max)', () => {
  it('should allow assignment when total is low (< 10)', () => {
    expect(canAssign(5, 8)).toBe(true);
  });

  it('should allow assignment when under 30%', () => {
    expect(canAssign(10, 100)).toBe(true); // 10%
  });

  it('should block assignment when at 30%', () => {
    expect(canAssign(30, 100)).toBe(false); // 30% — not strictly less
  });

  it('should block assignment when over 30%', () => {
    expect(canAssign(50, 100)).toBe(false); // 50%
  });

  it('should allow first assignment to any problem', () => {
    expect(canAssign(0, 0)).toBe(true);
    expect(canAssign(0, 5)).toBe(true);
  });

  it('should handle edge case of problem having all traffic', () => {
    expect(canAssign(100, 100)).toBe(false); // 100%
  });

  it('should allow just under 30%', () => {
    expect(canAssign(29, 100)).toBe(true); // 29%
  });
});

describe('Attention Score', () => {
  it('should give human problems 2x weight', () => {
    const humanScore = calculateAttentionScore(true, 5, 50, 0, 10);
    const botScore = calculateAttentionScore(false, 5, 50, 0, 10);
    expect(humanScore).toBe(botScore * 2);
  });

  it('should give higher score for larger deficit', () => {
    const lowDeficit = calculateAttentionScore(false, 45, 50, 0, 10);
    const highDeficit = calculateAttentionScore(false, 5, 50, 0, 10);
    expect(highDeficit).toBeGreaterThan(lowDeficit);
  });

  it('should reduce score with more recent activity', () => {
    const noActivity = calculateAttentionScore(false, 5, 50, 0, 10);
    const someActivity = calculateAttentionScore(false, 5, 50, 10, 10);
    expect(noActivity).toBeGreaterThan(someActivity);
  });

  it('should give 1.5x boost to problems < 2 hours old', () => {
    const newProblem = calculateAttentionScore(false, 5, 50, 0, 1);
    const oldProblem = calculateAttentionScore(false, 5, 50, 0, 10);
    expect(newProblem).toBe(oldProblem * 1.5);
  });

  it('should not boost problems >= 2 hours old', () => {
    const twoHours = calculateAttentionScore(false, 5, 50, 0, 2);
    const threeHours = calculateAttentionScore(false, 5, 50, 0, 3);
    expect(twoHours).toBe(threeHours); // Both get no boost
  });

  it('should return 0 when at or above target', () => {
    const atTarget = calculateAttentionScore(false, 50, 50, 0, 10);
    const aboveTarget = calculateAttentionScore(false, 60, 50, 0, 10);
    expect(atTarget).toBe(0);
    expect(aboveTarget).toBe(0);
  });

  it('should handle zero recent activity correctly', () => {
    const score = calculateAttentionScore(false, 0, 50, 0, 10);
    // deficit=50, weight=1, activity=0 → 50/(1+0) = 50
    expect(score).toBe(50);
  });
});
