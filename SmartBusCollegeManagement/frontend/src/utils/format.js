export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString("en-IN") : "—");
export const errMsg = (e) => e?.response?.data?.message || e?.message || "Something went wrong";
export const plusMonthsISO = (m) => {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d.toISOString().slice(0, 10);
};