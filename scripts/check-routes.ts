import { fallbackTravelPayload } from "../lib/fallback-travel";
import { buildDailyGuidesForTrip, getGuideDataForTrip } from "../lib/trip-guide";

const accommCoords: Record<string, { lat: number; lng: number }> = {
  "East Sicily accommodation": { lat: 37.6598, lng: 15.1098 },
  "Malta accommodation": { lat: 35.9024, lng: 14.4907 },
  "Gzira accommodation": { lat: 35.9024, lng: 14.4907 },
  "Costa Saracena accommodation": { lat: 37.3029, lng: 15.1204 },
  "Realmonte accommodation": { lat: 37.2908, lng: 13.4765 },
  "Piano Milano accommodation": { lat: 38.0174, lng: 12.5364 },
  "Via Metauro, 16": { lat: 38.0394, lng: 14.0228 }, // Calvanico area fallback
  "Via Provinciale 24b": { lat: 38.2536, lng: 15.7152 },
  "Via della Riserva dell'Albaceto, 25": { lat: 41.8832, lng: 12.3482 } // Rome Final
};

async function checkRoutes() {
  const trip = fallbackTravelPayload.trip;
  const guideData = getGuideDataForTrip(trip);
  const dailyGuides = buildDailyGuidesForTrip(trip, guideData);

  let hasIssue = false;

  for (const guide of dailyGuides) {
    if (guide.transportMode === "flight" || guide.transportMode === "train") continue;

    const coords = [];
    if (guide.accommodation) {
      let latlng = guide.accommodation.coordinates;
      if (!latlng) {
         latlng = accommCoords[guide.accommodation.name] || accommCoords[guide.accommodation.address];
      }
      if (latlng) {
        coords.push(latlng);
      }
    }
    
    for (const place of guide.places) {
      if (place.coordinates) coords.push(place.coordinates);
    }
    
    // Add end point as accommodation if returning to basecamp
    if (guide.accommodation && coords.length > 1) {
      let latlng = guide.accommodation.coordinates;
      if (!latlng) {
         latlng = accommCoords[guide.accommodation.name] || accommCoords[guide.accommodation.address];
      }
      if (latlng) {
        coords.push(latlng);
      }
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
        }
      } catch (err) {}
    }
  }
}

checkRoutes();