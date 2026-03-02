import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OtpData, ResetTokenData } from "./auth.types";

/* ================= JWT CONFIG ================= */
const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

/* ================= OTP CONFIG ================= */
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5");
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "3");

/* ================= PASSWORD RESET CONFIG ================= */
const RESET_TOKEN_EXPIRY_MINUTES = parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || "15");
const RESET_TOKEN_MAX_ATTEMPTS = parseInt(process.env.RESET_TOKEN_MAX_ATTEMPTS || "3");

/* ================= OTP STORES ================= */
export const otpStore = new Map<string, OtpData>();
export const otpVerified = new Set<string>();

/* ================= PASSWORD RESET STORES ================= */
export const resetTokenStore = new Map<string, ResetTokenData>();

/* ================= TOKEN BLACKLIST (for logout) ================= */
export const tokenBlacklist = new Set<string>();

/* ================= EMAIL & ID HELPERS ================= */
export function extractEnrollmentNo(email: string): string {
  return email.split("@")[0].toLowerCase();
}

export function isInstitutionalEmail(email: string): boolean {
  return (
    email.endsWith("@amu.ac.in") ||
    email.endsWith("@myamu.ac.in")
  );
}

/* ================= OTP HELPERS ================= */

export function generateOtp(): string {
  // Generate random 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isOtpExpired(otpData: OtpData): boolean {
  return new Date() > otpData.expiresAt;
}

export function canAttemptOtp(otpData: OtpData): boolean {
  return otpData.attempts < OTP_MAX_ATTEMPTS;
}

export function incrementOtpAttempts(email: string): void {
  const otpData = otpStore.get(email);
  if (otpData) {
    otpData.attempts += 1;
    otpStore.set(email, otpData);
  }
}

export function getRemainingAttempts(otpData: OtpData): number {
  return OTP_MAX_ATTEMPTS - otpData.attempts;
}

export function getOtpExpiryTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

export function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) return "0s";
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function logOtpToConsole(email: string, otp: string, expiresAt: Date): void {
  console.log("\n" + "=".repeat(50));
  console.log("🔐 OTP GENERATED");
  console.log("=".repeat(50));
  console.log(`Email:      ${email}`);
  console.log(`OTP:        ${otp}`);
  console.log(`Generated:  ${new Date().toLocaleString()}`);
  console.log(`Expires:    ${expiresAt.toLocaleString()} (${OTP_EXPIRY_MINUTES} minutes)`);
  console.log(`Attempts:   0/${OTP_MAX_ATTEMPTS}`);
  console.log("=".repeat(50) + "\n");
}

/* ================= PASSWORD RESET HELPERS ================= */

export function generateResetToken(): string {
  // Generate random 6-digit reset token
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isResetTokenExpired(tokenData: ResetTokenData): boolean {
  return new Date() > tokenData.expiresAt;
}

export function canAttemptResetToken(tokenData: ResetTokenData): boolean {
  return tokenData.attempts < RESET_TOKEN_MAX_ATTEMPTS;
}

export function incrementResetTokenAttempts(email: string): void {
  const tokenData = resetTokenStore.get(email);
  if (tokenData) {
    tokenData.attempts += 1;
    resetTokenStore.set(email, tokenData);
  }
}

export function getRemainingResetAttempts(tokenData: ResetTokenData): number {
  return RESET_TOKEN_MAX_ATTEMPTS - tokenData.attempts;
}

export function getResetTokenExpiryTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
}

export function logResetTokenToConsole(email: string, token: string, expiresAt: Date): void {
  console.log("\n" + "=".repeat(50));
  console.log("🔑 PASSWORD RESET TOKEN GENERATED");
  console.log("=".repeat(50));
  console.log(`Email:      ${email}`);
  console.log(`Token:      ${token}`);
  console.log(`Generated:  ${new Date().toLocaleString()}`);
  console.log(`Expires:    ${expiresAt.toLocaleString()} (${RESET_TOKEN_EXPIRY_MINUTES} minutes)`);
  console.log(`Attempts:   0/${RESET_TOKEN_MAX_ATTEMPTS}`);
  console.log("=".repeat(50) + "\n");
}

/* ================= TOKEN BLACKLIST HELPERS ================= */

export function addToBlacklist(token: string): void {
  tokenBlacklist.add(token);
}

export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

/* ================= PASSWORD HELPERS ================= */
export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/* ================= TOKEN HELPERS ================= */
export function generateAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(
  payload: object,
  rememberMe: boolean
) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? "30d" : REFRESH_TOKEN_EXPIRY,
  });
}
