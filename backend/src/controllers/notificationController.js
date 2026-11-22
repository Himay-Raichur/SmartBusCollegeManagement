import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import Driver from "../models/Driver.js";
import Bus from "../models/Bus.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { notifyUsers } from "../utils/notify.js";
import { getPaging, pageMeta } from "../utils/paginate.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = { user: req.user._id };
  const [data, total, unread] = await Promise.all([
    Notification.find(filter).sort("-createdAt").skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);
  res.json({ success: true, data, unread, meta: pageMeta(page, limit, total) });
});

export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true });
  if (!n) throw httpError(404, "Notification not found");
  res.json({ success: true, data: n });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: "All notifications marked as read" });
});

export const announce = asyncHandler(async (req, res) => {
  const { title, message, audience, route, type = "announcement" } = req.body;
  let userIds = [];

  if (audience !== "drivers") {
    userIds.push(...(await Student.find(route ? { route } : {}).distinct("user")));
  }
  if (audience !== "students") {
    if (route) {
      const driverIds = await Bus.find({ route, driver: { $ne: null } }).distinct("driver");
      userIds.push(...(await Driver.find({ _id: { $in: driverIds } }).distinct("user")));
    } else {
      userIds.push(...(await Driver.find().distinct("user")));
    }
  }
  await notifyUsers(userIds, { title, message, type });
  res.status(201).json({ success: true, message: `Announcement sent to ${new Set(userIds.map(String)).size} user(s)` });
});