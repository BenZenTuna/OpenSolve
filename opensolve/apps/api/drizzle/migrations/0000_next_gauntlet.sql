DO $$ BEGIN
 CREATE TYPE "public"."author_type" AS ENUM('human', 'bot');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."bot_status" AS ENUM('active', 'suspended', 'banned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."flag_category" AS ENUM('sexual', 'drugs', 'weapons', 'criminal', 'ethical', 'hate_speech', 'harassment', 'none');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."flag_verdict" AS ENUM('green', 'red');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."oauth_provider" AS ENUM('google', 'twitter');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."problem_category" AS ENUM('science_technology', 'health_medicine', 'environment_climate', 'education_learning', 'business_economics', 'society_culture', 'governance_policy', 'urban_infrastructure', 'food_agriculture', 'safety_security', 'communication_media', 'space_exploration');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."problem_status" AS ENUM('pending', 'approved', 'rejected', 'active', 'mature');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."task_type" AS ENUM('flag', 'solve', 'vote', 'create');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('human', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."vote_winner" AS ENUM('a', 'b', 'skip');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" uuid,
	"human_user_id" uuid,
	"action" varchar(50) NOT NULL,
	"problem_id" uuid,
	"solution_id" uuid,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" uuid NOT NULL,
	"badge_type" varchar(50) NOT NULL,
	"tier" varchar(20) NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"status" "bot_status" DEFAULT 'active' NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"total_solutions" integer DEFAULT 0 NOT NULL,
	"total_votes" integer DEFAULT 0 NOT NULL,
	"total_flags" integer DEFAULT 0 NOT NULL,
	"total_problems_created" integer DEFAULT 0 NOT NULL,
	"vote_accuracy" real DEFAULT 0.5 NOT NULL,
	"global_elo" integer DEFAULT 1200 NOT NULL,
	"last_active_at" timestamp,
	"total_tasks_completed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comparisons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"solution_a_id" uuid NOT NULL,
	"solution_b_id" uuid NOT NULL,
	"voter_bot_id" uuid NOT NULL,
	"winner" "vote_winner" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"bot_id" uuid NOT NULL,
	"verdict" "flag_verdict" NOT NULL,
	"category" "flag_category" DEFAULT 'none' NOT NULL,
	"suggested_category" "problem_category",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "llm_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"model_version" varchar(50),
	"model_family" varchar(50),
	"total_solutions" integer DEFAULT 0 NOT NULL,
	"avg_bt_score" real DEFAULT 1500 NOT NULL,
	"best_bt_score" real DEFAULT 1500 NOT NULL,
	"total_wins" integer DEFAULT 0 NOT NULL,
	"total_comparisons" integer DEFAULT 0 NOT NULL,
	"win_rate" real DEFAULT 0 NOT NULL,
	"top3_count" integer DEFAULT 0 NOT NULL,
	"first_place_count" integer DEFAULT 0 NOT NULL,
	"unique_bots" integer DEFAULT 0 NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_type" "author_type" NOT NULL,
	"human_author_id" uuid,
	"bot_author_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"status" "problem_status" DEFAULT 'pending' NOT NULL,
	"category" "problem_category",
	"category_assigned_by" uuid,
	"category_confidence" real DEFAULT 0,
	"green_flags" integer DEFAULT 0 NOT NULL,
	"red_flags" integer DEFAULT 0 NOT NULL,
	"solution_count" integer DEFAULT 0 NOT NULL,
	"comparison_count" integer DEFAULT 0 NOT NULL,
	"attention_score" real DEFAULT 0 NOT NULL,
	"last_bot_activity_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"bot_id" uuid NOT NULL,
	"text" text NOT NULL,
	"llm_model" varchar(100),
	"llm_model_version" varchar(50),
	"bt_score" real DEFAULT 1500 NOT NULL,
	"comparison_count" integer DEFAULT 0 NOT NULL,
	"win_count" integer DEFAULT 0 NOT NULL,
	"loss_count" integer DEFAULT 0 NOT NULL,
	"confidence_interval" real DEFAULT 500 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bot_id" uuid NOT NULL,
	"task_type" "task_type" NOT NULL,
	"problem_id" uuid,
	"solution_a_id" uuid,
	"solution_b_id" uuid,
	"status" varchar(20) DEFAULT 'assigned' NOT NULL,
	"payload" text,
	"result" text,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50),
	"oauth_provider" "oauth_provider" NOT NULL,
	"oauth_id" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'human' NOT NULL,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"bot_name" varchar(50),
	"api_key_hash" varchar(255),
	"api_key_prefix" varchar(8),
	"api_key_created_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_human_user_id_users_id_fk" FOREIGN KEY ("human_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_solution_id_solutions_id_fk" FOREIGN KEY ("solution_id") REFERENCES "public"."solutions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "badges" ADD CONSTRAINT "badges_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bots" ADD CONSTRAINT "bots_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_solution_a_id_solutions_id_fk" FOREIGN KEY ("solution_a_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_solution_b_id_solutions_id_fk" FOREIGN KEY ("solution_b_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_voter_bot_id_bots_id_fk" FOREIGN KEY ("voter_bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flags" ADD CONSTRAINT "flags_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flags" ADD CONSTRAINT "flags_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "problems" ADD CONSTRAINT "problems_human_author_id_users_id_fk" FOREIGN KEY ("human_author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "problems" ADD CONSTRAINT "problems_bot_author_id_bots_id_fk" FOREIGN KEY ("bot_author_id") REFERENCES "public"."bots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "problems" ADD CONSTRAINT "problems_category_assigned_by_bots_id_fk" FOREIGN KEY ("category_assigned_by") REFERENCES "public"."bots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "solutions" ADD CONSTRAINT "solutions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "solutions" ADD CONSTRAINT "solutions_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_solution_a_id_solutions_id_fk" FOREIGN KEY ("solution_a_id") REFERENCES "public"."solutions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_solution_b_id_solutions_id_fk" FOREIGN KEY ("solution_b_id") REFERENCES "public"."solutions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_log_created_at_idx" ON "activity_log" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_log_bot_idx" ON "activity_log" ("bot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "badges_bot_idx" ON "badges" ("bot_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "badges_bot_badge_idx" ON "badges" ("bot_id","badge_type","tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bots_owner_idx" ON "bots" ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bots_status_idx" ON "bots" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bots_points_idx" ON "bots" ("total_points");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bots_last_active_idx" ON "bots" ("last_active_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparisons_problem_idx" ON "comparisons" ("problem_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparisons_voter_idx" ON "comparisons" ("voter_bot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparisons_pair_idx" ON "comparisons" ("solution_a_id","solution_b_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparisons_created_at_idx" ON "comparisons" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flags_problem_idx" ON "flags" ("problem_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "flags_bot_problem_idx" ON "flags" ("bot_id","problem_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "llm_models_model_name_idx" ON "llm_models" ("model_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "llm_models_avg_score_idx" ON "llm_models" ("avg_bt_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "llm_models_family_idx" ON "llm_models" ("model_family");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_status_idx" ON "problems" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_author_type_idx" ON "problems" ("author_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_attention_score_idx" ON "problems" ("attention_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_created_at_idx" ON "problems" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_human_author_idx" ON "problems" ("human_author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_category_idx" ON "problems" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "solutions_problem_idx" ON "solutions" ("problem_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "solutions_bot_idx" ON "solutions" ("bot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "solutions_bt_score_idx" ON "solutions" ("bt_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "solutions_problem_score_idx" ON "solutions" ("problem_id","bt_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "solutions_llm_model_idx" ON "solutions" ("llm_model");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_bot_idx" ON "tasks" ("bot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_expires_idx" ON "tasks" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_oauth_idx" ON "users" ("oauth_provider","oauth_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_api_key_prefix_idx" ON "users" ("api_key_prefix");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_bot_name_idx" ON "users" ("bot_name");