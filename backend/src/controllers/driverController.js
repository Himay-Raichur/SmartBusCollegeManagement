import User from "../models/User.js";
import Driver from "../models/Driver.js";
import Bus from "../models/Bus.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import pick from "../utils/pick.js";
import { getPaging, pageMeta, escapeRegex } from "../utils/paginate.js";
import { createDriverAccount } from "../services/accountService.js";

const attachBuses = async (drivers) => {
  const buses = await Bus.find({ driver: { $in: drivers.map((d) => d._id) } }).select("busNumber driver");
  const map = new Map(buses.map((b) => [String(b.driver), { _id: b._id, busNumber: b.busNumber }]));
  return drivers.map((d) => ({ ...d.toObject(), bus: map.get(String(d._id)) || null }));
};

export const listDrivers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = {};
  if (req.query.status) {
    filter.user = { $in: await User.find({ role: "driver", isActive: req.query.status === "active" }).distinct("_id") };
  }
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), "i");
    const ids = await User.find({ role: "driver", $or: [{ name: rx }, { email: rx }] }).distinct("_id");
    filter.$or = [{ licenseNumber: rx }, { user: { $in: ids } }];
  }
  const [items, total] = await Promise.all([
    Driver.find(filter).populate("user", "name email phone isActive").sort("-createdAt").skip(skip).limit(limit),
    Driver.countDocuments(filter),
  ]);
  res.json({ success: true, data: await attachBuses(items), meta: pageMeta(page, limit, total) });
});

export const createDriver = asyncHandler(async (req, res) => {
  const { driver } = await createDriverAccount(req.body);
  res.status(201).json({ success: true, data: await Driver.findById(driver._id).populate("user", "name email phone isActive") });
});

export const updateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) throw httpError(404, "Driver not found");
  const user = await User.findById(driver.user);
  const b = req.body;
  if (b.email && String(b.email).toLowerCase() !== user.email) {
    if (await User.exists({ email: String(b.email).toLowerCase(), _id: { $ne: user._id } }))
      throw httpError(409, "Email already registered");
    user.email = b.email;
  }
  Object.assign(user, pick(b, ["name", "phone"]));
  if (b.isActive !== undefined) user.isActive = Boolean(b.isActive);
  if (b.password) {
    if (String(b.password).length < 6) throw httpError(422, "Password must be at least 6 characters");
    user.password = b.password;
  }
  if (b.licenseNumber) driver.licenseNumber = b.licenseNumber;
  await user.save();
  await driver.save();
  res.json({ success: true, data: await Driver.findById(driver._id).populate("user", "name email phone isActive") });
});

export const deactivateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) throw httpError(404, "Driver not found");
  await User.findByIdAndUpdate(driver.user, { isActive: false });
  res.json({ success: true, message: "Driver account deactivated" });
});