/*
  Warnings:

  - The `registration_mode` column on the `CourseRegistration` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `attempt_type` on the `CourseAttempt` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `registration_mode` on the `CourseAttempt` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AttemptType" AS ENUM ('REGULAR', 'BACKLOG', 'IMPROVEMENT', 'GRADUATING');

-- CreateEnum
CREATE TYPE "RegistrationMode" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('ACTIVE', 'DROPPED', 'WITHDRAWN', 'COMPLETED');

-- AlterTable Course
ALTER TABLE "Course" ADD COLUMN "is_running" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Course" ADD COLUMN "max_seats" INTEGER;

-- AlterTable Student
ALTER TABLE "Student" ADD COLUMN "last_registration_semester" INTEGER;
ALTER TABLE "Student" ADD COLUMN "last_registration_year" INTEGER;
ALTER TABLE "Student" ADD COLUMN "required_credits_for_degree" INTEGER NOT NULL DEFAULT 160;

-- AlterTable CourseRegistration - Add new columns first
ALTER TABLE "CourseRegistration" ADD COLUMN "is_graduating_course" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CourseRegistration" ADD COLUMN "status" "RegistrationStatus" NOT NULL DEFAULT 'ACTIVE';

-- Migrate CourseRegistration.registration_mode to ENUM
ALTER TABLE "CourseRegistration" ADD COLUMN "registration_mode_new" "RegistrationMode";
UPDATE "CourseRegistration" SET "registration_mode_new" = 
  CASE 
    WHEN "registration_mode" = 'A' THEN 'A'::"RegistrationMode"
    WHEN "registration_mode" = 'B' THEN 'B'::"RegistrationMode"
    WHEN "registration_mode" = 'C' THEN 'C'::"RegistrationMode"
    ELSE 'A'::"RegistrationMode"
  END;
ALTER TABLE "CourseRegistration" DROP COLUMN "registration_mode";
ALTER TABLE "CourseRegistration" RENAME COLUMN "registration_mode_new" TO "registration_mode";
ALTER TABLE "CourseRegistration" ALTER COLUMN "registration_mode" SET NOT NULL;
ALTER TABLE "CourseRegistration" ALTER COLUMN "registration_mode" SET DEFAULT 'A';

-- Migrate CourseAttempt.attempt_type to ENUM
ALTER TABLE "CourseAttempt" ADD COLUMN "attempt_type_new" "AttemptType";
UPDATE "CourseAttempt" SET "attempt_type_new" = 
  CASE 
    WHEN "attempt_type" = 'REGULAR' THEN 'REGULAR'::"AttemptType"
    WHEN "attempt_type" = 'BACKLOG' THEN 'BACKLOG'::"AttemptType"
    WHEN "attempt_type" = 'IMPROVEMENT' THEN 'IMPROVEMENT'::"AttemptType"
    WHEN "attempt_type" = 'GRADUATING' THEN 'GRADUATING'::"AttemptType"
    ELSE 'REGULAR'::"AttemptType"
  END;
ALTER TABLE "CourseAttempt" DROP COLUMN "attempt_type";
ALTER TABLE "CourseAttempt" RENAME COLUMN "attempt_type_new" TO "attempt_type";
ALTER TABLE "CourseAttempt" ALTER COLUMN "attempt_type" SET NOT NULL;

-- Migrate CourseAttempt.registration_mode to ENUM
ALTER TABLE "CourseAttempt" ADD COLUMN "registration_mode_new" "RegistrationMode";
UPDATE "CourseAttempt" SET "registration_mode_new" = 
  CASE 
    WHEN "registration_mode" = 'A' THEN 'A'::"RegistrationMode"
    WHEN "registration_mode" = 'B' THEN 'B'::"RegistrationMode"
    WHEN "registration_mode" = 'C' THEN 'C'::"RegistrationMode"
    ELSE 'A'::"RegistrationMode"
  END;
ALTER TABLE "CourseAttempt" DROP COLUMN "registration_mode";
ALTER TABLE "CourseAttempt" RENAME COLUMN "registration_mode_new" TO "registration_mode";
ALTER TABLE "CourseAttempt" ALTER COLUMN "registration_mode" SET NOT NULL;

-- CreateTable RegistrationAlert
CREATE TABLE "RegistrationAlert" (
    "alert_id" SERIAL NOT NULL,
    "enrollment_no" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "alert_message" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "RegistrationAlert_pkey" PRIMARY KEY ("alert_id")
);

-- AddForeignKey
ALTER TABLE "RegistrationAlert" ADD CONSTRAINT "RegistrationAlert_enrollment_no_fkey" FOREIGN KEY ("enrollment_no") REFERENCES "Student"("enrollment_no") ON DELETE RESTRICT ON UPDATE CASCADE;

