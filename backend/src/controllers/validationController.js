import BusPass from "../models/BusPass.js";
import Bus from "../models/Bus.js";
import Trip from "../models/Trip.js";
import PassValidation from "../models/PassValidation.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { getDriverProfile, getStudentProfile } from "../utils/profiles.js";
import { getPaging, pageMeta } from "../utils/paginate.js";
import { expireOldPasses } from "../services/passService.js";

const MESSAGES = {
  valid: "Valid pass",
  invalid: "Invalid pass: not recognised",
  expired: "Pass has expired",
  inactive: "Pass is not active",
  route_mismatch: "Pass is not valid for this route",
};

export const scanPass = asyncHandler(async (req, res) => {
  const driver = await getDriverProfile(req.user._id);
  const bus = await Bus.findOne({ driver: driver._id });
  if (!bus) throw httpError(409, "You are not assigned to a bus");
  const trip = await Trip.findOne({ driver: driver._id, status: "active" });
  if (!trip) throw httpError(409, "Start a trip before scanning passes");

  await expireOldPasses();
  const token = String(req.body.qrToken || "").trim();
  const pass = token
    ? await BusPass.findOne({ qrToken: token })
        .populate({ path: "student", populate: { path: "user", select: "name" } })
        .populate("route", "name routeNumber")
    : null;

  const now = new Date();
  let result = "valid";
  if (!pass) result = "invalid";
  else if (pass.status === "expired" || pass.validUntil < now) result = "expired";
  else if (pass.status !== "approved" || pass.validFrom > now || !pass.student.user) result = "inactive";
  else if (
    String(pass.route._id) !== String(trip.route) ||
    String(pass.student.route) !== String(pass.route._id)
  )
    result = "route_mismatch";

  await PassValidation.create({
    student: pass?.student?._id,
    pass: pass?._id,
    bus: bus._id,
    route: trip.route,
    driver: driver._id,
    trip: trip._id,
    result,
  });

  res.json({
    success: true,
    result,
    message: MESSAGES[result],
    pass: pass
      ? {
          passId: pass.passId,
          studentName: pass.student.user?.name,
          studentId: pass.student.studentId,
          route: pass.route.name,
          validUntil: pass.validUntil,
        }
      : null,
  });
});

export const listValidations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = {};
  if (req.user.role === "driver") filter.driver = (await getDriverProfile(req.user._id))._id;
  if (req.user.role === "student") filter.student = (await getStudentProfile(req.user._id))._id;
  if (req.user.role === "admin") {
    for (const k of ["route", "bus"]) if (req.query[k]) filter[k] = String(req.query[k]);
  }
  if (req.query.result) filter.result = String(req.query.result);
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }
  const [data, total] = await Promise.all([
    PassValidation.find(filter)
      .populate({ path: "student", select: "studentId user", populate: { path: "user", select: "name" } })
      .populate("pass", "passId")
      .populate("bus", "busNumber")
      .populate("route", "name routeNumber")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit),
    PassValidation.countDocuments(filter),
  ]);
  res.json({ success: true, data, meta: pageMeta(page, limit, total) });
});