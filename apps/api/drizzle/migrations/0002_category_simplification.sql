-- CAT-1: Simplify from 21 categories to 8 flat categories
-- Safe because no problems have been categorized yet (all category columns are NULL)

-- Step 1: Drop columns that use the enum (to remove type dependency)
ALTER TABLE "problems" ALTER COLUMN "category" TYPE text;
ALTER TABLE "flags" ALTER COLUMN "suggested_category" TYPE text;

-- Step 2: Drop old enum
DROP TYPE "public"."problem_category";

-- Step 3: Create new enum with 8 categories
CREATE TYPE "public"."problem_category" AS ENUM(
  'technology',
  'science_nature',
  'health',
  'business_finance',
  'education_career',
  'society_culture',
  'philosophy_ideas',
  'lifestyle'
);

-- Step 4: Restore columns with new enum type
ALTER TABLE "problems" ALTER COLUMN "category" TYPE "public"."problem_category" USING "category"::"public"."problem_category";
ALTER TABLE "flags" ALTER COLUMN "suggested_category" TYPE "public"."problem_category" USING "suggested_category"::"public"."problem_category";
