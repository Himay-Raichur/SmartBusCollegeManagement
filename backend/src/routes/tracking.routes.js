import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { updateLocation, allBusLocations, myBusTracking } from "../controllers/trackingController.js";

const router = Router();
router.use(protect);
router.post("/location", authorize("driver"), updateLocation);
router.get("/buses", authorize("admin"), allBusLocations);
router.get("/my-bus", authorize("student"), myBusTracking);

export default router;