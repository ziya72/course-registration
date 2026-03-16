/*
  Warnings:

  - A unique constraint covering the columns `[password_reset_token]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[password_reset_token]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GradeRecord" ALTER COLUMN "sem" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SemesterResult" ALTER COLUMN "sem" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "password_reset_expiry" TIMESTAMP(3),
ADD COLUMN     "password_reset_token" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "password_reset_expiry" TIMESTAMP(3),
ADD COLUMN     "password_reset_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_password_reset_token_key" ON "Student"("password_reset_token");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_password_reset_token_key" ON "Teacher"("password_reset_token");

-- RenameIndex
ALTER INDEX "GradeRecord_enrollment_sem_idx" RENAME TO "GradeRecord_enrollment_no_sem_idx";

-- RenameIndex
ALTER INDEX "GradeRecord_unique_attempt_idx" RENAME TO "GradeRecord_enrollment_no_course_code_sem_key";
