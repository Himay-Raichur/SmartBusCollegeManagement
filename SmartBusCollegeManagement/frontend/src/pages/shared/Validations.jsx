import { useState } from "react";
import useFetch from "../../hooks/useFetch.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Badge, DataTable, PageHeader, Pagination, inputCls } from "../../components/ui.jsx";
import { fmtDateTime } from "../../utils/format.js";

export default function Validations() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [page, setPage] = useState(1);
  const [result, setResult] = useState("");
  const [route, setRoute] = useState("");
  const [bus, setBus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const routes = useFetch("/routes", { limit: 100 });
  const buses = useFetch("/buses", { limit: 100 });
  const { data, meta, loading, error, reload } = useFetch("/validations", {
    page, limit: 10, result: result || undefined,
    route: isAdmin ? route || undefined : undefined,
    bus: isAdmin ? bus || undefined : undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
  });

  const columns = [
    { header: "Time", render: (v) => fmtDateTime(v.createdAt) },
    ...(isAdmin ? [{ header: "Student", render: (v) => (v.student ? `${v.student.user?.name} (${v.student.studentId})` : "—") }] : []),
    { header: "Pass", render: (v) => v.pass?.passId || "—" },
    { header: "Bus", render: (v) => v.bus?.busNumber },
    { header: "Route", render: (v) => v.route?.name },
    { header: "Result", render: (v) => <Badge value={v.result} /> },
  ];
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  return (
    <>
      <PageHeader title={isAdmin ? "Pass validation records" : "My pass validation history"} />
      <div className="mb-4 flex flex-wrap gap-3">
        <select className={`${inputCls} w-auto`} value={result} onChange={reset(setResult)}>
          <option value="">All results</option>
          {["valid", "invalid", "expired", "inactive", "route_mismatch"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {isAdmin && (
          <>
            <select className={`${inputCls} w-auto`} value={route} onChange={reset(setRoute)}>
              <option value="">All routes</option>
              {routes.data?.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
            <select className={`${inputCls} w-auto`} value={bus} onChange={reset(setBus)}>
              <option value="">All buses</option>
              {buses.data?.map((b) => <option key={b._id} value={b._id}>{b.busNumber}</option>)}
            </select>
          </>
        )}
        <input type="date" className={`${inputCls} w-auto`} value={from} onChange={reset(setFrom)} aria-label="From date" />
        <input type="date" className={`${inputCls} w-auto`} value={to} onChange={reset(setTo)} aria-label="To date" />
      </div>
      <DataTable columns={columns} rows={data} loading={loading} error={error} onRetry={reload} emptyText="No validation records" />
      <Pagination meta={meta} onPage={setPage} />
    </>
  );
}