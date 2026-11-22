import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { startSimulation } from "./src/services/trackingSimulator.js";

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("Set JWT_SECRET (16+ characters) in backend/.env");
  process.exit(1);
}

const start = async () => {
  await connectDB();
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
  });
  startSimulation();
};

start();