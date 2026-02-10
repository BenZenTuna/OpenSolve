import { describe, it, expect } from 'vitest';

/**
 * Pair Selector unit tests.
 * Tests the three pairing strategies: Swiss, Uniform Exposure, Random.
 */

interface Solution {
  id: string;
  text: string;
  btScore: number;
  comparisonCount: number;
}

interface SelectedPair {
  solutionA: Solution;
  solutionB: Solution;
}

// Pure implementations extracted from PairSelectorService

function swissSystemPair(
  sols: Solution[],
  votedPairs: Set<string>
): SelectedPair | null {
  const sorted = [...sols].sort((a, b) => b.btScore - a.btScore);

  // Adjacent pairs
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const pairKey = [a.id, b.id].sort().join('|');
    if (!votedPairs.has(pairKey)) {
      return { solutionA: a, solutionB: b };
    }
  }

  // Gap of 2
  for (let i = 0; i < sorted.length - 2; i++) {
    const a = sorted[i];
    const b = sorted[i + 2];
    const pairKey = [a.id, b.id].sort().join('|');
    if (!votedPairs.has(pairKey)) {
      return { solutionA: a, solutionB: b };
    }
  }

  return null;
}

function uniformExposurePair(
  sols: Solution[],
  votedPairs: Set<string>
): SelectedPair | null {
  const sorted = [...sols].sort((a, b) => a.comparisonCount - b.comparisonCount);

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const pairKey = [sorted[i].id, sorted[j].id].sort().join('|');
      if (!votedPairs.has(pairKey)) {
        return { solutionA: sorted[i], solutionB: sorted[j] };
      }
    }
  }

  return null;
}

function randomPair(
  sols: Solution[],
  votedPairs: Set<string>
): SelectedPair | null {
  const shuffled = [...sols].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i++) {
    for (let j = i + 1; j < shuffled.length; j++) {
      const pairKey = [shuffled[i].id, shuffled[j].id].sort().join('|');
      if (!votedPairs.has(pairKey)) {
        return { solutionA: shuffled[i], solutionB: shuffled[j] };
      }
    }
  }

  return null;
}

const makeSolution = (id: string, btScore: number, comparisonCount = 0): Solution => ({
  id,
  text: `Solution ${id}`,
  btScore,
  comparisonCount,
});

describe('Swiss System Pairing', () => {
  it('should pair adjacent solutions by BT score', () => {
    const sols = [
      makeSolution('a', 1600),
      makeSolution('b', 1500),
      makeSolution('c', 1400),
      makeSolution('d', 1300),
    ];

    const pair = swissSystemPair(sols, new Set());
    expect(pair).not.toBeNull();
    // Should be the top two adjacent: a (1600) and b (1500)
    expect(pair!.solutionA.id).toBe('a');
    expect(pair!.solutionB.id).toBe('b');
  });

  it('should skip already-voted pairs', () => {
    const sols = [
      makeSolution('a', 1600),
      makeSolution('b', 1500),
      makeSolution('c', 1400),
    ];

    // a|b already voted
    const voted = new Set(['a|b']);
    const pair = swissSystemPair(sols, voted);
    expect(pair).not.toBeNull();
    // Next adjacent pair: b (1500) and c (1400)
    expect(pair!.solutionA.id).toBe('b');
    expect(pair!.solutionB.id).toBe('c');
  });

  it('should fall back to gap-of-2 when adjacent are exhausted', () => {
    const sols = [
      makeSolution('a', 1600),
      makeSolution('b', 1500),
      makeSolution('c', 1400),
    ];

    // Both adjacent pairs voted
    const voted = new Set(['a|b', 'b|c']);
    const pair = swissSystemPair(sols, voted);
    expect(pair).not.toBeNull();
    // Gap of 2: a (1600) and c (1400)
    expect(pair!.solutionA.id).toBe('a');
    expect(pair!.solutionB.id).toBe('c');
  });

  it('should return null when all pairs are exhausted', () => {
    const sols = [
      makeSolution('a', 1600),
      makeSolution('b', 1500),
      makeSolution('c', 1400),
    ];

    const voted = new Set(['a|b', 'b|c', 'a|c']);
    const pair = swissSystemPair(sols, voted);
    expect(pair).toBeNull();
  });
});

describe('Uniform Exposure Pairing', () => {
  it('should prioritize solutions with fewest comparisons', () => {
    const sols = [
      makeSolution('a', 1600, 10),
      makeSolution('b', 1500, 2),
      makeSolution('c', 1400, 0),
      makeSolution('d', 1300, 5),
    ];

    const pair = uniformExposurePair(sols, new Set());
    expect(pair).not.toBeNull();
    // c (0 comparisons) should be first, then b (2 comparisons)
    expect(pair!.solutionA.id).toBe('c');
    expect(pair!.solutionB.id).toBe('b');
  });

  it('should work with all equal comparison counts', () => {
    const sols = [
      makeSolution('a', 1600, 5),
      makeSolution('b', 1500, 5),
      makeSolution('c', 1400, 5),
    ];

    const pair = uniformExposurePair(sols, new Set());
    expect(pair).not.toBeNull();
  });
});

describe('Random Pairing', () => {
  it('should return a valid pair', () => {
    const sols = [
      makeSolution('a', 1600),
      makeSolution('b', 1500),
      makeSolution('c', 1400),
    ];

    const pair = randomPair(sols, new Set());
    expect(pair).not.toBeNull();
    expect(pair!.solutionA.id).not.toBe(pair!.solutionB.id);
  });

  it('should return null when all pairs are voted', () => {
    const sols = [
      makeSolution('a', 1600),
      makeSolution('b', 1500),
    ];

    const voted = new Set(['a|b']);
    const pair = randomPair(sols, voted);
    expect(pair).toBeNull();
  });
});

describe('Pair Deduplication', () => {
  it('should treat a|b and b|a as the same pair', () => {
    const key1 = ['a', 'b'].sort().join('|');
    const key2 = ['b', 'a'].sort().join('|');
    expect(key1).toBe(key2);
  });

  it('should prevent same pair from being selected twice', () => {
    const sols = [
      makeSolution('x', 1500),
      makeSolution('y', 1500),
    ];

    // First selection
    const pair1 = randomPair(sols, new Set());
    expect(pair1).not.toBeNull();

    // Mark as voted
    const pairKey = [pair1!.solutionA.id, pair1!.solutionB.id].sort().join('|');
    const voted = new Set([pairKey]);

    // Second selection — should be null (only 2 solutions, 1 pair)
    const pair2 = randomPair(sols, voted);
    expect(pair2).toBeNull();
  });
});

describe('Edge Cases', () => {
  it('should return null with fewer than 2 solutions', () => {
    const sols = [makeSolution('a', 1500)];
    expect(swissSystemPair(sols, new Set())).toBeNull();
    expect(uniformExposurePair(sols, new Set())).toBeNull();
    expect(randomPair(sols, new Set())).toBeNull();
  });

  it('should handle exactly 2 solutions', () => {
    const sols = [
      makeSolution('a', 1600),
      makeSolution('b', 1400),
    ];

    const pair = swissSystemPair(sols, new Set());
    expect(pair).not.toBeNull();
    expect(pair!.solutionA.id).toBe('a');
    expect(pair!.solutionB.id).toBe('b');
  });
});
