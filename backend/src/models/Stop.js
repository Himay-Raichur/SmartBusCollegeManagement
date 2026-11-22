import mongoose from "mongoose";

const stopSchema = new mongoose.Schema(
  {
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    name: { type: String, required: true, trim: true },
    sequence: { type: Number, required: true, min: 1 },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    arrivalTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "arrivalTime must be HH:MM (24h)"],
    },
  },
  { timestamps: true }
);
stopSchema.index({ route: 1, sequence: 1 });

export default mongoose.model("Stop", stopSchema);