import useFetch from "../../hooks/useFetch.js";
import { Badge, Card, DataTable, ErrorBox, PageHeader, PageLoader } from "../../components/ui.jsx";
import MapView from "../../components/MapView.jsx";
import { fmtTime } from "../../utils/format.js";

export default function AdminTracking() {
  const { data, loading, error, reload } = useFetch("/tracking/buses", {}, 5000);
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (loading && !data) return <PageLoader />;

  const buses = data.map((l) => ({ key: l._id, lat: l.lat, lng: l.lng, mode: l.mode, label: `Bus ${l.bus?.busNumber}` }));
  const columns = [
    { header: "Bus", render: (l) => l.bus?.busNumber },
    { header: "Position source", render: (l) => <Badge value={l.mode} /> },
    { header: "Coordinates", render: (l) => `${l.lat.toFixed(5)}, ${l.lng.toFixed(5)}` },
    { header: "Last update", render: (l) => fmtTime(l.updatedAt) },
  ];

  return (
    <>
      <PageHeader title="Live bus map" subtitle="Refreshes every 5 seconds. Amber markers are simulated demo positions; green markers are real driver GPS." />
      <Card className="mb-4"><MapView buses={buses} height={420} /></Card>
      <DataTable columns={columns} rows={data} emptyText="No buses are on an active trip" />
    </>
  );
}