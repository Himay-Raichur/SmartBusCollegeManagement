import { Router } from "express";
import { healthCheck } from "../controllers/healthController.js";
import authRoutes from './authRoutes.js';
import studentRoutes from "./student.routes.js";
import driverRoutes from "./driver.routes.js";
import busRoutes from "./bus.routes.js";
import routeRoutes from "./route.routes.js";
import passRoutes from "./pass.routes.js";
import validationRoutes from "./validation.routes.js";
import tripRoutes from "./trip.routes.js";
import trackingRoutes from "./tracking.routes.js";
import notificationRoutes from "./notification.routes.js";
import reportRoutes from "./report.routes.js";
import profileRoutes from "./profile.routes.js";

const router = Router();

router.get("/health", healthCheck);
router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/drivers", driverRoutes);
router.use("/buses", busRoutes);
router.use("/routes", routeRoutes);
router.use("/passes", passRoutes);
router.use("/validations", validationRoutes);
router.use("/trips", tripRoutes);
router.use("/tracking", trackingRoutes);
router.use("/notifications", notificationRoutes);
router.use("/reports", reportRoutes);
router.use("/profiles", profileRoutes);

export default router;