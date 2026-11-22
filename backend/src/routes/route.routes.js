import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  listRoutes, getRoute, createRoute, updateRoute, deleteRoute,
  addStop, updateStop, deleteStop, reorderStops,
} from "../controllers/routeController.js";

const router = Router();
router.use(protect);
router.get("/", listRoutes);
router.get("/:id", getRoute);

router.use(authorize("admin"));
router.post("/", createRoute);
router.put("/stops/:stopId", updateStop);
router.delete("/stops/:stopId", deleteStop);
router.put("/:id", updateRoute);
router.delete("/:id", deleteRoute);
router.post("/:id/stops", addStop);
router.put("/:id/stops/reorder", reorderStops);

export default router;