import mongoose from "mongoose";

const DB_STATES = [
  "disconnected",
  "connected",
  "connecting",
  "disconnecting",
];

export const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Bus API is running",
    database: DB_STATES[mongoose.connection.readyState],
    timestamp: new Date().toISOString(),
  });
};