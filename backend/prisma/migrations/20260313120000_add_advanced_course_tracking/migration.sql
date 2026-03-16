-- Add Advanced Course Tracking
-- This migration adds is_advanced field and advanced course requirements

-- Step 1: Add is_advanced field to Course table
ALTER TABLE "Course" ADD COLUMN "is_advanced" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Create AdvancedCourseRequirement table
CREATE TABLE "AdvancedCourseRequirement" (
    "requirement_id" SERIAL NOT NULL,
    "course_code" TEXT NOT NULL,
    "requirement_type" TEXT NOT NULL,
    "requirement_value" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvancedCourseRequirement_pkey" PRIMARY KEY ("requirement_id")
);

-- Step 3: Add indexes
CREATE INDEX "AdvancedCourseRequirement_course_code_idx" ON "AdvancedCourseRequirement"("course_code");
CREATE INDEX "AdvancedCourseRequirement_requirement_type_idx" ON "AdvancedCourseRequirement"("requirement_type");

-- Step 4: Add foreign key constraint
ALTER TABLE "AdvancedCourseRequirement" ADD CONSTRAINT "AdvancedCourseRequirement_course_code_fkey" FOREIGN KEY ("course_code") REFERENCES "Course"("course_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Add sample advanced course requirements (CPI >= 8.5 example)
-- This is commented out - will be added via application logic
-- INSERT INTO "AdvancedCourseRequirement" ("course_code", "requirement_type", "requirement_value", "description") 
-- VALUES ('CS499', 'MIN_CPI', '8.5', 'Minimum CPI of 8.5 required for advanced algorithms course');