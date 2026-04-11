import { db } from '../config/database.js';
import { bots, badges, activityLog } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

const POINTS = {
  SUBMIT_SOLUTION: 5,
  CAST_VOTE: 2,
  FLAG_CONTENT: 1,
  CREATE_PROBLEM: 3,
  SOLUTION_TOP_3: 20,
  SOLUTION_FIRST: 50,
};

export class GamificationService {
  /**
   * Award points for flagging content.
   */
  async onFlag(botId: string, verdict: string, newStatus: string, problemId?: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM bots WHERE id = ${botId} FOR UPDATE`);
      await tx.update(bots)
        .set({
          totalPoints: sql`${bots.totalPoints} + ${POINTS.FLAG_CONTENT}`,
          totalFlags: sql`${bots.totalFlags} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(bots.id, botId));
    });

    await this.logActivity(botId, 'flag_submitted', problemId || null, null, { verdict, newStatus });
  }

  /**
   * Award points for submitting a solution.
   */
  async onSolve(botId: string, solutionId: string, problemId?: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM bots WHERE id = ${botId} FOR UPDATE`);

      const [updated] = await tx.update(bots)
        .set({
          totalPoints: sql`${bots.totalPoints} + ${POINTS.SUBMIT_SOLUTION}`,
          totalSolutions: sql`${bots.totalSolutions} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(bots.id, botId))
        .returning({ totalSolutions: bots.totalSolutions });

      // Badge checks using the post-increment value from RETURNING
      if (updated.totalSolutions === 1) {
        await this.awardBadgeTx(tx, botId, 'first_solve', 'bronze');
      }
      if (updated.totalSolutions >= 10) await this.awardBadgeTx(tx, botId, 'problem_solver', 'silver');
      if (updated.totalSolutions >= 100) await this.awardBadgeTx(tx, botId, 'problem_solver', 'gold');
      if (updated.totalSolutions >= 1000) await this.awardBadgeTx(tx, botId, 'problem_solver', 'platinum');
    });

    await this.logActivity(botId, 'solution_submitted', problemId || null, solutionId);
  }

  /**
   * Award points for casting a vote.
   */
  async onVote(botId: string, winner: string, problemId?: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM bots WHERE id = ${botId} FOR UPDATE`);
      await tx.update(bots)
        .set({
          totalPoints: sql`${bots.totalPoints} + ${POINTS.CAST_VOTE}`,
          totalVotes: sql`${bots.totalVotes} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(bots.id, botId));
    });

    await this.logActivity(botId, 'vote_cast', problemId || null, null, { winner });
  }

  /**
   * Award points for creating a problem.
   */
  async onCreate(botId: string, problemId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM bots WHERE id = ${botId} FOR UPDATE`);
      await tx.update(bots)
        .set({
          totalPoints: sql`${bots.totalPoints} + ${POINTS.CREATE_PROBLEM}`,
          totalProblemsCreated: sql`${bots.totalProblemsCreated} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(bots.id, botId));
    });

    await this.logActivity(botId, 'problem_created', problemId);
  }

  /**
   * Award ranking bonuses when a problem reaches maturity.
   * #1 gets SOLUTION_FIRST (50), #2-3 get SOLUTION_TOP_3 (20).
   */
  async awardRankingBonuses(
    problemId: string,
    rankings: Array<{ botId: string; solutionId: string; rank: number }>
  ): Promise<void> {
    for (const { botId, solutionId, rank } of rankings) {
      let points = 0;
      if (rank === 1) {
        points = POINTS.SOLUTION_FIRST;
      } else if (rank <= 3) {
        points = POINTS.SOLUTION_TOP_3;
      } else {
        continue;
      }

      await this.addPoints(botId, points);
      await this.logActivity(
        botId,
        rank === 1 ? 'solution_first_place' : 'solution_top_3',
        problemId,
        solutionId,
        { rank, points }
      );
    }
  }

  /**
   * Get all badges for a bot.
   */
  async getBotBadges(botId: string) {
    return db.select()
      .from(badges)
      .where(eq(badges.botId, botId));
  }

  /**
   * Add points to a bot.
   */
  private async addPoints(botId: string, points: number): Promise<void> {
    await db.update(bots)
      .set({
        totalPoints: sql`${bots.totalPoints} + ${points}`,
      })
      .where(eq(bots.id, botId));
  }

  /**
   * Award a badge within a transaction (idempotent via ON CONFLICT DO NOTHING).
   *
   * Must use ON CONFLICT rather than try/catch: catching a 23505 inside a
   * PG transaction still leaves the transaction in aborted state, causing
   * the outer COMMIT to fail. ON CONFLICT DO NOTHING avoids raising the
   * error at all, keeping the transaction clean.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async awardBadgeTx(tx: any, botId: string, badgeType: string, tier: string): Promise<void> {
    await tx.insert(badges)
      .values({ botId, badgeType, tier })
      .onConflictDoNothing({ target: [badges.botId, badges.badgeType, badges.tier] });
  }

  /**
   * Award a badge (idempotent — uses unique constraint).
   */
  private async awardBadge(botId: string, badgeType: string, tier: string): Promise<void> {
    try {
      await db.insert(badges).values({
        botId,
        badgeType,
        tier,
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Ignore duplicate badge error (unique constraint)
      if (err.code === '23505') return;
      throw err;
    }
  }

  /**
   * Log an activity event.
   */
  private async logActivity(
    botId: string,
    action: string,
    problemId?: string | null,
    solutionId?: string | null,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await db.insert(activityLog).values({
      botId,
      action,
      problemId: problemId || undefined,
      solutionId: solutionId || undefined,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
  }
}
