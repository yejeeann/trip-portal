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
    <section className="guide-page">
      <SectionTitle eyebrow="Before the Route" title={title} note="항공과 환승 흐름을 한눈에" />
      <div className="guide-card-stack">
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
  return (
    <section className="guide-page page-break-before">
      <SectionTitle eyebrow="Trip Framework" title={title} note="날짜별 이동과 숙소 기준표" />
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
          {items.map((item) => (
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
        {guide.routeOverview.map((point, index) => (
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
  const seeItems = place.whatToSee?.slice(0, 2) ?? [];
  const tipItems = place.tips?.slice(0, 1) ?? [];
  const summary = truncateText(place.detailDescription || place.shortDescription || place.description, 460);

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
        <span>{truncateText(place.shortDescription || place.description, 180)}</span>
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

function DailyGuidePage({ guide, sectionTitle }: { guide: DailyGuide; sectionTitle: string }) {
  const timeline = getDayTimelineItem(guide.day);
  const places = getPrimaryPlaces(guide);
  const tourismPlaces = places.filter((place) => !isLogisticsPlace(place));
  const foodPlaces = tourismPlaces.filter(isFoodBreakPlace);
  const guidePlaces = tourismPlaces.filter((place) => !isFoodBreakPlace(place));
  const { essential: essentialPlaces, more: morePlaces } = splitGuidePlacesByPriority(guidePlaces);
  const dailyMarkers = getDailyMarkers(guide);
  const heroPlace = tourismPlaces.find((place) => place.image) ?? places.find((place) => place.image);
  const daySummary = [
    { label: "Route", value: timeline?.primaryRoute ?? guide.region },
    { label: "Pace", value: getDayPace(guide, tourismPlaces.length) },
    { label: "Focus", value: getDayFocus(guide, tourismPlaces) },
    { label: "Key Tip", value: getDayTip(guide, timeline) }
  ];
  const practicalNotes = getPracticalNotes(guide, timeline);

  return (
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
                <span>Daily Map</span>
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

      {essentialPlaces.length > 0 && (
        <section className="daily-edit-section">
          <div className="daily-edit-title">
            <span>Essential Stops</span>
            <strong>핵심 관광지</strong>
          </div>
          <div className="place-grid essential-grid">
            {essentialPlaces.map((place, index) => <PlaceBrief key={place.id} place={place} index={index} />)}
          </div>
        </section>
      )}

      {morePlaces.length > 0 && (
        <section className="daily-edit-section">
          <div className="daily-edit-title">
            <span>More Places</span>
            <strong>함께 보는 장소</strong>
          </div>
          <div className="more-place-grid">
            {morePlaces.map((place, index) => <MorePlaceCard key={place.id} place={place} index={essentialPlaces.length + index} />)}
          </div>
        </section>
      )}

      <FoodBreaks places={foodPlaces} />
      <PracticalNotes notes={practicalNotes} />
    </section>
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
      <FlightSummary tickets={guideData.flightTickets} title={design.sectionLabels.flights} />
      <RouteAtlas />
      <RouteSchedule items={guideData.masterTimeline} title={design.sectionLabels.schedule} />
      <StayDirectory stays={stays} title={design.sectionLabels.stays} />
      {guideData.dailyGuides.map((guide) => (
        <DailyGuidePage key={guide.id} guide={guide} sectionTitle={design.sectionLabels.daily} />
      ))}
    </main>
  );
};

export default PrintLayout;
