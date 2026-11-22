import User from "../models/User.js";
import Student from "../models/Student.js";
import Driver from "../models/Driver.js";
import httpError from "../utils/httpError.js";

const assertEmailFree = async (email) => {
  if (await User.exists({ email: String(email).toLowerCase() })) throw httpError(409, "Email already registered");
};

export const createStudentAccount = async (d) => {
  if (await Student.exists({ studentId: String(d.studentId).toUpperCase() }))
    throw httpError(409, "Student ID already registered");
  await assertEmailFree(d.email);
  const user = await User.create({ name: d.name, email: d.email, password: d.password, phone: d.phone, role: "student" });
  try {
    const student = await Student.create({
      user: user._id,
      studentId: d.studentId,
      department: d.department,
      year: d.year,
      section: d.section,
      address: d.address,
    });
    return { user, student };
  } catch (e) {
    await User.findByIdAndDelete(user._id);
    throw e;
  }
};

export const createDriverAccount = async (d) => {
  if (await Driver.exists({ licenseNumber: String(d.licenseNumber).toUpperCase() }))
    throw httpError(409, "License number already registered");
  await assertEmailFree(d.email);
  const user = await User.create({ name: d.name, email: d.email, password: d.password, phone: d.phone, role: "driver" });
  try {
    const driver = await Driver.create({ user: user._id, licenseNumber: d.licenseNumber });
    return { user, driver };
  } catch (e) {
    await User.findByIdAndDelete(user._id);
    throw e;
  }
};