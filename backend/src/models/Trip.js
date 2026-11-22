import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },
    mode: { type: String, enum: ["demo", "live"], default: "demo" },
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);
tripSchema.index({ driver: 1, status: 1 });
tripSchema.index({ bus: 1, status: 1 });

export default mongoose.model("Trip", tripSchema);