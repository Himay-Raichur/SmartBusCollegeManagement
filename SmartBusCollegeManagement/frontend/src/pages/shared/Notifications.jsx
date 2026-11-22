import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api.js";
import useFetch from "../../hooks/useFetch.js";
import { Button, Empty, ErrorBox, PageHeader, PageLoader, Pagination } from "../../components/ui.jsx";
import { errMsg, fmtDateTime } from "../../utils/format.js";

export default function Notifications() {
  const [page, setPage] = useState(1);
  const { data, meta, extra, loading, error, reload } = useFetch("/notifications", { page, limit: 10 });

  const read = async (n) => {
    if (n.isRead) return;
    try { await api.patch(`/notifications/${n._id}/read`); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const readAll = async () => {
    try { await api.patch("/notifications/read-all"); reload(); } catch (e) { toast.error(errMsg(e)); }
  };

  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (loading && !data) return <PageLoader />;
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={`${extra?.unread ?? 0} unread`}
        action={<Button variant="outline" onClick={readAll} disabled={!extra?.unread}>Mark all as read</Button>}
      />
      {!data?.length ? <Empty text="No notifications" /> : (
        <ul className="space-y-2">
          {data.map((n) => (
            <li
              key={n._id}
              onClick={() => read(n)}
              className={`cursor-pointer rounded-xl border p-4 ${n.isRead ? "border-slate-200 bg-white" : "border-secondary/40 bg-sky-50"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-slate-800">{n.title}</p>
                <span className="text-xs text-slate-500">{fmtDateTime(n.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{n.message}</p>
            </li>
          ))}
        </ul>
      )}
      <Pagination meta={meta} onPage={setPage} />
    </>
  );
}