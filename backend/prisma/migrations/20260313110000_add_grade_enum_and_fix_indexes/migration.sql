-- Add Grade enum and fix indexes
-- This migration adds grade validation and optimizes indexes

-- Step 1: Create Grade enum
CREATE TYPE "Grade" AS ENUM ('A_PLUS', 'A', 'B_PLUS', 'B', 'C', 'D', 'E', 'F', 'I');

-- Step 2: Add temporary column with enum type
ALTER TABLE "GradeRecord" ADD COLUMN "grade_enum" "Grade";

-- Step 3: Migrate existing grade data to enum format
UPDATE "GradeRecord" SET "grade_enum" = 
  CASE 
    WHEN "grade" = 'A+' THEN 'A_PLUS'::"Grade"
    WHEN "grade" = 'A' THEN 'A'::"Grade"
    WHEN "grade" = 'B+' THEN 'B_PLUS'::"Grade"
    WHEN "grade" = 'B' THEN 'B'::"Grade"
    WHEN "grade" = 'C' THEN 'C'::"Grade"
    WHEN "grade" = 'D' THEN 'D'::"Grade"
    WHEN "grade" = 'E' THEN 'E'::"Grade"
    WHEN "grade" = 'F' THEN 'F'::"Grade"
    WHEN "grade" = 'I' THEN 'I'::"Grade"
    ELSE NULL
  END
WHERE "grade" IS NOT NULL;

-- Step 4: Drop old grade column and rename new one
ALTER TABLE "GradeRecord" DROP COLUMN "grade";
ALTER TABLE "GradeRecord" RENAME COLUMN "grade_enum" TO "grade";

-- Step 5: Fix indexes - drop the old composite index and add the correct ones
DROP INDEX IF EXISTS "GradeRecord_composite_idx";

-- Add the missing enrollment_no + sem composite index
CREATE INDEX "GradeRecord_enrollment_sem_idx" ON "GradeRecord"("enrollment_no", "sem");

-- Add unique constraint for enrollment_no + course_code + sem
CREATE UNIQUE INDEX "GradeRecord_unique_attempt_idx" ON "GradeRecord"("enrollment_no", "course_code", "sem");

-- Step 6: Verify all required indexes exist
-- enrollment_no (should exist)
-- course_code (should exist) 
-- sem (should exist)
-- enrollment_no + sem (just added)
-- unique constraint (just added)