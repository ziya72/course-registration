-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "credits" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "SemesterResult" ALTER COLUMN "total_credits_earned" SET DEFAULT 0.00,
ALTER COLUMN "total_credits_earned" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "total_earned_credits" SET DEFAULT 0.00,
ALTER COLUMN "total_earned_credits" SET DATA TYPE DECIMAL(65,30);
