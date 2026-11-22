import User from "../models/User.js";
import Student from "../models/Student.js";
import Bus from "../models/Bus.js";
import Route from "../models/Route.js";
import BusPass from "../models/BusPass.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import pick from "../utils/pick.js";
import { notifyUsers } from "../utils/notify.js";
import { getPaging, pageMeta, escapeRegex } from "../utils/paginate.js";
import { createStudentAccount } from "../services/accountService.js";

const populate = (q) =>
  q.populate("user", "name email phone isActive").populate("route", "name routeNumber").populate("bus", "busNumber capacity");

export const listStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = {};
  for (const k of ["department", "route", "bus"]) if (req.query[k]) filter[k] = String(req.query[k]);
  if (req.query.year) filter.year = Number(req.query.year);
  if (req.query.status) {
    filter.user = { $in: await User.find({ role: "student", isActive: req.query.status === "active" }).distinct("_id") };
  }
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), "i");
    const ids = await User.find({ role: "student", $or: [{ name: rx }, { email: rx }] }).distinct("_id");
    filter.$or = [{ studentId: rx }, { user: { $in: ids } }];
  }
  const [data, total] = await Promise.all([
    populate(Student.find(filter).sort("-createdAt").skip(skip).limit(limit)),
    Student.countDocuments(filter),
  ]);
  res.json({ success: true, data, meta: pageMeta(page, limit, total) });
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await populate(Student.findById(req.params.id));
  if (!student) throw httpError(404, "Student not found");
  const latestPass = await BusPass.findOne({ student: student._id }).sort("-createdAt").select("passId status validUntil");
  res.json({ success: true, data: { ...student.toObject(), latestPass } });
});

export const createStudent = asyncHandler(async (req, res) => {
  const { student } = await createStudentAccount(req.body);
  res.status(201).json({ success: true, data: await populate(Student.findById(student._id)) });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw httpError(404, "Student not found");
  const user = await User.findById(student.user);
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
  Object.assign(student, pick(b, ["department", "year", "section", "address"]));

  const notes = [];
  if (b.route !== undefined && String(b.route || "") !== String(student.route || "")) {
    if (b.route && !(await Route.exists({ _id: b.route }))) throw httpError(404, "Route not found");
    student.route = b.route || null;
    notes.push("Your route was updated");
  }
  if (b.bus !== undefined && String(b.bus || "") !== String(student.bus || "")) {
    if (b.bus) {
      const bus = await Bus.findById(b.bus);
      if (!bus) throw httpError(404, "Bus not found");
      const seats = await Student.countDocuments({ bus: bus._id, _id: { $ne: student._id } });
      if (seats >= bus.capacity) throw httpError(409, "Bus is full");
    }
    student.bus = b.bus || null;
    notes.push("Your bus assignment was updated");
  }

  await user.save();
  await student.save();
  if (notes.length)
    await notifyUsers([user._id], { title: "Transport assignment updated", message: notes.join(". ") + ".", type: "assignment" });
  res.json({ success: true, data: await populate(Student.findById(student._id)) });
});

// "Delete" = deactivate, so history (passes, validations) stays intact.
export const deactivateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw httpError(404, "Student not found");
  await User.findByIdAndUpdate(student.user, { isActive: false });
  res.json({ success: true, message: "Student account deactivated" });
});