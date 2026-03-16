-- AlterTable
ALTER TABLE "CourseRegistration" ADD COLUMN     "registration_mode" TEXT NOT NULL DEFAULT 'A';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "total_earned_credits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CourseAttempt" (
    "attempt_id" SERIAL NOT NULL,
    "enrollment_no" TEXT NOT NULL,
    "course_code" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "attempt_type" TEXT NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "semester_type" INTEGER NOT NULL,
    "semester_no" INTEGER NOT NULL,
    "registration_mode" TEXT NOT NULL,
    "grade_obtained" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseAttempt_pkey" PRIMARY KEY ("attempt_id")
);

-- CreateIndex
CREATE INDEX "CourseAttempt_enrollment_no_course_code_idx" ON "CourseAttempt"("enrollment_no", "course_code");

-- CreateIndex
CREATE INDEX "CourseAttempt_enrollment_no_academic_year_idx" ON "CourseAttempt"("enrollment_no", "academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "CourseAttempt_enrollment_no_course_code_attempt_number_key" ON "CourseAttempt"("enrollment_no", "course_code", "attempt_number");

-- AddForeignKey
ALTER TABLE "CourseAttempt" ADD CONSTRAINT "CourseAttempt_enrollment_no_fkey" FOREIGN KEY ("enrollment_no") REFERENCES "Student"("enrollment_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAttempt" ADD CONSTRAINT "CourseAttempt_course_code_fkey" FOREIGN KEY ("course_code") REFERENCES "Course"("course_code") ON DELETE RESTRICT ON UPDATE CASCADE;
