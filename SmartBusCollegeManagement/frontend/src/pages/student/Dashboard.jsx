import { Link } from "react-router-dom";
import { Bus, Route as RouteIcon, Ticket, Clock } from "lucide-react";
import useFetch from "../../hooks/useFetch.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Badge, Card, Empty, ErrorBox, PageHeader, PageLoader, StatCard } from "../../components/ui.jsx";
import { fmtDateTime } from "../../utils/format.js";

export default function StudentDashboard() {
  const { user } = useAuth();
  const passes = useFetch("/passes/my");
  const track = useFetch("/tracking/my-bus", {}, 10000);
  const notes = useFetch("/notifications", { limit: 5 });

  if (passes.error) return <ErrorBox message={passes.error} onRetry={passes.reload} />;
  if (passes.loading || track.loading) return <PageLoader />;
  const t = track.data;
  const latest = passes.data?.[0];

  return (
    <>
      <PageHeader title={`Hello, ${user.name}`} subtitle="Your transport summary" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Bus} label="Assigned bus" value={t?.assigned ? t.bus.busNumber : "Not assigned"} />
        <StatCard icon={RouteIcon} label="Route" value={t?.assigned ? t.bus.route?.routeNumber || "—" : "—"} tone="sky" />
        <StatCard icon={Ticket} label="Latest pass" value={latest ? latest.status : "No pass"} tone="teal" />
        <StatCard icon={Clock} label="ETA to pickup (approx.)" value={t?.eta ? `${t.eta.minutes} min` : "—"} tone="amber" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Bus pass" action={<Link className="text-sm text-secondary hover:underline" to="/student/pass">Open</Link>}>
          {!latest ? <p className="text-sm text-slate-600">You have not applied for a pass yet.</p> : (
            <p className="text-sm text-slate-700">{latest.passId} · {latest.route?.name} · <Badge value={latest.status} /></p>
          )}
        </Card>
        <Card title="Bus tracking" action={<Link className="text-sm text-secondary hover:underline" to="/student/tracking">Open map</Link>}>
          {!t?.assigned ? <p className="text-sm text-slate-600">No bus assigned yet.</p> : t.tripActive ? (
            <p className="text-sm text-slate-700">Bus {t.bus.busNumber} is on a trip. <Badge value={t.trackingMode} /></p>
          ) : <p className="text-sm text-slate-600">Bus {t.bus.busNumber} has no active trip right now.</p>}
        </Card>
      </div>

      <Card title="Recent notifications" className="mt-4" action={<Link className="text-sm text-secondary hover:underline" to="/student/notifications">View all</Link>}>
        {!notes.data?.length ? <Empty text="No notifications" /> : (
          <ul className="divide-y divide-slate-100">
            {notes.data.map((n) => (
              <li key={n._id} className="py-2 text-sm"><p className="font-medium text-slate-800">{n.title}</p><p className="text-slate-600">{n.message}</p><p className="text-xs text-slate-400">{fmtDateTime(n.createdAt)}</p></li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}