import Trip from "../models/Trip.js";
import Stop from "../models/Stop.js";
import BusLocation from "../models/BusLocation.js";

const STEP = 0.1; // fraction of a segment per tick
const state = new Map(); // tripId -> { stops, idx, t }

export const tickDemo = async () => {
  const trips = await Trip.find({ status: "active", mode: "demo" });
  const liveIds = new Set(trips.map((t) => String(t._id)));
  for (const key of state.keys()) if (!liveIds.has(key)) state.delete(key);

  for (const trip of trips) {
    const key = String(trip._id);
    let s = state.get(key);
    if (!s) {
      const stops = await Stop.find({ route: trip.route }).sort("sequence");
      if (stops.length < 2) continue;
      s = { stops, idx: 0, t: 0 };
      state.set(key, s);
    }
    s.t += STEP;
    if (s.t >= 1) {
      s.t = 0;
      s.idx += 1;
      if (s.idx >= s.stops.length - 1) s.idx = 0;
    }
    const a = s.stops[s.idx];
    const b = s.stops[s.idx + 1];
    await BusLocation.findOneAndUpdate(
      { bus: trip.bus },
      { bus: trip.bus, trip: trip._id, lat: a.lat + (b.lat - a.lat) * s.t, lng: a.lng + (b.lng - a.lng) * s.t, mode: "demo" },
      { upsert: true }
    );
  }
};

export const startSimulation = () => {
  console.log("Demo tracking simulator disabled");
};