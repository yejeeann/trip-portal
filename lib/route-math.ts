import type { Coordinates } from "@/lib/types";

export function calculateDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c * 1.25;
}

export function formatDistance(distanceKm: number | null) {
  if (distanceKm === null) return "거리 확인 필요";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)}km`;
  return `${Math.round(distanceKm)}km`;
}

export function estimateRouteTime(distanceKm: number) {
  const speedKmh = distanceKm < 1.5 ? 4.5 : distanceKm < 12 ? 22 : 55;
  const minutes = Math.max(5, Math.round((distanceKm / speedKmh) * 60));

  if (minutes < 60) return `약 ${minutes}분`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `약 ${hours}시간 ${rest}분` : `약 ${hours}시간`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
