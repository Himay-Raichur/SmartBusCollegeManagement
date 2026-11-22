import "dotenv/config";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Driver from "../models/Driver.js";
import Bus from "../models/Bus.js";
import Route from "../models/Route.js";
import Stop from "../models/Stop.js";
import BusPass from "../models/BusPass.js";
import Trip from "../models/Trip.js";
import BusLocation from "../models/BusLocation.js";
import PassValidation from "../models/PassValidation.js";
import Notification from "../models/Notification.js";
import { createStudentAccount, createDriverAccount } from "../services/accountService.js";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed in production");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const reset = process.argv.includes("--reset");

if ((await User.exists({ role: "admin" })) && !reset) {
  console.log("Data already exists. Run `npm run seed -- --reset` to wipe everything and reseed.");
  process.exit(0);
}

if (reset) {
  for (const M of [User, Student, Driver, Bus, Route, Stop, BusPass, Trip, BusLocation, PassValidation, Notification])
    await M.deleteMany({});
}

await User.create({
  name: "Transport Admin",
  email: "admin@smartbus.test",
  password: "Admin@123",
  role: "admin"
});

const { driver: d1 } = await createDriverAccount({
  name: "Ravi Kumar",
  email: "driver1@smartbus.test",
  password: "Driver@123",
  phone: "9000000001",
  licenseNumber: "TS0120230001"
});

const { driver: d2 } = await createDriverAccount({
  name: "Suresh Reddy",
  email: "driver2@smartbus.test",
  password: "Driver@123",
  phone: "9000000002",
  licenseNumber: "TS0120230002"
});

const mkRoute = async (name, routeNumber, startPoint, distanceKm, stops) => {
  const route = await Route.create({
    name,
    routeNumber,
    startPoint,
    destination: "College Campus, Gachibowli",
    distanceKm
  });

  await Stop.insertMany(
    stops.map(([n, lat, lng, t], i) => ({
      route: route._id,
      name: n,
      sequence: i + 1,
      lat,
      lng,
      arrivalTime: t
    }))
  );

  return route;
};

// Coordinates are approximate, for demonstration only.
const r1 = await mkRoute("Secunderabad - Campus", "R1", "Secunderabad", 22, [
  ["Secunderabad", 17.4399, 78.4983, "07:00"],
  ["Begumpet", 17.444, 78.467, "07:15"],
  ["Ameerpet", 17.4375, 78.4483, "07:30"],
  ["Jubilee Hills Checkpost", 17.4326, 78.4071, "07:45"],
  ["Madhapur", 17.4486, 78.3908, "08:00"],
  ["College Campus", 17.4401, 78.3489, "08:20"],
]);

const r2 = await mkRoute("LB Nagar - Campus", "R2", "LB Nagar", 28, [
  ["LB Nagar", 17.3457, 78.5522, "06:45"],
  ["Dilsukhnagar", 17.3688, 78.5247, "07:00"],
  ["Nampally", 17.3919, 78.4684, "07:20"],
  ["Mehdipatnam", 17.395, 78.435, "07:40"],
  ["Tolichowki", 17.4009, 78.413, "07:55"],
  ["College Campus", 17.4401, 78.3489, "08:20"],
]);

const b1 = await Bus.create({
  busNumber: "BUS-01",
  registrationNumber: "TS09AB1001",
  capacity: 40,
  busType: "standard",
  route: r1._id,
  driver: d1._id
});

const b2 = await Bus.create({
  busNumber: "BUS-02",
  registrationNumber: "TS09AB1002",
  capacity: 35,
  busType: "ac",
  route: r2._id,
  driver: d2._id
});

await Bus.create({
  busNumber: "BUS-03",
  registrationNumber: "TS09AB1003",
  capacity: 30,
  busType: "mini",
  status: "maintenance"
});

const names = ["Ananya Sharma", "Rahul Verma", "Priya Nair", "Arjun Rao", "Meera Iyer"];
const students = [];

for (let i = 0; i < names.length; i++) {
  const { student } = await createStudentAccount({
    name: names[i],
    email: `student${i + 1}@smartbus.test`,
    password: "Student@123",
    phone: `98000000${10 + i}`,
    studentId: `21CS00${i + 1}`,
    department: "CSE",
    year: 3,
    section: "A",
    address: "Hyderabad",
  });

  students.push(student);
}

// Student 1: approved pass on R1. Student 3: pending application on R2.
const s1Stop = await Stop.findOne({ route: r1._id, name: "Ameerpet" });

const qrToken = crypto.randomBytes(16).toString("hex");

const until = new Date();
until.setMonth(until.getMonth() + 6);

await BusPass.create({
  passId: "BP-SEED-0001",
  student: students[0]._id,
  route: r1._id,
  pickupStop: s1Stop._id,
  bus: b1._id,
  status: "approved",
  validFrom: new Date(),
  validUntil: until,
  qrToken,
});

await Student.findByIdAndUpdate(students[0]._id, {
  route: r1._id,
  bus: b1._id
});

await Student.findByIdAndUpdate(students[1]._id, {
  route: r1._id,
  bus: b1._id
});

const s3Stop = await Stop.findOne({ route: r2._id, name: "Mehdipatnam" });

await BusPass.create({
  passId: "BP-SEED-0002",
  student: students[2]._id,
  route: r2._id,
  pickupStop: s3Stop._id
});

console.log("\nSeed complete\n");
console.log("Admin   : admin@smartbus.test    / Admin@123");
console.log("Drivers : driver1@smartbus.test, driver2@smartbus.test / Driver@123");
console.log("Students: student1..5@smartbus.test / Student@123");
console.log(`\nStudent 21CS001 QR token (for scanner testing):\n${qrToken}\n`);

await mongoose.disconnect();