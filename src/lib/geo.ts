export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Estimate travel time in minutes from a distance. Uses a conservative average
 * urban speed because school buses make frequent stops.
 */
export function etaMinutes(distanceKm: number, avgSpeedKmh = 22): number {
  if (distanceKm <= 0) return 0;
  return (distanceKm / avgSpeedKmh) * 60;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Perpendicular distance (km) from point p to the segment a-b. */
export function pointToSegmentKm(p: LatLng, a: LatLng, b: LatLng): number {
  // Project onto a local planar approximation (fine at city scale).
  const latRef = toRad((a.lat + b.lat) / 2);
  const kx = 111.32 * Math.cos(latRef);
  const ky = 110.574;
  const ax = a.lng * kx, ay = a.lat * ky;
  const bx = b.lng * kx, by = b.lat * ky;
  const px = p.lng * kx, py = p.lat * ky;
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** Minimum distance from a point to a polyline (km). */
export function distanceToPolylineKm(p: LatLng, polyline: LatLng[]): number {
  if (polyline.length === 0) return Number.POSITIVE_INFINITY;
  if (polyline.length === 1) return haversineKm(p, polyline[0]);
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < polyline.length - 1; i++) {
    min = Math.min(min, pointToSegmentKm(p, polyline[i], polyline[i + 1]));
  }
  return min;
}

/** Interpolate a point between two coordinates (for smooth map motion). */
export function lerpPoint(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}
