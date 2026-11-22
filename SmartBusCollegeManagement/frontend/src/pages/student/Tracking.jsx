import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch.js";
import { Card, DataTable, Empty, ErrorBox, PageHeader, PageLoader } from "../../components/ui.jsx";
import MapView from "../../components/MapView.jsx";
import { fmtTime } from "../../utils/format.js";

export default function StudentTracking() {
  const { data: t, loading, error, reload } = useFetch("/tracking/my-bus", {}, 5000);
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (loading || !t) return <PageLoader />;
  if (!t.assigned) return (
    <>
      <PageHeader title="Track my bus" />
      <Empty text="No bus is assigned to you yet." />
      <p className="mt-3 text-center text-sm"><Link className="text-secondary hover:underline" to="/student/pass">Apply for a bus pass</Link></p>
    </>
  );

  const pickupId = t.stops.find((s) => s.name === t.eta?.pickupStop)?._id;
  const buses = t.tripActive && t.location ? [{ key: "bus", lat: t.location.lat, lng: t.location.lng, mode: t.trackingMode, label: `Bus ${t.bus.busNumber}` }] : [];

  const banner = !t.tripActive
    ? { cls: "bg-slate-100 text-slate-700", text: "No active trip right now. The bus is not running." }
    : t.trackingMode === "demo"
      ? { cls: "bg-amber-100 text-amber-800", text: "DEMO MODE: the bus position is SIMULATED, not real GPS." }
      : { cls: "bg-emerald-100 text-emerald-800", text: "LIVE GPS: position shared from the driver's device." };

  return (
    <>
      <PageHeader title={`Track bus ${t.bus.busNumber}`} subtitle={t.bus.route ? `${t.bus.route.routeNumber} · ${t.bus.route.name}` : ""} />
      <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${banner.cls}`}>{banner.text}</div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><MapView stops={t.stops} buses={buses} pickupId={pickupId} height={420} /></div>
        <Card title="Estimated arrival (approximate)">
          {t.eta ? (
            <>
              <p className="text-3xl font-semibold text-primary">≈ {t.eta.minutes} min</p>
              <p className="mt-1 text-sm text-slate-600">to {t.eta.pickupStop}</p>
              <p className="text-sm text-slate-600">around {fmtTime(t.eta.arrivalTime)} · {t.eta.distanceKm} km away</p>
              <p className="mt-2 text-xs text-slate-500">Last position update: {fmtTime(t.lastUpdated)}</p>
            </>
          ) : <p className="text-sm text-slate-600">{t.tripActive ? "Waiting for the first position update..." : "ETA appears when the bus is on a trip."}</p>}
          <p className="mt-3 text-xs text-slate-500">{t.note}</p>
        </Card>
      </div>
      {t.stopEtas.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 font-semibold text-primary">Stops (approximate arrival)</h2>
          <DataTable
            columns={[
              { header: "#", render: (s) => s.sequence }, { header: "Stop", render: (s) => s.stop },
              { header: "Distance from bus", render: (s) => `${s.distanceKm} km` },
              { header: "ETA", render: (s) => `≈ ${s.minutes} min (${fmtTime(s.arrivalTime)})` },
            ]}
            rows={t.stopEtas.map((s) => ({ ...s, _id: s.sequence }))}
          />
        </div>
      )}
    </>
  );
}