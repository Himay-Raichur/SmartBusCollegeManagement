import Student from "../models/Student.js";
import Driver from "../models/Driver.js";
import httpError from "./httpError.js";

export async function getStudentProfile(id) {
  const student = await Student.findOne({ user: id }).populate("user", "name email phone role isActive");
  if (!student) throw httpError(404, "Student profile not found");
  return student;
}

export async function getDriverProfile(id) {
  const driver = await Driver.findOne({ user: id }).populate("user", "name email phone role isActive");
  if (!driver) throw httpError(404, "Driver profile not found");
  return driver;
}
