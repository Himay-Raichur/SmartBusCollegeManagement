export const getPaging = (q) => {
  const page = Math.max(parseInt(q.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};
export const pageMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");