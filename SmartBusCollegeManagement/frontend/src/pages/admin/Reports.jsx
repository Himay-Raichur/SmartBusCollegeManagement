import { useState } from "react";
import useFetch from "../../hooks/useFetch.js";
import { Card, DataTable, ErrorBox, PageHeader, PageLoader, StatCard, inputCls } from "../../components/ui.jsx";
import { BarCard, PieCard } from "../../components/Charts.jsx";
import { Users } from "lucide-react";

export default function Reports() {
  const [f, setF] = useState({ route: "", bus: "", from: "", to: "" });
  const routes = useFetch("/routes", { limit: 100 });
  const buses = useFetch("/buses", { limit: 100 });
  const { data, loading, error, reload } = useFetch("/reports/overview", {
    route: f.route || undefined, bus: f.bus || undefined,
    from: f.from ? new Date(f.from).toISOString() : undefined,
    to: f.to ? new Date(`${f.to}T23:59:59`).toISOString() : undefined,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Reports & analytics" subtitle="Filters apply to validation and trip statistics" />
      <div className="mb-5 flex flex-wrap gap-3">
        <select className={`${inputCls} w-auto`} value={f.route} onChange={set("route")}>
          <option value="">All routes</option>{routes.data?.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
        <select className={`${inputCls} w-auto`} value={f.bus} onChange={set("bus")}>
          <option value="">All buses</option>{buses.data?.map((b) => <option key={b._id} value={b._id}>{b.busNumber}</option>)}
        </select>
        <input type="date" className={`${inputCls} w-auto`} value={f.from} onChange={set("from")} aria-label="From date" />
        <input type="date" className={`${inputCls} w-auto`} value={f.to} onChange={set("to")} aria-label="To date" />
      </div>
      {error ? <ErrorBox message={error} onRetry={reload} /> : loading || !data ? <PageLoader /> : (
        <>
          <div className="mb-4 max-w-xs"><StatCard icon={Users} label="Students using buses" value={data.studentsUsingBuses} /></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarCard title="Students per route" data={data.studentsPerRoute} xKey="route" yKey="count" />
            <BarCard title="Bus capacity utilisation (%)" data={data.busUtilization} xKey="bus" yKey="percent" color="#14b8a6" />
            <PieCard title="Pass validation results" data={data.validationStats.map((v) => ({ name: v.result, value: v.count }))} />
            <PieCard title="Trips by status" data={data.tripStats.map((t) => ({ name: t.status, value: t.count }))} />
          </div>
          <Card title="Driver trip records" className="mt-4">
            <DataTable columns={[
              { header: "Driver", render: (d) => d.driver }, { header: "Trips", render: (d) => d.trips }, { header: "Completed", render: (d) => d.completed },
            ]} rows={data.driverTrips.map((d, i) => ({ ...d, _id: i }))} emptyText="No trips in this period" />
          </Card>
        </>
      )}
    </>
  );
}