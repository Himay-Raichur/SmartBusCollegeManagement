import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    routeNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    startPoint: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    distanceKm: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Route", routeSchema);