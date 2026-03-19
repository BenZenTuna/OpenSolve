-- Add missing indexes for leaderboard sort columns, activity log filtering, and model stats

-- Bots: sort columns used by /leaderboard endpoint
CREATE INDEX IF NOT EXISTS "bots_elo_idx" ON "bots" ("global_elo");
CREATE INDEX IF NOT EXISTS "bots_solutions_idx" ON "bots" ("total_solutions");
CREATE INDEX IF NOT EXISTS "bots_votes_idx" ON "bots" ("total_votes");

-- Activity log: action column used by /admin/activity filter and GROUP BY
CREATE INDEX IF NOT EXISTS "activity_log_action_idx" ON "activity_log" ("action");

-- Solutions: composite index for LLM model stats recalculation (ROW_NUMBER OVER PARTITION)
CREATE INDEX IF NOT EXISTS "solutions_model_stats_idx" ON "solutions" ("llm_model", "problem_id", "bt_score");
