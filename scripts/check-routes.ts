import { fallbackTravelPayload } from "../lib/fallback-travel";
import { buildDailyGuidesForTrip, getGuideDataForTrip } from "../lib/trip-guide";
import type { Coordinates } from "../lib/types";

async function checkRoutes() {
  const trip = fallbackTravelPayload.trip;
  const guideData = getGuideDataForTrip(trip);
  const dailyGuides = buildDailyGuidesForTrip(trip, guideData);

  let hasIssue = false;

  for (const guide of dailyGuides) {
    if (guide.transportMode === "flight") continue;

    const coords: Coordinates[] = [];
    for (const place of guide.places) {
      if (place.coordinates) coords.push(place.coordinates);
    }

    if (coords.length > 1) {
      const coordsString = coords.map(c => `${c.lng},${c.lat}`).join(";");
      const mode = guide.transportMode === "walk" ? "foot" : "driving";
      const url = `https://router.project-osrm.org/route/v1/${mode}/${coordsString}?overview=false`;

      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            let totalDistance = 0;
            let totalDuration = 0;
            data.routes[0].legs.forEach((leg: any) => {
              totalDistance += leg.distance;
              totalDuration += leg.duration;
            });

            const distanceKm = totalDistance / 1000;
            const durationMins = Math.round(totalDuration / 60);

            console.log(`Day ${guide.day} (${guide.region}): ${distanceKm.toFixed(1)}km, 약 ${Math.floor(durationMins/60)}시간 ${durationMins%60}분 소요 (${mode})`);

            if (mode === "driving" && durationMins > 240) { // 4시간 초과
              console.log(`  -> ⚠️ 경고: 차량 이동 시간이 너무 깁니다! (4시간 초과)`);
              hasIssue = true;
            }
            if (mode === "foot" && durationMins > 180) { // 3시간 초과
              console.log(`  -> ⚠️ 경고: 도보 이동 시간이 너무 깁니다! (3시간 초과)`);
              hasIssue = true;
            }
            if (distanceKm > 300) {
              console.log(`  -> ⚠️ 경고: 이동 거리가 너무 깁니다! (300km 초과)`);
              hasIssue = true;
            }
          }
        } else {
          console.log(`Day ${guide.day}: OSRM API 오류 (${res.status})`);
        }
      } catch (err) {
        console.error(`Day ${guide.day}: OSRM fetch 오류`, err);
      }
    }
  }

  if (!hasIssue) {
    console.log("\n모든 일정의 이동 거리 및 시간이 기준치 이내로 합리적입니다.");
  } else {
    console.log("\n일부 일정에 무리한 이동 구간이 포함되어 있습니다. 점검이 필요합니다.");
  }
}

checkRoutes();
