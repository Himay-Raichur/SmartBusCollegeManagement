import BusPass from "../models/BusPass.js";
import { notifyUsers } from "../utils/notify.js";

export const expireOldPasses = async () => {
  const due = await BusPass.find({ status: "approved", validUntil: { $lt: new Date() } }).populate("student", "user");
  if (!due.length) return;
  await BusPass.updateMany({ _id: { $in: due.map((p) => p._id) } }, { status: "expired" });
  await notifyUsers(due.map((p) => p.student?.user), {
    title: "Bus pass expired",
    message: "Your bus pass has expired. Apply for a new pass to continue travelling.",
    type: "pass",
  });
};