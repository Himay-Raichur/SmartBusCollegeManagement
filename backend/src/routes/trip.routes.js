import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { startTrip, endTrip, currentTrip, listTrips, getTrip } from "../controllers/tripController.js";

const router = Router();
router.use(protect);
router.post("/start", authorize("driver"), startTrip);
router.patch("/end", authorize("driver"), endTrip);
router.get("/current", authorize("driver"), currentTrip);
router.get("/", authorize("admin", "driver"), listTrips);
router.get("/:id", authorize("admin", "driver"), getTrip);

export default router;