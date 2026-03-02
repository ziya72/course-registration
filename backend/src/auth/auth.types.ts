// src/auth/auth.types.ts

/**
 * Authentication Types & DTOs
 * 
 * Purpose:
 * - Centralize all auth-related TypeScript types
 * - Define data contracts for requests/responses
 * - Ensure type safety across auth module
 * - Support future RBAC and middleware
 */

/* ================= USER ROLES ================= */
export type UserRole = "student" | "teacher" | "admin";

/* ================= REQUEST DTOs ================= */

export interface RequestOtpDto {
  email: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/* ================= RESPONSE DTOs ================= */

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface MessageResponse {
  message: string;
}

/* ================= JWT PAYLOADS ================= */

export interface StudentJwtPayload {
  enrollmentNo: string;
  role: "student";
  iat?: number;
  exp?: number;
}

export interface TeacherJwtPayload {
  teacherId: number;
  role: "teacher" | "admin";
  iat?: number;
  exp?: number;
}

export type JwtPayload = StudentJwtPayload | TeacherJwtPayload;

/* ================= AUTH CONTEXT ================= */

// For use in Express Request after auth middleware
export interface AuthUser {
  enrollmentNo?: string;
  teacherId?: number;
  role: UserRole;
}

/* ================= VALIDATION ================= */

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/* ================= OTP MANAGEMENT ================= */

export interface OtpData {
  otp: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

export type OtpError = 
  | "OTP_EXPIRED" 
  | "MAX_ATTEMPTS_EXCEEDED" 
  | "INVALID_OTP" 
  | "OTP_NOT_FOUND"
  | "OTP_ALREADY_SENT";

/* ================= PASSWORD RESET ================= */

export interface ResetTokenData {
  token: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/* ================= LOGOUT ================= */

export interface LogoutResponse {
  message: string;
}
