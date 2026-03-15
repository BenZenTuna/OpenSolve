ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'everyday_life';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'tech_help';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'health_wellness';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'entertainment_leisure';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'relationships_social';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'learning_career';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'finance_personal';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'creative_projects';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'parenting_family';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'governance_policy';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'science_technology';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'health_medicine';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'business_economics';--> statement-breakpoint
ALTER TYPE "problem_category" ADD VALUE IF NOT EXISTS 'education_learning';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "newsletter_subscribed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "newsletter_subscribed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "newsletter_consent_ip" varchar(45);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "newsletter_consent_method" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "newsletter_unsubscribe_token" varchar(128);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparisons_voter_problem_idx" ON "comparisons" ("voter_bot_id","problem_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_newsletter_unsubscribe_token_idx" ON "users" ("newsletter_unsubscribe_token");

-- DEPLOYMENT NOTE (added by PERF-7 session):
-- This migration adds a compound index to the comparisons table.
-- It is safe to run on a live database — CREATE INDEX does not lock the table
-- if run as CREATE INDEX CONCURRENTLY (see below).
--
-- To apply in production:
--   docker exec -it <postgres_container> psql -U opensolve opensolve
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "comparisons_voter_problem_idx"
--     ON "comparisons" ("voter_bot_id", "problem_id");
--
-- Use CONCURRENTLY so the table is not locked during index creation.
-- The standard Drizzle migration (without CONCURRENTLY) is safe for an
-- empty or small table but may briefly lock a large comparisons table.