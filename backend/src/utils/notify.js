import Notification from "../models/Notification.js";

export const notifyUsers = async (userIds, { title, message, type = "general" }) => {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return;
  await Notification.insertMany(ids.map((user) => ({ user, title, message, type })));
};