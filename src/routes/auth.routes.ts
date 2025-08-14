import express from "express";
import {
  registerHandler,
  loginHandler,
  verifyEmailHandler,
  resendEmailVerificationHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../controller/auth.controller";
import Limiter from "../middleware/rateLimit";
import validate from "../middleware/validateZod";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validations/authValidation";

const router = express.Router();

router.post("/register", Limiter, validate(registerSchema), registerHandler);
router.post("/verify-email", Limiter, verifyEmailHandler);
router.post("/login", Limiter, validate(loginSchema), loginHandler);
router.post("/resend-otp", Limiter, resendEmailVerificationHandler);
router.post("/forgot-password", Limiter, validate(forgotPasswordSchema), forgotPasswordHandler);
router.post("/reset-password", Limiter, validate(resetPasswordSchema), resetPasswordHandler);

export default router;
