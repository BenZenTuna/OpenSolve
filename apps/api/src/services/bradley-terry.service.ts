import { db } from '../config/database.js';
import { solutions, comparisons, problems, bots } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { redis } from '../config/redis.js';
import { LlmLeaderboardService } from './llm-leaderboard.service.js';
import { GamificationService } from './gamification.service.js';

const K_FACTOR = 32;
const llmLeaderboard = new LlmLeaderboardService();
const gamification = new GamificationService();

export class BradleyTerryService {
  /**
   * Process a new comparison result and update scores.
   * Called every time a bot submits a vote.
   */
  async processVote(
    problemId: string,
    solutionAId: string,
    solutionBId: string,
    winner: 'a' | 'b' | 'skip',
    voterBotId: string
  ): Promise<{ solutionA: { newScore: number }; solutionB: { newScore: number } }> {
    // Record the comparison — guard against duplicate votes on same pair
    try {
      await db.insert(comparisons).values({
        problemId,
        solutionAId,
        solutionBId,
        voterBotId,
        winner,
      });
    } catch (err: any) {
      if (err.code === '23505') {
        // Bot already voted on this pair — return current scores
        const [solA] = await db.select().from(solutions).where(eq(solutions.id, solutionAId));
        const [solB] = await db.select().from(solutions).where(eq(solutions.id, solutionBId));
        return { solutionA: { newScore: solA.btScore }, solutionB: { newScore: solB.btScore } };
      }
      throw err;
    }

    // If skip, only increment comparison counts (atomic, no lock needed)
    if (winner === 'skip') {
      await Promise.all([
        db.update(solutions)
          .set({ comparisonCount: sql`${solutions.comparisonCount} + 1` })
          .where(eq(solutions.id, solutionAId)),
        db.update(solutions)
          .set({ comparisonCount: sql`${solutions.comparisonCount} + 1` })
          .where(eq(solutions.id, solutionBId)),
        db.update(problems)
          .set({ comparisonCount: sql`${problems.comparisonCount} + 1` })
          .where(eq(problems.id, problemId)),
      ]);

      const [solA] = await db.select().from(solutions).where(eq(solutions.id, solutionAId));
      const [solB] = await db.select().from(solutions).where(eq(solutions.id, solutionBId));
      return { solutionA: { newScore: solA.btScore }, solutionB: { newScore: solB.btScore } };
    }

    // === TRANSACTION: Lock both solutions, read, calculate, write atomically ===
    const result = await db.transaction(async (tx) => {
      // Lock both rows — consistent ordering by ID to prevent deadlocks
      const [idFirst, idSecond] = [solutionAId, solutionBId].sort();
      await tx.execute(sql`SELECT id FROM solutions WHERE id = ${idFirst} FOR UPDATE`);
      await tx.execute(sql`SELECT id FROM solutions WHERE id = ${idSecond} FOR UPDATE`);

      // Read current scores (locked)
      const [solutionA] = await tx.select().from(solutions).where(eq(solutions.id, solutionAId));
      const [solutionB] = await tx.select().from(solutions).where(eq(solutions.id, solutionBId));

      const rA = solutionA.btScore;
      const rB = solutionB.btScore;

      // Expected scores: P(i > j) = 1 / (1 + 10^((Rj - Ri) / 400))
      const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
      const expectedB = 1 / (1 + Math.pow(10, (rA - rB) / 400));

      const actualA = winner === 'a' ? 1 : 0;
      const actualB = winner === 'b' ? 1 : 0;

      const newRatingA = rA + K_FACTOR * (actualA - expectedA);
      const newRatingB = rB + K_FACTOR * (actualB - expectedB);

      const ciA = 400 / Math.sqrt(solutionA.comparisonCount + 1);
      const ciB = 400 / Math.sqrt(solutionB.comparisonCount + 1);

      // Update solution A
      const updateA: Record<string, unknown> = {
        btScore: newRatingA,
        comparisonCount: sql`${solutions.comparisonCount} + 1`,
        confidenceInterval: ciA,
      };
      if (winner === 'a') updateA.winCount = sql`${solutions.winCount} + 1`;
      if (winner === 'b') updateA.lossCount = sql`${solutions.lossCount} + 1`;
      await tx.update(solutions).set(updateA).where(eq(solutions.id, solutionAId));

      // Update solution B
      const updateB: Record<string, unknown> = {
        btScore: newRatingB,
        comparisonCount: sql`${solutions.comparisonCount} + 1`,
        confidenceInterval: ciB,
      };
      if (winner === 'b') updateB.winCount = sql`${solutions.winCount} + 1`;
      if (winner === 'a') updateB.lossCount = sql`${solutions.lossCount} + 1`;
      await tx.update(solutions).set(updateB).where(eq(solutions.id, solutionBId));

      // ── Update globalElo for both solution bots (avg of top 20 solutions) ──
      const botIdA = solutionA.botId;
      const botIdB = solutionB.botId;
      const botIdsToUpdate = new Set<string>();
      if (botIdA) botIdsToUpdate.add(botIdA);
      if (botIdB) botIdsToUpdate.add(botIdB);

      for (const botId of botIdsToUpdate) {
        await tx.execute(sql`
          UPDATE bots SET global_elo = COALESCE((
            SELECT AVG(bt_score)::int FROM (
              SELECT bt_score FROM solutions
              WHERE bot_id = ${botId}
              ORDER BY bt_score DESC
              LIMIT 20
            ) top_solutions
          ), 1200)
          WHERE id = ${botId}
        `);
      }

      // ── Update voteAccuracy for the voting bot ──
      // Lock voter bot row to prevent concurrent accuracy overwrites
      const voterRows = await tx.execute(sql`
        SELECT total_votes, vote_accuracy FROM bots WHERE id = ${voterBotId} FOR UPDATE
      `);
      const voterRaw = ((voterRows as { rows?: unknown[] }).rows ?? voterRows) as Array<{ total_votes: number; vote_accuracy: number }>;
      const voterBot = voterRaw[0];

      if (voterBot) {
        // Correct vote = voter picked the solution with the higher PRE-update score.
        // Using pre-update scores (rA, rB) avoids circular validation where the
        // vote's own K=32 Elo swing makes the chosen solution appear "correct."
        // Skip accuracy update entirely if pre-update scores are equal (no consensus).
        if (rA !== rB) {
          const voterCorrect =
            (winner === 'a' && rA > rB) ||
            (winner === 'b' && rB > rA);
          const correctVal = voterCorrect ? 1 : 0;

          // Rolling update: new_accuracy = ((old * (n-1)) + correct) / n
          // total_votes is the pre-gamification count; gamification increments it after this
          const prevVotes = voterBot.total_votes;
          const newAccuracy = prevVotes > 0
            ? ((voterBot.vote_accuracy * prevVotes) + correctVal) / (prevVotes + 1)
            : correctVal;

          await tx.update(bots)
            .set({ voteAccuracy: newAccuracy })
            .where(eq(bots.id, voterBotId));
        }
      }

      // Increment problem-level comparison count inside the transaction
      await tx.update(problems).set({
        comparisonCount: sql`${problems.comparisonCount} + 1`,
      }).where(eq(problems.id, problemId));

      return {
        newRatingA,
        newRatingB,
        llmModelA: solutionA.llmModel,
        llmModelB: solutionB.llmModel,
      };
    });
    // === END TRANSACTION ===

    await this.checkMaturity(problemId);

    // Debounced homepage cache invalidation
    const lastInvalidated = await redis.get('homepage:last_invalidated');
    const now = Date.now();
    const MIN_INVALIDATION_INTERVAL_MS = 30_000;

    if (!lastInvalidated || now - parseInt(lastInvalidated) > MIN_INVALIDATION_INTERVAL_MS) {
      await redis.del('homepage:spotlight', 'homepage:top-solutions:6', 'homepage:top-solutions:12', 'homepage:rising:3', 'homepage:rising:6');
      await redis.set('homepage:last_invalidated', now.toString(), 'EX', 60);
    }

    // Recalculate LLM model stats (every 10th comparison for efficiency)
    if (result.llmModelA) {
      const [modelA] = await db.select({ totalComparisons: solutions.comparisonCount }).from(solutions).where(eq(solutions.id, solutionAId));
      if (modelA && modelA.totalComparisons % 10 === 0) {
        llmLeaderboard.recalculateModelStats(result.llmModelA).catch(() => {});
      }
    }
    if (result.llmModelB) {
      const [modelB] = await db.select({ totalComparisons: solutions.comparisonCount }).from(solutions).where(eq(solutions.id, solutionBId));
      if (modelB && modelB.totalComparisons % 10 === 0) {
        llmLeaderboard.recalculateModelStats(result.llmModelB).catch(() => {});
      }
    }

    return {
      solutionA: { newScore: result.newRatingA },
      solutionB: { newScore: result.newRatingB },
    };
  }

  /**
   * Get ranked solutions for a problem.
   */
  async getRankedSolutions(problemId: string, limit?: number) {
    return db.select()
      .from(solutions)
      .where(eq(solutions.problemId, problemId))
      .orderBy(sql`${solutions.btScore} DESC`)
      .limit(limit || 100);
  }

  /**
   * Get top 3 solutions for display.
   */
  async getTopSolutions(problemId: string) {
    return this.getRankedSolutions(problemId, 3);
  }

  /**
   * Check if a problem's rankings are mature (stable).
   * Conditions: >=3 solutions, all have >=5 comparisons, top 3 CIs don't overlap.
   */
  private async checkMaturity(problemId: string): Promise<void> {
    const allSolutions = await db.select()
      .from(solutions)
      .where(eq(solutions.problemId, problemId));

    if (allSolutions.length < 3) return;

    const allCompared = allSolutions.every(s => s.comparisonCount >= 5);
    if (!allCompared) return;

    const sorted = allSolutions.sort((a, b) => b.btScore - a.btScore);
    const top3 = sorted.slice(0, 3);

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

    if (!isStable) return;

    // Atomic transition: only one concurrent caller wins the race
    const [updated] = await db.update(problems)
      .set({ status: 'mature', updatedAt: new Date() })
      .where(and(eq(problems.id, problemId), sql`${problems.status} != 'mature'`))
      .returning({ id: problems.id });

    if (!updated) return;

    // Award ranking bonuses to top 3 solutions' bots
    const top3Rankings = sorted.slice(0, 3)
      .map((solution, index) => ({
        botId: solution.botId,
        solutionId: solution.id,
        rank: index + 1,
      }))
      .filter((r): r is { botId: string; solutionId: string; rank: number } => r.botId !== null);

    await gamification.awardRankingBonuses(problemId, top3Rankings);
  }
}
