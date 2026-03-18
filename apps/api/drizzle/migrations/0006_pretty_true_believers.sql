CREATE INDEX IF NOT EXISTS "problems_solve_dispatch_idx" ON "problems" ("status","attention_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_vote_dispatch_idx" ON "problems" ("status","solution_count","attention_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_flag_dispatch_idx" ON "problems" ("status","created_at");