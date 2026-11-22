import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["general", "announcement", "delay", "pass", "assignment", "route_change", "trip"],
      default: "general",
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);