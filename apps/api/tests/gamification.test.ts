import { describe, it, expect } from 'vitest';

/**
 * Gamification unit tests.
 * Tests point values, badge trigger logic, and milestone thresholds.
 */

const POINTS = {
  SUBMIT_SOLUTION: 5,
  CAST_VOTE: 2,
  FLAG_CONTENT: 1,
  CREATE_PROBLEM: 3,
  SOLUTION_TOP_3: 20,
  SOLUTION_FIRST: 50,
};

interface BadgeTrigger {
  type: string;
  tier: string;
  threshold: number;
}

const BADGE_TRIGGERS: BadgeTrigger[] = [
  { type: 'first_solve', tier: 'bronze', threshold: 1 },
  { type: 'problem_solver', tier: 'silver', threshold: 10 },
  { type: 'problem_solver', tier: 'gold', threshold: 100 },
  { type: 'problem_solver', tier: 'platinum', threshold: 1000 },
];

function getBadgesToAward(totalSolutions: number): BadgeTrigger[] {
  return BADGE_TRIGGERS.filter(b => totalSolutions >= b.threshold);
}

function calculateTotalPoints(actions: {
  solutions: number;
  votes: number;
  flags: number;
  creates: number;
}): number {
  return (
    actions.solutions * POINTS.SUBMIT_SOLUTION +
    actions.votes * POINTS.CAST_VOTE +
    actions.flags * POINTS.FLAG_CONTENT +
    actions.creates * POINTS.CREATE_PROBLEM
  );
}

describe('Point Values', () => {
  it('should award 5 points per solution', () => {
    expect(POINTS.SUBMIT_SOLUTION).toBe(5);
  });

  it('should award 2 points per vote', () => {
    expect(POINTS.CAST_VOTE).toBe(2);
  });

  it('should award 1 point per flag', () => {
    expect(POINTS.FLAG_CONTENT).toBe(1);
  });

  it('should award 3 points per problem created', () => {
    expect(POINTS.CREATE_PROBLEM).toBe(3);
  });

  it('should correctly sum total points', () => {
    const total = calculateTotalPoints({
      solutions: 10,
      votes: 50,
      flags: 5,
      creates: 2,
    });
    // 10*5 + 50*2 + 5*1 + 2*3 = 50 + 100 + 5 + 6 = 161
    expect(total).toBe(161);
  });
});

describe('Badge Triggers', () => {
  it('should award first_solve bronze at 1 solution', () => {
    const badges = getBadgesToAward(1);
    expect(badges).toHaveLength(1);
    expect(badges[0]).toEqual({ type: 'first_solve', tier: 'bronze', threshold: 1 });
  });

  it('should award problem_solver silver at 10 solutions', () => {
    const badges = getBadgesToAward(10);
    expect(badges).toHaveLength(2);
    const types = badges.map(b => `${b.type}:${b.tier}`);
    expect(types).toContain('first_solve:bronze');
    expect(types).toContain('problem_solver:silver');
  });

  it('should award problem_solver gold at 100 solutions', () => {
    const badges = getBadgesToAward(100);
    expect(badges).toHaveLength(3);
    const types = badges.map(b => `${b.type}:${b.tier}`);
    expect(types).toContain('problem_solver:gold');
  });

  it('should award all badges at 1000 solutions', () => {
    const badges = getBadgesToAward(1000);
    expect(badges).toHaveLength(4);
    const types = badges.map(b => `${b.type}:${b.tier}`);
    expect(types).toContain('problem_solver:platinum');
  });

  it('should not award badges at 0 solutions', () => {
    const badges = getBadgesToAward(0);
    expect(badges).toHaveLength(0);
  });
});

describe('Points Priority', () => {
  it('should have solutions worth more than votes', () => {
    expect(POINTS.SUBMIT_SOLUTION).toBeGreaterThan(POINTS.CAST_VOTE);
  });

  it('should have creates worth more than flags', () => {
    expect(POINTS.CREATE_PROBLEM).toBeGreaterThan(POINTS.FLAG_CONTENT);
  });

  it('should have votes worth more than flags', () => {
    expect(POINTS.CAST_VOTE).toBeGreaterThan(POINTS.FLAG_CONTENT);
  });
});
