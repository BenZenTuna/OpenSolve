import { db } from '../config/database.js';
import { flags, problems } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

export class ModerationService {
  async processFlag(
    problemId: string,
    botId: string,
    verdict: 'green' | 'red',
    category: string
  ): Promise<{ newStatus: string }> {
    // Record the flag
    await db.insert(flags).values({
      problemId,
      botId,
      verdict,
      category: category as any,
    });

    // Update counters
    if (verdict === 'green') {
      await db.update(problems)
        .set({ greenFlags: sql`${problems.greenFlags} + 1` })
        .where(eq(problems.id, problemId));
    } else {
      await db.update(problems)
        .set({ redFlags: sql`${problems.redFlags} + 1` })
        .where(eq(problems.id, problemId));
    }

    // Get updated problem
    const [problem] = await db.select().from(problems).where(eq(problems.id, problemId));
    const totalFlags = problem.greenFlags + problem.redFlags;

    // Determine new status
    let newStatus = problem.status;

    if (totalFlags >= 3) {
      if (problem.redFlags >= 2) {
        // 2 or more red flags = rejected
        newStatus = 'rejected';
      } else if (problem.greenFlags >= 3) {
        // 3 green flags = approved -> active
        newStatus = 'active';
      } else {
        // Mixed (e.g., 2 green, 1 red) — need more flags (tiebreaker)
        // Only transition at totalFlags >= 5 for mixed cases
        if (totalFlags >= 5) {
          newStatus = problem.greenFlags > problem.redFlags ? 'active' : 'rejected';
        }
        // Otherwise stay pending for more flags
      }
    }

    if (newStatus !== problem.status) {
      await db.update(problems)
        .set({ status: newStatus as any, updatedAt: new Date() })
        .where(eq(problems.id, problemId));
    }

    return { newStatus };
  }
}
