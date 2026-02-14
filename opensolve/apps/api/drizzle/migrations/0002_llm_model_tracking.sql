-- Add LLM model tracking columns to solutions table
ALTER TABLE "solutions" ADD COLUMN "llm_model" varchar(100);
ALTER TABLE "solutions" ADD COLUMN "llm_model_version" varchar(50);
CREATE INDEX IF NOT EXISTS "solutions_llm_model_idx" ON "solutions" ("llm_model");

-- Create LLM models aggregate table
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

CREATE UNIQUE INDEX IF NOT EXISTS "llm_models_model_name_idx" ON "llm_models" ("model_name");
CREATE INDEX IF NOT EXISTS "llm_models_avg_score_idx" ON "llm_models" ("avg_bt_score");
CREATE INDEX IF NOT EXISTS "llm_models_family_idx" ON "llm_models" ("model_family");
