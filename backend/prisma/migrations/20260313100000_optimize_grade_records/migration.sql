-- Database Schema Optimization: GradeRecord and SemesterResult
-- This migration optimizes the schema by removing redundant fields and adding performance indexes

-- Step 1: Add new fields to GradeRecord
ALTER TABLE "GradeRecord" ADD COLUMN "sem" VARCHAR(10);
ALTER TABLE "GradeRecord" ADD COLUMN "semester_no" INTEGER;

-- Step 2: Populate new fields from existing data
-- Convert academic_year and semester_type to sem format (S24252 = 2024-25 semester 2)
UPDATE "GradeRecord" SET 
  "sem" = CONCAT('S', 
    CASE 
      WHEN "academic_year" >= 2000 THEN LPAD(("academic_year" - 2000)::text, 2, '0')
      ELSE LPAD("academic_year"::text, 2, '0')
    END,
    LPAD("semester_type"::text, 3, '0')
  );

-- Populate semester_no from courses table
UPDATE "GradeRecord" SET 
  "semester_no" = (
    SELECT "semester_no" 
    FROM "Course" 
    WHERE "Course"."course_code" = "GradeRecord"."course_code" 
    LIMIT 1
  );

-- Step 3: Make new fields NOT NULL after population
ALTER TABLE "GradeRecord" ALTER COLUMN "sem" SET NOT NULL;
ALTER TABLE "GradeRecord" ALTER COLUMN "semester_no" SET NOT NULL;

-- Step 4: Add performance indexes BEFORE removing old columns
CREATE INDEX "GradeRecord_enrollment_no_idx" ON "GradeRecord"("enrollment_no");
CREATE INDEX "GradeRecord_course_code_idx" ON "GradeRecord"("course_code");
CREATE INDEX "GradeRecord_sem_idx" ON "GradeRecord"("sem");
CREATE INDEX "GradeRecord_composite_idx" ON "GradeRecord"("enrollment_no", "course_code", "sem");

-- Step 5: Remove redundant columns
ALTER TABLE "GradeRecord" DROP COLUMN "faculty_no";
ALTER TABLE "GradeRecord" DROP COLUMN "grade_points";
ALTER TABLE "GradeRecord" DROP COLUMN "is_backlog";
ALTER TABLE "GradeRecord" DROP COLUMN "is_improvement";
ALTER TABLE "GradeRecord" DROP COLUMN "academic_year";
ALTER TABLE "GradeRecord" DROP COLUMN "semester_type";

-- Step 6: Optimize SemesterResult table
-- Add sem field
ALTER TABLE "SemesterResult" ADD COLUMN "sem" VARCHAR(10);

-- Populate sem field
UPDATE "SemesterResult" SET 
  "sem" = CONCAT('S', 
    CASE 
      WHEN "academic_year" >= 2000 THEN LPAD(("academic_year" - 2000)::text, 2, '0')
      ELSE LPAD("academic_year"::text, 2, '0')
    END,
    LPAD("semester_type"::text, 3, '0')
  );

-- Make sem NOT NULL
ALTER TABLE "SemesterResult" ALTER COLUMN "sem" SET NOT NULL;

-- Add indexes for SemesterResult
CREATE INDEX "SemesterResult_enrollment_no_idx" ON "SemesterResult"("enrollment_no");
CREATE INDEX "SemesterResult_sem_idx" ON "SemesterResult"("sem");

-- Remove redundant fields from SemesterResult
ALTER TABLE "SemesterResult" DROP COLUMN "faculty_no";
ALTER TABLE "SemesterResult" DROP COLUMN "spi";
ALTER TABLE "SemesterResult" DROP COLUMN "cpi";
ALTER TABLE "SemesterResult" DROP COLUMN "total_credits_earned";
ALTER TABLE "SemesterResult" DROP COLUMN "academic_year";
ALTER TABLE "SemesterResult" DROP COLUMN "semester_no";
ALTER TABLE "SemesterResult" DROP COLUMN "semester_type";
ALTER TABLE "SemesterResult" DROP COLUMN "branch_code";
ALTER TABLE "SemesterResult" DROP COLUMN "name";