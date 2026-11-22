const toRad = (d) => (d * Math.PI) / 180;

export const haversineKm = (a, b) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const estimate = (from, to) => {
  const speed = Number(process.env.AVG_BUS_SPEED_KMPH) || 25;
  const distanceKm = haversineKm(from, to);
  const minutes = Math.round((distanceKm / speed) * 60);
  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    minutes,
    arrivalTime: new Date(Date.now() + minutes * 60000).toISOString(),
    approximate: true,
  };
};