"use client";

import { createContext, useContext, useEffect } from "react";
import { sicilyGuideData } from "@/lib/sicily-guide-data";
import { staticPrintGuideDesign, type PrintGuideDesign } from "@/lib/print-guide-design";
import type { DailyCityVisit, DailyGuide, DailyGuidePlace, DailyRouteOverviewPoint, FlightTicket, MasterTimelineItem, TimelineAccommodation } from "@/lib/swiss-guide-data";
import type { TravelPayload } from "@/lib/types";
import printMapSnapshots from "@/data/generated/print-map-snapshots.json";
import type { OsmMarker } from "./multi-osm-map";

type StayRow = TimelineAccommodation & {
  key: string;
  days: number[];
};

type PrintMapMarker = OsmMarker & {
  name: string;
};

type PrintMapScope = "overview" | "atlas" | "daily" | "dailyWide";

type PrintMapSnapshotManifest = {
  maps?: string[];
};

type CityGuideDefinition = {
  eyebrow: string;
  title: string;
  subtitle: string;
  keywords: string[];
  cityMatchers: string[];
};

type PlaceStoryEntry = {
  place: DailyGuidePlace;
  day: number;
  city: string;
  region: string;
};

type DailyRouteListItem = {
  id: string;
  label: string;
  name: string;
  meta?: string;
  segmentInfo?: string;
};

type TicketSegment = FlightTicket["segments"][number];

const modeLabels: Record<string, string> = {
  flight: "Flight",
  train: "Train",
  "rental-car": "Rental car",
  taxi: "Taxi",
  ferry: "Ferry",
  walk: "Walk",
  transit: "Transit",
  drive: "Drive"
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
}

function modeLabel(value?: string) {
  if (!value) return "Plan";
  return modeLabels[value] ?? value;
}

function getUniqueStays(items: MasterTimelineItem[]): StayRow[] {
  const stays = new Map<string, StayRow>();

  items.forEach((item) => {
    if (!item.accommodation) return;
    const key = `${item.accommodation.name}-${item.accommodation.address}`;
    const existing = stays.get(key);
    if (existing) {
      existing.days.push(item.day);
      return;
    }

    stays.set(key, {
      ...item.accommodation,
      key,
      days: [item.day]
    });
  });

  return Array.from(stays.values());
}

function getDayTimelineItem(day: number) {
  return sicilyGuideData.masterTimeline.find((item) => item.day === day);
}

function getPrimaryPlaces(guide: DailyGuide) {
  const cityVisitPlaces = guide.cityVisits?.flatMap((visit) => visit.spots) ?? [];
  return cityVisitPlaces.length ? cityVisitPlaces : guide.places;
}

function isTransitOrEndpointName(value: string) {
  const normalized = value.toLowerCase();
  return [
    "seoul",
    "incheon",
    "helsinki",
    "airport",
    "fiumicino",
    "icn",
    "fco",
    "hel",
    "mla",
    "cta",
    "luqa",
    "departure",
    "arrival",
    "return",
    "출국",
    "도착"
  ].some((token) => normalized.includes(token));
}

function isActualTravelPoint(name: string) {
  return !isTransitOrEndpointName(name);
}

function isLogisticsText(name: string, category = "") {
  const text = `${name} ${category}`.toLowerCase();
  if (text.includes("old harbour") || text.includes("old harbor")) return false;

  return [
    "airport",
    "fiumicino",
    "termini",
    "centrale",
    "station",
    "train",
    "terminal",
    "ferry",
    "ferry terminal",
    "ferry port",
    "port",
    "harbor",
    "harbour",
    "parking",
    "park-and-ride",
    "luggage",
    "storage",
    "transfer",
    "transit",
    "metro",
    "bus",
    "taxi",
    "rental",
    "car pickup",
    "overview",
    "arrival",
    "departure",
    "공항",
    "기차역",
    "역",
    "터미널",
    "항구",
    "페리",
    "선착장",
    "주차",
    "짐",
    "보관",
    "숙소",
    "체크인",
    "체크아웃",
    "거점",
    "환승",
    "이동",
    "도착",
    "출발",
    "도시 기준점"
  ].some((token) => text.includes(token));
}

function isLogisticsPlace(place: DailyGuidePlace) {
  return isLogisticsText(place.name, place.category);
}

function isFoodBreakPlace(place: DailyGuidePlace) {
  const labelText = `${place.name} ${place.category}`.toLowerCase();
  const directTokens = [
    "monti district",
    "restaurant",
    "cafe",
    "caffe",
    "dolceria",
    "bakery",
    "market",
    "mercato",
    "pescheria",
    "bonajuto",
    "maria grammatico",
    "ta' kalbi",
    "tartufo",
    "lungo garden",
    "lunch",
    "dinner",
    "dessert",
    "gelato",
    "sorbet",
    "food",
    "식사",
    "휴식",
    "점심",
    "저녁",
    "카페",
    "디저트",
    "제과점",
    "해산물",
    "시장",
    "베이커리",
    "초콜릿"
  ];

  return directTokens.some((token) => labelText.includes(token));
}

const essentialStopKeywords = [
  "villa romana",
  "valley of the temples",
  "kolymbethra",
  "greek theatre",
  "neapolis",
  "ortigia",
  "piazza duomo",
  "duomo",
  "cathedral",
  "cattedrale",
  "monreale",
  "palatine chapel",
  "santa caterina",
  "segesta",
  "temple",
  "teatro",
  "amphitheatre",
  "archaeological",
  "pompeii",
  "valletta",
  "st john",
  "upper barrakka",
  "blue grotto",
  "citadel",
  "erice",
  "scopello",
  "cefalu",
  "chianalea",
  "tropea",
  "santa maria dell'isola",
  "amalfi",
  "pantheon",
  "piazza venezia",
  "vittoriano",
  "altare della patria",
  "colosseum",
  "roman forum",
  "trevi fountain",
  "spanish steps",
  "piazza navona",
  "대성당",
  "성당",
  "신전",
  "고고학",
  "유적",
  "극장",
  "수도원",
  "전망",
  "성채",
  "폼페이",
  "몬레알레"
];

const essentialCategoryKeywords = [
  "unesco",
  "역사",
  "유적",
  "고고학",
  "성당",
  "대성당",
  "전망",
  "성채",
  "temple",
  "cathedral",
  "archaeological",
  "historic",
  "view"
];

function getEssentialScore(place: DailyGuidePlace) {
  const text = [
    place.name,
    place.category,
    place.shortDescription,
    place.description,
    place.detailDescription,
    ...(place.whyVisit ?? []),
    ...(place.whatToSee ?? [])
  ].join(" ").toLowerCase();

  const nameText = place.name.toLowerCase();
  const categoryText = place.category.toLowerCase();
  const keywordScore = essentialStopKeywords.filter((keyword) => text.includes(keyword)).length;
  const categoryScore = essentialCategoryKeywords.some((keyword) => categoryText.includes(keyword)) ? 1 : 0;
  const mustSeeCategoryScore = categoryText.includes("꼭 가봐야 할 곳") ? 3 : 0;
  const namedLandmarkBonus = essentialStopKeywords.some((keyword) => nameText.includes(keyword)) ? 2 : 0;

  return keywordScore + categoryScore + mustSeeCategoryScore + namedLandmarkBonus;
}

function splitGuidePlacesByPriority(places: DailyGuidePlace[]) {
  const scoredPlaces = places.map((place, index) => ({
    place,
    index,
    score: getEssentialScore(place)
  }));
  const essentialIdsByRouteOrder = new Set(scoredPlaces
    .filter((item) => item.score >= 3)
    .map((item) => item.place.id));
  const essential = places.filter((place) => essentialIdsByRouteOrder.has(place.id));
  const essentialIds = new Set(essential.map((place) => place.id));
  const more = places.filter((place) => !essentialIds.has(place.id));

  if (essential.length) {
    return { essential, more };
  }

  // 3점 이상인 랜드마크가 없는 경우, 점수와 무관하게 순서대로 상위 2개를 Featured로 지정
  const best = scoredPlaces
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.place);
  const bestIds = new Set(best.map((place) => place.id));

  return {
    essential: best,
    more: places.filter((place) => !bestIds.has(place.id))
  };
}

const MAX_KEY_STOPS_PER_DAY = 7;
const PAGE_B_FIRST_PAGE_KEY_LIMIT = 3;
const PAGE_B_CARD_PAGE_SIZE = 6;
const STAY_CARDS_PER_PAGE = 8;

function truncateText(value: string | undefined, maxLength: number) {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength).trimEnd();
}

function pageCardText(value: string | undefined, maxLength: number) {
  if (!value) return "";

  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const sentences = normalized.match(/[^.!?。！？]+[.!?。！？]?/g) ?? [normalized];
  let output = "";

  for (const sentence of sentences) {
    const next = `${output}${output ? " " : ""}${sentence.trim()}`.trim();
    if (next.length > maxLength) break;
    output = next;
  }

  if (output.length >= Math.min(80, maxLength * 0.55)) return output;

  const clipped = normalized.slice(0, maxLength).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");
  return lastSpace > Math.floor(maxLength * 0.55) ? clipped.slice(0, lastSpace) : clipped;
}

function getDayFocus(guide: DailyGuide, places: DailyGuidePlace[]) {
  const categories = Array.from(new Set(places.map((place) => place.category).filter(Boolean))).slice(0, 3);
  if (categories.length) return categories.join(" / ");
  return guide.region;
}

function getDayPace(guide: DailyGuide, placeCount: number) {
  const mode = guide.transportMode;
  if (mode === "flight" || mode === "train" || mode === "ferry") return "이동 중심";
  if (placeCount >= 8) return "촘촘한 탐방";
  if (placeCount >= 5) return "균형 일정";
  return "여유 일정";
}

function getDayTip(guide: DailyGuide, timeline?: MasterTimelineItem) {
  const notes = guide.cityVisits?.flatMap((visit) => visit.practicalNotes ?? []) ?? [];
  return truncateText(notes[0] ?? timeline?.note ?? guide.deck, 84);
}

function getPracticalNotes(guide: DailyGuide, timeline?: MasterTimelineItem) {
  const notes = [
    ...(timeline?.note ? [timeline.note] : []),
    ...(guide.cityVisits?.flatMap((visit) => visit.practicalNotes ?? []) ?? [])
  ];

  return Array.from(new Set(notes)).filter(Boolean).slice(0, 7);
}

function uniqueMarkers(markers: PrintMapMarker[]) {
  const seen = new Set<string>();
  const unique = markers.filter((marker) => {
    const key = `${marker.variant ?? "route"}-${marker.lat.toFixed(3)}-${marker.lng.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let routeIndex = 0;

  return unique.map((marker) => {
    if (marker.variant === "stay") {
      return {
        ...marker,
        label: ""
      };
    }

    routeIndex += 1;

    return {
      ...marker,
      label: String(routeIndex)
    };
  });
}

function marker(name: string, lat: number, lng: number): PrintMapMarker {
  return {
    lat,
    lng,
    name,
    label: ""
  };
}

function normalizePrintPlaceKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").trim();
}

function getPrintImageSrc(src?: string) {
  if (!src) return src;
  const match = src.match(/^\/travel-photos\/(.+?)\.(jpe?g|png)$/i);
  if (!match) return src;
  return `/travel-photos-print/${match[1]}.jpg`;
}

const PRINT_TILE_SIZE = 256;
const MAX_MERCATOR_LAT = 85.05112878;
const PRINT_MAP_SNAPSHOT_KEYS = new Set(((printMapSnapshots as PrintMapSnapshotManifest).maps ?? []));
const PrintMapSnapshotContext = createContext(true);

type ProjectedPrintMarker = PrintMapMarker & {
  x: number;
  y: number;
  index: number;
};

type PrintMapTile = {
  key: string;
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

type PrintMapLayout = {
  tiles: PrintMapTile[];
  markers: ProjectedPrintMarker[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lonToWorldX(lng: number, zoom: number) {
  return ((lng + 180) / 360) * PRINT_TILE_SIZE * 2 ** zoom;
}

function latToWorldY(lat: number, zoom: number) {
  const safeLat = clamp(lat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT);
  const sinLat = Math.sin((safeLat * Math.PI) / 180);
  return (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * PRINT_TILE_SIZE * 2 ** zoom;
}

function getPrintMapZoom(markers: PrintMapMarker[], scope: PrintMapScope) {
  if (scope === "overview") return 6;
  if (scope === "atlas") return 5;

  const lats = markers.map((item) => item.lat);
  const lngs = markers.map((item) => item.lng);
  const latRange = Math.max(...lats) - Math.min(...lats);
  const lngRange = Math.max(...lngs) - Math.min(...lngs);
  const range = Math.max(latRange, lngRange);

  if (range > 80) return 2;
  if (range > 25) return 3;
  if (range > 8) return 5;
  if (range > 1.4) return 8;
  if (range > 0.55) return 9;
  if (range > 0.2) return 11;
  if (range > 0.08) return 12;
  return 13;
}

function getPrintMapAspect(scope: PrintMapScope) {
  if (scope === "overview") return 2.18;
  if (scope === "atlas") return 1.62;
  if (scope === "dailyWide") return 2.12;
  return 1.32;
}

function getMapBoundsConfig(scope: PrintMapScope) {
  if (scope === "overview") {
    return {
      minWidthRatio: 0.36,
      minHeightRatio: 0.5,
      paddingXRatio: 0.2,
      paddingYRatio: 0.18,
      minPaddingXRatio: 0.18,
      minPaddingYRatio: 0.14,
      markerInset: 6
    };
  }

  if (scope === "atlas") {
    return {
      minWidthRatio: 0.82,
      minHeightRatio: 0.64,
      paddingXRatio: 0.12,
      paddingYRatio: 0.16,
      minPaddingXRatio: 0.16,
      minPaddingYRatio: 0.14,
      markerInset: 4
    };
  }

  if (scope === "dailyWide") {
    return {
      minWidthRatio: 0.58,
      minHeightRatio: 0.3,
      paddingXRatio: 0.18,
      paddingYRatio: 0.22,
      minPaddingXRatio: 0.14,
      minPaddingYRatio: 0.14,
      markerInset: 5
    };
  }

  return {
    minWidthRatio: 0.45,
    minHeightRatio: 0.38,
    paddingXRatio: 0.28,
    paddingYRatio: 0.24,
    minPaddingXRatio: 0.16,
    minPaddingYRatio: 0.14,
    markerInset: 4
  };
}

function fitBoundsToAspect(minX: number, maxX: number, minY: number, maxY: number, aspect: number, worldSize: number) {
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  let width = Math.max(maxX - minX, PRINT_TILE_SIZE * 0.4);
  let height = Math.max(maxY - minY, PRINT_TILE_SIZE * 0.4);
  const currentAspect = width / height;

  if (currentAspect < aspect) {
    width = height * aspect;
  } else {
    height = width / aspect;
  }

  width = Math.min(width, worldSize);
  height = Math.min(height, worldSize);

  const fittedMinX = clamp(centerX - width / 2, 0, worldSize - width);
  const fittedMinY = clamp(centerY - height / 2, 0, worldSize - height);

  return {
    minX: fittedMinX,
    maxX: fittedMinX + width,
    minY: fittedMinY,
    maxY: fittedMinY + height
  };
}

function getTileUrl(x: number, y: number, zoom: number) {
  const subdomains = ["a", "b", "c"];
  const subdomain = subdomains[Math.abs(x + y) % subdomains.length];
  return `https://${subdomain}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`;
}

function stablePrintMapHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function getPrintMapSnapshotKey(markers: PrintMapMarker[], scope: PrintMapScope) {
  const markerSignature = markers
    .map((markerItem) => [
      markerItem.name,
      markerItem.lat.toFixed(5),
      markerItem.lng.toFixed(5),
      markerItem.label,
      markerItem.variant ?? "route",
      markerItem.includeInRoute === false ? "no-route" : "route"
    ].join(":"))
    .join("|");

  return `print-map-${scope}-${stablePrintMapHash(markerSignature)}`;
}

function getTileMapLayout(markers: PrintMapMarker[], scope: PrintMapScope): PrintMapLayout {
  const zoom = getPrintMapZoom(markers, scope);
  const worldSize = PRINT_TILE_SIZE * 2 ** zoom;
  const boundsConfig = getMapBoundsConfig(scope);
  const rawPoints = markers.map((markerItem, index) => ({
    marker: markerItem,
    index,
    worldX: lonToWorldX(markerItem.lng, zoom),
    worldY: latToWorldY(markerItem.lat, zoom)
  }));
  const rawMinX = Math.min(...rawPoints.map((item) => item.worldX));
  const rawMaxX = Math.max(...rawPoints.map((item) => item.worldX));
  const rawMinY = Math.min(...rawPoints.map((item) => item.worldY));
  const rawMaxY = Math.max(...rawPoints.map((item) => item.worldY));
  const rawWidth = Math.max(rawMaxX - rawMinX, PRINT_TILE_SIZE * boundsConfig.minWidthRatio);
  const rawHeight = Math.max(rawMaxY - rawMinY, PRINT_TILE_SIZE * boundsConfig.minHeightRatio);
  const paddingX = Math.max(rawWidth * boundsConfig.paddingXRatio, PRINT_TILE_SIZE * boundsConfig.minPaddingXRatio);
  const paddingY = Math.max(rawHeight * boundsConfig.paddingYRatio, PRINT_TILE_SIZE * boundsConfig.minPaddingYRatio);
  const paddedMinX = clamp(rawMinX - paddingX, 0, worldSize - PRINT_TILE_SIZE);
  const paddedMaxX = clamp(rawMaxX + paddingX, PRINT_TILE_SIZE, worldSize);
  const paddedMinY = clamp(rawMinY - paddingY, 0, worldSize - PRINT_TILE_SIZE);
  const paddedMaxY = clamp(rawMaxY + paddingY, PRINT_TILE_SIZE, worldSize);
  const fittedBounds = fitBoundsToAspect(
    paddedMinX,
    paddedMaxX,
    paddedMinY,
    paddedMaxY,
    getPrintMapAspect(scope),
    worldSize
  );
  const minX = fittedBounds.minX;
  const maxX = fittedBounds.maxX;
  const minY = fittedBounds.minY;
  const maxY = fittedBounds.maxY;
  const width = Math.max(maxX - minX, PRINT_TILE_SIZE);
  const height = Math.max(maxY - minY, PRINT_TILE_SIZE);
  const minTileX = Math.floor(minX / PRINT_TILE_SIZE);
  const maxTileX = Math.floor(maxX / PRINT_TILE_SIZE);
  const minTileY = Math.floor(minY / PRINT_TILE_SIZE);
  const maxTileY = Math.floor(maxY / PRINT_TILE_SIZE);
  const maxTile = 2 ** zoom - 1;
  const tiles: PrintMapTile[] = [];

  for (let tileX = clamp(minTileX, 0, maxTile); tileX <= clamp(maxTileX, 0, maxTile); tileX += 1) {
    for (let tileY = clamp(minTileY, 0, maxTile); tileY <= clamp(maxTileY, 0, maxTile); tileY += 1) {
      tiles.push({
        key: `${zoom}-${tileX}-${tileY}`,
        src: getTileUrl(tileX, tileY, zoom),
        left: ((tileX * PRINT_TILE_SIZE - minX) / width) * 100,
        top: ((tileY * PRINT_TILE_SIZE - minY) / height) * 100,
        width: (PRINT_TILE_SIZE / width) * 100,
        height: (PRINT_TILE_SIZE / height) * 100
      });
    }
  }

  const projectedMarkers: ProjectedPrintMarker[] = rawPoints.map((item) => ({
    ...item.marker,
    index: item.index,
    x: ((item.worldX - minX) / width) * 100,
    y: ((item.worldY - minY) / height) * 100
  }));

  return {
    tiles,
    markers: projectedMarkers.map((item) => ({
      ...item,
      x: clamp(item.x, boundsConfig.markerInset, 100 - boundsConfig.markerInset),
      y: clamp(item.y, boundsConfig.markerInset, 100 - boundsConfig.markerInset)
    }))
  };
}

function PrintTileMap({ markers, scope }: { markers: PrintMapMarker[]; scope: PrintMapScope }) {
  if (!markers.length) return <div className="print-tile-map print-tile-map-empty">지도 데이터가 부족합니다.</div>;

  const preferMapSnapshots = useContext(PrintMapSnapshotContext);
  const snapshotKey = getPrintMapSnapshotKey(markers, scope);
  const snapshotSrc = `/print-maps/${snapshotKey}.png`;

  if (preferMapSnapshots && PRINT_MAP_SNAPSHOT_KEYS.has(snapshotKey)) {
    return (
      <div
        className={`print-tile-map print-tile-map-${scope} print-tile-map-snapshot`}
        data-print-map-key={snapshotKey}
        data-print-map-scope={scope}
      >
        <img className="print-map-snapshot-image" src={snapshotSrc} alt="" loading="eager" decoding="sync" />
      </div>
    );
  }

  const layout = getTileMapLayout(markers, scope);
  const routePoints = layout.markers.filter((item) => item.includeInRoute !== false);
  const routePolyline = routePoints.map((item) => `${item.x},${item.y}`).join(" ");

  return (
    <div
      className={`print-tile-map print-tile-map-${scope}`}
      data-print-map-key={snapshotKey}
      data-print-map-scope={scope}
    >
      {layout.tiles.map((tile) => (
        <img
          key={tile.key}
          src={tile.src}
          alt=""
          loading="eager"
          decoding="sync"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          style={{
            left: `${tile.left}%`,
            top: `${tile.top}%`,
            width: `${tile.width}%`,
            height: `${tile.height}%`
          }}
        />
      ))}
      {routePolyline && (
        <svg className="print-tile-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={routePolyline} fill="none" />
        </svg>
      )}
      {layout.markers.map((markerItem) => (
        <span
          key={`${markerItem.name}-${markerItem.index}`}
          className={`print-tile-pin ${markerItem.variant === "stay" ? "print-tile-pin-stay" : ""}`}
          style={{ left: `${markerItem.x}%`, top: `${markerItem.y}%` }}
        >
          {markerItem.variant === "stay" ? "H" : markerItem.label}
        </span>
      ))}
    </div>
  );
}

function getAllRouteMarkers() {
  const majorRoute = [
    marker("Rome", 41.9028, 12.4964),
    marker("Catania", 37.5079, 15.083),
    marker("Taormina", 37.8516, 15.2853),
    marker("Syracuse", 37.0755, 15.2866),
    marker("Noto", 36.8915, 15.0707),
    marker("Ragusa / Modica", 36.9239, 14.7199),
    marker("Valletta / Gzira", 35.8992, 14.5141),
    marker("Gozo", 36.0443, 14.2512),
    marker("Villa Romana del Casale", 37.3647, 14.3346),
    marker("Agrigento / Realmonte", 37.2898, 13.5902),
    marker("Trapani / Erice", 38.0174, 12.5364),
    marker("Segesta / Scopello", 37.9414, 12.8324),
    marker("Palermo / Monreale", 38.1157, 13.3615),
    marker("Cefalu", 38.0394, 14.0228),
    marker("Scilla / Calabria", 38.2536, 15.7152),
    marker("Tropea / Pizzo", 38.6786, 15.8972),
    marker("Salerno / Amalfi", 40.6779, 14.7659),
    marker("Pompeii", 40.7484, 14.4847),
    marker("Rome Final", 41.8832, 12.3482)
  ];

  return uniqueMarkers(majorRoute);
}

function parseGoogleMapsCoordinates(url?: string) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const query = parsedUrl.searchParams.get("query") ?? "";
    const match = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);

    if (!match) return null;

    const lat = Number(match[1]);
    const lng = Number(match[2]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  } catch {
    return null;
  }
}

function getStayMarkers() {
  return getUniqueStays(sicilyGuideData.masterTimeline).flatMap((stay) => {
    const coordinates = parseGoogleMapsCoordinates(stay.googleMapsUrl);
    if (!coordinates) return [];

    return [{
      ...coordinates,
      name: `Stay: ${stay.name}`,
      label: "",
      variant: "stay" as const,
      includeInRoute: false
    }];
  });
}

function getAtlasMarkers() {
  return uniqueMarkers([
    ...getAllRouteMarkers(),
    ...getStayMarkers()
  ]);
}

function getDailyMarkers(guide: DailyGuide) {
  return uniqueMarkers(getPrimaryPlaces(guide)
    .filter((place) => place.coordinates)
    .filter((place) => isActualTravelPoint(place.name) && isActualTravelPoint(place.category))
    .map((place, index) => ({
      lat: place.coordinates!.lat,
      lng: place.coordinates!.lng,
      name: place.name,
      label: String(index + 1)
    })));
}

function getDailyRouteMarkers(guide: DailyGuide) {
  if (guide.routeOverview?.length) {
    return uniqueMarkers(guide.routeOverview.map((point, index) => ({
      lat: point.coordinates.lat,
      lng: point.coordinates.lng,
      name: point.name,
      label: String(index + 1)
    })));
  }

  return uniqueMarkers(getPrimaryPlaces(guide)
    .filter((place) => place.coordinates)
    .map((place, index) => ({
      lat: place.coordinates!.lat,
      lng: place.coordinates!.lng,
      name: place.name,
      label: String(index + 1)
    })));
}

function isMovementRoutePoint(point: DailyRouteOverviewPoint) {
  if (point.mode && point.mode !== "walk") return true;
  return isLogisticsText(point.name);
}

function getDailyMovementMarkers(guide: DailyGuide) {
  const movementPoints = guide.routeOverview?.filter(isMovementRoutePoint) ?? [];

  if (movementPoints.length) {
    const mergedPoints = movementPoints.reduce<DailyRouteOverviewPoint[]>((acc, point) => {
      const existingIndex = acc.findIndex((item) =>
        item.coordinates.lat.toFixed(3) === point.coordinates.lat.toFixed(3) &&
        item.coordinates.lng.toFixed(3) === point.coordinates.lng.toFixed(3)
      );

      if (existingIndex < 0) return [...acc, point];

      const existing = acc[existingIndex];
      acc[existingIndex] = point.name.length > existing.name.length ? point : existing;
      return acc;
    }, []);

    return uniqueMarkers(mergedPoints.map((point, index) => ({
      lat: point.coordinates.lat,
      lng: point.coordinates.lng,
      name: point.name,
      label: String(index + 1)
    })));
  }

  return getDailyRouteMarkers(guide);
}

function isLocalSightPlace(place: DailyGuidePlace) {
  const text = `${place.name} ${place.category}`.toLowerCase();

  return Boolean(place.coordinates) &&
    !text.includes("monti district") &&
    !text.includes("휴식") &&
    !isFoodBreakPlace(place) &&
    !isLogisticsPlace(place);
}

function placesToNumberedMarkers(places: DailyGuidePlace[]) {
  return uniqueMarkers(places
    .filter(isLocalSightPlace)
    .map((place, index) => ({
      lat: place.coordinates!.lat,
      lng: place.coordinates!.lng,
      name: place.name,
      label: String(index + 1)
    })));
}

function getPrimaryLocalSightMarkers(guide: DailyGuide) {
  const primaryVisit = guide.cityVisits?.find((visit) => visit.spots.filter(isLocalSightPlace).length >= 2);

  if (primaryVisit) {
    return placesToNumberedMarkers(primaryVisit.spots);
  }

  return placesToNumberedMarkers(getPrimaryPlaces(guide));
}

function getMarkerSpreadKm(markers: PrintMapMarker[]) {
  if (markers.length < 2) return 0;

  const lats = markers.map((marker) => marker.lat);
  const lngs = markers.map((marker) => marker.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const avgLat = (minLat + maxLat) / 2;
  const latKm = (maxLat - minLat) * 111;
  const lngKm = (maxLng - minLng) * 111 * Math.cos((avgLat * Math.PI) / 180);

  return Math.sqrt(latKm ** 2 + lngKm ** 2);
}

function shouldSplitDailyMaps(routeMarkers: PrintMapMarker[], localSightMarkers: PrintMapMarker[]) {
  if (routeMarkers.length < 2 || localSightMarkers.length < 2) return false;

  const routeSpread = getMarkerSpreadKm(routeMarkers);
  const localSpread = Math.max(getMarkerSpreadKm(localSightMarkers), 0.8);

  return routeSpread >= 12 && routeSpread / localSpread >= 2.8;
}

function getDailySightMarkers(guide: DailyGuide) {
  return uniqueMarkers(getPrimaryPlaces(guide)
    .filter((place) => place.coordinates)
    .filter((place) => !isLogisticsPlace(place))
    .map((place, index) => ({
      lat: place.coordinates!.lat,
      lng: place.coordinates!.lng,
      name: place.name,
      label: String(index + 1)
    })));
}

function placesToMapMarkers(places: DailyGuidePlace[]) {
  return uniqueMarkers(places
    .filter((place) => place.coordinates)
    .map((place, index) => ({
      lat: place.coordinates!.lat,
      lng: place.coordinates!.lng,
      name: place.name,
      label: String(index + 1)
    })));
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

const cityGuideDefinitions: CityGuideDefinition[] = [
  {
    eyebrow: "Rome",
    title: "Rome Arrival Layer",
    subtitle: "Arrival-day Rome is compact but dense: ancient power, baroque piazzas, and a night train departure all sit inside one walkable frame.",
    keywords: ["rome", "colosseum", "pantheon", "forum", "trevi", "spanish steps", "piazza navona"],
    cityMatchers: ["rome"]
  },
  {
    eyebrow: "Eastern Sicily",
    title: "Catania, Etna & Taormina",
    subtitle: "Volcanic cities, black-stone baroque streets, fishing villages, cliffside theatres, and mountain towns open the Sicilian rhythm.",
    keywords: ["catania", "etna", "taormina", "savoca", "aci trezza", "isola bella", "greek theatre"],
    cityMatchers: ["catania", "aci trezza", "mount etna", "taormina", "castelmola", "forza", "savoca", "naxos", "isola bella"]
  },
  {
    eyebrow: "Syracuse & Ortigia",
    title: "Ancient Syracuse & Ortigia",
    subtitle: "Greek theatre stone, limestone quarries, baroque piazzas, sea walls, and mythic springs compress many centuries into one city walk.",
    keywords: ["syracuse", "siracusa", "ortigia", "neapolis", "duomo", "arethusa", "maniace", "dionysius"],
    cityMatchers: ["syracuse", "ortigia"]
  },
  {
    eyebrow: "Southeast Baroque",
    title: "Noto, Ragusa, Modica & Marzamemi",
    subtitle: "The southeast turns from baroque reconstruction and hill towns to chocolate, stone stairways, and small fishing-harbour light.",
    keywords: ["noto", "ragusa", "modica", "marzamemi", "pozzallo", "baroque", "duomo"],
    cityMatchers: ["noto", "ragusa", "modica", "pozzallo", "marzamemi"]
  },
  {
    eyebrow: "Malta",
    title: "Valletta, Gozo, Mdina & The Three Cities",
    subtitle: "Fortified harbours, knights' churches, blue water crossings, island archaeology, and walled inland towns shape the Malta chapter.",
    keywords: ["valletta", "barrakka", "st john", "birgu", "senglea", "bormla", "gozo", "cittadella", "ggantija", "blue lagoon", "mdina"],
    cityMatchers: ["valletta", "birgu", "bormla", "senglea", "comino", "gozo", "blue grotto", "marsaxlokk", "mdina", "mosta"]
  },
  {
    eyebrow: "Southern Sicily",
    title: "Agrigento, Realmonte & The South Coast",
    subtitle: "Roman mosaics, Greek temple valleys, pale cliffs, and old-town viewpoints slow the route into a southern Sicilian chapter.",
    keywords: ["agrigento", "temple", "temples", "kolymbethra", "scala", "realmonte", "villa romana"],
    cityMatchers: ["villa romana", "agrigento", "realmonte"]
  },
  {
    eyebrow: "Western Sicily",
    title: "Trapani, Erice, Palermo & Cefalu",
    subtitle: "Salt pans, mountain villages, Segesta, coves, Arab-Norman Palermo, Monreale mosaics, and Cefalu's sea edge form the western arc.",
    keywords: ["trapani", "erice", "palermo", "monreale", "palatine", "segesta", "scopello", "cefalu"],
    cityMatchers: ["trapani", "erice", "segesta", "scopello", "palermo", "monreale", "cefalu"]
  },
  {
    eyebrow: "Mainland Return",
    title: "Calabria, Amalfi & Pompeii",
    subtitle: "The mainland return moves through fishing villages, Tyrrhenian viewpoints, Campania coast light, and the archaeological weight of Pompeii.",
    keywords: ["amalfi", "pompeii", "tropea", "scilla", "pizzo", "calabria"],
    cityMatchers: ["scilla", "tropea", "pizzo", "amalfi", "pompeii"]
  }
];

function isSimpleFoodBreakPlace(place: DailyGuidePlace) {
  const text = `${place.name} ${place.category}`.toLowerCase();
  if (text.includes("mercato") || text.includes("market") || text.includes("pescheria") || text.includes("ballaro")) {
    return false;
  }

  return [
    "monti district",
    "restaurant",
    "cafe",
    "caffe",
    "dolceria",
    "bakery",
    "bonajuto",
    "maria grammatico",
    "ta' kalbi",
    "tartufo",
    "lungo garden",
    "dessert",
    "gelato",
    "sorbet",
    "디저트",
    "제과점",
    "베이커리",
    "초콜릿",
    "해산물 점심"
  ].some((token) => text.includes(token));
}

function isPlaceStoryEligible(place: DailyGuidePlace) {
  return Boolean(place.coordinates) && !isLogisticsPlace(place) && !isSimpleFoodBreakPlace(place);
}

function getAllPlaceStoryEntries() {
  const entries: PlaceStoryEntry[] = [];
  const seen = new Set<string>();

  for (const guide of sicilyGuideData.dailyGuides) {
    for (const visit of guide.cityVisits ?? []) {
      for (const place of visit.spots ?? []) {
        if (!isPlaceStoryEligible(place)) continue;

        const key = normalizePrintPlaceKey(place.name);
        if (seen.has(key)) continue;
        seen.add(key);

        entries.push({
          place,
          day: guide.day,
          city: visit.city,
          region: guide.region
        });
      }
    }
  }

  return entries;
}

function getCityGuidePlaces(definition: CityGuideDefinition) {
  return getAllPlaceStoryEntries().filter((entry) => getPlaceStoryDefinition(entry)?.title === definition.title);
}

function getPlaceStoryDefinition(entry: PlaceStoryEntry) {
  const text = `${entry.city} ${entry.place.name} ${entry.place.category}`.toLowerCase();
  return cityGuideDefinitions.find((definition) => definition.cityMatchers.some((matcher) => text.includes(matcher)));
}

function getPlaceStoryDescription(entry: PlaceStoryEntry) {
  const { place } = entry;
  const parts = [
    place.detailDescription,
    ...(place.whyVisit ?? []),
    ...(place.whatToSee ?? []),
    ...(place.tips ?? []),
    place.description
  ].filter((value): value is string => Boolean(value && value.trim()));
  const uniqueParts = Array.from(new Set(parts.map((part) => part.replace(/\s+/g, " ").trim())));
  let text = "";

  for (const part of uniqueParts) {
    const next = `${text}${text ? " " : ""}${part}`.trim();
    if (next.length > 720 && text.length >= 400) break;
    text = next;
    if (text.length >= 460) break;
  }

  if (text.length < 400) {
    text = `${text} Day ${String(entry.day).padStart(2, "0")}의 ${entry.city} 구간에서는 ${place.name}을(를) 단독 명소가 아니라 전후 동선과 함께 읽는 편이 좋습니다. 위치, 주변 거리감, 사진 포인트, 체력 배분을 함께 확인하면 짧은 체류 안에서도 이 장소가 일정에서 맡는 역할이 분명해집니다.`;
  }

  return text;
}

function getPlaceStoryLead(entry: PlaceStoryEntry) {
  return pageCardText(entry.place.whyVisit?.[0] || entry.place.description || entry.place.detailDescription, 96);
}

function getPlaceStoryPoints(entry: PlaceStoryEntry) {
  return [
    entry.place.whatToSee?.[0],
    entry.place.whyVisit?.[1],
    entry.place.tips?.[0]
  ].filter((value): value is string => Boolean(value)).slice(0, 3);
}

function getPlaceStoryCities(entries: PlaceStoryEntry[]) {
  return Array.from(new Set(entries.map((entry) => entry.city))).slice(0, 8);
}

function CoverPage({ payload, design }: { payload: TravelPayload; design: PrintGuideDesign }) {
  const coverImage = "/travel-photos/home-hero-taormina-bright-portrait.png";

  return (
    <section className="guide-cover">
      <img className="cover-photo" src={getPrintImageSrc(coverImage)} alt={design.title} />
      <div className="cover-scrim" />
      <div className="cover-topline">
        <span>{design.coverLabel}</span>
        <span>2026 Field Edition</span>
      </div>
      <div className="cover-copy">
        <p className="guide-kicker">Sicily / Malta / Calabria / Amalfi / Rome</p>
        <h1>{design.title}</h1>
        <p className="guide-subtitle">{design.subtitle}</p>
        <div className="cover-route">
          <span>Sicily</span>
          <span>Malta</span>
          <span>Calabria</span>
          <span>Campania</span>
          <span>Rome</span>
        </div>
      </div>
      <div className="guide-cover-grid">
        <div>
          <span>Route</span>
          <strong>Ancient coastlines and slow-road cities</strong>
        </div>
        <div>
          <span>Days</span>
          <strong>{sicilyGuideData.masterTimeline.length}</strong>
        </div>
        <div>
          <span>Dates</span>
          <strong>{payload.trip.dateRange || "May 21 - Jun 08"}</strong>
        </div>
      </div>
    </section>
  );
}

function GuideIntroPage({ payload, design }: { payload: TravelPayload; design: PrintGuideDesign }) {
  const introRouteMarkers = getAllRouteMarkers();
  const routeBlocks = [
    {
      label: "Arc 01",
      title: "Eastern Sicily",
      copy: "Catania, Etna, Taormina, Syracuse, Noto, Ragusa and Modica are arranged around driving load, parking friction, and the richest baroque layers."
    },
    {
      label: "Arc 02",
      title: "Malta Interlude",
      copy: "Gzira works as the base: ferry into Valletta, boats toward Comino and Gozo, then a south-coast loop through Blue Grotto and Marsaxlokk."
    },
    {
      label: "Arc 03",
      title: "West to the Mainland",
      copy: "Agrigento, Erice, Palermo, Monreale, Calabria, Salerno, Amalfi and Pompeii form the return spine toward the final Rome night."
    }
  ];

  return (
    <section className="guide-page guide-intro page-break-before">
      <div className="intro-masthead">
        <p className="guide-kicker">Journey at a Glance</p>
        <h2>여행 한눈에 보기</h2>
        <p>{payload.trip.subtitle || design.subtitle}</p>
      </div>

      <div className="intro-grid">
        <article className="intro-note">
          <span>Route Rhythm</span>
          <p>
            Rome 도착과 야간열차, Sicily 동부와 남부, Malta 섬 이동, 서부 Sicily, Calabria와 Amalfi 해안을 지나
            Rome 출국으로 이어지는 긴 호흡의 지중해 루트입니다. 이 페이지는 전체 지리와 이동 리듬을 먼저 잡기 위한 요약 지도입니다.
          </p>
        </article>

        <div className="intro-facts">
          <div>
            <span>Dates</span>
            <strong>{payload.trip.dateRange || "May 21 - Jun 08, 2026"}</strong>
          </div>
          <div>
            <span>Scope</span>
            <strong>{sicilyGuideData.masterTimeline.length} travel days</strong>
          </div>
          <div>
            <span>Mode</span>
            <strong>Flights, train, ferries, rental car</strong>
          </div>
        </div>
      </div>

      <section className="intro-route-flow avoid-break-inside">
        <div className="intro-route-map">
          <PrintTileMap markers={introRouteMarkers} scope="overview" />
          <div className="day-map-caption">
            <span>Mediterranean Route</span>
            <strong>{introRouteMarkers.length} key stops</strong>
          </div>
        </div>
        <div className="route-editorial">
          {routeBlocks.map((block) => (
            <article key={block.label}>
              <span>{block.label}</span>
              <h3>{block.title}</h3>
              <p>{block.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function getNightTrainVisits(guides: DailyGuide[]) {
  return guides.flatMap((guide) =>
    (guide.cityVisits ?? [])
      .filter((visit) => visit.trainInfo)
      .map((visit) => ({ guide, visit }))
  );
}

function getTransportMovementRows(items: MasterTimelineItem[]) {
  return items
    .filter((item) => ["flight", "train", "ferry"].includes(item.transportMode ?? "") || [15, 17].includes(item.day))
    .map((item) => ({
      day: item.day,
      date: item.dateLabel,
      route: item.primaryRoute,
      mode: modeLabel(item.transportMode),
      stay: item.accommodation?.name ?? "Transit"
    }));
}

function CityGuidePage({ definition }: { definition: CityGuideDefinition }) {
  const entries = getCityGuidePlaces(definition);
  const heroEntry = entries.find((entry) => entry.place.image);
  const heroPlace = heroEntry?.place;
  const mapMarkers = placesToMapMarkers(entries.map((entry) => entry.place));
  const storyPages = chunkArray(entries, 3);
  const cityNames = getPlaceStoryCities(entries);

  if (!entries.length) return null;

  return (
    <>
      <section className="guide-page city-guide-page place-story-opener page-break-before">
        <header className="city-guide-hero">
          <div>
            <p className="guide-kicker">{definition.eyebrow}</p>
            <h2>{definition.title}</h2>
            <p>{definition.subtitle}</p>
            <div className="place-story-city-chips">
              {cityNames.map((city) => (
                <span key={`${definition.title}-${city}`}>{city}</span>
              ))}
            </div>
          </div>
          {heroPlace?.image && (
            <figure>
              <img src={getPrintImageSrc(heroPlace.image)} alt={heroPlace.imageAlt} style={getPlaceImageStyle(heroPlace)} />
              <figcaption>{heroPlace.name}</figcaption>
            </figure>
          )}
        </header>

        <div className="city-guide-body">
          <article className="city-guide-feature">
            <span>Chapter Route</span>
            <p>
              {definition.title} 장은 실제 여정의 흐름을 따라 {cityNames.join(" / ")}의 장소를 이어 읽도록 구성했습니다.
              하루 일정 카드에서 짧게 다룬 배경을 넓혀, 현장에서 기억하면 좋은 역사와 풍경, 관람 포인트를 장소별 이야기로 정리했습니다.
            </p>
          </article>
          <div className="city-guide-map">
            <PrintTileMap markers={mapMarkers} scope="daily" />
            <div className="day-map-caption">
              <span>City Map</span>
              <strong>{mapMarkers.length} detailed places</strong>
            </div>
          </div>
        </div>

        <div className="city-guide-place-list city-guide-place-list-featured">
          {entries.slice(0, 4).map((entry, index) => (
            <article key={entry.place.id} className="city-guide-place">
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <div>
                <p>Day {String(entry.day).padStart(2, "0")} / {entry.city}</p>
                <h3>{entry.place.name}</h3>
                <span>{getPlaceStoryLead(entry)}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="city-guide-tip-grid">
          {entries.slice(0, 2).map((entry) => (
            <article key={`${entry.place.id}-tip`}>
              <span>{entry.place.name}</span>
              <p>{pageCardText(entry.place.tips?.[0] || entry.place.whatToSee?.[0] || entry.place.whyVisit?.[0] || entry.place.description, 120)}</p>
            </article>
          ))}
        </div>
      </section>

      {storyPages.map((pageEntries, pageIndex) => (
        <section key={`${definition.title}-stories-${pageIndex}`} className="guide-page city-guide-more-page place-story-page page-break-before">
          <SectionTitle
            eyebrow={definition.eyebrow}
            title={`${definition.title} Stories`}
            note={`${entries.length}개 관광지 / 일정 순서 ${pageIndex + 1}/${storyPages.length}`}
          />
          <div className="place-story-block-list">
            {pageEntries.map((entry, index) => {
              const absoluteIndex = pageIndex * 3 + index;
              const points = getPlaceStoryPoints(entry);

              return (
                <article key={entry.place.id} className="place-story-block">
                  {entry.place.image && (
                    <figure>
                      <img
                        src={getPrintImageSrc(entry.place.image)}
                        alt={entry.place.imageAlt}
                        loading="eager"
                        decoding="sync"
                        style={getPlaceImageStyle(entry.place)}
                      />
                    </figure>
                  )}
                  <div className="place-story-copy">
                    <p className="place-story-meta">
                      {String(absoluteIndex + 1).padStart(2, "0")} / Day {String(entry.day).padStart(2, "0")} / {entry.city} / {entry.place.category}
                    </p>
                    <h3>{entry.place.name}</h3>
                    <strong>{getPlaceStoryLead(entry)}</strong>
                    <p>{getPlaceStoryDescription(entry)}</p>
                    {points.length > 0 && (
                      <ul>
                        {points.map((point) => (
                          <li key={`${entry.place.id}-${point}`}>{pageCardText(point, 92)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        ))}
    </>
  );
}

function SectionTitle({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <header className="guide-section-title">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      {note && <span>{note}</span>}
    </header>
  );
}

function TransportGuidePage({
  tickets
}: {
  tickets: FlightTicket[];
}) {
  if (!tickets.length) return null;

  return (
    <section className="guide-page flight-essentials-page transport-guide-page page-break-before">
      <SectionTitle
        eyebrow="Transport Guide"
        title="Flight Tickets"
        note={`${tickets.length} confirmed flight groups`}
      />
      <div className="flight-ticket-grid">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="guide-box avoid-break-inside">
            <div className="guide-box-header">
              <div>
                <p>{ticket.title}</p>
                <h3>{ticket.routeLabel}</h3>
              </div>
              <strong>{ticket.dateLabel}</strong>
            </div>
            <div className="flight-segments">
              {ticket.segments.map((segment) => (
                <div key={`${ticket.id}-${segment.flightNo}`} className="flight-segment">
                  <div>
                    <strong>{segment.flightNo}</strong>
                    <span>{segment.airlineName}</span>
                  </div>
                  <div>
                    <b>{segment.from.code}</b>
                    <span>{segment.from.time}</span>
                  </div>
                  <div className="flight-arrow">{segment.duration}</div>
                  <div>
                    <b>{segment.to.code}</b>
                    <span>{segment.to.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MovementReferencePage({ items, dailyGuides }: { items: MasterTimelineItem[]; dailyGuides: DailyGuide[] }) {
  const movementRows = getTransportMovementRows(items);
  const trainVisits = getNightTrainVisits(dailyGuides);
  if (!movementRows.length && !trainVisits.length) return null;

  return (
    <section className="guide-page movement-reference-page page-break-before">
      <SectionTitle eyebrow="Transport Guide" title="Night Train & Movement Reference" note="Flights, trains, ferries and long driving days" />
      {trainVisits.map(({ guide, visit }) => (
        <div key={`${guide.id}-${visit.id}-movement-train`} className="transport-train-block">
          <div className="transport-day-label">Day {String(guide.day).padStart(2, "0")} / {formatDate(guide.date)}</div>
          <NightTrainCard visit={visit} />
        </div>
      ))}
      {movementRows.length > 0 && (
        <section className="transport-movement-table avoid-break-inside">
          <div className="daily-edit-title">
            <span>Movement Days</span>
            <strong>Long-distance days</strong>
          </div>
          <table className="guide-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Route</th>
                <th>Mode</th>
                <th>Stay</th>
              </tr>
            </thead>
            <tbody>
              {movementRows.map((row) => (
                <tr key={`movement-${row.day}`}>
                  <td>{String(row.day).padStart(2, "0")}</td>
                  <td>{row.date}</td>
                  <td>{row.route}</td>
                  <td>{row.mode}</td>
                  <td>{row.stay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </section>
  );
}

function StayDirectory({ stays, title }: { stays: StayRow[]; title: string }) {
  if (!stays.length) return null;
  const stayMarkers = getStayMarkers();
  const stayPages = chunkArray(stays, STAY_CARDS_PER_PAGE);

  return (
    <>
      <section className="guide-page stay-directory-page page-break-before">
        <SectionTitle eyebrow="Accommodations" title={title} note="숙소 전체 요약 지도" />
        {stayMarkers.length > 0 && (
          <section className="stay-map-block avoid-break-inside">
            <div className="stay-map-panel">
              <div className="stay-map-canvas">
                <PrintTileMap markers={stayMarkers} scope="atlas" />
              </div>
              <div className="day-map-caption">
                <span>Stay Map</span>
                <strong>{stays.length} accommodation bases</strong>
              </div>
            </div>
            <div className="stay-map-key">
              {stays.map((stay, index) => (
                <div key={`${stay.key}-map-key`}>
                  <b>{index + 1}</b>
                  <span>
                    <strong>{stay.name}</strong>
                    <em>Days {stay.days.join(", ")}</em>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>

      {stayPages.map((pageStays, pageIndex) => (
        <section key={`stay-directory-cards-${pageIndex}`} className="guide-page stay-directory-page stay-directory-cards-page page-break-before">
          <SectionTitle
            eyebrow="Accommodations"
            title={`${title} Links`}
            note={`예약 주소와 링크 ${pageIndex + 1}/${stayPages.length}`}
          />
          <div className="stay-grid">
            {pageStays.map((stay, index) => {
              const absoluteIndex = pageIndex * STAY_CARDS_PER_PAGE + index;

              return (
                <article key={stay.key} className="guide-box avoid-break-inside">
                  <p className="stay-days">{String(absoluteIndex + 1).padStart(2, "0")} / Days {stay.days.join(", ")}</p>
                  <h3>{stay.name}</h3>
                  <p>{stay.address}</p>
                  <dl className="mini-facts">
                    <div>
                      <dt>Check-in</dt>
                      <dd>{stay.checkIn ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>Check-out</dt>
                      <dd>{stay.checkOut ?? "-"}</dd>
                    </div>
                  </dl>
                  {(stay.googleMapsUrl || stay.airbnbUrl) && (
                    <div className="stay-links">
                      {stay.googleMapsUrl && <a href={stay.googleMapsUrl}>Google Maps</a>}
                      {stay.airbnbUrl && <a href={stay.airbnbUrl}>Airbnb</a>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

function OfflineChecklistPage({
  stays,
  tickets,
  items
}: {
  stays: StayRow[];
  tickets: FlightTicket[];
  items: MasterTimelineItem[];
}) {
  const firstDay = items[0];
  const lastDay = items[items.length - 1];
  const tripWindow = `${firstDay?.dateLabel ?? "5/21"} - ${lastDay?.dateLabel ?? "6/8"}`;
  const checklistGroups = [
    {
      title: "Documents & Tickets",
      items: [
        `여권, 항공권, 야간열차, 렌터카, 숙소 예약서를 ${tripWindow} 일정 순서대로 저장`,
        "Finnair AY042/AY1761, InterCityNotte 1955, Ryanair FR2930/FR395, Finnair AY1762/AY041 시간 재확인",
        "렌터카 예약자 면허증, 국제운전면허증, 보조 운전자 등록 여부 확인",
        "주요 성당/유적 입장권과 예약 메일은 휴대폰 로컬 파일로 저장"
      ]
    },
    {
      title: "Maps & Addresses",
      items: [
        `${stays.length}개 숙소의 주소, 체크인 방법, 주차/열쇠 안내를 오프라인으로 열어둘 것`,
        "Rome Termini, Catania Centrale, Catania Airport, Malta Airport, Messina/Villa San Giovanni 항구 핀 저장",
        "동부 시칠리아, 몰타, 서부 시칠리아, 칼라브리아, 아말피/나폴리, 로마 오프라인 지도 다운로드",
        "Day 12 Realmonte-Trapani-Erice-Balestrate와 Day 17 Tropea-Pizzo-Pompeii-Salerno 장거리 경로 사전 저장"
      ]
    },
    {
      title: "Movement Days",
      items: [
        "Day 1 Rome 도착 후 Termini 이동과 20:16 야간열차 탑승 플랫폼 확인",
        "Day 7 Catania-Malta 오전 항공은 수하물/보안 시간을 감안해 공항 도착 여유 확보",
        "Day 9 Malta-Catania 밤 도착 후 숙소 체크인 안내와 주차 동선을 미리 캡처",
        "Day 15 Sicily-Calabria 이동은 페리 대기, 주유, 숙소 도착 시간을 함께 계산"
      ]
    },
    {
      title: "Daily Essentials",
      items: [
        "여권 사본, 카드 2장 이상, 소액 현금, 여행자보험, 비상 연락처를 가족별로 분산 보관",
        "eSIM/로밍, 보조배터리, C타입 케이블, EU 어댑터, 차량용 충전기 준비",
        "돌길이 많은 Erice, Mdina, Palermo, Pompeii용 편한 신발과 얇은 겉옷 준비",
        "해변/페리/장거리 운전일을 위해 선크림, 선글라스, 멀미약, 상비약 확인"
      ]
    }
  ];

  return (
    <section className="guide-page offline-checklist-page page-break-before">
      <SectionTitle eyebrow="Final Travel Check" title="Pre-Departure Checklist" note="Sicily, Malta, Calabria, Amalfi and Rome 일정 전용 출발 전 점검표" />
      <div className="offline-checklist-grid">
        {checklistGroups.map((group) => (
          <article key={group.title} className="offline-checklist-card avoid-break-inside">
            <h3>{group.title}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function RouteOverview({ guide }: { guide: DailyGuide }) {
  if (!guide.routeOverview?.length) return null;

  return (
    <section className="day-route-flow avoid-break-inside">
      <div className="day-route-flow-title">
        <span>Route Flow</span>
        <strong>오늘의 동선</strong>
      </div>
      <div className="day-route-strip">
        {guide.routeOverview.slice(0, 6).map((point, index) => (
          <div key={point.id}>
            <span>{index + 1}</span>
            <strong>{point.name}</strong>
            {point.detail && <p>{point.detail}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function DailyMapCard({
  markers,
  label,
  title,
  emptyLabel,
  scope = "daily",
  className
}: {
  markers: PrintMapMarker[];
  label: string;
  title: string;
  emptyLabel: string;
  scope?: PrintMapScope;
  className?: string;
}) {
  return (
    <div className={`daily-route-map-card daily-route-map-card-${scope} ${className ?? ""} avoid-break-inside`}>
      {markers.length > 0 ? (
        <PrintTileMap markers={markers} scope={scope} />
      ) : (
        <div className="print-tile-map print-tile-map-empty">{emptyLabel}</div>
      )}
      <div className="day-map-caption">
        <span>{label}</span>
        <strong>{title}</strong>
      </div>
    </div>
  );
}

function DailyRouteSpine({
  title,
  items
}: {
  title: string;
  items: DailyRouteListItem[];
}) {
  if (!items.length) return null;

  return (
    <section className="daily-route-spine avoid-break-inside">
      <div className="daily-route-section-title">
        <span>{title}</span>
      </div>
      <ol>
        {items.slice(0, 8).map((item) => (
          <li key={item.id}>
            <b>{item.label}</b>
            <div>
              <strong>{item.name}</strong>
              {item.segmentInfo && <span>{item.segmentInfo}</span>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function normalizeTravelText(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/international|airport|aeroporto|fontanarossa|fiumicino|transfer|preview|terminal|centrale/g, " ")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

function markerMatchesAirportPoint(markerItem: PrintMapMarker, point: TicketSegment["from"]) {
  const markerText = normalizeTravelText(markerItem.name);
  const tokens = [
    point.code,
    point.city,
    point.airport,
    `${point.city} ${point.airport}`
  ]
    .map(normalizeTravelText)
    .filter((token) => token.length >= 2);

  return tokens.some((token) => markerText.includes(token) || token.includes(markerText));
}

function findTicketSegmentForLeg(from: PrintMapMarker, to: PrintMapMarker) {
  for (const ticket of sicilyGuideData.flightTickets) {
    for (const segment of ticket.segments) {
      if (markerMatchesAirportPoint(from, segment.from) && markerMatchesAirportPoint(to, segment.to)) {
        return segment;
      }
    }
  }

  return null;
}

function formatTicketSegmentInfo(segment: TicketSegment) {
  const fromDate = segment.from.dateLabel ? `${segment.from.dateLabel} ` : "";
  const toDate = segment.to.dateLabel && segment.to.dateLabel !== segment.from.dateLabel ? `${segment.to.dateLabel} ` : "";
  return `${segment.flightNo} · ${fromDate}${segment.from.time} → ${toDate}${segment.to.time} · ${segment.duration}`;
}

function buildMovementSegmentInfos(markers: PrintMapMarker[]) {
  return markers.map((markerItem, index) => {
    const nextMarker = markers[index + 1];
    if (!nextMarker) return "";

    const ticketSegment = findTicketSegmentForLeg(markerItem, nextMarker);
    if (ticketSegment) return formatTicketSegmentInfo(ticketSegment);

    return "";
  });
}

function DailyRoutePage({
  guide,
  sectionTitle,
  places,
  daySummary
}: {
  guide: DailyGuide;
  sectionTitle: string;
  places: DailyGuidePlace[];
  daySummary: { label: string; value: string | undefined }[];
}) {
  const routeMarkers = getDailyMovementMarkers(guide);
  const localSightMarkers = getPrimaryLocalSightMarkers(guide);
  const splitMaps = shouldSplitDailyMaps(routeMarkers, localSightMarkers);
  const isLongReturnMovementDay = guide.day === 17;
  const singleMapMarkers = splitMaps ? [] : uniqueMarkers([...routeMarkers, ...localSightMarkers]);
  const singleMapLabel = localSightMarkers.length > 0 ? "Route & Sight Map" : "Movement Map";
  const singleMapTitle = localSightMarkers.length > 0
    ? `${singleMapMarkers.length} mapped points`
    : `${routeMarkers.length} route points`;
  const movementSegments = buildMovementSegmentInfos(routeMarkers);

  const movementRouteItems: DailyRouteListItem[] = routeMarkers.map((markerItem, idx) => {
    return {
      id: `move-${markerItem.label}-${markerItem.name}`,
      label: markerItem.label,
      name: markerItem.name,
      segmentInfo: movementSegments[idx]
    };
  });

  const localSightRouteItems: DailyRouteListItem[] = localSightMarkers.map((markerItem) => {
    return {
      id: `sight-${markerItem.label}-${markerItem.name}`,
      label: markerItem.label,
      name: markerItem.name
    };
  });

  return (
    <section className={`guide-page daily-route-map-page ${splitMaps ? "daily-route-map-page-split" : "daily-route-map-page-single"} page-break-before`}>
      <header className="day-header">
        <div className="day-badge">Day {String(guide.day).padStart(2, "0")}</div>
        <div>
          <p>{sectionTitle} / {formatDate(guide.date)} / {guide.region}</p>
          <h2>{guide.title}</h2>
        </div>
      </header>

      <div className="day-brief day-summary-grid">
        {daySummary.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value || "-"}</strong>
          </div>
        ))}
      </div>

      <div className={`daily-route-map-layout ${splitMaps ? "daily-route-map-layout-split" : "daily-route-map-layout-single"}`}>
        {splitMaps ? (
          <div className="daily-route-map-stack">
            <DailyMapCard
              markers={routeMarkers}
              label="Movement Map"
              title={`${routeMarkers.length} route points`}
              emptyLabel="이동 경로 좌표가 부족합니다."
              scope="dailyWide"
              className={isLongReturnMovementDay ? "daily-route-map-card-return-wide" : undefined}
            />
            <DailyMapCard
              markers={localSightMarkers}
              label="Local Sight Map"
              title={`${localSightMarkers.length} city stops`}
              emptyLabel="도시 관광지 좌표가 부족합니다."
            />
          </div>
        ) : (
          <DailyMapCard
            markers={singleMapMarkers}
            label={singleMapLabel}
            title={singleMapTitle}
            emptyLabel="이동 경로 좌표가 부족합니다."
            scope={localSightMarkers.length > 0 ? "daily" : "dailyWide"}
          />
        )}

        <aside className="daily-route-side">
          {splitMaps ? (
            <>
              <DailyRouteSpine title="Movement Route" items={movementRouteItems} />
              <DailyRouteSpine title="Sight Route" items={localSightRouteItems} />
            </>
          ) : (
          <>
            <DailyRouteSpine title="Route Summary" items={movementRouteItems} />
            <DailyRouteSpine title="Sightseeing" items={localSightRouteItems} />
          </>
          )}
        </aside>
      </div>
    </section>
  );
}

function MapPanel({
  title,
  caption,
  markers,
  emptyLabel
}: {
  title: string;
  caption: string;
  markers: PrintMapMarker[];
  emptyLabel: string;
}) {
  return (
    <section className="map-panel avoid-break-inside">
      <div className="map-panel-heading">
        <span>{title}</span>
        <strong>{caption}</strong>
      </div>
      <div className="map-panel-map">
        {markers.length > 0 ? <PrintTileMap markers={markers} scope="daily" /> : <div className="print-tile-map print-tile-map-empty">{emptyLabel}</div>}
      </div>
      {markers.length > 0 && (
        <div className="map-panel-key">
          {markers.slice(0, 10).map((item) => (
            <div key={`${title}-${item.name}-${item.label}`}>
              <b>{item.label}</b>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NightTrainCard({ visit }: { visit: DailyCityVisit }) {
  const trainInfo = visit.trainInfo;
  if (!trainInfo) return null;

  return (
    <article className="night-train-card avoid-break-inside">
      <div>
        <p>Overnight Train</p>
        <h3>{trainInfo.title}</h3>
        <span>{trainInfo.cabinType}</span>
      </div>
      {trainInfo.image && <img src={getPrintImageSrc(trainInfo.image)} alt={trainInfo.imageAlt} />}
      <dl>
        <div>
          <dt>Route</dt>
          <dd>{trainInfo.routeLabel}</dd>
        </div>
        <div>
          <dt>Depart</dt>
          <dd>{trainInfo.departureLabel}</dd>
        </div>
        <div>
          <dt>Arrive</dt>
          <dd>{trainInfo.arrivalLabel}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{trainInfo.durationLabel}</dd>
        </div>
      </dl>
      <ul>
        {trainInfo.highlights.slice(0, 2).map((item) => (
          <li key={item}>{truncateText(item, 105)}</li>
        ))}
      </ul>
    </article>
  );
}

function CompactNightTrainCard({ visit }: { visit: DailyCityVisit }) {
  const trainInfo = visit.trainInfo;
  if (!trainInfo) return null;

  return (
    <article className="compact-train-card avoid-break-inside">
      <div className="compact-train-head">
        <span>Overnight Train</span>
        <strong>{trainInfo.title}</strong>
        <em>{trainInfo.cabinType}</em>
      </div>
      <p>{trainInfo.routeLabel}</p>
      <dl>
        <div>
          <dt>Depart</dt>
          <dd>{trainInfo.departureLabel}</dd>
        </div>
        <div>
          <dt>Arrive</dt>
          <dd>{trainInfo.arrivalLabel}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{trainInfo.durationLabel}</dd>
        </div>
      </dl>
    </article>
  );
}

function ReturnJourneyCombinedPage({ guides, sectionTitle }: { guides: DailyGuide[]; sectionTitle: string }) {
  const returnGuides = guides.filter(Boolean);
  if (!returnGuides.length) return null;

  return (
    <section className="guide-page return-journey-page page-break-before">
      <SectionTitle
        eyebrow={sectionTitle}
        title="Return Journey"
        note={returnGuides.map((guide) => `Day ${String(guide.day).padStart(2, "0")} · ${formatDate(guide.date)}`).join(" / ")}
      />

      <div className="return-journey-grid">
        {returnGuides.map((guide) => {
          const timeline = getDayTimelineItem(guide.day);
          const routeMarkers = getDailyMovementMarkers(guide);
          const routeItems: DailyRouteListItem[] = routeMarkers.map((markerItem) => ({
            id: `${guide.id}-${markerItem.label}-${markerItem.name}`,
            label: markerItem.label,
            name: markerItem.name
          }));
          const notes = [
            guide.deck,
            ...(guide.editorial ?? []),
            timeline?.note
          ].filter(Boolean).slice(0, 3);

          return (
            <article key={guide.id} className="return-day-card avoid-break-inside">
              <header className="return-day-header">
                <div className="day-badge">Day {String(guide.day).padStart(2, "0")}</div>
                <div>
                  <p>{formatDate(guide.date)} / {guide.region}</p>
                  <h3>{guide.title}</h3>
                </div>
              </header>

              <div className="return-day-map">
                {routeMarkers.length > 0 ? (
                  <PrintTileMap markers={routeMarkers} scope="dailyWide" />
                ) : (
                  <div className="print-tile-map print-tile-map-empty">이동 경로 좌표가 부족합니다.</div>
                )}
                <div className="day-map-caption">
                  <span>Movement</span>
                  <strong>{routeMarkers.length} route point{routeMarkers.length === 1 ? "" : "s"}</strong>
                </div>
              </div>

              <div className="return-day-facts">
                <div>
                  <span>Mode</span>
                  <strong>{modeLabel(guide.transportMode ?? timeline?.transportMode)}</strong>
                </div>
                <div>
                  <span>Base</span>
                  <strong>{guide.accommodation?.name ?? guide.region}</strong>
                </div>
              </div>

              {routeItems.length > 0 && <DailyRouteSpine title="Route Point" items={routeItems} />}

              {notes.length > 0 && (
                <div className="return-day-notes">
                  {notes.map((note, index) => (
                    <p key={`${guide.id}-return-note-${index}`}>{pageCardText(note, 150)}</p>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DailyMapPage({ guide, sectionTitle }: { guide: DailyGuide; sectionTitle: string }) {
  const routeMarkers = getDailyRouteMarkers(guide);
  const sightMarkers = getDailySightMarkers(guide);
  const trainVisits = guide.cityVisits?.filter((visit) => visit.displayMode === "train" || visit.trainInfo) ?? [];
  const routePoints = guide.routeOverview ?? [];

  if (!routeMarkers.length && !sightMarkers.length && !trainVisits.length) return null;

  return (
    <section className="guide-page daily-map-page page-break-before">
      <SectionTitle
        eyebrow={sectionTitle}
        title={`Day ${String(guide.day).padStart(2, "0")} Maps & Movement`}
        note={`${formatDate(guide.date)} / ${guide.region}`}
      />

      <div className="daily-map-grid">
        <MapPanel
          title="City Movement"
          caption="도시 이동 경로"
          markers={routeMarkers}
          emptyLabel="이동 경로 좌표가 부족합니다."
        />
        <MapPanel
          title="Sightseeing Map"
          caption="관광지 지도"
          markers={sightMarkers}
          emptyLabel="관광지 좌표가 부족합니다."
        />
      </div>

      {routePoints.length > 0 && (
        <div className="daily-route-directory">
          {routePoints.map((point, index) => (
            <article key={point.id}>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <div>
                <h3>{point.name}</h3>
                <p>{point.detail}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {trainVisits.map((visit) => (
        <NightTrainCard key={visit.id} visit={visit} />
      ))}
    </section>
  );
}

function CityVisitBox({ visit }: { visit: DailyCityVisit }) {
  return (
    <section className="city-visit avoid-break-inside">
      <div className="city-visit-header">
        <div>
          <p>{modeLabel(visit.routeMode)} / {visit.stayDuration}</p>
          <h4>{visit.city}</h4>
        </div>
        {visit.entryPoint && <span>{visit.entryPoint}</span>}
      </div>
      {visit.practicalNotes?.length > 0 && (
        <ul className="compact-list">
          {visit.practicalNotes.slice(0, 4).map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function getPlaceImageObjectPosition(place: DailyGuidePlace) {
  const name = place.name.toLowerCase();

  if (name.includes("roman forum")) return "58% 58%";
  if (name.includes("colosseum")) return "30% 58%";
  if (name.includes("pantheon")) return "50% 64%";
  if (name.includes("piazza venezia")) return "50% 50%";

  return "50% 50%";
}

function getPlaceImageObjectFit(place: DailyGuidePlace) {
  const name = place.name.toLowerCase();
  const image = place.image?.toLowerCase() ?? "";
  const text = `${name} ${image}`;

  if (
    text.includes("sant-agata") ||
    text.includes("piazza-universita") ||
    text.includes("piazza universita") ||
    text.includes("upper-barrakka") ||
    text.includes("upper barrakka") ||
    text.includes("mosta-rotunda") ||
    text.includes("mosta rotunda") ||
    text.includes("erice-panorama") ||
    text.includes("monastero-santa-caterina") ||
    text.includes("cefalu-cathedral") ||
    text.includes("villa-romana-del-casale") ||
    text.includes("tomb-of-theron") ||
    text.includes("tomb of theron") ||
    text.includes("via-atenea") ||
    text.includes("via atenea") ||
    text.includes("monreale") ||
    text.includes("pompeii-archaeological-park") ||
    text.includes("forum-of-pompeii") ||
    text.includes("lungo garden")
  ) {
    return "contain";
  }

  return "cover";
}

function getPlaceImageStyle(place: DailyGuidePlace): React.CSSProperties {
  return {
    objectFit: getPlaceImageObjectFit(place),
    objectPosition: getPlaceImageObjectPosition(place)
  };
}

function PlaceBrief({ place, index, showImage = true }: { place: DailyGuidePlace; index: number; showImage?: boolean }) {
  const seeItems = (place.whatToSee?.slice(0, 2) ?? []).map((item) => pageCardText(item, 112));
  const tipItems = (place.tips?.slice(0, 1) ?? []).map((item) => pageCardText(item, 108));
  const seeText = seeItems.filter(Boolean).join(" / ");
  const tipText = tipItems.filter(Boolean).join(" / ");
  const summary = pageCardText(place.detailDescription || place.shortDescription || place.description, 255);
  const stopNumber = String(index + 1).padStart(2, "0");

  return (
    <article className="place-brief essential-place avoid-break-inside">
      {showImage && place.image && (
        <figure className="place-thumb">
          <img
            src={getPrintImageSrc(place.image)}
            alt={place.imageAlt}
            loading="eager"
            decoding="sync"
            style={getPlaceImageStyle(place)}
          />
        </figure>
      )}
      <div className="place-brief-body">
        <div className="place-brief-top">
          <div>
            <p>Stop {stopNumber}</p>
            <h4>{place.name}</h4>
          </div>
        </div>
        <p className="place-summary">{summary}</p>
        {(seeText || tipText) && (
          <div className="place-note-lines">
            {seeText && (
              <p>
                <b>See</b>
                <span>{seeText}</span>
              </p>
            )}
            {tipText && (
              <p>
                <b>Tip</b>
                <span>{tipText}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function KeyStopCard({
  place,
  stopNumber,
  hideImage,
  compact = false
}: {
  place: DailyGuidePlace;
  stopNumber: string;
  hideImage?: boolean;
  compact?: boolean;
}) {
  const summary = pageCardText(place.detailDescription || place.description || place.shortDescription, compact ? 150 : 220);
  const focus = pageCardText(place.whatToSee?.[0] || place.whyVisit?.[0], compact ? 70 : 95);

  return (
    <article className={`key-stop-card ${compact ? "key-stop-card-compact" : ""} avoid-break-inside`} style={hideImage ? { display: "block" } : undefined}>
      {!hideImage && place.image && (
        <figure className="key-stop-image">
          <img
            src={getPrintImageSrc(place.image)}
            alt={place.imageAlt}
            loading="eager"
            decoding="sync"
            style={getPlaceImageStyle(place)}
          />
        </figure>
      )}
      <div className="key-stop-body" style={hideImage ? { marginTop: "0.5rem" } : undefined}>
        <p>Stop {stopNumber}</p>
        <h4>{place.name}</h4>
        <span>{summary}</span>
        {focus && <em>{focus}</em>}
      </div>
    </article>
  );
}

function MorePlaceCard({
  place,
  stopNumber,
  compact = false
}: {
  place: DailyGuidePlace;
  stopNumber: string;
  compact?: boolean;
}) {
  return (
    <article className={`more-place ${compact ? "more-place-compact" : ""} avoid-break-inside`}>
      {place.image && <img src={getPrintImageSrc(place.image)} alt={place.imageAlt} style={getPlaceImageStyle(place)} />}
      <div>
        <p>Stop {stopNumber} / {place.category}</p>
        <h4>{place.name}</h4>
        <span>{pageCardText(place.shortDescription || place.description, compact ? 86 : 145)}</span>
      </div>
    </article>
  );
}

function SecondaryPlaceCard({
  place,
  stopNumber,
  hideImage,
  compact = false
}: {
  place: DailyGuidePlace;
  stopNumber: string;
  hideImage?: boolean;
  compact?: boolean;
}) {
  const summaryLength = compact ? ((place.image && !hideImage) ? 135 : 160) : ((place.image && !hideImage) ? 220 : 240);
  const noteLength = compact ? ((place.image && !hideImage) ? 72 : 88) : ((place.image && !hideImage) ? 118 : 128);
  const summary = pageCardText(place.detailDescription || place.description || place.shortDescription, summaryLength);
  const note = pageCardText(place.whatToSee?.[0] || place.tips?.[0] || place.whyVisit?.[0], noteLength);

  return (
    <article className={`secondary-place-card ${compact ? "secondary-place-card-compact" : ""} avoid-break-inside`} style={hideImage ? { display: "block" } : undefined}>
      {!hideImage && place.image && (
        <figure className="secondary-place-image">
          <img
            src={getPrintImageSrc(place.image)}
            alt={place.imageAlt}
            loading="eager"
            decoding="sync"
            style={getPlaceImageStyle(place)}
          />
        </figure>
      )}
      <div className="secondary-place-body" style={hideImage ? { marginTop: "0.5rem" } : undefined}>
        <div className="secondary-place-head">
          <p>Stop {stopNumber} / {place.category}</p>
          <h4>{place.name}</h4>
        </div>
        <span>{summary}</span>
        {note && (
          <div className="secondary-place-note">
            <b>Focus</b>
            <em>{note}</em>
          </div>
        )}
      </div>
    </article>
  );
}

type PageBPlaceCard = {
  place: DailyGuidePlace;
  variant: "key" | "secondary";
};

function FoodBreaks({ places, getStopNumber }: { places: DailyGuidePlace[]; getStopNumber: (id: string) => string }) {
  if (!places.length) return null;

  return (
    <section className="daily-edit-section food-breaks avoid-break-inside">
      <div className="daily-edit-title">
        <span>Food & Breaks</span>
      </div>
      <div className="food-break-grid">
        {places.map((place) => (
          <MorePlaceCard key={place.id} place={place} stopNumber={getStopNumber(place.id)} compact />
        ))}
      </div>
    </section>
  );
}

function PracticalNotes({ notes }: { notes: string[] }) {
  if (!notes.length) return null;

  return (
    <section className="daily-edit-section practical-notes avoid-break-inside">
      <div className="daily-edit-title">
        <span>Practical Notes</span>
      </div>
      <ul>
        {notes.map((note) => (
          <li key={note}>{pageCardText(note, 128)}</li>
        ))}
      </ul>
    </section>
  );
}

function DailyFieldNotes({
  guide,
  timeline,
  compact = false
}: {
  guide: DailyGuide;
  timeline?: MasterTimelineItem;
  compact?: boolean;
}) {
  const notes = Array.from(new Set([
    ...(guide.editorial ?? []),
    guide.deck,
    timeline?.note
  ].filter(Boolean)));

  if (!notes.length) return null;

  const displayNotes = notes.filter((note): note is string => typeof note === "string" && ![
    "MCP route artifact",
    "MCP train route check",
    "MCP route call",
    "result JSON",
    "generated/"
  ].some((token) => note.includes(token)));

  if (!displayNotes.length) return null;

  return (
    <section className="daily-edit-section daily-field-notes avoid-break-inside">
      <div className="daily-edit-title">
        <span>Field Notes</span>
      </div>
      <div className="field-note-list">
        {displayNotes.slice(0, compact ? 1 : 3).map((note, index) => (
          <p key={`${guide.id}-field-note-${index}`}>{pageCardText(note, compact ? 110 : 155)}</p>
        ))}
      </div>
    </section>
  );
}

function DailyGuidePage({ guide, sectionTitle }: { guide: DailyGuide; sectionTitle: string }) {
  const timeline = getDayTimelineItem(guide.day);
  const places = getPrimaryPlaces(guide);
  const tourismPlaces = places.filter((place) => !isLogisticsPlace(place));
  const foodPlaces = tourismPlaces.filter(isFoodBreakPlace);
  const guidePlaces = tourismPlaces.filter((place) => !isFoodBreakPlace(place));
  const heroPlace = guidePlaces.find((place) => place.image) ?? guidePlaces[0];
  const guidePlacesWithoutHero = guidePlaces.filter((p) => p.id !== heroPlace?.id);
  const { essential: essentialPlaces, more: morePlaces } = splitGuidePlacesByPriority(guidePlacesWithoutHero);
  const densePlacesPage = guidePlacesWithoutHero.length >= PAGE_B_FIRST_PAGE_KEY_LIMIT + 2;
  const firstPageKeyLimit = densePlacesPage ? PAGE_B_FIRST_PAGE_KEY_LIMIT : MAX_KEY_STOPS_PER_DAY;
  const keyPlaces = essentialPlaces.slice(0, firstPageKeyLimit);
  const denseSecondaryLimit = densePlacesPage ? Math.max(0, PAGE_B_FIRST_PAGE_KEY_LIMIT - keyPlaces.length) : 0;
  const secondaryPlaces = densePlacesPage
    ? morePlaces.slice(0, denseSecondaryLimit)
    : [...essentialPlaces.slice(firstPageKeyLimit), ...morePlaces].slice(0, 3);
  const remainingPageBCards: PageBPlaceCard[] = [
    ...essentialPlaces.slice(firstPageKeyLimit).map((place) => ({ place, variant: "key" as const })),
    ...morePlaces.slice(densePlacesPage ? denseSecondaryLimit : Math.max(0, 3 - essentialPlaces.slice(firstPageKeyLimit).length)).map((place) => ({ place, variant: "secondary" as const }))
  ];
  const continuedPlacePages = chunkArray(remainingPageBCards, PAGE_B_CARD_PAGE_SIZE);
  const dailyFoodPlaces = foodPlaces.slice(0, 2);
  const trainVisits = guide.cityVisits?.filter((visit) => visit.trainInfo) ?? [];
  const hasPlacesPage = guidePlaces.length > 0 || dailyFoodPlaces.length > 0;
  const daySummary = [
    { label: "Mode", value: modeLabel(guide.transportMode ?? timeline?.transportMode) },
    { label: "Pace", value: getDayPace(guide, tourismPlaces.length) },
    { label: "Base", value: guide.accommodation?.name ?? guide.region },
    { label: "Key Tip", value: getDayTip(guide, timeline) }
  ];
  const practicalNotes = getPracticalNotes(guide, timeline);
  const compactFirstPageGrid = keyPlaces.length > 0 && secondaryPlaces.length === 0;

  const getStopNumber = (placeId: string) => {
    const idx = tourismPlaces.findIndex(p => p.id === placeId);
    return idx >= 0 ? String(idx + 1).padStart(2, "0") : "01";
  };

  return (
    <>
      <DailyRoutePage
        guide={guide}
        sectionTitle={sectionTitle}
        places={tourismPlaces}
        daySummary={daySummary}
      />

      {hasPlacesPage && (
      <>
      <section className="guide-page day-page daily-places-page page-break-before">
        <SectionTitle
          eyebrow={`${sectionTitle} / Day ${String(guide.day).padStart(2, "0")}`}
          title="Places & Practical"
          note={`${formatDate(guide.date)} / ${guide.region}`}
        />

        {heroPlace && (
          <article className="daily-featured-stop avoid-break-inside">
            {heroPlace.image && (
              <figure className="daily-featured-stop-image">
                <img
                  src={getPrintImageSrc(heroPlace.image)}
                  alt={heroPlace.imageAlt}
                  loading="eager"
                  decoding="sync"
                  style={getPlaceImageStyle(heroPlace)}
                />
              </figure>
            )}
            <div className="daily-featured-stop-grid">
              <div>
                <span>
                  Stop {getStopNumber(heroPlace.id)} · Featured
                </span>
                <h3>{heroPlace.name}</h3>
                <p>{heroPlace.category}</p>
              </div>
              <div className="daily-featured-stop-copy">
                <p>{pageCardText(heroPlace.detailDescription || heroPlace.description, 300)}</p>
                {(heroPlace.whatToSee?.[0] || heroPlace.whyVisit?.[0]) && (
                  <div>
                    <strong>관람 포인트</strong>
                    <span>{pageCardText(heroPlace.whatToSee?.[0] || heroPlace.whyVisit?.[0], 95)}</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        )}

        <div className={`daily-book-grid ${compactFirstPageGrid ? "daily-book-grid-dense" : ""}`}>
          {keyPlaces.length > 0 && (
            <section className="daily-edit-section key-stops-section">
              <div className="daily-edit-title">
                <span>Key Stops</span>
              </div>
              <div className="key-stops-grid">
                {keyPlaces.map((place) => (
                  <KeyStopCard
                    key={place.id}
                    place={place}
                    hideImage={place.id === heroPlace?.id}
                    stopNumber={getStopNumber(place.id)}
                    compact
                  />
                ))}
              </div>
            </section>
          )}

          <div className="daily-main-notes">
            {keyPlaces.length === 0 && (
              <DailyFieldNotes guide={guide} timeline={timeline} />
            )}
            {secondaryPlaces.length > 0 && (
              <section className="daily-edit-section">
                <div className="daily-edit-title">
                  <span>Secondary Stops</span>
                </div>
                <div className="more-place-grid">
                  {secondaryPlaces.map((place) => (
                    <SecondaryPlaceCard key={place.id} place={place} stopNumber={getStopNumber(place.id)} hideImage={place.id === heroPlace?.id} compact />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="daily-side-notes">

            <FoodBreaks places={dailyFoodPlaces} getStopNumber={getStopNumber} />
            <PracticalNotes notes={practicalNotes.slice(0, trainVisits.length ? 2 : 3)} />
            {trainVisits.map((visit) => (
              <CompactNightTrainCard key={`${guide.id}-${visit.city}-train`} visit={visit} />
            ))}
            {keyPlaces.length > 0 && trainVisits.length === 0 && (
              <DailyFieldNotes guide={guide} timeline={timeline} compact />
            )}
          </aside>
        </div>
      </section>

      {continuedPlacePages.map((pageCards, pageIndex) => (
        <section
          key={`${guide.id}-places-continued-${pageIndex}`}
          className="guide-page day-page daily-places-page daily-places-page-continued page-break-before"
        >
          <SectionTitle
            eyebrow={`${sectionTitle} / Day ${String(guide.day).padStart(2, "0")} / Page B${pageIndex + 2}`}
            title="More Places"
            note={`${formatDate(guide.date)} / ${guide.region}`}
          />
          <div className={`continued-place-grid continued-place-grid-count-${pageCards.length}`}>
            {pageCards.map(({ place, variant }) => (
              variant === "key" ? (
                <KeyStopCard
                  key={place.id}
                  place={place}
                  stopNumber={getStopNumber(place.id)}
                />
              ) : (
                <SecondaryPlaceCard
                  key={place.id}
                  place={place}
                  stopNumber={getStopNumber(place.id)}
                />
              )
            ))}
          </div>
        </section>
      ))}
      </>
      )}
    </>
  );
}
export const PrintLayout = ({
  payload,
  printDesign,
  preferMapSnapshots = true
}: {
  payload: TravelPayload;
  printDesign?: PrintGuideDesign;
  preferMapSnapshots?: boolean;
}) => {
  const guideData = sicilyGuideData;
  const design = printDesign ?? staticPrintGuideDesign;
  const stays = getUniqueStays(guideData.masterTimeline);

  useEffect(() => {
    document.body.classList.add("print-body");
    return () => document.body.classList.remove("print-body");
  }, []);

  return (
    <PrintMapSnapshotContext.Provider value={preferMapSnapshots}>
    <main
      className={`print-guide print-density-${design.layoutDensity}`}
      style={{
        "--print-theme": design.themeColor,
        "--print-accent": design.accentColor,
        "--print-ink": design.inkColor,
        "--print-muted": design.mutedColor
      } as React.CSSProperties}
    >
      <CoverPage payload={payload} design={design} />
      <GuideIntroPage payload={payload} design={design} />
      <TransportGuidePage
        tickets={guideData.flightTickets}
      />
      <MovementReferencePage items={guideData.masterTimeline} dailyGuides={guideData.dailyGuides} />
      <StayDirectory stays={stays} title={design.sectionLabels.stays} />
      {guideData.dailyGuides.map((guide) => {
        if (guide.day === 18) {
          const nextGuide = guideData.dailyGuides.find((item) => item.day === 19);
          return (
            <ReturnJourneyCombinedPage
              key="return-journey-combined"
              guides={nextGuide ? [guide, nextGuide] : [guide]}
              sectionTitle={design.sectionLabels.daily}
            />
          );
        }

        if (guide.day === 19) return null;

        return <DailyGuidePage key={guide.id} guide={guide} sectionTitle={design.sectionLabels.daily} />;
      })}
      {cityGuideDefinitions.map((definition) => (
        <CityGuidePage key={definition.title} definition={definition} />
      ))}
      <OfflineChecklistPage
        stays={stays}
        tickets={guideData.flightTickets}
        items={guideData.masterTimeline}
      />
    </main>
    </PrintMapSnapshotContext.Provider>
  );
};

export default PrintLayout;
