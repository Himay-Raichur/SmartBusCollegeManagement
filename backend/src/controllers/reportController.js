import Student from "../models/Student.js";
import Driver from "../models/Driver.js";
import Bus from "../models/Bus.js";
import Route from "../models/Route.js";
import BusPass from "../models/BusPass.js";
import Trip from "../models/Trip.js";
import PassValidation from "../models/PassValidation.js";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const dashboard = asyncHandler(async (req, res) => {
  const [
    students,
    drivers,
    buses,
    activeRoutes,
    approvedPasses,
    pendingPasses,
    activeTrips,
    unreadNotifications,
  ] = await Promise.all([
    Student.countDocuments(),
    Driver.countDocuments(),
    Bus.countDocuments({ status: { $ne: "inactive" } }),
    Route.countDocuments({ isActive: true }),
    BusPass.countDocuments({ status: "approved" }),
    BusPass.countDocuments({ status: "pending" }),
    Trip.countDocuments({ status: "active" }),
    Notification.countDocuments({ isRead: false }),
  ]);

  const recentPasses = await BusPass.find()
    .sort("-createdAt")
    .limit(5)
    .populate({ path: "student", select: "studentId", populate: { path: "user", select: "name" } })
    .populate("route", "name routeNumber");

  res.json({
    success: true,
    data: {
      counts: {
        students,
        drivers,
        buses,
        activeRoutes,
        approvedPasses,
        pendingPasses,
        activeTrips,
        unreadNotifications,
      },
      recentPasses,
    },
  });
});

export const overview = asyncHandler(async (req, res) => {
  const since = startOfToday();
  const [passesByStatus, busesByStatus, tripsToday, validationsToday] = await Promise.all([
    BusPass.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Bus.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Trip.countDocuments({ startedAt: { $gte: since } }),
    PassValidation.countDocuments({ createdAt: { $gte: since } }),
  ]);

  const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));

  res.json({
    success: true,
    data: {
      passesByStatus: toMap(passesByStatus),
      busesByStatus: toMap(busesByStatus),
      tripsToday,
      validationsToday,
    },
  });
});
