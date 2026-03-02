import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  extractEnrollmentNo,
  isInstitutionalEmail,
  generateOtp,
  otpStore,
  otpVerified,
  isOtpExpired,
  canAttemptOtp,
  incrementOtpAttempts,
  getRemainingAttempts,
  getOtpExpiryTime,
  formatTimeRemaining,
  logOtpToConsole,
  generateResetToken,
  resetTokenStore,
  isResetTokenExpired,
  canAttemptResetToken,
  incrementResetTokenAttempts,
  getRemainingResetAttempts,
  getResetTokenExpiryTime,
  logResetTokenToConsole,
  addToBlacklist,
} from "./auth.utils";
import {
  AuthResponse,
  MessageResponse,
  LogoutResponse,
  UserRole,
} from "./auth.types";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export class AuthService {
  static async requestOtp(email: string): Promise<MessageResponse> {
    console.log("🔍 DEBUG: requestOtp called with email:", email);
    
    if (!isInstitutionalEmail(email)) {
      throw new Error("Invalid institutional email");
    }

    const enrollmentNo = extractEnrollmentNo(email);

    const student = await prisma.student.findUnique({
      where: { enrollment_no: enrollmentNo },
    });

    if (!student) {
      throw new Error("Student record not found");
    }

    // Check if OTP already exists and hasn't expired
    const existingOtp = otpStore.get(email);
    if (existingOtp && !isOtpExpired(existingOtp)) {
      const timeRemaining = formatTimeRemaining(existingOtp.expiresAt);
      throw new Error(
        `OTP already sent. Please wait ${timeRemaining} before requesting a new one.`
      );
    }

    // Generate new OTP
    const otp = generateOtp();
    const expiresAt = getOtpExpiryTime();

    // Store OTP with metadata
    otpStore.set(email, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    });

    // Log OTP to console
    logOtpToConsole(email, otp, expiresAt);

    return { message: "OTP sent (check console)" };
  }

  static async verifyOtp(email: string, otp: string): Promise<MessageResponse> {
    const otpData = otpStore.get(email);

    // Check if OTP exists
    if (!otpData) {
      throw new Error("OTP not found. Please request an OTP first.");
    }

    // Check if OTP expired
    if (isOtpExpired(otpData)) {
      otpStore.delete(email); // Clean up expired OTP
      throw new Error("OTP expired. Please request a new one.");
    }

    // Check if max attempts exceeded
    if (!canAttemptOtp(otpData)) {
      throw new Error(
        "Maximum verification attempts exceeded. Please wait for OTP to expire and request a new one."
      );
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      incrementOtpAttempts(email);
      const remaining = getRemainingAttempts(otpData);
      throw new Error(
        `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
      );
    }

    // OTP verified successfully
    otpVerified.add(email);
    otpStore.delete(email); // Clear OTP after successful verification

    return { message: "OTP verified" };
  }

  static async signup(email: string, password: string): Promise<AuthResponse> {
    if (!otpVerified.has(email)) {
      throw new Error("OTP verification required");
    }

    const enrollmentNo = extractEnrollmentNo(email);

    const student = await prisma.student.findUnique({
      where: { enrollment_no: enrollmentNo },
    });

    if (!student) {
      throw new Error("Student record not found");
    }

    if (student.password_hash) {
      throw new Error("Account already activated");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.student.update({
      where: { enrollment_no: enrollmentNo },
      data: {
        password_hash: hashedPassword,
        is_active: true, // Activate when password is set
      },
    });

    otpVerified.delete(email);

    const token = jwt.sign(
      { enrollmentNo, role: "student" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      token,
      user: {
        id: student.enrollment_no,
        name: student.name,
        email: student.email,
        role: "student",
      },
    };
  }

  static async signin(
    email: string,
    password: string,
    rememberMe = false
  ): Promise<AuthResponse> {
    // Check if it's a TEACHER first (pre-created by admin)
    const teacher = await prisma.teacher.findUnique({
      where: { email },
    });

    if (teacher) {
      if (!teacher.password_hash || !teacher.is_active) {
        throw new Error("Invalid credentials");
      }

      const match = await bcrypt.compare(
        password,
        teacher.password_hash
      );

      if (!match) {
        throw new Error("Invalid credentials");
      }

      const token = jwt.sign(
        { teacherId: teacher.teacher_id, role: teacher.role },
        JWT_SECRET,
        { expiresIn: rememberMe ? "7d" : "1h" }
      );

      return {
        token,
        user: {
          id: teacher.teacher_id.toString(),
          name: teacher.name,
          email: teacher.email,
          role: teacher.role as UserRole,
        },
      };
    }

    // Otherwise, try STUDENT LOGIN
    if (isInstitutionalEmail(email)) {
      const enrollmentNo = extractEnrollmentNo(email);

      const student = await prisma.student.findUnique({
        where: { enrollment_no: enrollmentNo },
      });

      if (!student || !student.password_hash || !student.is_active) {
        throw new Error("Invalid credentials");
      }

      const match = await bcrypt.compare(
        password,
        student.password_hash
      );

      if (!match) {
        throw new Error("Invalid credentials");
      }

      const token = jwt.sign(
        { enrollmentNo, role: "student" },
        JWT_SECRET,
        { expiresIn: rememberMe ? "7d" : "1h" }
      );

      return {
        token,
        user: {
          id: student.enrollment_no,
          name: student.name,
          email: student.email,
          role: "student",
        },
      };
    }

    throw new Error("Invalid credentials");
  }

  /* ================= FORGOT PASSWORD ================= */

  static async forgotPassword(email: string): Promise<MessageResponse> {
    // Check if it's a student or teacher
    let userExists = false;

    // Check student
    if (isInstitutionalEmail(email)) {
      const enrollmentNo = extractEnrollmentNo(email);
      const student = await prisma.student.findUnique({
        where: { enrollment_no: enrollmentNo },
      });
      userExists = !!student;
    } else {
      // Check teacher
      const teacher = await prisma.teacher.findUnique({
        where: { email },
      });
      userExists = !!teacher;
    }

    if (!userExists) {
      throw new Error("User not found");
    }

    // Check if reset token already exists and hasn't expired
    const existingToken = resetTokenStore.get(email);
    if (existingToken && !isResetTokenExpired(existingToken)) {
      const timeRemaining = formatTimeRemaining(existingToken.expiresAt);
      throw new Error(
        `Password reset token already sent. Please wait ${timeRemaining} before requesting a new one.`
      );
    }

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = getResetTokenExpiryTime();

    // Store reset token
    resetTokenStore.set(email, {
      token,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    });

    // Log token to console
    logResetTokenToConsole(email, token, expiresAt);

    return { message: "Password reset token sent (check console)" };
  }

  static async resetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Promise<MessageResponse> {
    const tokenData = resetTokenStore.get(email);

    // Check if token exists
    if (!tokenData) {
      throw new Error("Reset token not found. Please request a password reset first.");
    }

    // Check if token expired
    if (isResetTokenExpired(tokenData)) {
      resetTokenStore.delete(email);
      throw new Error("Reset token expired. Please request a new one.");
    }

    // Check if max attempts exceeded
    if (!canAttemptResetToken(tokenData)) {
      throw new Error(
        "Maximum verification attempts exceeded. Please wait for token to expire and request a new one."
      );
    }

    // Verify token
    if (tokenData.token !== token) {
      incrementResetTokenAttempts(email);
      const remaining = getRemainingResetAttempts(tokenData);
      throw new Error(
        `Invalid reset token. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
      );
    }

    // Token verified, update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update student or teacher password
    if (isInstitutionalEmail(email)) {
      const enrollmentNo = extractEnrollmentNo(email);
      await prisma.student.update({
        where: { enrollment_no: enrollmentNo },
        data: { password_hash: hashedPassword },
      });
    } else {
      await prisma.teacher.update({
        where: { email },
        data: { password_hash: hashedPassword },
      });
    }

    // Clear reset token
    resetTokenStore.delete(email);

    return { message: "Password reset successfully" };
  }

  /* ================= LOGOUT ================= */

  static async logout(token: string): Promise<LogoutResponse> {
    // Add token to blacklist
    addToBlacklist(token);

    return { message: "Logged out successfully" };
  }
}
