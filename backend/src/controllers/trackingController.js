import BusLocation from "../models/BusLocation.js";
import Bus from "../models/Bus.js";
import Trip from "../models/Trip.js";
import Stop from "../models/Stop.js";
import BusPass from "../models/BusPass.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { getDriverProfile, getStudentProfile } from "../utils/profiles.js";
import { estimate } from "../services/etaService.js";

export const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  const nLat = Number(lat);
  const nLng = Number(lng);
  if ([lat, lng].some((v) => v == null || v === "") || !Number.isFinite(nLat) || !Number.isFinite(nLng) || Math.abs(nLat) > 90 || Math.abs(nLng) > 180)
    throw httpError(422, "Valid lat and lng are required");

  const driver = await getDriverProfile(req.user._id);
  const trip = await Trip.findOne({ driver: driver._id, status: "active" });
  if (!trip) throw httpError(409, "Start a trip first");
  if (trip.mode !== "live") throw httpError(409, "Trip is in demo mode; GPS updates are not accepted");

  const location = await BusLocation.findOneAndUpdate(
    { bus: trip.bus },
    { bus: trip.bus, trip: trip._id, lat: nLat, lng: nLng, mode: "live" },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: location });
});

export const allBusLocations = asyncHandler(async (req, res) => {
  const data = await BusLocation.find().populate("bus", "busNumber route").populate("trip", "status mode route");
  res.json({ success: true, data });
});

export const myBusTracking = asyncHandler(async (req, res) => {
  const student = await getStudentProfile(req.user._id);
  if (!student.bus) return res.json({ success: true, data: { assigned: false } });

  const [bus, location, trip, pass, stops] = await Promise.all([
    Bus.findById(student.bus).populate("route", "name routeNumber"),
    BusLocation.findOne({ bus: student.bus }),
    Trip.findOne({ bus: student.bus, status: "active" }),
    BusPass.findOne({ student: student._id, status: "approved" }).populate("pickupStop"),
    Stop.find({ route: student.route }).sort("sequence"),
  ]);

  let eta = null;
  let stopEtas = [];
  if (trip && location) {
    stopEtas = stops.map((s) => ({ stop: s.name, sequence: s.sequence, ...estimate(location, s) }));
    if (pass?.pickupStop) eta = { pickupStop: pass.pickupStop.name, ...estimate(location, pass.pickupStop) };
  }

  res.json({
    success: true,
    data: {
      assigned: true,
      bus,
      stops,
      tripActive: Boolean(trip),
      trackingMode: trip?.mode || null, // "demo" = simulated, "live" = real GPS
      location,
      lastUpdated: location?.updatedAt || null,
      eta,
      stopEtas,
      note: "Estimates are approximate: straight-line distance divided by an average bus speed.",
    },
  });
});