import mongoose from "mongoose";

const busSchema = new mongoose.Schema(
  {
    busNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    registrationNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    capacity: { type: Number, required: true, min: 1 },
    busType: { type: String, enum: ["standard", "mini", "ac", "deluxe"], default: "standard" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null },
    status: {
      type: String,
      enum: ["available", "active", "maintenance", "inactive"],
      default: "available",
    },
  },
  { timestamps: true }
);
busSchema.index({ route: 1 });

export default mongoose.model("Bus", busSchema);