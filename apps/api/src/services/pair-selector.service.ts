import { db } from '../config/database.js';
import { solutions, comparisons } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';

interface SolutionSlim {
  id: string;
  botId: string | null;
  btScore: number;
  comparisonCount: number;
}

interface Solution extends SolutionSlim {
  text: string;
}

interface SelectedPair {
  solutionA: Solution;
  solutionB: Solution;
}

export class PairSelectorService {
  /**
   * Select a pair of solutions for comparison.
   * Strategy mix: 50% Swiss, 30% uniform exposure, 20% random.
   */
  async selectPair(problemId: string, botId: string): Promise<SelectedPair | null> {
    // Parallel: slim solution columns for selection + bot's existing comparisons
    const [allSolutions, botComparisons] = await Promise.all([
      db.select({
        id: solutions.id,
        botId: solutions.botId,
        btScore: solutions.btScore,
        comparisonCount: solutions.comparisonCount,
      }).from(solutions).where(eq(solutions.problemId, problemId)),
      db.select({ aId: comparisons.solutionAId, bId: comparisons.solutionBId })
        .from(comparisons)
        .where(and(eq(comparisons.problemId, problemId), eq(comparisons.voterBotId, botId))),
    ]);

    if (allSolutions.length < 2) return null;

    const votedPairs = new Set(
      botComparisons.map(c => [c.aId, c.bId].sort().join('|'))
    );

    // Choose strategy
    const rand = Math.random();
    let slimPair: { solutionA: SolutionSlim; solutionB: SolutionSlim } | null = null;

    if (rand < 0.50) {
      slimPair = this.swissSystemPair(allSolutions, votedPairs);
    } else if (rand < 0.80) {
      slimPair = this.uniformExposurePair(allSolutions, votedPairs);
    } else {
      slimPair = this.randomPair(allSolutions, votedPairs);
    }

    // Fallback: try remaining strategies
    if (!slimPair) slimPair = this.randomPair(allSolutions, votedPairs);
    if (!slimPair) slimPair = this.uniformExposurePair(allSolutions, votedPairs);
    if (!slimPair) slimPair = this.swissSystemPair(allSolutions, votedPairs);

    if (!slimPair) return null;

    // Normalize: smaller ID always in position A (matches unique index ordering)
    if (slimPair.solutionA.id > slimPair.solutionB.id) {
      const temp = slimPair.solutionA;
      slimPair.solutionA = slimPair.solutionB;
      slimPair.solutionB = temp;
    }

    // Hydrate text for the 2 selected solutions only
    const selectedIds = [slimPair.solutionA.id, slimPair.solutionB.id];
    const texts = await db.select({ id: solutions.id, text: solutions.text })
      .from(solutions)
      .where(inArray(solutions.id, selectedIds));

    const textMap = new Map(texts.map(t => [t.id, t.text]));

    return {
      solutionA: { ...slimPair.solutionA, text: textMap.get(slimPair.solutionA.id) || '' },
      solutionB: { ...slimPair.solutionB, text: textMap.get(slimPair.solutionB.id) || '' },
    };
  }

  /**
   * Swiss-system: pair solutions with similar BT scores.
   * Most informative for ranking accuracy.
   */
  private swissSystemPair(
    sols: SolutionSlim[],
    votedPairs: Set<string>
  ): { solutionA: SolutionSlim; solutionB: SolutionSlim } | null {
    const sorted = [...sols].sort((a, b) => b.btScore - a.btScore);

    // Try adjacent pairs (most informative)
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const pairKey = [a.id, b.id].sort().join('|');
      if (!votedPairs.has(pairKey)) {
        return { solutionA: a, solutionB: b };
      }
    }

    // Try pairs with gap of 2
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

  /**
   * Uniform exposure: prioritize solutions with fewest comparisons.
   * Ensures every idea gets fair evaluation.
   */
  private uniformExposurePair(
    sols: SolutionSlim[],
    votedPairs: Set<string>
  ): { solutionA: SolutionSlim; solutionB: SolutionSlim } | null {
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

  /**
   * Pure random: maintains graph connectivity.
   */
  private randomPair(
    sols: SolutionSlim[],
    votedPairs: Set<string>
  ): { solutionA: SolutionSlim; solutionB: SolutionSlim } | null {
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
}
