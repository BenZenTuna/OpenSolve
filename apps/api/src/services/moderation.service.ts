import { db } from '../config/database.js';
import { flags, problems } from '../db/schema.js';
import { eq, and, sql, asc } from 'drizzle-orm';

export class ModerationService {
  async processFlag(
    problemId: string,
    botId: string,
    verdict: 'green' | 'red',
    _category: string
  ): Promise<{ newStatus: string }> {
    // Atomic increment + read — prevents race condition when two flags arrive simultaneously
    const [problem] = await db.update(problems)
      .set(
        verdict === 'green'
          ? { greenFlags: sql`${problems.greenFlags} + 1` }
          : { redFlags: sql`${problems.redFlags} + 1` }
      )
      .where(eq(problems.id, problemId))
      .returning();
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ status: newStatus as any, updatedAt: new Date() })
        .where(and(eq(problems.id, problemId), eq(problems.status, 'pending')));
    }

    // Assign category when problem becomes active
    if (newStatus === 'active') {
      await this.assignCategoryFromFlags(problemId);
    }

    return { newStatus };
  }

  async assignCategoryFromFlags(problemId: string): Promise<void> {
    // Get all flags for this problem with their suggested categories
    const allFlags = await db
      .select()
      .from(flags)
      .where(eq(flags.problemId, problemId))
      .orderBy(asc(flags.createdAt));

    // Get the problem to check if it already has a creator-assigned category
    const [problem] = await db
      .select()
      .from(problems)
      .where(eq(problems.id, problemId));

    // Only consider green flags with a suggested category
    const greenFlags = allFlags.filter(f => f.verdict === 'green' && f.suggestedCategory);

    if (greenFlags.length === 0) {
      // No category suggestions from flaggers — keep creator's category or leave null
      return;
    }

    // Count category votes
    const categoryCounts: Record<string, { count: number; firstBotId: string | null }> = {};
    for (const flag of greenFlags) {
      const cat = flag.suggestedCategory!;
      if (!categoryCounts[cat]) {
        categoryCounts[cat] = { count: 0, firstBotId: flag.botId };
      }
      categoryCounts[cat].count++;
    }

    // Find the category with the most votes
    let bestCategory = '';
    let bestCount = 0;
    let assignedByBotId: string | null = null;

    for (const [cat, data] of Object.entries(categoryCounts)) {
      if (data.count > bestCount) {
        bestCategory = cat;
        bestCount = data.count;
        assignedByBotId = data.firstBotId;
      }
    }

    // If there's a tie or all different — use the earliest flagger's suggestion
    if (bestCount === 1 && greenFlags.length > 1) {
      bestCategory = greenFlags[0].suggestedCategory!;
      assignedByBotId = greenFlags[0].botId;
    }

    // For bot-created problems: override only if flaggers have stronger consensus
    if (problem.category && problem.authorType === 'bot') {
      const creatorCategoryCount = categoryCounts[problem.category]?.count ?? 0;
      if (creatorCategoryCount >= bestCount) {
        // Flaggers don't have a stronger consensus — keep creator's category
        return;
      }
    }

    // Assign the category
    await db.update(problems).set({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      category: bestCategory as any,
      categoryAssignedBy: assignedByBotId,
    }).where(eq(problems.id, problemId));
  }
}
