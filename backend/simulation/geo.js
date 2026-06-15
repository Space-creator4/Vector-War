export function haversineKm(a, b) {
  const radiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

export function interpolateLatLng(start, end, progress) {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress
  };
}

export function terrainModifier(type) {
  if (type === "ship" || type === "jet" || type === "heli") return 1;
  if (type === "infantry") return 0.85;
  return 0.75;
}

function toRad(value) {
  return (value * Math.PI) / 180;
}
