
import { Users, Bus, UserCog, Route as RouteIcon, Ticket, Navigation } from "lucide-react";
import useFetch from "../../hooks/useFetch.js";
import { Badge, Card, Empty, ErrorBox, PageHeader, PageLoader, StatCard } from "../../components/ui.jsx";
import { BarCard, PieCard } from "../../components/Charts.jsx";
import { fmtDateTime } from "../../utils/format.js";

const Row = ({ left, sub, badge }) => (
  <li className="flex items-center justify-between gap-2 py-2 text-sm">
    <div>
      <p className="text-slate-800">{left}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
    <Badge value={badge} />
  </li>
);

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch("/reports/dashboard", {}, 15000);

  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (loading || !data) return <PageLoader />;

  const stats = data.stats || {};
  const charts = data.charts || {};
  const recent = data.recent || {};

  const studentsPerRoute = charts.studentsPerRoute || [];
  const busUtilization = charts.busUtilization || [];
  const passStats = charts.passStats || [];

  const passes = recent.passes || [];
  const trips = recent.trips || [];
  const validations = recent.validations || [];

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Overview of the transport system" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="Total students" value={stats.students ?? 0} />
        <StatCard icon={Bus} label="Total buses" value={stats.buses ?? 0} tone="sky" />
        <StatCard icon={UserCog} label="Total drivers" value={stats.drivers ?? 0} tone="teal" />
        <StatCard icon={RouteIcon} label="Active routes" value={stats.activeRoutes ?? 0} />
        <StatCard icon={Ticket} label="Pending pass applications" value={stats.pendingPasses ?? 0} tone="amber" />
        <StatCard icon={Navigation} label="Active trips" value={stats.activeTrips ?? 0} tone="teal" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <BarCard title="Students per route" data={studentsPerRoute} xKey="route" yKey="count" />
        <BarCard title="Bus utilisation (%)" data={busUtilization} xKey="bus" yKey="percent" color="#14b8a6" />
        <PieCard title="Pass applications" data={passStats.map((p) => ({ name: p.status, value: p.count }))} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Recent pass activity">
          {!passes.length ? <Empty text="No passes yet" /> : (
            <ul className="divide-y divide-slate-100">
              {passes.map((p) => (
                <Row
                  key={p._id}
                  left={p.student?.user?.name || "Unknown student"}
                  sub={`${p.passId || ""} · ${fmtDateTime(p.updatedAt)}`}
                  badge={p.status}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent trips">
          {!trips.length ? <Empty text="No trips yet" /> : (
            <ul className="divide-y divide-slate-100">
              {trips.map((t) => (
                <Row
                  key={t._id}
                  left={`${t.bus?.busNumber || "Unknown bus"} · ${t.route?.name || "Unknown route"}`}
                  sub={fmtDateTime(t.startedAt)}
                  badge={t.status}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent validations">
          {!validations.length ? <Empty text="No scans yet" /> : (
            <ul className="divide-y divide-slate-100">
              {validations.map((v) => (
                <Row
                  key={v._id}
                  left={v.student?.user?.name || "Unknown pass"}
                  sub={`${v.bus?.busNumber || "Unknown bus"} · ${fmtDateTime(v.createdAt)}`}
                  badge={v.result}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
