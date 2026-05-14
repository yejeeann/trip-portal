"use client";

import { useEffect } from "react";
import { sicilyGuideData } from "@/lib/sicily-guide-data";
import { staticPrintGuideDesign, type PrintGuideDesign } from "@/lib/print-guide-design";
import type { DailyCityVisit, DailyGuide, DailyGuidePlace, FlightTicket, MasterTimelineItem, TimelineAccommodation } from "@/lib/swiss-guide-data";
import type { TravelPayload } from "@/lib/types";
import type { OsmMarker } from "./multi-osm-map";

type StayRow = TimelineAccommodation & {
  key: string;
  days: number[];
};

type PrintMapMarker = OsmMarker & {
  name: string;
};

type CityGuideDefinition = {
  eyebrow: string;
  title: string;
  subtitle: string;
  keywords: string[];
};

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

function isLogisticsPlace(place: DailyGuidePlace) {
  const text = `${place.name} ${place.category}`.toLowerCase();
  if (text.includes("old harbour") || text.includes("old harbor")) return false;

  return [
    "airport",
    "fiumicino",
    "termini",
    "centrale",
    "station",
    "train",
    "terminal",
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
    "환승",
    "이동",
    "도착",
    "출발",
    "도시 기준점"
  ].some((token) => text.includes(token));
}

function isFoodBreakPlace(place: DailyGuidePlace) {
  const text = `${place.name} ${place.category}`.toLowerCase();
  return [
    "restaurant",
    "cafe",
    "caffe",
    "dolceria",
    "bakery",
    "market",
    "lunch",
    "dinner",
    "dessert",
    "gelato",
    "sorbet",
    "food",
    "식사",
    "점심",
    "저녁",
    "카페",
    "디저트",
    "시장",
    "베이커리",
    "초콜릿"
  ].some((token) => text.includes(token));
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
  "colosseum",
  "roman forum",
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
  const namedLandmarkBonus = essentialStopKeywords.some((keyword) => nameText.includes(keyword)) ? 2 : 0;

  return keywordScore + categoryScore + namedLandmarkBonus;
}

function splitGuidePlacesByPriority(places: DailyGuidePlace[]) {
  const scoredPlaces = places.map((place, index) => ({
    place,
    index,
    score: getEssentialScore(place)
  }));
  const essential = scoredPlaces
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.place);
  const essentialIds = new Set(essential.map((place) => place.id));
  const more = places.filter((place) => !essentialIds.has(place.id));

  if (essential.length) {
    return { essential, more };
  }

  const best = scoredPlaces
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .map((item) => item.place);
  const bestIds = new Set(best.map((place) => place.id));

  return {
    essential: best,
    more: places.filter((place) => !bestIds.has(place.id))
  };
}

function truncateText(value: string | undefined, maxLength: number) {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
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

const PRINT_TILE_SIZE = 256;
const MAX_MERCATOR_LAT = 85.05112878;

type ProjectedPrintMarker = PrintMapMarker & {
  x: number;
  y: number;
  index: number;
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

function getPrintMapZoom(markers: PrintMapMarker[], scope: "atlas" | "daily") {
  if (scope === "atlas") return 5;

  const lats = markers.map((item) => item.lat);
  const lngs = markers.map((item) => item.lng);
  const latRange = Math.max(...lats) - Math.min(...lats);
  const lngRange = Math.max(...lngs) - Math.min(...lngs);
  const range = Math.max(latRange, lngRange);

  if (range > 1.4) return 8;
  if (range > 0.55) return 9;
  if (range > 0.2) return 11;
  if (range > 0.08) return 12;
  return 13;
}

function getTileUrl(x: number, y: number, zoom: number) {
  const subdomains = ["a", "b", "c"];
  const subdomain = subdomains[Math.abs(x + y) % subdomains.length];
  return `https://${subdomain}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`;
}

function getTileMapLayout(markers: PrintMapMarker[], scope: "atlas" | "daily") {
  const zoom = getPrintMapZoom(markers, scope);
  const worldSize = PRINT_TILE_SIZE * 2 ** zoom;
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
  const rawWidth = Math.max(rawMaxX - rawMinX, scope === "atlas" ? PRINT_TILE_SIZE * 0.82 : PRINT_TILE_SIZE * 0.45);
  const rawHeight = Math.max(rawMaxY - rawMinY, scope === "atlas" ? PRINT_TILE_SIZE * 0.64 : PRINT_TILE_SIZE * 0.38);
  const paddingX = Math.max(rawWidth * (scope === "atlas" ? 0.12 : 0.28), PRINT_TILE_SIZE * 0.16);
  const paddingY = Math.max(rawHeight * (scope === "atlas" ? 0.16 : 0.24), PRINT_TILE_SIZE * 0.14);
  const minX = clamp(rawMinX - paddingX, 0, worldSize - PRINT_TILE_SIZE);
  const maxX = clamp(rawMaxX + paddingX, PRINT_TILE_SIZE, worldSize);
  const minY = clamp(rawMinY - paddingY, 0, worldSize - PRINT_TILE_SIZE);
  const maxY = clamp(rawMaxY + paddingY, PRINT_TILE_SIZE, worldSize);
  const width = Math.max(maxX - minX, PRINT_TILE_SIZE);
  const height = Math.max(maxY - minY, PRINT_TILE_SIZE);
  const minTileX = Math.floor(minX / PRINT_TILE_SIZE);
  const maxTileX = Math.floor(maxX / PRINT_TILE_SIZE);
  const minTileY = Math.floor(minY / PRINT_TILE_SIZE);
  const maxTileY = Math.floor(maxY / PRINT_TILE_SIZE);
  const maxTile = 2 ** zoom - 1;
  const tiles = [];

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
      x: clamp(item.x, 4, 96),
      y: clamp(item.y, 4, 96)
    }))
  };
}

function PrintTileMap({ markers, scope }: { markers: PrintMapMarker[]; scope: "atlas" | "daily" }) {
  if (!markers.length) return <div className="print-tile-map print-tile-map-empty">지도 데이터가 부족합니다.</div>;

  const layout = getTileMapLayout(markers, scope);
  const routePoints = layout.markers.filter((item) => item.includeInRoute !== false);
  const routePolyline = routePoints.map((item) => `${item.x},${item.y}`).join(" ");

  return (
    <div className={`print-tile-map print-tile-map-${scope}`}>
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
    eyebrow: "Eastern Sicily",
    title: "Taormina & The Etna Coast",
    subtitle: "Cliffside theatre views, volcanic towns, fishing villages, and the first true Mediterranean rhythm of the trip.",
    keywords: ["taormina", "etna", "savoca", "aci trezza", "isola bella", "greek theatre"]
  },
  {
    eyebrow: "Syracuse",
    title: "Ortigia & Ancient Syracuse",
    subtitle: "A compact island city where Greek, Roman, Christian, baroque, and seaside layers can be read in one walk.",
    keywords: ["syracuse", "siracusa", "ortigia", "neapolis", "duomo", "arethusa", "maniace", "dionysius"]
  },
  {
    eyebrow: "Malta",
    title: "Valletta, Gozo & The Three Cities",
    subtitle: "Fortified harbours, knights' churches, blue water crossings, and quieter island archaeology.",
    keywords: ["valletta", "barrakka", "st john", "birgu", "senglea", "bormla", "gozo", "cittadella", "ggantija", "blue lagoon"]
  },
  {
    eyebrow: "Southern Sicily",
    title: "Agrigento & The Southern Coast",
    subtitle: "Temple valleys, Roman mosaics, pale cliffs, and the slower inland-to-sea turn across the island.",
    keywords: ["agrigento", "temple", "temples", "kolymbethra", "scala", "realmonte", "villa romana"]
  },
  {
    eyebrow: "Western Sicily",
    title: "Palermo, Monreale & The West",
    subtitle: "Arab-Norman chapels, mountain towns, fishing coves, and the denser cultural weave of western Sicily.",
    keywords: ["palermo", "monreale", "palatine", "segesta", "scopello", "erice", "cefalu"]
  },
  {
    eyebrow: "Mainland Return",
    title: "Amalfi, Pompeii & Rome",
    subtitle: "The mainland finale shifts from coast road drama to Roman ruins, a compact ending with a much larger historical frame.",
    keywords: ["amalfi", "pompeii", "rome", "colosseum", "pantheon", "forum", "tropea", "scilla"]
  }
];

function getAllGuidePlaces() {
  const places = sicilyGuideData.dailyGuides.flatMap((guide) => getPrimaryPlaces(guide));
  const seen = new Set<string>();

  return places.filter((place) => {
    if (isLogisticsPlace(place)) return false;
    const key = normalizePrintPlaceKey(place.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCityGuidePlaces(definition: CityGuideDefinition) {
  const places = getAllGuidePlaces();

  return places
    .map((place, index) => {
      const text = `${place.name} ${place.category} ${place.shortDescription ?? ""} ${place.description}`.toLowerCase();
      const matchScore = definition.keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
      const essentialScore = getEssentialScore(place);

      return { place, index, score: matchScore * 4 + essentialScore };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.place);
}

function CoverPage({ payload, design }: { payload: TravelPayload; design: PrintGuideDesign }) {
  const coverImage = "/travel-photos/home-hero-taormina-bright-portrait.png";

  return (
    <section className="guide-cover">
      <img className="cover-photo" src={coverImage} alt={payload.trip.title || design.title} />
      <div className="cover-scrim" />
      <div className="cover-topline">
        <span>{design.coverLabel}</span>
        <span>2026 Field Edition</span>
      </div>
      <div className="cover-copy">
        <p className="guide-kicker">Sicily / Malta / Calabria / Amalfi / Rome</p>
        <h1>{payload.trip.title || design.title}</h1>
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
        <p className="guide-kicker">Offline Guidebook Source</p>
        <h2>{payload.trip.title || design.title}</h2>
        <p>{payload.trip.subtitle || design.subtitle}</p>
      </div>

      <div className="intro-grid">
        <article className="intro-note">
          <span>Editorial brief</span>
          <p>
            Built from the markdown guidebook source, confirmed transport, static attraction data, accommodations, route notes,
            and the same warm Mediterranean visual system used in the mobile home screen. The layout is tuned for A4 reading,
            quick daily scanning, and offline use.
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
  );
}

function ChapterOpener({
  eyebrow,
  title,
  copy,
  meta
}: {
  eyebrow: string;
  title: string;
  copy: string;
  meta: string[];
}) {
  return (
    <section className="guide-page chapter-opener page-break-before">
      <div>
        <p className="guide-kicker">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="chapter-meta">
        {meta.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function CityGuidePage({ definition }: { definition: CityGuideDefinition }) {
  const places = getCityGuidePlaces(definition);
  const heroPlace = places.find((place) => place.image);
  const mapMarkers = placesToMapMarkers(places);
  const firstPlaces = places.slice(0, 2);
  const remainingPlacePages = chunkArray(places.slice(2), 8);

  if (!places.length) return null;

  return (
    <>
      <section className="guide-page city-guide-page page-break-before">
        <header className="city-guide-hero">
          <div>
            <p className="guide-kicker">{definition.eyebrow}</p>
            <h2>{definition.title}</h2>
            <p>{definition.subtitle}</p>
          </div>
          {heroPlace?.image && (
            <figure>
              <img src={heroPlace.image} alt={heroPlace.imageAlt} />
              <figcaption>{heroPlace.name}</figcaption>
            </figure>
          )}
        </header>

        <div className="city-guide-body">
          <article className="city-guide-feature">
            <span>Guidebook Note</span>
            <p>{truncateText(heroPlace?.detailDescription || heroPlace?.description || definition.subtitle, 300)}</p>
          </article>
          <div className="city-guide-map">
            <PrintTileMap markers={mapMarkers} scope="daily" />
            <div className="day-map-caption">
              <span>City Map</span>
              <strong>{mapMarkers.length} sights</strong>
            </div>
          </div>
        </div>

        <div className="city-guide-place-list city-guide-place-list-featured">
          {firstPlaces.map((place, index) => (
            <article key={place.id} className="city-guide-place">
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <div>
                <p>{place.category}</p>
                <h3>{place.name}</h3>
                <span>{truncateText(place.shortDescription || place.description, 150)}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="city-guide-tip-grid">
          {places.slice(0, 2).map((place) => (
            <article key={`${place.id}-tip`}>
              <span>{place.name}</span>
              <p>{truncateText(place.tips?.[0] || place.whatToSee?.[0] || place.whyVisit?.[0] || place.description, 120)}</p>
            </article>
          ))}
        </div>
      </section>

      {remainingPlacePages.map((pagePlaces, pageIndex) => (
        <section key={`${definition.title}-directory-${pageIndex}`} className="guide-page city-guide-more-page page-break-before">
          <SectionTitle
            eyebrow={definition.eyebrow}
            title={`${definition.title} Places`}
            note={`${places.length}개 관광지 전체 보기 ${pageIndex + 1}/${remainingPlacePages.length}`}
          />
          <div className="city-guide-place-directory">
            {pagePlaces.map((place, index) => {
              const absoluteIndex = firstPlaces.length + pageIndex * 8 + index;

              return (
                <article key={place.id} className="city-guide-place">
                  <strong>{String(absoluteIndex + 1).padStart(2, "0")}</strong>
                  <div>
                    <p>{place.category}</p>
                    <h3>{place.name}</h3>
                    <span>{truncateText(place.shortDescription || place.description, 170)}</span>
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

function getRouteArcLabel(day: number) {
  if (day <= 6) return "Eastern Sicily";
  if (day <= 9) return "Malta";
  if (day <= 15) return "Western Sicily";
  if (day <= 18) return "Mainland Coast";
  return "Rome";
}

function GuideIndexPage({ items }: { items: MasterTimelineItem[] }) {
  const grouped = items.reduce<Record<string, MasterTimelineItem[]>>((acc, item) => {
    const label = getRouteArcLabel(item.day);
    acc[label] = acc[label] ?? [];
    acc[label].push(item);
    return acc;
  }, {});

  return (
    <section className="guide-page guide-index page-break-before">
      <SectionTitle eyebrow="Guide Index" title="Day Finder" note="오프라인에서 빠르게 찾는 날짜별 목차" />
      <div className="guide-index-grid">
        {Object.entries(grouped).map(([label, days]) => (
          <article key={label} className="guide-index-block avoid-break-inside">
            <p>{label}</p>
            <div>
              {days.map((item) => (
                <div key={item.id} className="guide-index-row">
                  <strong>{String(item.day).padStart(2, "0")}</strong>
                  <span>
                    <b>{item.dateLabel}</b>
                    {item.primaryRoute}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
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

function FlightSummary({ tickets, title }: { tickets: FlightTicket[]; title: string }) {
  if (!tickets.length) return null;

  return (
    <>
      {tickets.map((ticket, index) => (
        <section key={ticket.id} className={index === 0 ? "guide-page" : "guide-page page-break-before"}>
          <SectionTitle eyebrow="Before the Route" title={title} note="항공과 환승 흐름을 한눈에" />
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
        </section>
      ))}
    </>
  );
}

function RouteAtlas() {
  const markers = getAtlasMarkers();

  if (!markers.length) return null;

  return (
    <section className="guide-page page-break-before">
      <SectionTitle eyebrow="Route Overview" title="Route Atlas" note="주요 도시와 거점만 표시한 전체 동선" />
      <div className="route-atlas-map avoid-break-inside">
        <PrintTileMap markers={markers} scope="atlas" />
      </div>
      <div className="map-key-grid">
        {markers.map((marker) => (
          <div key={`marker-${marker.label}-${marker.name}`}>
            <strong className={marker.variant === "stay" ? "map-key-stay" : undefined}>
              {marker.variant === "stay" ? "⌂" : marker.label}
            </strong>
            <span>{marker.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RouteSchedule({ items, title }: { items: MasterTimelineItem[]; title: string }) {
  const schedulePages = Array.from(
    { length: Math.ceil(items.length / 10) },
    (_, index) => items.slice(index * 10, index * 10 + 10)
  );

  return (
    <>
      {schedulePages.map((pageItems, pageIndex) => (
        <section key={`schedule-${pageIndex}`} className="guide-page page-break-before">
          <SectionTitle
            eyebrow="Trip Framework"
            title={pageIndex === 0 ? title : `${title} Continued`}
            note="날짜별 이동과 숙소 기준표"
          />
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
              {pageItems.map((item) => (
                <tr key={item.id}>
                  <td>{String(item.day).padStart(2, "0")}</td>
                  <td>{item.dateLabel}</td>
                  <td>{item.primaryRoute}</td>
                  <td>{modeLabel(item.transportMode)}</td>
                  <td>{item.accommodation?.name ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}

function StayDirectory({ stays, title }: { stays: StayRow[]; title: string }) {
  if (!stays.length) return null;

  return (
    <section className="guide-page page-break-before">
      <SectionTitle eyebrow="Bases & Check-ins" title={title} note="체크인과 주소 빠른 참조" />
      <div className="stay-grid">
        {stays.map((stay) => (
          <article key={stay.key} className="guide-box avoid-break-inside">
            <p className="stay-days">Days {stay.days.join(", ")}</p>
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
      {trainInfo.image && <img src={trainInfo.image} alt={trainInfo.imageAlt} />}
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
        {trainInfo.highlights.slice(0, 3).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
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

function PlaceBrief({ place, index }: { place: DailyGuidePlace; index: number }) {
  const seeItems = place.whatToSee?.slice(0, 1) ?? [];
  const tipItems = place.tips?.slice(0, 1) ?? [];
  const summary = truncateText(place.detailDescription || place.shortDescription || place.description, 180);

  return (
    <article className="place-brief essential-place avoid-break-inside">
      {place.image && (
        <div className="place-thumb">
          <img src={place.image} alt={place.imageAlt} />
        </div>
      )}
      <div className="place-brief-body">
        <div className="place-brief-top">
          <div>
            <p>Stop {String(index + 1).padStart(2, "0")}</p>
            <h4>{place.name}</h4>
          </div>
          <span>{place.category}</span>
        </div>
        <p className="place-summary">{summary}</p>
      </div>
      {(seeItems.length > 0 || tipItems.length > 0) && (
        <div className="place-columns">
          {seeItems.length > 0 && (
            <div>
              <b>See</b>
              <ul>
                {seeItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
          {tipItems.length > 0 && (
            <div>
              <b>Tip</b>
              <ul>
                {tipItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function MorePlaceCard({ place, index }: { place: DailyGuidePlace; index: number }) {
  return (
    <article className="more-place avoid-break-inside">
      {place.image && <img src={place.image} alt={place.imageAlt} />}
      <div>
        <p>Stop {String(index + 1).padStart(2, "0")} / {place.category}</p>
        <h4>{place.name}</h4>
        <span>{truncateText(place.shortDescription || place.description, 120)}</span>
      </div>
    </article>
  );
}

function FoodBreaks({ places }: { places: DailyGuidePlace[] }) {
  if (!places.length) return null;

  return (
    <section className="daily-edit-section food-breaks avoid-break-inside">
      <div className="daily-edit-title">
        <span>Food & Breaks</span>
        <strong>먹고 쉬는 포인트</strong>
      </div>
      <div className="food-break-grid">
        {places.map((place, index) => (
          <MorePlaceCard key={place.id} place={place} index={index} />
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
        <strong>주차 / 이동 / 예약 메모</strong>
      </div>
      <ul>
        {notes.map((note) => (
          <li key={note}>{note}</li>
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

  return (
    <section className="daily-edit-section daily-field-notes avoid-break-inside">
      <div className="daily-edit-title">
        <span>Field Notes</span>
        <strong>읽는 여행 메모</strong>
      </div>
      <div className="field-note-list">
        {notes.slice(0, compact ? 1 : 3).map((note, index) => (
          <p key={`${guide.id}-field-note-${index}`}>{truncateText(note, compact ? 150 : 240)}</p>
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
  const { essential: essentialPlaces, more: morePlaces } = splitGuidePlacesByPriority(guidePlaces);
  const featuredPlaces = essentialPlaces.slice(0, 1);
  const secondaryPlaces = [...essentialPlaces.slice(1), ...morePlaces].slice(0, 1);
  const dailyFoodPlaces = secondaryPlaces.length === 0 ? foodPlaces.slice(0, 1) : [];
  const dailyMarkers = getDailySightMarkers(guide);
  const heroPlace = tourismPlaces.find((place) => place.image) ?? places.find((place) => place.image);
  const daySummary = [
    { label: "Route", value: timeline?.primaryRoute ?? guide.region },
    { label: "Pace", value: getDayPace(guide, tourismPlaces.length) },
    { label: "Focus", value: getDayFocus(guide, tourismPlaces) },
    { label: "Key Tip", value: getDayTip(guide, timeline) }
  ];
  const practicalNotes = getPracticalNotes(guide, timeline);

  return (
    <>
      <section className="guide-page day-page page-break-before">
        <header className="day-header">
          <div className="day-badge">Day {String(guide.day).padStart(2, "0")}</div>
          <div>
            <p>{sectionTitle} / {formatDate(guide.date)} / {guide.region}</p>
            <h2>{guide.title}</h2>
          </div>
        </header>

        {(heroPlace?.image || dailyMarkers.length > 0) && (
          <div className="day-visual-grid avoid-break-inside">
            {heroPlace?.image && (
              <figure className="day-hero-image">
                <img src={heroPlace.image} alt={heroPlace.imageAlt} />
                <figcaption>Featured stop / {heroPlace.name}</figcaption>
              </figure>
            )}
            {dailyMarkers.length > 0 && (
              <div className="day-mini-map">
                <PrintTileMap markers={dailyMarkers} scope="daily" />
                <div className="day-map-caption">
                  <span>Sight Map</span>
                  <strong>{dailyMarkers.length} mapped stops</strong>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="day-brief day-summary-grid">
          {daySummary.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value || "-"}</strong>
            </div>
          ))}
        </div>
        <p className="day-mood">{truncateText(guide.deck, 220)}</p>
        <RouteOverview guide={guide} />

        <div className="daily-book-grid">
          <div>
            {featuredPlaces.length > 0 && (
              <section className="daily-edit-section">
                <div className="daily-edit-title">
                  <span>Editor's Picks</span>
                  <strong>오늘 꼭 볼 장소</strong>
                </div>
                <div className="place-grid essential-grid">
                  {featuredPlaces.map((place, index) => <PlaceBrief key={place.id} place={place} index={index} />)}
                </div>
              </section>
            )}
            {featuredPlaces.length === 0 && (
              <DailyFieldNotes guide={guide} timeline={timeline} />
            )}
            {featuredPlaces.length > 0 && secondaryPlaces.length === 0 && dailyFoodPlaces.length === 0 && (
              <DailyFieldNotes guide={guide} timeline={timeline} compact />
            )}
          </div>
          <aside className="daily-side-notes">
            {secondaryPlaces.length > 0 && (
              <section className="daily-edit-section">
                <div className="daily-edit-title">
                  <span>Nearby Notes</span>
                  <strong>함께 보는 장소</strong>
                </div>
                <div className="more-place-grid">
                  {secondaryPlaces.map((place, index) => (
                    <MorePlaceCard key={place.id} place={place} index={featuredPlaces.length + index} />
                  ))}
                </div>
              </section>
            )}

            <FoodBreaks places={dailyFoodPlaces} />
            <PracticalNotes notes={practicalNotes.slice(0, 1)} />
          </aside>
        </div>
      </section>
      <DailyMapPage guide={guide} sectionTitle={sectionTitle} />
    </>
  );
}
export const PrintLayout = ({ payload, printDesign }: { payload: TravelPayload; printDesign?: PrintGuideDesign }) => {
  const guideData = sicilyGuideData;
  const design = printDesign ?? staticPrintGuideDesign;
  const stays = getUniqueStays(guideData.masterTimeline);

  useEffect(() => {
    document.body.classList.add("print-body");
    return () => document.body.classList.remove("print-body");
  }, []);

  return (
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
      <GuideIndexPage items={guideData.masterTimeline} />
      <ChapterOpener
        eyebrow="Part One"
        title="Essentials Before Departure"
        copy="Flights, route structure, accommodation anchors, and the wide map view are grouped first so the PDF works as an offline travel book rather than a loose itinerary dump."
        meta={["Flights", "Route Atlas", "Stay Directory", "Journey Planner"]}
      />
      <FlightSummary tickets={guideData.flightTickets} title={design.sectionLabels.flights} />
      <RouteAtlas />
      <RouteSchedule items={guideData.masterTimeline} title={design.sectionLabels.schedule} />
      <StayDirectory stays={stays} title={design.sectionLabels.stays} />
      <ChapterOpener
        eyebrow="Part Two"
        title="City & Place Guide"
        copy="The richest background notes are separated from the daily execution pages, so the guide can be read like a travel book before or during the trip."
        meta={["City Essays", "Essential Sights", "History Notes", "Reading Pages"]}
      />
      {cityGuideDefinitions.map((definition) => (
        <CityGuidePage key={definition.title} definition={definition} />
      ))}
      <ChapterOpener
        eyebrow="Part Three"
        title="Daily Field Guide"
        copy="Each day is edited like a guidebook spread: a visual anchor, a readable route flow, key stops, nearby notes, food breaks, and practical reminders."
        meta={["Daily Maps", "Editor's Picks", "Practical Notes", "Offline Reading"]}
      />
      {guideData.dailyGuides.map((guide) => (
        <DailyGuidePage key={guide.id} guide={guide} sectionTitle={design.sectionLabels.daily} />
      ))}
    </main>
  );
};

export default PrintLayout;
