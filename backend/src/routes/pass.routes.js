import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { applyPassRules, approvePassRules, rejectPassRules } from "../middleware/validators.js";
import { applyForPass, myPasses, listPasses, getPass, approvePass, rejectPass } from "../controllers/passController.js";

const router = Router();
router.use(protect);
router.post("/", authorize("student"), applyPassRules, validate, applyForPass);
router.get("/my", authorize("student"), myPasses);
router.get("/", authorize("admin"), listPasses);
router.get("/:id", authorize("admin", "student"), getPass);
router.patch("/:id/approve", authorize("admin"), approvePassRules, validate, approvePass);
router.patch("/:id/reject", authorize("admin"), rejectPassRules, validate, rejectPass);

export default router;