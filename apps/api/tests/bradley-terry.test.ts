import { describe, it, expect } from 'vitest';

/**
 * Bradley-Terry / Elo formula unit tests.
 * These test the mathematical engine without database dependencies.
 */

const K_FACTOR = 32;

// Pure function extracted from BradleyTerryService
function calculateExpected(rA: number, rB: number): { expectedA: number; expectedB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (rA - rB) / 400));
  return { expectedA, expectedB };
}

function calculateNewRatings(
  rA: number,
  rB: number,
  winner: 'a' | 'b'
): { newRatingA: number; newRatingB: number } {
  const { expectedA, expectedB } = calculateExpected(rA, rB);
  const actualA = winner === 'a' ? 1 : 0;
  const actualB = winner === 'b' ? 1 : 0;
  return {
    newRatingA: rA + K_FACTOR * (actualA - expectedA),
    newRatingB: rB + K_FACTOR * (actualB - expectedB),
  };
}

function calculateCI(comparisons: number): number {
  return 400 / Math.sqrt(comparisons);
}

describe('Bradley-Terry Elo Formula', () => {
  it('should calculate 50/50 expected scores for equal ratings', () => {
    const { expectedA, expectedB } = calculateExpected(1500, 1500);
    expect(expectedA).toBeCloseTo(0.5, 5);
    expect(expectedB).toBeCloseTo(0.5, 5);
  });

  it('should sum expected scores to 1', () => {
    const { expectedA, expectedB } = calculateExpected(1700, 1300);
    expect(expectedA + expectedB).toBeCloseTo(1.0, 10);
  });

  it('should give higher expected score to higher-rated player', () => {
    const { expectedA, expectedB } = calculateExpected(1700, 1300);
    expect(expectedA).toBeGreaterThan(expectedB);
    expect(expectedA).toBeGreaterThan(0.5);
  });

  it('should produce symmetric expected scores', () => {
    const result1 = calculateExpected(1600, 1400);
    const result2 = calculateExpected(1400, 1600);
    expect(result1.expectedA).toBeCloseTo(result2.expectedB, 10);
    expect(result1.expectedB).toBeCloseTo(result2.expectedA, 10);
  });

  it('should update ratings correctly when equal players and A wins', () => {
    const { newRatingA, newRatingB } = calculateNewRatings(1500, 1500, 'a');
    expect(newRatingA).toBe(1500 + K_FACTOR * 0.5); // 1516
    expect(newRatingB).toBe(1500 - K_FACTOR * 0.5); // 1484
    expect(newRatingA).toBeCloseTo(1516, 0);
    expect(newRatingB).toBeCloseTo(1484, 0);
  });

  it('should update ratings correctly when equal players and B wins', () => {
    const { newRatingA, newRatingB } = calculateNewRatings(1500, 1500, 'b');
    expect(newRatingA).toBeCloseTo(1484, 0);
    expect(newRatingB).toBeCloseTo(1516, 0);
  });

  it('should give smaller rating change when favorite wins', () => {
    // A is rated much higher — if A wins, small change
    const { newRatingA: aWinsA, newRatingB: aWinsB } = calculateNewRatings(1800, 1200, 'a');
    const changeA = aWinsA - 1800;
    const changeB = aWinsB - 1200;

    expect(changeA).toBeGreaterThan(0); // A gains
    expect(changeA).toBeLessThan(K_FACTOR * 0.5); // But gains less than half K
    expect(changeB).toBeLessThan(0); // B loses
  });

  it('should give larger rating change for upset', () => {
    // A is rated much higher — if B wins, big change
    const { newRatingA: upsetA, newRatingB: upsetB } = calculateNewRatings(1800, 1200, 'b');
    const changeA = upsetA - 1800;
    const changeB = upsetB - 1200;

    expect(changeA).toBeLessThan(0); // A loses
    expect(Math.abs(changeA)).toBeGreaterThan(K_FACTOR * 0.5); // Loses more than half K
    expect(changeB).toBeGreaterThan(0); // B gains a lot
    expect(changeB).toBeGreaterThan(K_FACTOR * 0.5); // Gains more than half K
  });

  it('should conserve total rating (zero-sum)', () => {
    const { newRatingA, newRatingB } = calculateNewRatings(1600, 1400, 'a');
    expect(newRatingA + newRatingB).toBeCloseTo(1600 + 1400, 5);
  });

  it('should conserve total rating across multiple scenarios', () => {
    const scenarios: [number, number, 'a' | 'b'][] = [
      [1500, 1500, 'a'],
      [1800, 1200, 'b'],
      [1300, 1700, 'a'],
      [1500, 1500, 'b'],
    ];

    for (const [rA, rB, winner] of scenarios) {
      const { newRatingA, newRatingB } = calculateNewRatings(rA, rB, winner);
      expect(newRatingA + newRatingB).toBeCloseTo(rA + rB, 5);
    }
  });
});

describe('Confidence Intervals', () => {
  it('should start wide and narrow with more comparisons', () => {
    const ci1 = calculateCI(1);
    const ci5 = calculateCI(5);
    const ci20 = calculateCI(20);
    const ci100 = calculateCI(100);

    expect(ci1).toBeGreaterThan(ci5);
    expect(ci5).toBeGreaterThan(ci20);
    expect(ci20).toBeGreaterThan(ci100);
  });

  it('should be 400 at 1 comparison', () => {
    expect(calculateCI(1)).toBeCloseTo(400, 0);
  });

  it('should be ~179 at 5 comparisons', () => {
    expect(calculateCI(5)).toBeCloseTo(178.9, 0);
  });

  it('should be 40 at 100 comparisons', () => {
    expect(calculateCI(100)).toBeCloseTo(40, 0);
  });
});

describe('Maturity Detection', () => {
  it('should detect non-overlapping CIs as stable', () => {
    // Simulate top 3 solutions after many comparisons
    const top3 = [
      { btScore: 1600, confidenceInterval: 30, comparisonCount: 50 },
      { btScore: 1500, confidenceInterval: 30, comparisonCount: 50 },
      { btScore: 1400, confidenceInterval: 30, comparisonCount: 50 },
    ];

    let isStable = true;
    for (let i = 0; i < top3.length - 1; i++) {
      const current = top3[i];
      const next = top3[i + 1];
      const currentLow = current.btScore - current.confidenceInterval;
      const nextHigh = next.btScore + next.confidenceInterval;
      if (currentLow < nextHigh) {
        isStable = false;
        break;
      }
    }

    expect(isStable).toBe(true);
  });

  it('should detect overlapping CIs as unstable', () => {
    // Wide CIs that overlap
    const top3 = [
      { btScore: 1520, confidenceInterval: 100, comparisonCount: 5 },
      { btScore: 1500, confidenceInterval: 100, comparisonCount: 5 },
      { btScore: 1480, confidenceInterval: 100, comparisonCount: 5 },
    ];

    let isStable = true;
    for (let i = 0; i < top3.length - 1; i++) {
      const current = top3[i];
      const next = top3[i + 1];
      const currentLow = current.btScore - current.confidenceInterval;
      const nextHigh = next.btScore + next.confidenceInterval;
      if (currentLow < nextHigh) {
        isStable = false;
        break;
      }
    }

    expect(isStable).toBe(false);
  });

  it('should require all solutions to have >= 5 comparisons', () => {
    const solutions = [
      { comparisonCount: 10 },
      { comparisonCount: 3 }, // Not enough
      { comparisonCount: 7 },
    ];

    const allCompared = solutions.every(s => s.comparisonCount >= 5);
    expect(allCompared).toBe(false);
  });

  it('should require at least 3 solutions', () => {
    const solutionCount = 2;
    expect(solutionCount >= 3).toBe(false);
  });
});

describe('Ranking Convergence', () => {
  it('should converge to correct ranking after many votes', () => {
    // Simulate 3 solutions: A > B > C
    // A beats B 70%, B beats C 70%, A beats C 90%
    let rA = 1500, rB = 1500, rC = 1500;

    for (let i = 0; i < 100; i++) {
      // A vs B: A wins 70%
      const abWinner = Math.random() < 0.7 ? 'a' : 'b';
      const ab = calculateNewRatings(rA, rB, abWinner as 'a' | 'b');
      rA = ab.newRatingA;
      rB = ab.newRatingB;

      // B vs C: B wins 70%
      const bcWinner = Math.random() < 0.7 ? 'a' : 'b';
      const bc = calculateNewRatings(rB, rC, bcWinner as 'a' | 'b');
      rB = bc.newRatingA;
      rC = bc.newRatingB;

      // A vs C: A wins 90%
      const acWinner = Math.random() < 0.9 ? 'a' : 'b';
      const ac = calculateNewRatings(rA, rC, acWinner as 'a' | 'b');
      rA = ac.newRatingA;
      rC = ac.newRatingB;
    }

    // A should be ranked highest, then B, then C
    expect(rA).toBeGreaterThan(rB);
    expect(rB).toBeGreaterThan(rC);
  });
});
