import mongoose from "mongoose";

const busLocationSchema = new mongoose.Schema(
  {
    bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true, unique: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    mode: { type: String, enum: ["demo", "live"], required: true },
  },
  { timestamps: true }
);

export default mongoose.model("BusLocation", busLocationSchema);