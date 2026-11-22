import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

const DEFAULT_CENTER = [17.44, 78.42];

const pin = (bg, text, size = 26) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:#fff;width:${size}px;height:${size}px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font:600 11px sans-serif">${text}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

function Fit({ points, fitKey }) {
  const map = useMap();
  const done = useRef(null);
  useEffect(() => {
    if (points.length && done.current !== fitKey) {
      done.current = fitKey;
      map.fitBounds(points, { padding: [30, 30], maxZoom: 15 });
    }
  }, [points, fitKey, map]);
  return null;
}

// stops: [{_id,name,sequence,lat,lng,arrivalTime}]  buses: [{key,lat,lng,label,mode}]
export default function MapView({ stops = [], buses = [], pickupId, height = 360 }) {
  const source = stops.length ? stops : buses;
  const points = source.map((p) => [p.lat, p.lng]);
  return (
    <div className="isolate overflow-hidden rounded-lg border border-slate-200" style={{ height }}>
      <MapContainer center={points[0] || DEFAULT_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Fit points={points} fitKey={stops.length ? stops.map((s) => s._id).join() : "buses"} />
        {stops.length > 1 && <Polyline positions={stops.map((s) => [s.lat, s.lng])} pathOptions={{ color: "#38b6ff", weight: 4 }} />}
        {stops.map((s) => (
          <Marker key={s._id} position={[s.lat, s.lng]} icon={pin(s._id === pickupId ? "#14b8a6" : "#0b2545", s.sequence)}>
            <Popup>{s.sequence}. {s.name}{s.arrivalTime ? ` · ${s.arrivalTime}` : ""}{s._id === pickupId ? " (your pickup)" : ""}</Popup>
          </Marker>
        ))}
        {buses.map((b) => (
          <Marker key={b.key} position={[b.lat, b.lng]} icon={pin(b.mode === "live" ? "#16a34a" : "#f59e0b", "BUS", 34)} zIndexOffset={1000}>
            <Popup>{b.label}<br />{b.mode === "live" ? "Live GPS position" : "SIMULATED position (demo mode)"}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}