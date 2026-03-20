import { db } from '../config/database.js';
import { solutions, llmModels } from '../db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';
import { getModelFamily } from '@opensolve/shared';

export function extractModelFamily(modelName: string): string {
  return getModelFamily(modelName).family;
}

export class LlmLeaderboardService {
  /**
   * Record a model usage when a solution is submitted.
   * Upserts into the llm_models table.
   */
  async recordModel(modelName: string, modelVersion: string | null, _botId: string): Promise<void> {
    const family = extractModelFamily(modelName);

    // Check if model exists
    const [existing] = await db
      .select({ id: llmModels.id })
      .from(llmModels)
      .where(eq(llmModels.modelName, modelName))
      .limit(1);

    if (existing) {
      // Update existing
      const [botCount] = await db
        .select({ count: sql<number>`count(DISTINCT ${solutions.botId})::int` })
        .from(solutions)
        .where(eq(solutions.llmModel, modelName));

      await db.update(llmModels)
        .set({
          totalSolutions: sql`${llmModels.totalSolutions} + 1`,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
          uniqueBots: botCount.count,
          modelVersion: modelVersion || undefined,
          modelFamily: family,
        })
        .where(eq(llmModels.id, existing.id));
    } else {
      // Insert new — catch duplicate if concurrent request already inserted
      try {
        await db.insert(llmModels).values({
          modelName,
          modelVersion,
          modelFamily: family,
          totalSolutions: 1,
          uniqueBots: 1,
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.code === '23505') {
          // Model was inserted by concurrent request — increment its count
          await db.update(llmModels)
            .set({
              totalSolutions: sql`${llmModels.totalSolutions} + 1`,
              lastSeenAt: new Date(),
            })
            .where(eq(llmModels.modelName, modelName));
          return;
        }
        throw err;
      }
    }
  }

  /**
   * Recalculate aggregate stats for a model from the solutions table.
   * Called periodically after votes (every 10th comparison for the model).
   */
  async recalculateModelStats(modelName: string): Promise<void> {
    // Check if we should skip (only recalculate every 10th comparison)
    const [model] = await db
      .select({ id: llmModels.id, totalComparisons: llmModels.totalComparisons })
      .from(llmModels)
      .where(eq(llmModels.modelName, modelName))
      .limit(1);

    if (!model) return;

    // Get aggregate stats from solutions table
    const [stats] = await db
      .select({
        avgBtScore: sql<number>`COALESCE(avg(${solutions.btScore}), 1500)::real`,
        bestBtScore: sql<number>`COALESCE(max(${solutions.btScore}), 1500)::real`,
        totalWins: sql<number>`COALESCE(sum(${solutions.winCount}), 0)::int`,
        totalComparisons: sql<number>`COALESCE(sum(${solutions.comparisonCount}), 0)::int`,
        totalSolutions: sql<number>`count(*)::int`,
        uniqueBots: sql<number>`count(DISTINCT ${solutions.botId})::int`,
      })
      .from(solutions)
      .where(eq(solutions.llmModel, modelName));

    const winRate = stats.totalComparisons > 0
      ? stats.totalWins / stats.totalComparisons
      : 0;

    // Count top 3 placements and #1 placements (ranked against ALL solutions per problem)
    const placements = await db.execute(sql`
      WITH ranked AS (
        SELECT
          s.id,
          s.problem_id,
          s.llm_model,
          ROW_NUMBER() OVER (PARTITION BY s.problem_id ORDER BY s.bt_score DESC) AS rank
        FROM solutions s
        WHERE s.comparison_count >= 1
      )
      SELECT
        count(*) FILTER (WHERE rank <= 3) AS top3_count,
        count(*) FILTER (WHERE rank = 1) AS first_place_count
      FROM ranked
      WHERE llm_model = ${modelName}
    `);

    const placementRows = (placements as { rows?: unknown[] }).rows ?? placements;
    const placement = (placementRows as Array<{ top3_count: number; first_place_count: number }>)[0] || { top3_count: 0, first_place_count: 0 };

    await db.update(llmModels)
      .set({
        avgBtScore: stats.avgBtScore,
        bestBtScore: stats.bestBtScore,
        totalWins: stats.totalWins,
        totalComparisons: stats.totalComparisons,
        totalSolutions: stats.totalSolutions,
        uniqueBots: stats.uniqueBots,
        winRate,
        top3Count: Number(placement.top3_count) || 0,
        firstPlaceCount: Number(placement.first_place_count) || 0,
        updatedAt: new Date(),
      })
      .where(eq(llmModels.modelName, modelName));
  }

  /**
   * Get the LLM model leaderboard.
   */
  async getLeaderboard(options: {
    sort?: string;
    limit?: number;
    offset?: number;
    family?: string;
  }) {
    const { sort = 'win_rate', limit = 20, offset = 0, family } = options;

    const orderBy = {
      win_rate: desc(llmModels.winRate),
      avg_score: desc(llmModels.avgBtScore),
      first_place_count: desc(llmModels.firstPlaceCount),
      total_solutions: desc(llmModels.totalSolutions),
    }[sort] || desc(llmModels.winRate);

    const conditions = [];
    if (family) {
      conditions.push(eq(llmModels.modelFamily, family));
    }

    const query = db.select().from(llmModels);
    const whereClause = conditions.length > 0 ? conditions[0] : undefined;

    const [items, countResult] = await Promise.all([
      whereClause
        ? query.where(whereClause).orderBy(orderBy).limit(limit).offset(offset)
        : query.orderBy(orderBy).limit(limit).offset(offset),
      whereClause
        ? db.select({ count: sql<number>`count(*)::int` }).from(llmModels).where(whereClause)
        : db.select({ count: sql<number>`count(*)::int` }).from(llmModels),
    ]);

    return {
      models: items,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    };
  }

  /**
   * Get detailed stats for a specific model, including top solutions.
   */
  async getModelDetails(modelName: string) {
    const [model] = await db
      .select()
      .from(llmModels)
      .where(eq(llmModels.modelName, modelName))
      .limit(1);

    if (!model) return null;

    // Top 10 solutions by this model
    const topSolutions = await db.execute(sql`
      SELECT
        s.id,
        s.text,
        s.bt_score,
        s.comparison_count,
        s.win_count,
        s.loss_count,
        s.created_at,
        s.problem_id,
        p.title AS problem_title,
        b.name AS bot_name,
        u.bot_name AS owner_bot_name,
        (SELECT count(*) + 1 FROM solutions s2
         WHERE s2.problem_id = s.problem_id AND s2.bt_score > s.bt_score) AS rank
      FROM solutions s
      LEFT JOIN problems p ON s.problem_id = p.id
      LEFT JOIN bots b ON s.bot_id = b.id
      LEFT JOIN users u ON b.owner_id = u.id
      WHERE s.llm_model = ${modelName}
      ORDER BY s.bt_score DESC
      LIMIT 10
    `);

    // Unique bots using this model
    const botsUsing = await db.execute(sql`
      SELECT DISTINCT b.id, b.name, u.bot_name AS owner_bot_name
      FROM solutions s
      LEFT JOIN bots b ON s.bot_id = b.id
      LEFT JOIN users u ON b.owner_id = u.id
      WHERE s.llm_model = ${modelName}
        AND s.bot_id IS NOT NULL
    `);

    const topRows = (topSolutions as { rows?: unknown[] }).rows ?? topSolutions;
    const botRows = (botsUsing as { rows?: unknown[] }).rows ?? botsUsing;

    return {
      ...model,
      topSolutions: topRows,
      botsUsing: botRows,
    };
  }

  /**
   * Get model families with counts (for filter dropdown).
   */
  async getFamilies() {
    return db
      .select({
        family: llmModels.modelFamily,
        count: sql<number>`count(*)::int`,
      })
      .from(llmModels)
      .groupBy(llmModels.modelFamily)
      .orderBy(desc(sql`count(*)`));
  }

  /**
   * Full recalculation for all models (admin endpoint).
   */
  async recalculateAll(): Promise<number> {
    const allModels = await db
      .select({ modelName: llmModels.modelName })
      .from(llmModels);

    const CHUNK_SIZE = 5;
    let recalculated = 0;

    for (let i = 0; i < allModels.length; i += CHUNK_SIZE) {
      const chunk = allModels.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(m => this.recalculateModelStats(m.modelName)));
      recalculated += chunk.length;
      if (i + CHUNK_SIZE < allModels.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return recalculated;
  }
}
