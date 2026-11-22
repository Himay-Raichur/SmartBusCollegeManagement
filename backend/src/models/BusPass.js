import mongoose from "mongoose";

const ref = (name, required = false) => ({
  type: mongoose.Schema.Types.ObjectId,
  ref: name,
  required,
  default: required ? undefined : null,
});

const busPassSchema = new mongoose.Schema(
  {
    passId: { type: String, required: true, unique: true },
    student: ref("Student", true),
    route: ref("Route", true),
    pickupStop: ref("Stop", true),
    bus: ref("Bus"),
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
    },
    validFrom: Date,
    validUntil: Date,
    rejectionReason: String,
    qrToken: { type: String, unique: true, sparse: true },
    reviewedBy: ref("User"),
    reviewedAt: Date,
  },
  { timestamps: true }
);
busPassSchema.index({ student: 1, status: 1 });

export default mongoose.model("BusPass", busPassSchema);