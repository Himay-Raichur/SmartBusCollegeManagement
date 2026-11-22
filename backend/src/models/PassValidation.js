import mongoose from "mongoose";

const oid = (ref) => ({ type: mongoose.Schema.Types.ObjectId, ref });

const passValidationSchema = new mongoose.Schema(
  {
    student: oid("Student"),
    pass: oid("BusPass"),
    bus: oid("Bus"),
    route: oid("Route"),
    driver: oid("Driver"),
    trip: oid("Trip"),
    result: {
      type: String,
      enum: ["valid", "invalid", "expired", "inactive", "route_mismatch"],
      required: true,
    },
  },
  { timestamps: true }
);
passValidationSchema.index({ createdAt: -1 });
passValidationSchema.index({ student: 1 });

export default mongoose.model("PassValidation", passValidationSchema);