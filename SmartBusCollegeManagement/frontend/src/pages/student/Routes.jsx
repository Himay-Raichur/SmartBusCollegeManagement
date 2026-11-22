import { useState } from "react";
import useFetch from "../../hooks/useFetch.js";
import { Button, Card, Empty, ErrorBox, Modal, PageHeader, PageLoader } from "../../components/ui.jsx";
import MapView from "../../components/MapView.jsx";

export default function StudentRoutes() {
  const { data, loading, error, reload } = useFetch("/routes", { limit: 100, active: "true" });
  const [sel, setSel] = useState(null);
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (loading || !data) return <PageLoader />;
  const route = data.find((r) => r._id === sel);

  return (
    <>
      <PageHeader title="Routes & stops" subtitle="Available bus routes and timings" />
      {!data.length ? <Empty text="No routes available" /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((r) => (
            <Card key={r._id} title={`${r.routeNumber} · ${r.name}`}>
              <p className="text-sm text-slate-600">{r.startPoint} → {r.destination}</p>
              <p className="mt-1 text-xs text-slate-500">{r.stops.length} stops · {r.distanceKm} km</p>
              <Button className="mt-4" size="sm" variant="accent" onClick={() => setSel(r._id)}>View stops & map</Button>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!route} wide title={route ? `${route.routeNumber} · ${route.name}` : ""} onClose={() => setSel(null)}>
        {route && (
          <>
            <MapView stops={route.stops} height={300} />
            <ol className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
              {route.stops.map((s) => <li key={s._id} className="flex justify-between px-3 py-2"><span><b>{s.sequence}.</b> {s.name}</span><span className="text-slate-500">{s.arrivalTime || "—"}</span></li>)}
            </ol>
          </>
        )}
      </Modal>
    </>
  );
}