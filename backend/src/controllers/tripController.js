import Trip from "../models/Trip.js";
import Bus from "../models/Bus.js";
import Stop from "../models/Stop.js";
import Student from "../models/Student.js";
import BusLocation from "../models/BusLocation.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { notifyUsers } from "../utils/notify.js";
import { getDriverProfile } from "../utils/profiles.js";
import { getPaging, pageMeta } from "../utils/paginate.js";

const populate = (q) =>
  q
    .populate("bus", "busNumber")
    .populate("route", "name routeNumber")
    .populate({ path: "driver", select: "user", populate: { path: "user", select: "name" } });

export const startTrip = asyncHandler(async (req, res) => {
  const driver = await getDriverProfile(req.user._id);
  const bus = await Bus.findOne({ driver: driver._id });
  if (!bus) throw httpError(409, "You are not assigned to a bus");
  if (!bus.route) throw httpError(409, "Your bus has no route assigned");
  if (["maintenance", "inactive"].includes(bus.status)) throw httpError(409, `Bus is ${bus.status}`);
  if (await Trip.exists({ driver: driver._id, status: "active" })) throw httpError(409, "You already have an active trip");

  const mode = req.body.mode === "live" ? "live" : "demo";
  let first = null;
  if (mode === "demo") {
    const stops = await Stop.find({ route: bus.route }).sort("sequence");
    if (stops.length < 2) throw httpError(409, "Route needs at least 2 stops for demo tracking");
    first = stops[0];
  }

  const trip = await Trip.create({ bus: bus._id, route: bus.route, driver: driver._id, mode, status: "active", startedAt: new Date() });
  bus.status = "active";
  await bus.save();

  if (mode === "demo") {
    await BusLocation.findOneAndUpdate(
      { bus: bus._id },
      { bus: bus._id, trip: trip._id, lat: first.lat, lng: first.lng, mode },
      { upsert: true }
    );
  } else {
    await BusLocation.deleteOne({ bus: bus._id }); // clear stale position until GPS arrives
  }

  const userIds = await Student.find({ bus: bus._id }).distinct("user");
  await notifyUsers(userIds, { title: "Bus trip started", message: `Bus ${bus.busNumber} has started its trip.`, type: "trip" });
  res.status(201).json({ success: true, data: await populate(Trip.findById(trip._id)) });
});

export const endTrip = asyncHandler(async (req, res) => {
  const driver = await getDriverProfile(req.user._id);
  const trip = await Trip.findOne({ driver: driver._id, status: "active" });
  if (!trip) throw httpError(409, "No active trip to end");
  trip.status = "completed";
  trip.endedAt = new Date();
  await trip.save();
  await Bus.findByIdAndUpdate(trip.bus, { status: "available" });
  await BusLocation.deleteOne({ bus: trip.bus });
  res.json({ success: true, data: await populate(Trip.findById(trip._id)) });
});

export const currentTrip = asyncHandler(async (req, res) => {
  const driver = await getDriverProfile(req.user._id);
  const trip = await populate(Trip.findOne({ driver: driver._id, status: "active" }));
  res.json({ success: true, data: trip || null });
});

export const listTrips = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = {};
  if (req.user.role === "driver") filter.driver = (await getDriverProfile(req.user._id))._id;
  for (const k of ["status", "bus", "route", "mode"]) if (req.query[k]) filter[k] = String(req.query[k]);
  if (req.user.role === "admin" && req.query.driver) filter.driver = String(req.query.driver);
  if (req.query.from || req.query.to) {
    filter.startedAt = {};
    if (req.query.from) filter.startedAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.startedAt.$lte = new Date(req.query.to);
  }
  const [data, total] = await Promise.all([
    populate(Trip.find(filter).sort("-startedAt").skip(skip).limit(limit)),
    Trip.countDocuments(filter),
  ]);
  res.json({ success: true, data, meta: pageMeta(page, limit, total) });
});

export const getTrip = asyncHandler(async (req, res) => {
  const trip = await populate(Trip.findById(req.params.id));
  if (!trip) throw httpError(404, "Trip not found");
  if (req.user.role === "driver") {
    const driver = await getDriverProfile(req.user._id);
    if (String(trip.driver._id) !== String(driver._id)) throw httpError(404, "Trip not found");
  }
  res.json({ success: true, data: trip });
});