-- CreateEnum
CREATE TYPE "ElectiveType" AS ENUM ('BRANCH', 'OPEN');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "elective_type" "ElectiveType";
