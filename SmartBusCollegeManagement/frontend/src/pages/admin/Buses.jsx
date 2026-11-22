import { useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import api from "../../services/api.js";
import useFetch from "../../hooks/useFetch.js";
import useDebounce from "../../hooks/useDebounce.js";
import { errMsg } from "../../utils/format.js";
import { Badge, Button, ConfirmDialog, DataTable, PageHeader, Pagination, SearchBox, inputCls } from "../../components/ui.jsx";
import { FormModal } from "../../components/FormModal.jsx";

const opts = (arr) => arr.map((v) => ({ value: v, label: v }));

export default function Buses() {
  const [q, setQ] = useState("");
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { data, meta, loading, error, reload } = useFetch("/buses", { q: dq || undefined, page, limit: 10, status: status || undefined });
  const routes = useFetch("/routes", { limit: 100 });
  const drivers = useFetch("/drivers", { limit: 100 });
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const fields = [
    { name: "busNumber", label: "Bus number", required: true, half: true },
    { name: "registrationNumber", label: "Registration number", required: true, half: true },
    { name: "capacity", label: "Capacity", type: "number", min: 1, required: true, half: true },
    { name: "busType", label: "Bus type", type: "select", noEmpty: true, half: true, options: opts(["standard", "mini", "ac", "deluxe"]) },
    { name: "status", label: "Status", type: "select", noEmpty: true, half: true, options: opts(["available", "active", "maintenance", "inactive"]) },
    { name: "route", label: "Assigned route", type: "select", half: true, emptyLabel: "None", options: (routes.data || []).map((r) => ({ value: r._id, label: `${r.routeNumber} - ${r.name}` })) },
    { name: "driver", label: "Assigned driver", type: "select", emptyLabel: "None", options: (drivers.data || []).map((d) => ({ value: d._id, label: `${d.user?.name} (${d.licenseNumber})${d.bus ? ` - on ${d.bus.busNumber}` : ""}` })) },
  ];

  const submit = async (v) => {
    const body = { ...v, capacity: Number(v.capacity) };
    if (form.mode === "create") { await api.post("/buses", body); toast.success("Bus added"); }
    else { await api.put(`/buses/${form.bus._id}`, body); toast.success("Bus updated"); }
    setForm(null);
    reload();
  };

  const deactivate = async () => {
    setBusy(true);
    try { await api.delete(`/buses/${confirm._id}`); toast.success("Bus marked inactive"); setConfirm(null); reload(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const columns = [
    { header: "Bus", render: (b) => <div><p className="font-medium">{b.busNumber}</p><p className="text-xs text-slate-500">{b.registrationNumber}</p></div> },
    { header: "Type / Seats", render: (b) => `${b.busType} · ${b.capacity}` },
    { header: "Driver", render: (b) => b.driver?.user?.name || "Unassigned" },
    { header: "Route", render: (b) => (b.route ? `${b.route.routeNumber} - ${b.route.name}` : "Unassigned") },
    { header: "Status", render: (b) => <Badge value={b.status} /> },
    {
      header: "Actions",
      render: (b) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setForm({ mode: "edit", bus: b })}>Edit</Button>
          {b.status !== "inactive" && <Button size="sm" variant="danger" onClick={() => setConfirm(b)}>Deactivate</Button>}
        </div>
      ),
    },
  ];
  const initial = form?.mode === "edit"
    ? { busNumber: form.bus.busNumber, registrationNumber: form.bus.registrationNumber, capacity: form.bus.capacity, busType: form.bus.busType, status: form.bus.status, route: form.bus.route?._id || "", driver: form.bus.driver?._id || "" }
    : { busType: "standard", status: "available" };

  return (
    <>
      <PageHeader title="Buses" action={<Button onClick={() => setForm({ mode: "create" })}><Plus size={16} /> Add bus</Button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-64"><SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search bus or registration no." /></div>
        <select className={`${inputCls} w-auto`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {["available", "active", "maintenance", "inactive"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <DataTable columns={columns} rows={data} loading={loading} error={error} onRetry={reload} emptyText="No buses found" />
      <Pagination meta={meta} onPage={setPage} />
      <FormModal open={!!form} title={form?.mode === "create" ? "Add bus" : "Edit bus"} fields={fields} initial={initial} onClose={() => setForm(null)} onSubmit={submit} />
      <ConfirmDialog open={!!confirm} danger loading={busy} title="Deactivate bus?" message="The bus will be marked inactive. Existing history is kept." confirmLabel="Deactivate" onConfirm={deactivate} onCancel={() => setConfirm(null)} />
    </>
  );
}