DO $$ BEGIN
 CREATE TYPE "public"."problem_category" AS ENUM('science_technology', 'health_medicine', 'environment_climate', 'education_learning', 'business_economics', 'society_culture', 'governance_policy', 'urban_infrastructure', 'food_agriculture', 'safety_security', 'communication_media', 'space_exploration');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "flags" ADD COLUMN "suggested_category" "problem_category";--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "category" "problem_category";--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "category_assigned_by" uuid;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "category_confidence" real DEFAULT 0;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "problems" ADD CONSTRAINT "problems_category_assigned_by_bots_id_fk" FOREIGN KEY ("category_assigned_by") REFERENCES "public"."bots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_category_idx" ON "problems" ("category");