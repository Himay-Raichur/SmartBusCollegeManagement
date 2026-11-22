import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Driver from "../models/Driver.js";
import Bus from "../models/Bus.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { createStudentAccount } from "../services/accountService.js";

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone });

// Role is never read from the body: public registration always creates a student.
export const register = asyncHandler(async (req, res) => {
  const { user } = await createStudentAccount(req.body);
  res.status(201).json({ success: true, token: sign(user._id), user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+password");
  if (!user || !(await user.matchPassword(req.body.password))) throw httpError(401, "Invalid email or password");
  if (user.isActive === false) throw httpError(403, "Account is deactivated");
  res.json({ success: true, token: sign(user._id), user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.role === "student") {
    profile = await Student.findOne({ user: req.user._id }).populate("route", "name routeNumber").populate("bus", "busNumber");
  } else if (req.user.role === "driver") {
    const driver = await Driver.findOne({ user: req.user._id });
    const bus = driver
      ? await Bus.findOne({ driver: driver._id }).populate("route", "name routeNumber")
      : null;
    profile = { ...driver?.toObject(), bus };
  }
  res.json({ success: true, user: publicUser(req.user), profile });
});