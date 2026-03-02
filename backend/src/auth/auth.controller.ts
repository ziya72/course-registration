import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  RequestOtpDto,
  VerifyOtpDto,
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
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
      const { email, password, rememberMe } = req.body as LoginDto;
      res.json(await AuthService.signin(email, password, rememberMe));
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body as ForgotPasswordDto;
      res.json(await AuthService.forgotPassword(email));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, token, newPassword, confirmPassword } = req.body as ResetPasswordDto;
      
      // Validate password confirmation
      if (newPassword !== confirmPassword) {
        res.status(400).json({ error: "Passwords do not match" });
        return;
      }
      
      res.json(await AuthService.resetPassword(email, token, newPassword));
    } catch (err: any) {
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
