-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "password_reset_otp" TEXT,
ADD COLUMN     "password_reset_otp_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "password_reset_otp_expiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "password_reset_otp" TEXT,
ADD COLUMN     "password_reset_otp_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "password_reset_otp_expiry" TIMESTAMP(3);
