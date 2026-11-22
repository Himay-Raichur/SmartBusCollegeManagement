import { validationResult } from "express-validator";

export default (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  res.status(422).json({ success: false, message: errors[0].message, errors });
};