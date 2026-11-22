import { useState } from "react";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import api from "../../services/api.js";
import useFetch from "../../hooks/useFetch.js";
import { Badge, Button, Card, DataTable, ErrorBox, Field, PageHeader, PageLoader, inputCls } from "../../components/ui.jsx";
import { errMsg, fmtDate } from "../../utils/format.js";

function ApplyForm({ routes, onDone }) {
  const [route, setRoute] = useState("");
  const [stop, setStop] = useState("");
  const [busy, setBusy] = useState(false);
  const stops = routes.find((r) => r._id === route)?.stops || [];

  const submit = async (e) => {
    e.preventDefault();
    if (!route || !stop) return toast.error("Select a route and a pickup stop");
    setBusy(true);
    try { await api.post("/passes", { route, pickupStop: stop }); toast.success("Application submitted"); onDone(); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="grid max-w-xl gap-4">
      <Field label="Route">
        <select className={inputCls} value={route} onChange={(e) => { setRoute(e.target.value); setStop(""); }}>
          <option value="">Select a route...</option>
          {routes.map((r) => <option key={r._id} value={r._id}>{r.routeNumber} - {r.name}</option>)}
        </select>
      </Field>
      <Field label="Pickup stop">
        <select className={inputCls} value={stop} onChange={(e) => setStop(e.target.value)} disabled={!route}>
          <option value="">Select a stop...</option>
          {stops.map((s) => <option key={s._id} value={s._id}>{s.sequence}. {s.name} {s.arrivalTime ? `(${s.arrivalTime})` : ""}</option>)}
        </select>
      </Field>
      <div><Button type="submit" loading={busy}>Submit application</Button></div>
    </form>
  );
}

function DigitalPass({ pass }) {
  return (
    <div className="max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-primary px-5 py-3 text-white">
        <span className="font-semibold">College Bus Pass</span><Badge value={pass.status} />
      </div>
      <div className="flex flex-col items-center gap-4 p-5 sm:flex-row">
        <div className="rounded-lg border border-slate-200 p-2"><QRCodeSVG value={pass.qrToken} size={150} level="M" /></div>
        <dl className="grid flex-1 gap-2 text-sm">
          {[
            ["Name", pass.student?.user?.name], ["Student ID", pass.student?.studentId], ["Pass ID", pass.passId],
            ["Route", `${pass.route?.routeNumber} - ${pass.route?.name}`], ["Bus", pass.bus?.busNumber],
            ["Pickup", pass.pickupStop?.name], ["Valid", `${fmtDate(pass.validFrom)} to ${fmtDate(pass.validUntil)}`],
          ].map(([k, v]) => <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium text-slate-800">{v}</dd></div>)}
        </dl>
      </div>
      <p className="border-t border-slate-100 px-5 py-2 text-xs text-slate-500">Show this QR code to the driver. The pass is verified on the server at every scan.</p>
    </div>
  );
}

export default function StudentPass() {
  const { data, loading, error, reload } = useFetch("/passes/my");
  const routes = useFetch("/routes", { limit: 100, active: "true" });
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (loading || !data || routes.loading) return <PageLoader />;

  const latest = data[0];
  const canApply = !latest || ["rejected", "expired"].includes(latest.status);

  return (
    <>
      <PageHeader title="My bus pass" />
      {latest?.status === "approved" && <DigitalPass pass={latest} />}
      {latest?.status === "pending" && (
        <Card title="Application pending"><p className="text-sm text-slate-600">Pass {latest.passId} for {latest.route?.name} is waiting for admin review. You will be notified.</p></Card>
      )}
      {latest?.status === "rejected" && (
        <Card title="Application rejected" className="mb-4 border-red-200"><p className="text-sm text-red-700">Reason: {latest.rejectionReason}</p></Card>
      )}
      {latest?.status === "expired" && (
        <Card title="Pass expired" className="mb-4"><p className="text-sm text-slate-600">Your pass expired on {fmtDate(latest.validUntil)}. Apply again below.</p></Card>
      )}
      {canApply && <Card title="Apply for a bus pass" className="mt-4"><ApplyForm routes={routes.data || []} onDone={reload} /></Card>}

      <h2 className="mb-3 mt-8 font-semibold text-primary">Pass history</h2>
      <DataTable
        columns={[
          { header: "Pass ID", render: (p) => p.passId }, { header: "Route", render: (p) => p.route?.name },
          { header: "Applied", render: (p) => fmtDate(p.createdAt) }, { header: "Valid until", render: (p) => fmtDate(p.validUntil) },
          { header: "Status", render: (p) => <Badge value={p.status} /> },
        ]}
        rows={data} emptyText="No applications yet"
      />
    </>
  );
}