
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api.js";
import useFetch from "../../hooks/useFetch.js";
import useDebounce from "../../hooks/useDebounce.js";
import { errMsg, fmtDate, plusMonthsISO } from "../../utils/format.js";
import { Badge, Button, DataTable, PageHeader, Pagination, SearchBox } from "../../components/ui.jsx";
import { FormModal } from "../../components/FormModal.jsx";

const TABS = ["", "pending", "approved", "rejected", "expired"];

export default function Passes() {
  const [q, setQ] = useState("");
  const dq = useDebounce(q);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch("/passes", { q: dq || undefined, status: status || undefined, page, limit: 10 });
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [busOptions, setBusOptions] = useState([]);

  useEffect(() => {
    if (!approving) return;
    api.get("/buses", { params: { route: approving.route._id, limit: 100 } })
      .then((r) => setBusOptions(r.data.data.filter((b) => !["maintenance", "inactive"].includes(b.status)).map((b) => ({ value: b._id, label: `${b.busNumber} (${b.capacity} seats)` }))))
      .catch((e) => toast.error(errMsg(e)));
  }, [approving]);

  const approve = async (v) => {
    await api.patch(`/passes/${approving._id}/approve`, {
      bus: v.bus,
      validUntil: new Date(`${v.validUntil}T23:59:59`).toISOString(),
    });
    toast.success("Pass approved");
    setApproving(null);
    reload();
  };

  const reject = async (v) => {
    await api.patch(`/passes/${rejecting._id}/reject`, { reason: v.reason });
    toast.success("Pass rejected");
    setRejecting(null);
    reload();
  };

  const columns = [
    { header: "Pass ID", render: (p) => p.passId },
    {
      header: "Student",
      render: (p) => (
        <div>
          <p>{p.student?.user?.name}</p>
          <p className="text-xs text-slate-500">{p.student?.studentId}</p>
        </div>
      ),
    },
    { header: "Route", render: (p) => p.route?.name },
    { header: "Pickup stop", render: (p) => p.pickupStop?.name },
    { header: "Bus", render: (p) => p.bus?.busNumber || "—" },
    { header: "Valid until", render: (p) => fmtDate(p.validUntil) },
    { header: "Status", render: (p) => <Badge value={p.status} /> },
    {
      header: "Actions",
      render: (p) => p.status === "pending" ? (
        <div className="flex gap-2">
          <Button size="sm" variant="accent" onClick={() => setApproving(p)}>Approve</Button>
          <Button size="sm" variant="danger" onClick={() => setRejecting(p)}>Reject</Button>
        </div>
      ) : (
        p.status === "rejected" ? <span className="text-xs text-slate-500">{p.rejectionReason}</span> : "—"
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Bus pass applications" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button key={t || "all"} onClick={() => { setStatus(t); setPage(1); }} className={`rounded-md px-3 py-1.5 text-sm capitalize ${status === t ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              {t || "All"}
            </button>
          ))}
        </div>
        <div className="w-64">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search pass ID or student ID" />
        </div>
      </div>

      <DataTable columns={columns} rows={data} loading={loading} error={error} onRetry={reload} emptyText="No passes in this view" />
      <Pagination meta={meta} onPage={setPage} />

      <FormModal open={!!approving} title={`Approve ${approving?.passId || ""}`} submitLabel="Approve pass"
        fields={[
          { name: "bus", label: `Bus on ${approving?.route?.name || "route"}`, type: "select", required: true, options: busOptions, emptyLabel: busOptions.length ? "Select a bus..." : "No bus assigned to this route" },
          { name: "validUntil", label: "Valid until", type: "date", required: true },
        ]}
        initial={{ validUntil: plusMonthsISO(6) }} onClose={() => setApproving(null)} onSubmit={approve} />

      <FormModal open={!!rejecting} title={`Reject ${rejecting?.passId || ""}`} submitLabel="Reject pass"
        fields={[{ name: "reason", label: "Reason", type: "textarea", required: true }]} initial={{}} onClose={() => setRejecting(null)} onSubmit={reject} />
    </>
  );
}
