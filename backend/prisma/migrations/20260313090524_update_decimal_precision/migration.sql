/*
  Warnings:

  - You are about to alter the column `credits` on the `Course` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(3,1)`.
  - You are about to alter the column `grade_points` on the `GradeRecord` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(4,2)`.
  - You are about to alter the column `spi` on the `SemesterResult` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(6,3)`.
  - You are about to alter the column `cpi` on the `SemesterResult` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(6,3)`.
  - You are about to alter the column `total_credits_earned` on the `SemesterResult` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(4,1)`.
  - You are about to alter the column `current_cpi` on the `Student` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(6,3)`.
  - You are about to alter the column `total_earned_credits` on the `Student` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(4,1)`.

*/
-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "credits" SET DATA TYPE DECIMAL(3,1);

-- AlterTable
ALTER TABLE "GradeRecord" ALTER COLUMN "grade_points" SET DATA TYPE DECIMAL(4,2);

-- AlterTable
ALTER TABLE "SemesterResult" ALTER COLUMN "spi" SET DATA TYPE DECIMAL(6,3),
ALTER COLUMN "cpi" SET DATA TYPE DECIMAL(6,3),
ALTER COLUMN "total_credits_earned" SET DATA TYPE DECIMAL(4,1);

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "current_cpi" SET DATA TYPE DECIMAL(6,3),
ALTER COLUMN "total_earned_credits" SET DATA TYPE DECIMAL(4,1);
