import { body } from "express-validator";

const email = body("email").trim().toLowerCase().isEmail().withMessage("Valid email is required");
const password = body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters");
const name = body("name").trim().notEmpty().withMessage("Name is required");
const phone = body("phone")
  .optional({ values: "falsy" })
  .matches(/^[0-9+\-\s]{7,15}$/)
  .withMessage("Phone number is invalid");

export const loginRules = [email, body("password").notEmpty().withMessage("Password is required")];

export const studentRules = [
  name,
  email,
  password,
  phone,
  body("studentId").trim().notEmpty().withMessage("Student ID is required"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("year").isInt({ min: 1, max: 4 }).withMessage("Year must be 1 to 4"),
];

export const driverRules = [
  name,
  email,
  password,
  phone,
  body("licenseNumber").trim().notEmpty().withMessage("License number is required"),
];

export const applyPassRules = [
  body("route").isMongoId().withMessage("Valid route is required"),
  body("pickupStop").isMongoId().withMessage("Valid pickup stop is required"),
];

export const approvePassRules = [
  body("bus").isMongoId().withMessage("Valid bus is required"),
  body("validUntil").isISO8601().withMessage("validUntil must be a valid date"),
  body("validFrom").optional().isISO8601().withMessage("validFrom must be a valid date"),
];

export const rejectPassRules = [body("reason").trim().notEmpty().withMessage("Rejection reason is required")];

export const scanRules = [body("qrToken").trim().notEmpty().withMessage("qrToken is required")];

export const announcementRules = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
  body("audience").isIn(["students", "drivers", "all"]).withMessage("audience must be students, drivers or all"),
  body("type").optional().isIn(["announcement", "delay"]).withMessage("type must be announcement or delay"),
  body("route").optional({ values: "falsy" }).isMongoId().withMessage("route must be a valid id"),
];