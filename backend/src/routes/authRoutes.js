import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, me } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { loginRules, studentRules } from "../middleware/validators.js";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 20 : 200,
  message: { success: false, message: "Too many attempts, try again later" },
});

const router = Router();

router.post("/register", limiter, studentRules, validate, register);
router.post("/login", limiter, loginRules, validate, login);
router.get("/me", protect, me);

export default router;
