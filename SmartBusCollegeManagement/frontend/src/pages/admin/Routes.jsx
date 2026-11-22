
import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";
import api from "../../services/api.js";
import useFetch from "../../hooks/useFetch.js";
import useDebounce from "../../hooks/useDebounce.js";
import { errMsg } from "../../utils/format.js";
import { Badge, Button, ConfirmDialog, DataTable, Modal, PageHeader, Pagination, SearchBox } from "../../components/ui.jsx";
import { FormModal } from "../../components/FormModal.jsx";
import MapView from "../../components/MapView.jsx";

const ROUTE_FIELDS = [
  { name: "name", label: "Route name", required: true, half: true },
  { name: "routeNumber", label: "Route number", required: true, half: true },
  { name: "startPoint", label: "Starting point", required: true, half: true },
  { name: "destination", label: "Destination", required: true, half: true },
  { name: "distanceKm", label: "Distance (km)", type: "number", min: 0, step: "0.1", half: true },
];

const STOP_FIELDS = [
  { name: "name", label: "Stop name", required: true },
  { name: "lat", label: "Latitude", type: "number", step: "any", required: true, half: true, placeholder: "17.4375" },
  { name: "lng", label: "Longitude", type: "number", step: "any", required: true, half: true, placeholder: "78.4483" },
  { name: "arrivalTime", label: "Arrival time (HH:MM, 24h)", half: true, placeholder: "07:30", pattern: /^([01]\d|2[0-3]):[0-5]\d$/, patternMessage: "Use HH:MM, e.g. 07:30" },
];

export default function AdminRoutes() {
  const [q, setQ] = useState("");
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch("/routes", { q: dq || undefined, page, limit: 10 });
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [selId, setSelId] = useState(null);
  const [stopForm, setStopForm] = useState(null);
  const [stopConfirm, setStopConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const sel = data?.find((r) => r._id === selId);

  const submit = async (v) => {
    const body = { ...v, distanceKm: Number(v.distanceKm || 0) };
    if (form.mode === "create") {
      await api.post("/routes", body);
      toast.success("Route created");
    } else {
      await api.put(`/routes/${form.route._id}`, { ...body, isActive: v.isActive !== "false" });
      toast.success("Route updated");
    }
    setForm(null);
    reload();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/routes/${confirm._id}`);
      toast.success("Route deleted");
      setConfirm(null);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const submitStop = async (v) => {
    const body = { ...v, lat: Number(v.lat), lng: Number(v.lng) };
    if (!body.arrivalTime) delete body.arrivalTime;
    if (stopForm.mode === "create")
      await api.post(`/routes/${sel._id}/stops`, body);
    else
      await api.put(`/routes/stops/${stopForm.stop._id}`, body);
    toast.success("Stop saved");
    setStopForm(null);
    reload();
  };

  const removeStop = async () => {
    setBusy(true);
    try {
      await api.delete(`/routes/stops/${stopConfirm._id}`);
      toast.success("Stop deleted");
      setStopConfirm(null);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const move = async (i, dir) => {
    const ids = sel.stops.map((s) => s._id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try {
      await api.put(`/routes/${sel._id}/stops/reorder`, { order: ids });
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const columns = [
    { header: "No.", render: (r) => r.routeNumber },
    {
      header: "Route",
      render: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="text-xs text-slate-500">{r.startPoint} → {r.destination}</p>
        </div>
      ),
    },
    { header: "Stops", render: (r) => r.stops.length },
    { header: "Buses", render: (r) => (r.buses.length ? r.buses.map((b) => b.busNumber).join(", ") : "—") },
    { header: "Distance", render: (r) => `${r.distanceKm} km` },
    { header: "Status", render: (r) => <Badge value={r.isActive ? "active" : "inactive"} /> },
    {
      header: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <Button size="sm" variant="accent" onClick={() => setSelId(r._id)}>Stops & map</Button>
          <Button size="sm" variant="outline" onClick={() => setForm({ mode: "edit", route: r })}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirm(r)}>Delete</Button>
        </div>
      ),
    },
  ];

  const editFields = [
    ...ROUTE_FIELDS,
    {
      name: "isActive",
      label: "Status",
      type: "select",
      noEmpty: true,
      half: true,
      options: [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
      ],
    },
  ];

  const initial = form?.mode === "edit"
    ? {
        name: form.route.name,
        routeNumber: form.route.routeNumber,
        startPoint: form.route.startPoint,
        destination: form.route.destination,
        distanceKm: form.route.distanceKm,
        isActive: String(form.route.isActive),
      }
    : {};

  return (
    <>
      <PageHeader title="Routes & stops" action={<Button onClick={() => setForm({ mode: "create" })}><Plus size={16} /> Add route</Button>} />

      <div className="mb-4 w-64">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search routes" />
      </div>

      <DataTable columns={columns} rows={data} loading={loading} error={error} onRetry={reload} emptyText="No routes yet" />
      <Pagination meta={meta} onPage={setPage} />

      <FormModal open={!!form} title={form?.mode === "create" ? "Add route" : "Edit route"} fields={form?.mode === "create" ? ROUTE_FIELDS : editFields} initial={initial} onClose={() => setForm(null)} onSubmit={submit} />

      <ConfirmDialog open={!!confirm} danger loading={busy} title="Delete route?" message="Only routes not used by buses, students or passes can be deleted. Otherwise set the route inactive." confirmLabel="Delete" onConfirm={remove} onCancel={() => setConfirm(null)} />

      <Modal open={!!sel} wide title={sel ? `${sel.routeNumber} - ${sel.name}` : ""} onClose={() => setSelId(null)}>
        {sel && (
          <>
            <MapView stops={sel.stops} height={300} />

            <div className="mb-3 mt-4 flex items-center justify-between">
              <h4 className="font-medium text-primary">Stops ({sel.stops.length})</h4>
              <Button size="sm" onClick={() => setStopForm({ mode: "create" })}><Plus size={14} /> Add stop</Button>
            </div>

            <p className="mb-3 text-xs text-slate-500">
              Tip: on openstreetmap.org, right-click a place and choose "Show address" to copy its latitude and longitude.
            </p>

            {!sel.stops.length ? (
              <p className="text-sm text-slate-500">No stops yet. A route needs at least 2 stops for demo tracking.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {sel.stops.map((s, i) => (
                  <li key={s._id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span>
                      <b>{s.sequence}.</b> {s.name}
                      <span className="text-xs text-slate-500">
                        {s.arrivalTime || ""} · {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                      </span>
                    </span>
                    <span className="flex gap-1">
                      <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp size={14} /></Button>
                      <Button size="sm" variant="ghost" disabled={i === sel.stops.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown size={14} /></Button>
                      <Button size="sm" variant="outline" onClick={() => setStopForm({ mode: "edit", stop: s })}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => setStopConfirm(s)}>Delete</Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Modal>

      <FormModal open={!!stopForm} title={stopForm?.mode === "create" ? "Add stop" : "Edit stop"} fields={STOP_FIELDS}
        initial={stopForm?.mode === "edit" ? { name: stopForm.stop.name, lat: stopForm.stop.lat, lng: stopForm.stop.lng, arrivalTime: stopForm.stop.arrivalTime || "" } : {}}
        onClose={() => setStopForm(null)} onSubmit={submitStop} />

      <ConfirmDialog open={!!stopConfirm} danger loading={busy} title="Delete stop?" message={`Remove "${stopConfirm?.name}" from this route?`} confirmLabel="Delete" onConfirm={removeStop} onCancel={() => setStopConfirm(null)} />
    </>
  );
}
