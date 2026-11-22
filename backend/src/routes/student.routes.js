import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { studentRules } from "../middleware/validators.js";
import { listStudents, getStudent, createStudent, updateStudent, deactivateStudent } from "../controllers/studentController.js";

const router = Router();
router.use(protect, authorize("admin"));
router.route("/").get(listStudents).post(studentRules, validate, createStudent);
router.route("/:id").get(getStudent).put(updateStudent).delete(deactivateStudent);

export default router;