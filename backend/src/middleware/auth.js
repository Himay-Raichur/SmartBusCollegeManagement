import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw httpError(401, "Not authenticated");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw httpError(401, "Invalid or expired token");
  }
  const user = await User.findById(decoded.id);
  if (!user || user.isActive === false) throw httpError(401, "Account not available");
  req.user = user;
  next();
});

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(httpError(403, "You do not have access to this resource"));
    next();
  };