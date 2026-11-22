import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  },
  { timestamps: true }
);

export default mongoose.model("Driver", driverSchema);