import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../services/api.js";
import useFetch from "../../hooks/useFetch.js";
import { Badge, Button, Card, DataTable, PageHeader, inputCls } from "../../components/ui.jsx";
import { errMsg, fmtDateTime, fmtDate } from "../../utils/format.js";

const STYLE = {
  valid: "border-emerald-500 bg-emerald-50 text-emerald-800",
  error: "border-slate-400 bg-slate-50 text-slate-700",
};

export default function Scanner() {
  const trip = useFetch("/trips/current");
  const recent = useFetch("/validations", { limit: 8 });
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState("");
  const [camError, setCamError] = useState(null);
  const scanner = useRef(null);
  const last = useRef({ text: "", at: 0 });
  const busy = useRef(false);

  const submit = async (token) => {
    try {
      const { data } = await api.post("/validations/scan", { qrToken: token });
      setResult(data);
    } catch (e) {
      setResult({ result: "error", message: errMsg(e) });
    }
    recent.reload();
  };

  const onDecode = async (text) => {
    const now = Date.now();
    if (busy.current || (text === last.current.text && now - last.current.at < 4000)) return;
    busy.current = true;
    last.current = { text, at: now };
    await submit(text);
    busy.current = false;
  };

  const stop = async () => {
    const s = scanner.current;
    scanner.current = null;
    if (s) { try { await s.stop(); s.clear(); } catch { /* already stopped */ } }
    setScanning(false);
  };

  const start = async () => {
    setCamError(null);
    try {
      const s = new Html5Qrcode("qr-reader");
      scanner.current = s;
      await s.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, onDecode, () => {});
      setScanning(true);
    } catch (e) {
      scanner.current = null;
      setCamError(`Could not start the camera: ${e?.message || e}. Camera access needs HTTPS or localhost and your permission.`);
    }
  };

  useEffect(() => () => { stop(); }, []); // stop camera on leaving the page

  const noTrip = !trip.loading && !trip.data;

  return (
    <>
      <PageHeader title="Scan bus pass" subtitle="Every scan is verified by the server and recorded" />
      {noTrip && (
        <div className="mb-4 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-800">
          You must start a trip before scanning. <Link to="/driver" className="font-medium underline">Go to dashboard</Link>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Camera">
          <div id="qr-reader" className="mx-auto w-full max-w-sm overflow-hidden rounded-lg" />
          {camError && <p className="mt-2 text-sm text-red-600">{camError}</p>}
          <div className="mt-3 flex justify-center">
            {scanning ? <Button variant="outline" onClick={stop}>Stop camera</Button> : <Button disabled={noTrip} onClick={start}>Start camera</Button>}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs text-slate-500">No camera? Paste the pass token to test manually:</p>
            <div className="flex gap-2">
              <input className={inputCls} value={manual} onChange={(e) => setManual(e.target.value)} placeholder="QR token" />
              <Button variant="outline" disabled={noTrip || !manual.trim()} onClick={() => submit(manual.trim())}>Validate</Button>
            </div>
          </div>
        </Card>

        <Card title="Result">
          {!result ? <p className="text-sm text-slate-500">Scan a pass to see the result.</p> : (
            <div className={`rounded-xl border-2 p-5 ${STYLE[result.result] || "border-red-500 bg-red-50 text-red-800"}`}>
              <p className="text-xl font-semibold">{result.message}</p>
              {result.pass && (
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-xs opacity-70">Student</dt><dd>{result.pass.studentName}</dd></div>
                  <div><dt className="text-xs opacity-70">Student ID</dt><dd>{result.pass.studentId}</dd></div>
                  <div><dt className="text-xs opacity-70">Pass</dt><dd>{result.pass.passId}</dd></div>
                  <div><dt className="text-xs opacity-70">Valid until</dt><dd>{fmtDate(result.pass.validUntil)}</dd></div>
                </dl>
              )}
            </div>
          )}
        </Card>
      </div>

      <h2 className="mb-3 mt-6 font-semibold text-primary">Recent scans</h2>
      <DataTable
        columns={[
          { header: "Time", render: (v) => fmtDateTime(v.createdAt) },
          { header: "Student", render: (v) => (v.student ? `${v.student.user?.name} (${v.student.studentId})` : "Unknown") },
          { header: "Result", render: (v) => <Badge value={v.result} /> },
        ]}
        rows={recent.data} error={recent.error} onRetry={recent.reload} emptyText="No scans yet"
      />
    </>
  );
}