import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api.js";
import useFetch from "../../hooks/useFetch.js";
import { Badge, Button, Card, ConfirmDialog, DataTable, Empty, ErrorBox, PageHeader, PageLoader, inputCls } from "../../components/ui.jsx";
import MapView from "../../components/MapView.jsx";
import { errMsg, fmtDateTime, fmtTime } from "../../utils/format.js";

function useGpsSharing(active) {
  const [state, setState] = useState({ last: null, error: null });
  useEffect(() => {
    if (!active) return;
    if (!navigator.geolocation) { setState({ last: null, error: "This browser does not support geolocation" }); return; }
    let lastSent = 0;
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastSent < 5000) return;
        lastSent = now;
        try {
          await api.post("/tracking/location", { lat: pos.coords.latitude, lng: pos.coords.longitude });
          setState({ last: new Date(), error: null });
        } catch (e) { setState((s) => ({ ...s, error: errMsg(e) })); }
      },
      (err) => setState((s) => ({ ...s, error: err.message })),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active]);
  return state;
}

function RouteStops({ routeId }) {
  const { data, loading, error, reload } = useFetch(`/routes/${routeId}`);
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (loading || !data) return <PageLoader />;
  return (
    <>
      <MapView stops={data.stops} height={280} />
      <ol className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
        {data.stops.map((s) => <li key={s._id} className="flex justify-between px-3 py-2"><span><b>{s.sequence}.</b> {s.name}</span><span className="text-slate-500">{s.arrivalTime || "—"}</span></li>)}
      </ol>
    </>
  );
}

export default function DriverDashboard() {
  const me = useFetch("/auth/me");
  const trip = useFetch("/trips/current", {}, 15000);
  const students = useFetch("/drivers/me/students");
  const [mode, setMode] = useState("demo");
  const [busy, setBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const active = trip.data;
  const gps = useGpsSharing(active?.mode === "live");

  if (me.error) return <ErrorBox message={me.error} onRetry={me.reload} />;
  if (me.loading || trip.loading) return <PageLoader />;
  const bus = me.extra?.profile?.bus;

  const act = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); toast.success(okMsg); trip.reload(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); setConfirmEnd(false); }
  };

  if (!bus) return (<><PageHeader title="Driver dashboard" /><Empty text="No bus is assigned to you yet. Contact the transport office." /></>);

  return (
    <>
      <PageHeader title="Driver dashboard" subtitle={`Bus ${bus.busNumber} · ${bus.route ? `${bus.route.routeNumber} - ${bus.route.name}` : "no route"}`} />
      <Card title="Trip control" className="mb-4">
        {active ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">Trip active since {fmtDateTime(active.startedAt)} <Badge value={active.mode} /></p>
            {active.mode === "live" && (
              <p className={`text-sm ${gps.error ? "text-red-600" : "text-emerald-700"}`}>
                {gps.error ? `GPS problem: ${gps.error}` : gps.last ? `Sharing live GPS. Last sent ${fmtTime(gps.last)}.` : "Waiting for GPS permission and first fix..."}
              </p>
            )}
            {active.mode === "live" && <p className="text-xs text-slate-500">Keep this page open while driving. Location sharing stops if you leave the dashboard.</p>}
            <div className="flex gap-2">
              <Link to="/driver/scan"><Button variant="accent">Scan passes</Button></Link>
              <Button variant="danger" onClick={() => setConfirmEnd(true)}>End trip</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Tracking mode</span>
              <select className={`${inputCls} w-auto`} value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="demo">Demo (simulated movement)</option>
                <option value="live">Live GPS (this device)</option>
              </select>
            </label>
            <Button loading={busy} onClick={() => act(() => api.post("/trips/start", { mode }), "Trip started")}>Start trip</Button>
            {mode === "live" && <p className="w-full text-xs text-slate-500">Live GPS needs a GPS-enabled device and HTTPS (or localhost).</p>}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Bus details">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-slate-500">Bus</dt><dd>{bus.busNumber}</dd></div>
            <div><dt className="text-xs text-slate-500">Registration</dt><dd>{bus.registrationNumber}</dd></div>
            <div><dt className="text-xs text-slate-500">Capacity</dt><dd>{bus.capacity}</dd></div>
            <div><dt className="text-xs text-slate-500">Status</dt><dd><Badge value={bus.status} /></dd></div>
          </dl>
        </Card>
        <Card title="Assigned route">{bus.route ? <RouteStops routeId={bus.route._id} /> : <Empty text="No route assigned" />}</Card>
      </div>

      <h2 className="mb-3 mt-6 font-semibold text-primary">Assigned students</h2>
      <DataTable
        columns={[
          { header: "Student ID", render: (s) => s.studentId }, { header: "Name", render: (s) => s.user?.name },
          { header: "Phone", render: (s) => s.user?.phone || "—" }, { header: "Department", render: (s) => s.department },
        ]}
        rows={students.data} error={students.error} onRetry={students.reload} emptyText="No students assigned to your bus yet"
      />

      <ConfirmDialog open={confirmEnd} danger loading={busy} title="End trip?" message="The trip will be marked completed and tracking will stop." confirmLabel="End trip"
        onConfirm={() => act(() => api.patch("/trips/end"), "Trip ended")} onCancel={() => setConfirmEnd(false)} />
    </>
  );
}