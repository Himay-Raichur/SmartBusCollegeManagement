import asyncHandler from "../utils/asyncHandler.js";
import { getStudentProfile, getDriverProfile } from "../utils/profiles.js";

export const getMyStudentProfile = asyncHandler(async (req, res) => {
  const profile = await getStudentProfile(req.user._id);

  res.status(200).json({
    success: true,
    profile,
  });
});

export const getMyDriverProfile = asyncHandler(async (req, res) => {
  const profile = await getDriverProfile(req.user._id);

  res.status(200).json({
    success: true,
    profile,
  });
});