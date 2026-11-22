import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { dashboard, overview } from "../controllers/reportController.js";

const router = Router();
router.use(protect, authorize("admin"));
router.get("/dashboard", dashboard);
router.get("/overview", overview);

export default router;