import type { DailyCityVisit, DailyGuide, DailyGuidePlace, DailyRouteOverviewPoint } from "./swiss-guide-data";

const LOGISTICS_TERMS = [
  "공항",
  "airport",
  "기차역",
  "station",
  "termini",
  "centrale",
  "숙소",
  "거점",
  "체크인",
  "체크아웃",
  "도착",
  "출발",
  "복귀",
  "터미널",
  "terminal",
  "ferry",
  "base",
  "start",
  "return",
  "checkout",
  "check out",
  "night train",
  "train"
];

const CITY_TERMS = [
  "도시",
  "마을",
  "수도",
  "섬",
  "city",
  "town",
  "village"
];

function normalizeRouteName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").trim();
}

function includesAnyTerm(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

export function isTravelLogisticsPlace(place: Pick<DailyGuidePlace, "name" | "category">) {
  const text = normalizeRouteName(`${place.name} ${place.category}`);
  return includesAnyTerm(text, LOGISTICS_TERMS);
}

export function isSightseeingPlace(place: Pick<DailyGuidePlace, "name" | "category">) {
  const text = normalizeRouteName(`${place.name} ${place.category}`);
  return !includesAnyTerm(text, LOGISTICS_TERMS);
}

function routeModeToTransportMode(routeMode: DailyCityVisit["routeMode"]): DailyRouteOverviewPoint["mode"] {
  if (routeMode === "drive") return "rental-car";
  return routeMode;
}

function toCityVisitRoutePoint(visit: DailyCityVisit): DailyRouteOverviewPoint | null {
  const coordinates =
    visit.coordinates ??
    visit.spots.find((spot) => spot.coordinates)?.coordinates;

  if (!coordinates) return null;

  return {
    id: `city-visit-${visit.id}`,
    name: visit.city,
    detail: visit.entryPoint ? `${visit.stayDuration} · ${visit.entryPoint}` : visit.stayDuration,
    mode: routeModeToTransportMode(visit.routeMode),
    coordinates
  };
}

function findMatchingCityVisit(point: DailyRouteOverviewPoint, visits: DailyCityVisit[]) {
  const pointName = normalizeRouteName(point.name);
  const pointId = normalizeRouteName(point.id);

  for (const visit of visits) {
    if (visit.spots.some((spot) => {
      const spotName = normalizeRouteName(spot.name);
      const spotId = normalizeRouteName(spot.id);
      return (
        pointName === spotName ||
        pointName.includes(spotName) ||
        spotName.includes(pointName) ||
        pointId.includes(spotId) ||
        spotId.includes(pointId)
      );
    })) {
      return visit;
    }
  }

  return visits.find((visit) => {
    const visitName = normalizeRouteName(visit.city);
    return Boolean(visitName && (pointName === visitName || visitName.includes(pointName)));
  });
}

function findMatchingVisitSpot(point: DailyRouteOverviewPoint, visits: DailyCityVisit[]) {
  const pointName = normalizeRouteName(point.name);
  const pointId = normalizeRouteName(point.id);

  for (const visit of visits) {
    const spot = visit.spots.find((item) => {
      const spotName = normalizeRouteName(item.name);
      const spotId = normalizeRouteName(item.id);
      return (
        pointName === spotName ||
        pointName.includes(spotName) ||
        spotName.includes(pointName) ||
        pointId.includes(spotId) ||
        spotId.includes(pointId)
      );
    });

    if (spot) return spot;
  }

  return null;
}

function isMainRoutePoint(point: DailyRouteOverviewPoint, visits: DailyCityVisit[]) {
  const nameText = normalizeRouteName(point.name);
  const text = normalizeRouteName(`${point.name} ${point.detail ?? ""}`);
  const matchingSpot = findMatchingVisitSpot(point, visits);
  const isExplicitMovementPoint =
    point.mainRoute === true ||
    Boolean(point.mode && ["flight", "train", "ferry", "taxi", "transit"].includes(point.mode));

  if (isExplicitMovementPoint) return true;

  if (matchingSpot && isSightseeingPlace(matchingSpot) && !includesAnyTerm(nameText, LOGISTICS_TERMS)) {
    return false;
  }

  if (includesAnyTerm(text, LOGISTICS_TERMS)) return true;
  if (includesAnyTerm(nameText, CITY_TERMS)) return true;

  return visits.some((visit) => {
    const visitName = normalizeRouteName(visit.city);
    return Boolean(visitName && (nameText === visitName || visitName.includes(nameText)));
  });
}

function uniqueRoutePoints(points: DailyRouteOverviewPoint[]) {
  const seen = new Set<string>();

  return points.filter((point) => {
    const key = `${normalizeRouteName(point.name)}:${point.coordinates.lat.toFixed(4)},${point.coordinates.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildDailyMainRouteOverview(guide: DailyGuide): DailyRouteOverviewPoint[] {
  const visits = guide.cityVisits ?? [];

  if (!guide.routeOverview?.length) {
    return uniqueRoutePoints(visits.map(toCityVisitRoutePoint).filter((point): point is DailyRouteOverviewPoint => Boolean(point)));
  }

  if (visits.length === 0) return guide.routeOverview;

  const insertedVisitIds = new Set<string>();
  const result: DailyRouteOverviewPoint[] = [];

  guide.routeOverview.forEach((point) => {
    const matchingVisit = findMatchingCityVisit(point, visits);

    if (isMainRoutePoint(point, visits)) {
      result.push(point);
      if (matchingVisit) insertedVisitIds.add(matchingVisit.id);
      return;
    }

    if (matchingVisit && !insertedVisitIds.has(matchingVisit.id)) {
      const cityPoint = toCityVisitRoutePoint(matchingVisit);
      if (cityPoint) {
        result.push(cityPoint);
        insertedVisitIds.add(matchingVisit.id);
      }
    }
  });

  visits.forEach((visit) => {
    if (insertedVisitIds.has(visit.id)) return;
    const cityPoint = toCityVisitRoutePoint(visit);
    if (cityPoint) result.push(cityPoint);
  });

  return uniqueRoutePoints(result);
}
