import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    studentId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    department: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1, max: 4 },
    section: { type: String, trim: true },
    address: { type: String, trim: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", default: null },
  },
  { timestamps: true }
);
studentSchema.index({ route: 1 });
studentSchema.index({ bus: 1 });

export default mongoose.model("Student", studentSchema);