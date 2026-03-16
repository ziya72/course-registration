import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import { EmailService } from "../services/email.service";
import { JWTEncryptionService } from "../utils/jwt-encryption";
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
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5");

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
      throw new Error("Student record not found. Please contact admin.");
    }

    // Check if already has password
    if (student.password_hash) {
      throw new Error("Account already activated. Please use login.");
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

    // Send OTP via email (SendGrid)
    try {
      await EmailService.sendOtpEmail(email, otp, OTP_EXPIRY_MINUTES);
      console.log("✅ OTP sent via email to:", email);
    } catch (error: any) {
      // Fallback: Log to console if email fails
      console.error("❌ Email sending failed:", error.message);
      console.log("\n" + "=".repeat(60));
      console.log("📧 EMAIL FAILED - SHOWING OTP IN CONSOLE");
      console.log("=".repeat(60));
      logOtpToConsole(email, otp, expiresAt);
      console.log("=".repeat(60) + "\n");
    }

    // ALWAYS log to console in production for debugging
    if (process.env.NODE_ENV === 'production') {
      console.log("\n🔐 [PRODUCTION] OTP for", email, ":", otp);
      console.log("⏰ Expires at:", expiresAt.toISOString(), "\n");
    }

    return { message: "OTP sent to your email" };
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
    console.log("🔍 Signup attempt for:", email);
    
    // Check OTP verification
    if (!otpVerified.has(email)) {
      throw new Error("OTP verification required. Please verify your email first.");
    }

    if (!isInstitutionalEmail(email)) {
      throw new Error("Invalid institutional email");
    }

    const enrollmentNo = extractEnrollmentNo(email);
    console.log("📝 Enrollment No:", enrollmentNo);

    const student = await prisma.student.findUnique({
      where: { enrollment_no: enrollmentNo },
    });

    if (!student) {
      console.log("❌ Student record not found");
      throw new Error("Student record not found. Please contact admin.");
    }

    if (student.password_hash) {
      console.log("❌ Account already activated");
      throw new Error("Account already activated. Please login.");
    }

    console.log("✅ Creating password for student");
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.student.update({
      where: { enrollment_no: enrollmentNo },
      data: {
        password_hash: hashedPassword,
        is_active: true,
      },
    });

    // Clear OTP verification
    otpVerified.delete(email);

    console.log("✅ Student signup successful");

    // Create JWT payload with encrypted email and id
    const jwtPayload = JWTEncryptionService.createEncryptedPayload({
      enrollmentNo,
      role: "student",
      email: student.email,
      id: student.enrollment_no
    });

    const token = jwt.sign(
      jwtPayload,
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
    role: UserRole,
    rememberMe = false
  ): Promise<AuthResponse> {
    console.log("🔍 Login attempt for:", email, "Role:", role);
    
    if (role === "student") {
      // STUDENT LOGIN
      console.log("👨‍🎓 Checking student login");
      
      if (!isInstitutionalEmail(email)) {
        console.log("❌ Invalid institutional email format for student");
        throw new Error("Invalid institutional email format for student login");
      }
      
      const enrollmentNo = extractEnrollmentNo(email);
      console.log("📝 Enrollment No:", enrollmentNo);

      const student = await prisma.student.findUnique({
        where: { enrollment_no: enrollmentNo },
      });

      if (!student) {
        console.log("❌ Student not found");
        throw new Error("Invalid credentials. Please check your email and password.");
      }

      console.log("👨‍🎓 Student found:", student.email);
      console.log("🔐 Has password:", !!student.password_hash);
      console.log("✅ Is active:", student.is_active);

      if (!student.password_hash) {
        console.log("❌ No password set for student");
        throw new Error("Invalid credentials. Account not activated. Please complete registration first.");
      }

      if (!student.is_active) {
        console.log("❌ Student account is inactive");
        throw new Error("Invalid credentials. Account is inactive. Please contact admin.");
      }

      const match = await bcrypt.compare(
        password,
        student.password_hash
      );

      if (!match) {
        console.log("❌ Password mismatch for student");
        throw new Error("Invalid credentials. Please check your email and password.");
      }

      console.log("✅ Student login successful");

      // Create JWT payload with encrypted email and id
      const jwtPayload = JWTEncryptionService.createEncryptedPayload({
        enrollmentNo,
        role: "student",
        email: student.email,
        id: student.enrollment_no
      });

      const token = jwt.sign(
        jwtPayload,
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
    
    else if (role === "teacher" || role === "admin") {
      // TEACHER/ADMIN LOGIN
      console.log("👨‍� Checking teacher login");
      
      const teacher = await prisma.teacher.findUnique({
        where: { email },
      });

      if (!teacher) {
        console.log("❌ Teacher not found");
        throw new Error("Invalid credentials. Please check your email and password.");
      }

      console.log("👨‍🏫 Teacher found:", teacher.email);
      console.log("🔐 Has password:", !!teacher.password_hash);
      console.log("✅ Is active:", teacher.is_active);

      if (!teacher.password_hash || !teacher.is_active) {
        console.log("❌ Teacher inactive or no password");
        throw new Error("Invalid credentials. Account is inactive or not activated. Please contact admin.");
      }

      const match = await bcrypt.compare(
        password,
        teacher.password_hash
      );

      if (!match) {
        console.log("❌ Password mismatch for teacher");
        throw new Error("Invalid credentials. Please check your email and password.");
      }

      console.log("✅ Teacher login successful");
      
      // Create JWT payload with encrypted email and id
      const jwtPayload = JWTEncryptionService.createEncryptedPayload({
        teacherId: teacher.teacher_id,
        role: teacher.role,
        email: teacher.email,
        id: teacher.teacher_id.toString()
      });
      
      const token = jwt.sign(
        jwtPayload,
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

    else {
      console.log("❌ Invalid role specified");
      throw new Error("Invalid role specified. Must be 'student' or 'teacher'.");
    }
  }

  /* ================= FORGOT PASSWORD (OTP-based with Database) ================= */

  static async forgotPassword(email: string): Promise<MessageResponse> {
    console.log("🔍 Forgot password OTP request for:", email);
    
    const successMessage = "If an account with this email exists, a password reset OTP has been sent.";
    
    try {
      let userExists = false;
      let userEmail = email;
      let userType: 'student' | 'teacher' | null = null;

      // Check student
      if (isInstitutionalEmail(email)) {
        console.log("📧 Checking institutional email for student");
        const enrollmentNo = extractEnrollmentNo(email);
        console.log("📝 Extracted enrollment no:", enrollmentNo);
        
        const student = await prisma.student.findUnique({
          where: { enrollment_no: enrollmentNo },
        });
        
        if (student) {
          userExists = true;
          userEmail = student.email;
          userType = 'student';
          console.log("👨‍🎓 Student found");
        }
      } else {
        console.log("👨‍🏫 Checking teacher email");
        const teacher = await prisma.teacher.findUnique({
          where: { email },
        });
        
        if (teacher) {
          userExists = true;
          userType = 'teacher';
          console.log("👨‍🏫 Teacher found");
        }
      }

      if (!userExists) {
        console.log("❌ User not found for email:", email);
        return { message: successMessage };
      }

      // Generate 6-digit OTP
      const otp = generateOtp();
      const expiresAt = getOtpExpiryTime(); // 5 minutes

      console.log("🔑 Generated reset OTP for:", userEmail);
      console.log("⏰ OTP expires at:", expiresAt);

      // Store OTP in database
      if (userType === 'student') {
        const enrollmentNo = extractEnrollmentNo(userEmail);
        await prisma.student.update({
          where: { enrollment_no: enrollmentNo },
          data: {
            password_reset_otp: otp,
            password_reset_otp_expiry: expiresAt,
            password_reset_otp_attempts: 0,
          },
        });
      } else {
        await prisma.teacher.update({
          where: { email: userEmail },
          data: {
            password_reset_otp: otp,
            password_reset_otp_expiry: expiresAt,
            password_reset_otp_attempts: 0,
          },
        });
      }

      // Log OTP to console for development
      console.log("\n" + "=".repeat(60));
      console.log("🔐 PASSWORD RESET OTP");
      console.log("=".repeat(60));
      console.log("📧 Email:", userEmail);
      console.log("🔢 OTP:", otp);
      console.log("⏰ Expires:", expiresAt.toLocaleString(), "(5 minutes)");
      console.log("🔄 Attempts: 0/3");
      console.log("=".repeat(60) + "\n");

      // TODO: Send OTP via email (SendGrid or other service)

      return { message: successMessage };
    } catch (error: any) {
      console.error("❌ Forgot password error:", error);
      throw error;
    }
  }

  /* ================= VERIFY RESET OTP ================= */

  static async verifyResetOtp(email: string, otp: string): Promise<MessageResponse> {
    console.log("🔍 Verify reset OTP for email:", email);
    console.log("🔢 OTP provided:", otp);
    
    // Find user and get OTP data from database
    let user: any = null;
    let userType: 'student' | 'teacher' | null = null;

    // Check student table first
    if (isInstitutionalEmail(email)) {
      const enrollmentNo = extractEnrollmentNo(email);
      user = await prisma.student.findUnique({
        where: { enrollment_no: enrollmentNo }
      });
      
      if (user) {
        userType = 'student';
        console.log("👨‍🎓 Found student");
      }
    } else {
      // Check teacher table
      user = await prisma.teacher.findUnique({
        where: { email }
      });
      
      if (user) {
        userType = 'teacher';
        console.log("👨‍🏫 Found teacher");
      }
    }

    if (!user) {
      console.log("❌ No user found for email:", email);
      throw new Error("User not found.");
    }

    // Check if OTP exists
    if (!user.password_reset_otp) {
      console.log("❌ No OTP found for email:", email);
      throw new Error("No OTP found. Please request a new password reset.");
    }

    // Check if OTP has expired
    if (user.password_reset_otp_expiry && new Date() > user.password_reset_otp_expiry) {
      console.log("❌ OTP expired for email:", email);
      
      // Clear expired OTP
      if (userType === 'student') {
        await prisma.student.update({
          where: { enrollment_no: user.enrollment_no },
          data: {
            password_reset_otp: null,
            password_reset_otp_expiry: null,
            password_reset_otp_attempts: 0,
          },
        });
      } else {
        await prisma.teacher.update({
          where: { teacher_id: user.teacher_id },
          data: {
            password_reset_otp: null,
            password_reset_otp_expiry: null,
            password_reset_otp_attempts: 0,
          },
        });
      }
      
      throw new Error("OTP has expired. Please request a new password reset.");
    }

    // Check attempts
    if (user.password_reset_otp_attempts >= 3) {
      console.log("❌ Max attempts exceeded for email:", email);
      
      // Clear OTP after max attempts
      if (userType === 'student') {
        await prisma.student.update({
          where: { enrollment_no: user.enrollment_no },
          data: {
            password_reset_otp: null,
            password_reset_otp_expiry: null,
            password_reset_otp_attempts: 0,
          },
        });
      } else {
        await prisma.teacher.update({
          where: { teacher_id: user.teacher_id },
          data: {
            password_reset_otp: null,
            password_reset_otp_expiry: null,
            password_reset_otp_attempts: 0,
          },
        });
      }
      
      throw new Error("Maximum OTP attempts exceeded. Please request a new password reset.");
    }

    // Verify OTP
    if (user.password_reset_otp !== otp) {
      console.log("❌ Invalid OTP for email:", email);
      
      // Increment attempts
      const newAttempts = user.password_reset_otp_attempts + 1;
      if (userType === 'student') {
        await prisma.student.update({
          where: { enrollment_no: user.enrollment_no },
          data: { password_reset_otp_attempts: newAttempts },
        });
      } else {
        await prisma.teacher.update({
          where: { teacher_id: user.teacher_id },
          data: { password_reset_otp_attempts: newAttempts },
        });
      }
      
      const remaining = 3 - newAttempts;
      throw new Error(`Invalid OTP. ${remaining} attempts remaining.`);
    }

    console.log("✅ OTP verified successfully");

    return { message: "OTP verified successfully. You can now reset your password." };
  }

  /* ================= RESET PASSWORD (OTP-based with Database) ================= */

  static async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<MessageResponse> {
    console.log("🔍 Reset password request for email:", email);
    console.log("🔢 OTP provided:", otp);
    
    // Find user and get OTP data from database
    let user: any = null;
    let userType: 'student' | 'teacher' | null = null;

    // Check student table first
    if (isInstitutionalEmail(email)) {
      const enrollmentNo = extractEnrollmentNo(email);
      user = await prisma.student.findUnique({
        where: { enrollment_no: enrollmentNo }
      });
      
      if (user) {
        userType = 'student';
        console.log("👨‍🎓 Found student");
      }
    } else {
      // Check teacher table
      user = await prisma.teacher.findUnique({
        where: { email }
      });
      
      if (user) {
        userType = 'teacher';
        console.log("👨‍🏫 Found teacher");
      }
    }

    if (!user) {
      console.log("❌ No user found for email:", email);
      throw new Error("User not found.");
    }

    // Check if OTP exists
    if (!user.password_reset_otp) {
      console.log("❌ No OTP found for email:", email);
      throw new Error("No OTP found. Please request a new password reset.");
    }

    // Check if OTP has expired
    if (user.password_reset_otp_expiry && new Date() > user.password_reset_otp_expiry) {
      console.log("❌ OTP expired for email:", email);
      
      // Clear expired OTP
      if (userType === 'student') {
        await prisma.student.update({
          where: { enrollment_no: user.enrollment_no },
          data: {
            password_reset_otp: null,
            password_reset_otp_expiry: null,
            password_reset_otp_attempts: 0,
          },
        });
      } else {
        await prisma.teacher.update({
          where: { teacher_id: user.teacher_id },
          data: {
            password_reset_otp: null,
            password_reset_otp_expiry: null,
            password_reset_otp_attempts: 0,
          },
        });
      }
      
      throw new Error("OTP has expired. Please request a new password reset.");
    }

    // Check attempts
    if (user.password_reset_otp_attempts >= 3) {
      console.log("❌ Max attempts exceeded for email:", email);
      
      // Clear OTP after max attempts
      if (userType === 'student') {
        await prisma.student.update({
          where: { enrollment_no: user.enrollment_no },
          data: {
            password_reset_otp: null,
            password_reset_otp_expiry: null,
            password_reset_otp_attempts: 0,
          },
        });
      } else {
        await prisma.teacher.update({
          where: { teacher_id: user.teacher_id },
          data: {
            password_reset_otp: null,
            password_reset_otp_expiry: null,
            password_reset_otp_attempts: 0,
          },
        });
      }
      
      throw new Error("Maximum OTP attempts exceeded. Please request a new password reset.");
    }

    // Verify OTP
    if (user.password_reset_otp !== otp) {
      console.log("❌ Invalid OTP for email:", email);
      
      // Increment attempts
      const newAttempts = user.password_reset_otp_attempts + 1;
      if (userType === 'student') {
        await prisma.student.update({
          where: { enrollment_no: user.enrollment_no },
          data: { password_reset_otp_attempts: newAttempts },
        });
      } else {
        await prisma.teacher.update({
          where: { teacher_id: user.teacher_id },
          data: { password_reset_otp_attempts: newAttempts },
        });
      }
      
      const remaining = 3 - newAttempts;
      throw new Error(`Invalid OTP. ${remaining} attempts remaining.`);
    }

    console.log("✅ OTP verified successfully");

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    if (userType === 'student') {
      await prisma.student.update({
        where: { enrollment_no: user.enrollment_no },
        data: {
          password_hash: hashedPassword,
          password_reset_otp: null,
          password_reset_otp_expiry: null,
          password_reset_otp_attempts: 0,
        },
      });
    } else {
      await prisma.teacher.update({
        where: { teacher_id: user.teacher_id },
        data: {
          password_hash: hashedPassword,
          password_reset_otp: null,
          password_reset_otp_expiry: null,
          password_reset_otp_attempts: 0,
        },
      });
    }

    console.log("✅ Password reset successfully for:", userType);

    return { message: "Password successfully reset. Please login with your new password." };
  }


  /* ================= LOGOUT ================= */

  static async logout(token: string): Promise<LogoutResponse> {
    // Add token to blacklist
    addToBlacklist(token);

    return { message: "Logged out successfully" };
  }
}
