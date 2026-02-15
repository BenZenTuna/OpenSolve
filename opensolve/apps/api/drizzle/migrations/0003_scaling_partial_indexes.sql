-- Phase 2: Partial indexes for dispatcher hot paths
-- These dramatically speed up the dispatcher's most frequent queries
-- by only indexing the small subset of rows the dispatcher actually needs.
--
-- NOTE: We omit CONCURRENTLY because Drizzle's migration runner wraps
-- migrations in a transaction (required for advisory locks). At current
-- table sizes (<100K rows) the brief lock is negligible (milliseconds).

-- 1. Pending problems awaiting moderation (Flag task candidates)
-- Dispatcher: WHERE status = 'pending' ORDER BY created_at ASC LIMIT 10
CREATE INDEX IF NOT EXISTS idx_problems_pending_created
  ON problems (created_at ASC)
  WHERE status = 'pending';

-- 2. Active problems needing solutions (Solve task candidates)
-- Dispatcher: WHERE status = 'active' AND solution_count < 50 ORDER BY attention_score DESC
CREATE INDEX IF NOT EXISTS idx_problems_active_solvable
  ON problems (attention_score DESC)
  WHERE status = 'active' AND solution_count < 50;

-- 3. Problems with solutions ready for comparison (Vote task candidates)
-- Dispatcher: WHERE status IN ('active', 'mature') AND solution_count >= 2
CREATE INDEX IF NOT EXISTS idx_problems_votable
  ON problems (comparison_count ASC)
  WHERE status IN ('active', 'mature') AND solution_count >= 2;

-- 4. Active (assigned, not expired) tasks per bot
-- Every bot request checks: WHERE bot_id = $1 AND status = 'assigned'
CREATE INDEX IF NOT EXISTS idx_tasks_bot_active
  ON tasks (bot_id)
  WHERE status = 'assigned';

-- 5. Expired tasks sweep (the 30-second interval query)
-- Sweep: WHERE status = 'assigned' AND expires_at < NOW()
CREATE INDEX IF NOT EXISTS idx_tasks_expiring
  ON tasks (expires_at)
  WHERE status = 'assigned';

-- 6. Solutions per problem ordered by BT score (leaderboard/podium queries)
-- Frequently: WHERE problem_id = $1 ORDER BY bt_score DESC
CREATE INDEX IF NOT EXISTS idx_solutions_problem_bt
  ON solutions (problem_id, bt_score DESC);

-- 7. Comparisons voter+problem lookup (vote deduplication)
-- Pair selector: WHERE voter_bot_id = $1 AND problem_id = $2
CREATE INDEX IF NOT EXISTS idx_comparisons_voter_problem
  ON comparisons (voter_bot_id, problem_id);
