import Route from "../models/Route.js";
import Stop from "../models/Stop.js";
import Bus from "../models/Bus.js";
import Student from "../models/Student.js";
import BusPass from "../models/BusPass.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import pick from "../utils/pick.js";
import { notifyUsers } from "../utils/notify.js";
import { getPaging, pageMeta, escapeRegex } from "../utils/paginate.js";

const ROUTE_FIELDS = ["name", "routeNumber", "startPoint", "destination", "distanceKm", "isActive"];
const STOP_FIELDS = ["name", "sequence", "lat", "lng", "arrivalTime"];

const notifyRouteStudents = async (routeId, message) => {
  const ids = await Student.find({ route: routeId }).distinct("user");
  await notifyUsers(ids, { title: "Route updated", message, type: "route_change" });
};

const withDetails = async (route) => {
  const [stops, buses] = await Promise.all([
    Stop.find({ route: route._id }).sort("sequence"),
    Bus.find({ route: route._id })
      .select("busNumber status driver")
      .populate({ path: "driver", select: "user", populate: { path: "user", select: "name" } }),
  ]);
  return { ...route.toObject(), stops, buses };
};

export const listRoutes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = {};
  if (req.query.active) filter.isActive = req.query.active === "true";
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), "i");
    filter.$or = [{ name: rx }, { routeNumber: rx }];
  }
  const [routes, total] = await Promise.all([
    Route.find(filter).sort("routeNumber").skip(skip).limit(limit),
    Route.countDocuments(filter),
  ]);
  const data = await Promise.all(routes.map(withDetails));
  res.json({ success: true, data, meta: pageMeta(page, limit, total) });
});

export const getRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) throw httpError(404, "Route not found");
  res.json({ success: true, data: await withDetails(route) });
});

export const createRoute = asyncHandler(async (req, res) => {
  const route = await Route.create(pick(req.body, ROUTE_FIELDS));
  if (Array.isArray(req.body.stops) && req.body.stops.length) {
    try {
      await Stop.insertMany(
        req.body.stops.map((s, i) => ({ ...pick(s, STOP_FIELDS), sequence: s.sequence ?? i + 1, route: route._id }))
      );
    } catch (e) {
      await Route.findByIdAndDelete(route._id);
      throw e;
    }
  }
  res.status(201).json({ success: true, data: await withDetails(route) });
});

export const updateRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) throw httpError(404, "Route not found");
  Object.assign(route, pick(req.body, ROUTE_FIELDS));
  await route.save();
  await notifyRouteStudents(route._id, `Details of route ${route.routeNumber} were updated.`);
  res.json({ success: true, data: await withDetails(route) });
});

export const deleteRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) throw httpError(404, "Route not found");
  const [buses, students, passes] = await Promise.all([
    Bus.exists({ route: route._id }),
    Student.exists({ route: route._id }),
    BusPass.exists({ route: route._id }),
  ]);
  if (buses || students || passes)
    throw httpError(409, "Route is in use by buses, students or passes. Set it inactive instead.");
  await Stop.deleteMany({ route: route._id });
  await route.deleteOne();
  res.json({ success: true, message: "Route deleted" });
});

export const addStop = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) throw httpError(404, "Route not found");
  const data = pick(req.body, STOP_FIELDS);
  if (data.sequence === undefined) {
    const last = await Stop.findOne({ route: route._id }).sort("-sequence");
    data.sequence = last ? last.sequence + 1 : 1;
  }
  const stop = await Stop.create({ ...data, route: route._id });
  await notifyRouteStudents(route._id, `A stop (${stop.name}) was added to route ${route.routeNumber}.`);
  res.status(201).json({ success: true, data: stop });
});

export const updateStop = asyncHandler(async (req, res) => {
  const stop = await Stop.findById(req.params.stopId);
  if (!stop) throw httpError(404, "Stop not found");
  Object.assign(stop, pick(req.body, STOP_FIELDS));
  await stop.save();
  await notifyRouteStudents(stop.route, `Stop "${stop.name}" on your route was updated.`);
  res.json({ success: true, data: stop });
});

export const deleteStop = asyncHandler(async (req, res) => {
  const stop = await Stop.findById(req.params.stopId);
  if (!stop) throw httpError(404, "Stop not found");
  if (await BusPass.exists({ pickupStop: stop._id, status: { $in: ["pending", "approved"] } }))
    throw httpError(409, "Stop is a pickup point for an open pass");
  await stop.deleteOne();
  await notifyRouteStudents(stop.route, `Stop "${stop.name}" was removed from your route.`);
  res.json({ success: true, message: "Stop deleted" });
});

// Body: { order: [stopId, stopId, ...] } listing every stop of the route once.
export const reorderStops = asyncHandler(async (req, res) => {
  const { order } = req.body;
  const stops = await Stop.find({ route: req.params.id });
  const ids = Array.isArray(order) ? order.map(String) : null;
  if (!ids || ids.length !== stops.length || !stops.every((s) => ids.includes(String(s._id))))
    throw httpError(400, "order must list every stop of the route exactly once");
  await Stop.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { sequence: i + 1 } } })));
  await notifyRouteStudents(req.params.id, "The stop order on your route was changed.");
  res.json({ success: true, data: await Stop.find({ route: req.params.id }).sort("sequence") });
});