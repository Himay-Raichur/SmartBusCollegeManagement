import Bus from "../models/Bus.js";
import Driver from "../models/Driver.js";
import Route from "../models/Route.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import pick from "../utils/pick.js";
import { notifyUsers } from "../utils/notify.js";
import { getPaging, pageMeta, escapeRegex } from "../utils/paginate.js";

const FIELDS = ["busNumber", "registrationNumber", "capacity", "busType", "status"];

const populate = (q) =>
  q
    .populate({ path: "driver", select: "licenseNumber user", populate: { path: "user", select: "name phone" } })
    .populate("route", "name routeNumber");

const ensureDriverFree = async (driverId, exceptBusId) => {
  if (!(await Driver.exists({ _id: driverId }))) throw httpError(404, "Driver not found");
  const q = { driver: driverId };
  if (exceptBusId) q._id = { $ne: exceptBusId };
  if (await Bus.exists(q)) throw httpError(409, "Driver is already assigned to another bus");
};

const notifyDriver = async (driverId, title, message) => {
  const d = await Driver.findById(driverId).select("user");
  if (d) await notifyUsers([d.user], { title, message, type: "assignment" });
};

export const listBuses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.route) filter.route = String(req.query.route);
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), "i");
    filter.$or = [{ busNumber: rx }, { registrationNumber: rx }];
  }
  const [data, total] = await Promise.all([
    populate(Bus.find(filter).sort("busNumber").skip(skip).limit(limit)),
    Bus.countDocuments(filter),
  ]);
  res.json({ success: true, data, meta: pageMeta(page, limit, total) });
});

export const getBus = asyncHandler(async (req, res) => {
  const bus = await populate(Bus.findById(req.params.id));
  if (!bus) throw httpError(404, "Bus not found");
  const assignedStudents = await Student.countDocuments({ bus: bus._id });
  res.json({ success: true, data: { ...bus.toObject(), assignedStudents } });
});

export const createBus = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (req.body.route) {
    if (!(await Route.exists({ _id: req.body.route }))) throw httpError(404, "Route not found");
    data.route = req.body.route;
  }
  if (req.body.driver) {
    await ensureDriverFree(req.body.driver);
    data.driver = req.body.driver;
  }
  const bus = await Bus.create(data);
  if (bus.driver) await notifyDriver(bus.driver, "Bus assigned", `You have been assigned to bus ${bus.busNumber}.`);
  res.status(201).json({ success: true, data: await populate(Bus.findById(bus._id)) });
});

export const updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) throw httpError(404, "Bus not found");
  Object.assign(bus, pick(req.body, FIELDS));

  let routeChanged = false;
  if (req.body.driver !== undefined && String(req.body.driver || "") !== String(bus.driver || "")) {
    if (req.body.driver) await ensureDriverFree(req.body.driver, bus._id);
    bus.driver = req.body.driver || null;
    if (bus.driver) await notifyDriver(bus.driver, "Bus assigned", `You have been assigned to bus ${bus.busNumber}.`);
  }
  if (req.body.route !== undefined && String(req.body.route || "") !== String(bus.route || "")) {
    if (req.body.route && !(await Route.exists({ _id: req.body.route }))) throw httpError(404, "Route not found");
    bus.route = req.body.route || null;
    routeChanged = true;
  }
  await bus.save();

  if (routeChanged) {
    if (bus.driver) await notifyDriver(bus.driver, "Route changed", `Bus ${bus.busNumber} has a new route assignment.`);
    const userIds = await Student.find({ bus: bus._id }).distinct("user");
    await notifyUsers(userIds, { title: "Route changed", message: `The route for bus ${bus.busNumber} was changed.`, type: "route_change" });
  }
  res.json({ success: true, data: await populate(Bus.findById(bus._id)) });
});

// "Delete" = mark inactive (keeps trip and pass history valid).
export const deactivateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByIdAndUpdate(req.params.id, { status: "inactive" }, { new: true });
  if (!bus) throw httpError(404, "Bus not found");
  res.json({ success: true, message: "Bus marked inactive" });
});