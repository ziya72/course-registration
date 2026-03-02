import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();

router.post("/request-otp", AuthController.requestOtp);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/register", AuthController.signup);
router.post("/login", AuthController.signin);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/logout", AuthController.logout);

export default router;
