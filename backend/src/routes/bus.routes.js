import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { listBuses, getBus, createBus, updateBus, deactivateBus } from "../controllers/busController.js";

const router = Router();
router.use(protect);
router.get("/", listBuses);
router.get("/:id", getBus);
router.post("/", authorize("admin"), createBus);
router.put("/:id", authorize("admin"), updateBus);
router.delete("/:id", authorize("admin"), deactivateBus);

export default router;