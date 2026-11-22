import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { scanRules } from "../middleware/validators.js";
import { scanPass, listValidations } from "../controllers/validationController.js";

const router = Router();
router.use(protect);
router.post("/scan", authorize("driver"), scanRules, validate, scanPass);
router.get("/", listValidations); // admin: all, driver: own scans, student: own history

export default router;