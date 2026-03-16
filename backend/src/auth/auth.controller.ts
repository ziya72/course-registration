import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  RequestOtpDto,
  VerifyOtpDto,
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
} from "./auth.types";
import { extractTokenFromHeader } from "./auth.utils";

export class AuthController {
  static async requestOtp(req: Request, res: Response) {
    try {
      const { email } = req.body as RequestOtpDto;
      res.json(await AuthService.requestOtp(email));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body as VerifyOtpDto;
      res.json(await AuthService.verifyOtp(email, otp));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async signup(req: Request, res: Response) {
    try {
      const { email, password, confirmPassword } = req.body as RegisterDto;
      
      // Validate password confirmation
      if (password !== confirmPassword) {
        res.status(400).json({ error: "Passwords do not match" });
        return;
      }
      
      res.json(await AuthService.signup(email, password));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async signin(req: Request, res: Response) {
    try {
      const { email, password, role, rememberMe } = req.body as LoginDto;
      
      // Validate required fields
      if (!email || !password || !role) {
        res.status(400).json({ error: "Email, password, and role are required" });
        return;
      }
      
      // Validate role
      if (!['student', 'teacher', 'admin'].includes(role)) {
        res.status(400).json({ error: "Invalid role. Must be 'student', 'teacher', or 'admin'" });
        return;
      }
      
      res.json(await AuthService.signin(email, password, role, rememberMe));
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body as ForgotPasswordDto;
      
      console.log("📧 Forgot password request received for:", email);
      
      if (!email) {
        console.log("❌ No email provided");
        res.status(400).json({ error: "Email is required" });
        return;
      }
      
      res.json(await AuthService.forgotPassword(email));
    } catch (err: any) {
      console.error("❌ Forgot password controller error:", err);
      res.status(400).json({ error: err.message });
    }
  }

  static async verifyResetOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body as VerifyResetOtpDto;
      
      console.log("📧 Verify reset OTP request received for:", email);
      
      if (!email || !otp) {
        console.log("❌ Missing required fields");
        res.status(400).json({ error: "Email and OTP are required" });
        return;
      }
      
      res.json(await AuthService.verifyResetOtp(email, otp));
    } catch (err: any) {
      console.error("❌ Verify reset OTP controller error:", err);
      res.status(400).json({ error: err.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, newPassword } = req.body as ResetPasswordDto;
      
      console.log("📧 Reset password request received for:", email);
      
      if (!email || !otp || !newPassword) {
        console.log("❌ Missing required fields");
        res.status(400).json({ error: "Email, OTP, and new password are required" });
        return;
      }
      
      res.json(await AuthService.resetPassword(email, otp, newPassword));
    } catch (err: any) {
      console.error("❌ Reset password controller error:", err);
      res.status(400).json({ error: err.message });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      
      if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
      }

      res.json(await AuthService.logout(token));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
