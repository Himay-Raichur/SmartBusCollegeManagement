import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { announcementRules } from "../middleware/validators.js";
import { listNotifications, markRead, markAllRead, announce } from "../controllers/notificationController.js";

const router = Router();
router.use(protect);
router.get("/", listNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);
router.post("/announcements", authorize("admin"), announcementRules, validate, announce);

export default router;