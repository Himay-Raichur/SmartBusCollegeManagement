import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getMyStudentProfile,
  getMyDriverProfile,
} from "../controllers/profileController.js";

const router = Router();

router.get("/student/me", protect, authorize("student"), getMyStudentProfile);
router.get("/driver/me", protect, authorize("driver"), getMyDriverProfile);

export default router;