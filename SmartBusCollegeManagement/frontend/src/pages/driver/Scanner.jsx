
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../services/api.js";
import useFetch from "../../hooks/useFetch.js";
import { Badge, Button, Card, DataTable, PageHeader, inputCls } from "../../components/ui.jsx";
import { errMsg, fmtDateTime, fmtDate } from "../../utils/format.js";

const STYLE = {
  valid: "border-emerald-500 bg-emerald-50 text-emerald-800",
  error: "border-red-500 bg-red-50 text-red-800",
};

export default function Scanner() {
  const trip = useFetch("/trips/current");
  const recent = useFetch("/validations", { limit: 8 });

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState("");
  const [camError, setCamError] = useState(null);
  const [frameStatus, setFrameStatus] = useState("");
  const [cameraMode, setCameraMode] = useState("environment");

  const scanner = useRef(null);
  const last = useRef({ text: "", at: 0 });
  const busy = useRef(false);
  const audioRef = useRef(null);

  // Sound feedback for valid and invalid QR codes
const playSound = (type) => {
  try {
    const ctx = audioRef.current;
    if (!ctx || ctx.state !== "running") return;

    const isValid = type === "valid";

    const tones = isValid
      ? [
          { freq: 1000, duration: 0.18 },
          { freq: 1400, duration: 0.22 },
        ]
      : [
          { freq: 400, duration: 0.30 },
          { freq: 300, duration: 0.30 },
          { freq: 200, duration: 0.40 },
        ];

    let time = ctx.currentTime;

    tones.forEach((tone) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = isValid ? "sine" : "square";
      oscillator.frequency.setValueAtTime(tone.freq, time);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.7, time);
      gain.gain.setValueAtTime(0.7, time + tone.duration - 0.04);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        time + tone.duration
      );

      oscillator.start(time);
      oscillator.stop(time + tone.duration);

      time += tone.duration + 0.10;
    });
  } catch {
    // Sound unavailable
  }
};

const submit = async (token) => {
  if (!token) return;

  setResult(null);
  setFrameStatus("");

  try {
    const { data } = await api.post("/validations/scan", {
      qrToken: token,
    });

    setResult(data);

    const status = data.result === "valid" ? "valid" : "error";

    setFrameStatus(status);
    playSound(status);
  } catch (e) {
    const message = errMsg(e);

    setResult({
      result: "error",
      message,
    });

    setFrameStatus("error");
    playSound("error");
  } finally {
    recent.reload();
  }
};

const onDecode = async (decodedText) => {
  if (busy.current) return;

  if (last.current === decodedText) return;

  busy.current = true;
  last.current = decodedText;

  try {
    await submit(decodedText);
  } finally {
    busy.current = false;
  }
};

  const stop = async () => {
    const s = scanner.current;
    scanner.current = null;

    if (s) {
      try {
        if (s.isScanning) {
          await s.stop();
        }
        s.clear();
      } catch {
        /* already stopped */
      }
    }

    setScanning(false);
  };

  const start = async (mode = cameraMode) => {
    setCamError(null);
    setFrameStatus("");
    setResult(null);

    try {
      // Initialize audio after the user clicks Start camera
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      if (audioRef.current.state === "suspended") {
        await audioRef.current.resume();
      }

      const s = new Html5Qrcode("qr-reader");
      scanner.current = s;

      await s.start(
        { facingMode: mode },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        onDecode,
        () => {}
      );

      setScanning(true);
    } catch (e) {
      scanner.current = null;
      setCamError(
        `Could not start the camera: ${e?.message || e}. Camera access needs HTTPS or localhost and your permission.`
      );
    }
  };

  const switchCamera = async () => {
    const nextMode =
      cameraMode === "environment" ? "user" : "environment";

    await stop();
    setCameraMode(nextMode);
    await start(nextMode);
  };

  useEffect(() => () => {
    stop();
  }, []);

  const noTrip = !trip.loading && !trip.data;

  return (
    <>
      <PageHeader
        title="Scan bus pass"
        subtitle="Every scan is verified by the server and recorded"
      />

      {noTrip && (
        <div className="mb-4 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-800">
          You must start a trip before scanning.{" "}
          <Link to="/driver" className="font-medium underline">
            Go to dashboard
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Camera">
          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-lg">
            <div id="qr-reader" className="w-full overflow-hidden" />

            {scanning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={`h-[240px] w-[240px] rounded-xl border-4 transition-colors duration-300 ${
                    frameStatus === "valid"
                      ? "border-green-500"
                      : frameStatus === "error"
                      ? "border-red-500"
                      : "border-white"
                  }`}
                />
              </div>
            )}
          </div>

          {camError && (
            <p className="mt-2 text-sm text-red-600">{camError}</p>
          )}

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {scanning ? (
              <>
                <Button variant="outline" onClick={stop}>
                  Stop camera
                </Button>

                <Button variant="outline" onClick={switchCamera}>
                  {cameraMode === "environment"
                    ? "Switch to front camera"
                    : "Switch to back camera"}
                </Button>
              </>
            ) : (
              <Button disabled={noTrip} onClick={() => start()}>
                Start camera
              </Button>
            )}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs text-slate-500">
              No camera? Paste the pass token to test manually:
            </p>

            <div className="flex gap-2">
              <input
                className={inputCls}
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="QR token"
              />

              <Button
                variant="outline"
                disabled={noTrip || !manual.trim()}
                onClick={() => submit(manual.trim())}
              >
                Validate
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Result">
          {!result ? (
            <p className="text-sm text-slate-500">
              Scan a pass to see the result.
            </p>
          ) : (
            <div
              className={`rounded-xl border-2 p-5 ${
                STYLE[result.result] ||
                "border-red-500 bg-red-50 text-red-800"
              }`}
            >
              <p className="text-xl font-semibold">{result.message}</p>

              {result.pass && (
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs opacity-70">Student</dt>
                    <dd>{result.pass.studentName}</dd>
                  </div>

                  <div>
                    <dt className="text-xs opacity-70">Student ID</dt>
                    <dd>{result.pass.studentId}</dd>
                  </div>

                  <div>
                    <dt className="text-xs opacity-70">Pass</dt>
                    <dd>{result.pass.passId}</dd>
                  </div>

                  <div>
                    <dt className="text-xs opacity-70">Valid until</dt>
                    <dd>{fmtDate(result.pass.validUntil)}</dd>
                  </div>
                </dl>
              )}
            </div>
          )}
        </Card>
      </div>

      <h2 className="mb-3 mt-6 font-semibold text-primary">
        Recent scans
      </h2>

      <DataTable
        columns={[
          { header: "Time", render: (v) => fmtDateTime(v.createdAt) },
          {
            header: "Student",
            render: (v) =>
              v.student
                ? `${v.student.user?.name} (${v.student.studentId})`
                : "Unknown",
          },
          { header: "Result", render: (v) => <Badge value={v.result} /> },
        ]}
        rows={recent.data}
        error={recent.error}
        onRetry={recent.reload}
        emptyText="No scans yet"
      />
    </>
  );
}
