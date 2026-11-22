import crypto from "crypto";
import BusPass from "../models/BusPass.js";
import Student from "../models/Student.js";
import Route from "../models/Route.js";
import Stop from "../models/Stop.js";
import Bus from "../models/Bus.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { notifyUsers } from "../utils/notify.js";
import { getStudentProfile } from "../utils/profiles.js";
import { getPaging, pageMeta, escapeRegex } from "../utils/paginate.js";
import { expireOldPasses } from "../services/passService.js";

const populate = (q) =>
  q
    .populate({ path: "student", select: "studentId department year user", populate: { path: "user", select: "name email" } })
    .populate("route", "name routeNumber")
    .populate("bus", "busNumber")
    .populate("pickupStop", "name sequence");

const newPassId = () => `BP-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

export const applyForPass = asyncHandler(async (req, res) => {
  const student = await getStudentProfile(req.user._id);
  const { route, pickupStop } = req.body;
  if (!(await Route.exists({ _id: route, isActive: true }))) throw httpError(404, "Route not found or inactive");
  if (!(await Stop.exists({ _id: pickupStop, route }))) throw httpError(400, "Pickup stop does not belong to the selected route");

  await expireOldPasses();
  if (await BusPass.exists({ student: student._id, status: { $in: ["pending", "approved"] } }))
    throw httpError(409, "You already have a pending or active pass");

  const pass = await BusPass.create({ passId: newPassId(), student: student._id, route, pickupStop });
  const admins = await User.find({ role: "admin", isActive: true }).distinct("_id");
  await notifyUsers(admins, {
    title: "New pass application",
    message: `${req.user.name} applied for a bus pass (${pass.passId}).`,
    type: "pass",
  });
  res.status(201).json({ success: true, data: await populate(BusPass.findById(pass._id)) });
});

export const myPasses = asyncHandler(async (req, res) => {
  const student = await getStudentProfile(req.user._id);
  await expireOldPasses();
  const data = await populate(BusPass.find({ student: student._id }).sort("-createdAt")); // includes qrToken (own pass)
  res.json({ success: true, data });
});

export const listPasses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  await expireOldPasses();
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.route) filter.route = String(req.query.route);
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), "i");
    const studentIds = await Student.find({ studentId: rx }).distinct("_id");
    filter.$or = [{ passId: rx }, { student: { $in: studentIds } }];
  }
  const [data, total] = await Promise.all([
    populate(BusPass.find(filter).select("-qrToken").sort("-createdAt").skip(skip).limit(limit)),
    BusPass.countDocuments(filter),
  ]);
  res.json({ success: true, data, meta: pageMeta(page, limit, total) });
});

export const getPass = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "admin";
  const query = BusPass.findById(req.params.id);
  if (isAdmin) query.select("-qrToken");
  const pass = await populate(query);
  if (!pass) throw httpError(404, "Pass not found");
  if (!isAdmin) {
    const student = await getStudentProfile(req.user._id);
    if (String(pass.student._id) !== String(student._id)) throw httpError(404, "Pass not found");
  }
  res.json({ success: true, data: pass });
});

export const approvePass = asyncHandler(async (req, res) => {
  const pass = await BusPass.findById(req.params.id).populate("student");
  if (!pass) throw httpError(404, "Pass not found");
  if (pass.status !== "pending") throw httpError(409, `Pass is already ${pass.status}`);

  const bus = await Bus.findById(req.body.bus);
  if (!bus) throw httpError(404, "Bus not found");
  if (String(bus.route) !== String(pass.route)) throw httpError(400, "Selected bus is not assigned to the pass route");
  if (["maintenance", "inactive"].includes(bus.status)) throw httpError(400, "Selected bus is not in service");

  const from = req.body.validFrom ? new Date(req.body.validFrom) : new Date();
  const until = new Date(req.body.validUntil);
  if (isNaN(until) || until <= from || until <= new Date()) throw httpError(400, "validUntil must be in the future and after validFrom");

  const seats = await Student.countDocuments({ bus: bus._id, _id: { $ne: pass.student._id } });
  if (seats >= bus.capacity) throw httpError(409, "Bus is full");

  pass.set({
    bus: bus._id,
    validFrom: from,
    validUntil: until,
    status: "approved",
    qrToken: crypto.randomBytes(16).toString("hex"),
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
  });
  await pass.save();
  await Student.findByIdAndUpdate(pass.student._id, { route: pass.route, bus: bus._id });
  await notifyUsers([pass.student.user], {
    title: "Bus pass approved",
    message: `Your pass ${pass.passId} is approved for bus ${bus.busNumber}.`,
    type: "pass",
  });
  res.json({ success: true, data: await populate(BusPass.findById(pass._id).select("-qrToken")) });
});

export const rejectPass = asyncHandler(async (req, res) => {
  const pass = await BusPass.findById(req.params.id).populate("student", "user");
  if (!pass) throw httpError(404, "Pass not found");
  if (pass.status !== "pending") throw httpError(409, `Pass is already ${pass.status}`);
  pass.set({ status: "rejected", rejectionReason: req.body.reason, reviewedBy: req.user._id, reviewedAt: new Date() });
  await pass.save();
  await notifyUsers([pass.student.user], {
    title: "Bus pass rejected",
    message: `Your pass application ${pass.passId} was rejected: ${req.body.reason}`,
    type: "pass",
  });
  res.json({ success: true, data: await populate(BusPass.findById(pass._id).select("-qrToken")) });
});