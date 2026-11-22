import { useState } from "react";
import useFetch from "../../hooks/useFetch.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Badge, DataTable, PageHeader, Pagination, inputCls } from "../../components/ui.jsx";
import { fmtDateTime } from "../../utils/format.js";

export default function Trips() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, meta, loading, error, reload } = useFetch("/trips", {
    page, limit: 10, status: status || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
  });

  const columns = [
    { header: "Bus", render: (t) => t.bus?.busNumber },
    { header: "Route", render: (t) => t.route?.name },
    ...(isAdmin ? [{ header: "Driver", render: (t) => t.driver?.user?.name }] : []),
    { header: "Tracking", render: (t) => <Badge value={t.mode} /> },
    { header: "Started", render: (t) => fmtDateTime(t.startedAt) },
    { header: "Ended", render: (t) => fmtDateTime(t.endedAt) },
    { header: "Status", render: (t) => <Badge value={t.status} /> },
  ];
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  return (
    <>
      <PageHeader title={isAdmin ? "Trips" : "Trip history"} />
      <div className="mb-4 flex flex-wrap gap-3">
        <select className={`${inputCls} w-auto`} value={status} onChange={reset(setStatus)}>
          <option value="">All statuses</option>
          {["scheduled", "active", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" className={`${inputCls} w-auto`} value={from} onChange={reset(setFrom)} aria-label="From date" />
        <input type="date" className={`${inputCls} w-auto`} value={to} onChange={reset(setTo)} aria-label="To date" />
      </div>
      <DataTable columns={columns} rows={data} loading={loading} error={error} onRetry={reload} emptyText="No trips found" />
      <Pagination meta={meta} onPage={setPage} />
    </>
  );
}