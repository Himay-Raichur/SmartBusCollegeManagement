import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { driverRules } from "../middleware/validators.js";
import { listDrivers, createDriver, updateDriver, deactivateDriver } from "../controllers/driverController.js";

const router = Router();
router.use(protect, authorize("admin"));
router.route("/").get(listDrivers).post(driverRules, validate, createDriver);
router.route("/:id").put(updateDriver).delete(deactivateDriver);

export default router;