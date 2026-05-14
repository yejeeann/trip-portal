"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  Hotel,
  MapPin,
  MapPinned,
  Navigation,
  PlaneLanding,
  PlaneTakeoff,
  Sparkles,
  X
} from "lucide-react";
import { getGuideDataForTrip, buildDailyGuidesForTrip } from "@/lib/trip-guide";
import type { Trip, AppDesignConfig, AppStructureConfig, Coordinates } from "@/lib/types";
import { OsmMap } from "./osm-map";
import { MultiOsmMap } from "./multi-osm-map";
import { optimizeRouteAction, generateMapLinkAction } from "@/lib/mcp-actions";
import type { DailyCityVisit, DailyGuide, DailyGuidePlace, FlightTicket } from "@/lib/swiss-guide-data";
import { PlaceBottomSheet, StaticPlaceGuide } from "./place-detail";
import { AppNavigation } from "./app-navigation";
import { GuideImage } from "./guide-image";
import { AirlineLogo } from "./airline-logo";
import { useTravelPayload } from "@/lib/travel-payload-client";
import { useDailyMapMarkers } from "@/lib/daily-map-markers-client";
import { calculateDistanceKm, estimateRouteTime, formatDistance, fetchOsrmRouteMetrics, formatDuration } from "@/lib/route-math";

const dailyTabLabels: Record<number, string> = {
  1: "Seoul Departure",
  2: "Rome",
  3: "Catania / Etna",
  4: "Taormina / Savoca",
  5: "Syracuse / Ortigia",
  6: "Noto / Ragusa",
  7: "Valletta / Three Cities",
  8: "Comino / Gozo",
  9: "Blue Grotto / Mdina",
  10: "Villa Romana / Agrigento",
  11: "Agrigento",
  12: "Trapani / Erice",
  13: "Segesta / Scopello",
  14: "Palermo / Monreale",
  15: "Cefalu / Scilla",
  16: "Tropea / Pizzo",
  17: "Amalfi / Pompeii",
  18: "Rome Departure",
  19: "Seoul Arrival"
};

function getDailyTabLabel(guide: DailyGuide) {
  return dailyTabLabels[guide.day] ?? guide.region?.split(" / ")[0] ?? `Day ${guide.day}`;
}

export function DailyDetail({ tripId, dayId }: { tripId: string; dayId: string }) {
  const { payload, isLoading } = useTravelPayload();

  const trips = useMemo(() => {
    if (!payload) return [];
    return payload.trips?.length ? payload.trips : [payload.trip];
  }, [payload]);

  const trip = trips.find((item) => item.id === tripId) ?? null;
  const guideData = useMemo(() => (trip ? getGuideDataForTrip(trip) : null), [trip]);
  const dailyGuides = useMemo(() => {
    if (!trip || !guideData) return [];
    const explicitGuides = buildDailyGuidesForTrip(trip, guideData);
    const guideMap = new Map(explicitGuides.map(g => [g.day, g]));
    
    // masterTimeline을 기준으로 빈 날짜(Day 8 등)에 도달하면 즉석에서 가짜(Placeholder) 일정을 생성합니다.
    return guideData.masterTimeline.map(item => {
      const explicit = guideMap.get(item.day);
      if (explicit) return explicit; // 이미 데이터가 있으면 그대로 사용
      
      const dayItin = trip.itinerary.find(d => d.day === item.day);
      return {
        id: `${item.id}-missing`,
        day: item.day,
        date: item.date,
        title: item.primaryRoute,
        region: item.cities.join(" / ") || item.primaryRoute,
        deck: "상세 장소 메모가 아직 정리되지 않은 날짜입니다. 확정 교통편과 날짜 흐름을 기준으로 표시합니다.",
        mapLabel: `Day ${item.day} map`,
        editorial: [],
        places: [],
        accommodation: item.accommodation || (dayItin ? { name: dayItin.city, address: `${dayItin.city}, ${dayItin.country}` } : undefined)
      } as DailyGuide;
    });
  }, [guideData, trip]);

  const guide = dailyGuides.find((g) => String(g.day) === dayId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-field-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-field-line border-t-field-teal"></div>
      </div>
    );
  }

  if (!trip || !guide) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-field-surface px-6 text-field-ink">
        <div className="max-w-md text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-field-brass">Day unavailable</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold">No matching day found.</h1>
          <Link
            href={`/trips/${tripId}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-field-teal px-5 py-3 text-sm font-bold text-white transition hover:bg-field-brass"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Link>
        </div>
      </main>
    );
  }

  return <DailyTimeline trip={trip} guide={guide} dailyGuides={dailyGuides} uiConfig={payload?.uiConfig} appStructure={payload?.appStructure} />;
}

function DailyTimeline({
  trip,
  guide,
  dailyGuides,
  uiConfig,
  appStructure
}: {
  trip: Trip;
  guide: DailyGuide;
  dailyGuides: DailyGuide[];
  uiConfig?: AppDesignConfig;
  appStructure?: AppStructureConfig;
}) {
  const [selectedCityOverview, setSelectedCityOverview] = useState<DailyGuide | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<DailyGuidePlace | null>(null);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [expandedCitySegmentId, setExpandedCitySegmentId] = useState<string | null>(null);
  const [expandedOverviewPlaceId, setExpandedOverviewPlaceId] = useState<string | null>(null);
  const [isOverviewMapCollapsed, setIsOverviewMapCollapsed] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [routeMetrics, setRouteMetrics] = useState<Record<string, { distanceKm: number; durationStr: string }>>({});
  const dayTabsRef = useRef<HTMLDivElement | null>(null);
  const { markers, isLoading: isMapMarkersLoading, isSmartFill } = useDailyMapMarkers({
    guide,
    trip,
    includeAccommodation: true
  });

  const markerById = useMemo(() => {
    return new Map(markers.filter((marker) => marker.id).map((marker) => [marker.id, marker]));
  }, [markers]);

  useEffect(() => {
    const fetchMetrics = async () => {
      // 1. 주요 동선 (routeStops 기준) 추출
      const mainCoords: Coordinates[] = [];
      const coordKeys: string[] = [];

      if (guide.accommodation) {
        const coords = markerById.get("accommodation");
        if (coords) mainCoords.push({ lat: coords.lat, lng: coords.lng });
      }

      for (const place of guide.places) {
        const markerCoords = markerById.get(place.id);
        const coordinates = place.coordinates ?? (markerCoords ? { lat: markerCoords.lat, lng: markerCoords.lng } : undefined);
        if (coordinates) mainCoords.push(coordinates);
      }

      // 2. Overview 동선 추출
      const overviewCoords: Coordinates[] = [];
      if (guide.routeOverview?.length) {
        for (const point of guide.routeOverview) {
          overviewCoords.push(point.coordinates);
        }
      }

      const requests = [];
      const mode = guide.transportMode === "walk" ? "foot" : "driving";

      if (mainCoords.length > 1) {
        for (let i = 0; i < mainCoords.length - 1; i++) {
          coordKeys.push(`${mainCoords[i].lat},${mainCoords[i].lng}-${mainCoords[i+1].lat},${mainCoords[i+1].lng}`);
        }
        requests.push(fetchOsrmRouteMetrics(mainCoords, mode).then(legs => ({ legs, startIdx: 0 })));
      }

      if (overviewCoords.length > 1) {
        const startIdx = coordKeys.length;
        for (let i = 0; i < overviewCoords.length - 1; i++) {
          coordKeys.push(`${overviewCoords[i].lat},${overviewCoords[i].lng}-${overviewCoords[i+1].lat},${overviewCoords[i+1].lng}`);
        }
        requests.push(fetchOsrmRouteMetrics(overviewCoords, "driving").then(legs => ({ legs, startIdx })));
      }

      const results = await Promise.all(requests);

      let hasUpdates = false;
      const nextMetrics: Record<string, { distanceKm: number; durationStr: string }> = {};

      for (const { legs, startIdx } of results) {
        if (legs) {
          hasUpdates = true;
          legs.forEach((leg, i) => {
            const key = coordKeys[startIdx + i];
            if (key) {
              nextMetrics[key] = {
                distanceKm: leg.distance / 1000,
                durationStr: formatDuration(leg.duration)
              };
            }
          });
        }
      }

      if (hasUpdates) {
        setRouteMetrics(prev => ({ ...prev, ...nextMetrics }));
      }
    };

    fetchMetrics();
  }, [guide.accommodation, guide.places, guide.routeOverview, markerById, guide.transportMode]);

  const routeStops = useMemo(() => {
    const stops: {
      id: string;
      label: string;
      name: string;
      detail: string;
      coordinates?: { lat: number; lng: number };
    }[] = [];

    if (guide.accommodation) {
      const coords = markerById.get("accommodation");
      stops.push({
        id: "accommodation",
        label: "Start",
        name: guide.accommodation.name,
        detail: guide.accommodation.address,
        coordinates: coords ? { lat: coords.lat, lng: coords.lng } : undefined
      });
    }

    guide.places.forEach((place, index) => {
      const markerCoords = markerById.get(place.id);
      const coordinates = place.coordinates ?? (markerCoords ? { lat: markerCoords.lat, lng: markerCoords.lng } : undefined);
      stops.push({
        id: place.id,
        label: String(index + 1),
        name: place.name,
        detail: place.category,
        coordinates
      });
    });

    return stops.map((stop, index) => {
      const previous = stops[index - 1];
      let distanceKm = previous?.coordinates && stop.coordinates
        ? calculateDistanceKm(previous.coordinates, stop.coordinates)
        : null;
      let timeLabel = distanceKm === null ? "시간 확인 필요" : estimateRouteTime(distanceKm);

      if (previous?.coordinates && stop.coordinates) {
        const key = `${previous.coordinates.lat},${previous.coordinates.lng}-${stop.coordinates.lat},${stop.coordinates.lng}`;
        if (routeMetrics[key]) {
          distanceKm = routeMetrics[key].distanceKm;
          timeLabel = routeMetrics[key].durationStr;
        }
      }

      return {
        ...stop,
        legDistanceKm: distanceKm,
        legTimeLabel: timeLabel
      };
    });
  }, [guide.accommodation, guide.places, markerById, routeMetrics]);

  const citySegments = useMemo(() => {
    if (guide.cityVisits?.length) {
      return guide.cityVisits.map((visit, index) => {
        const matchingStop = routeStops.find((stop) =>
          stop.name.toLowerCase().includes(visit.city.toLowerCase()) ||
          visit.spots.some((spot) => spot.id === stop.id || stop.name.toLowerCase().includes(spot.name.toLowerCase()))
        );

        const sightseeingStops = getSegmentSightseeingStops(visit.spots);
        const supportStops = visit.spots.filter((spot) => !sightseeingStops.some((item) => item.id === spot.id));

        return {
          id: visit.id,
          name: visit.city,
          detail: `${visit.routeMode} route`,
          label: String(index + 1),
          index,
          place: sightseeingStops[0] ?? visit.spots[0],
          cityVisit: visit,
          stayLabel: visit.stayDuration,
          legDistanceKm: matchingStop?.legDistanceKm ?? null,
          legTimeLabel: matchingStop?.legTimeLabel ?? "시간 확인 필요",
          innerStops: visit.spots,
          sightseeingStops,
          supportStops
        };
      });
    }

    return routeStops
      .filter((stop) => stop.id !== "accommodation")
      .map((stop, index) => {
        const place = guide.places.find((item) => item.id === stop.id);
        return {
          ...stop,
          index,
          place,
          cityVisit: null,
          stayLabel: inferStayLabel(stop.legDistanceKm, place?.category),
          innerStops: place ? [place] : [],
          sightseeingStops: place && isSightseeingPlace(place) ? [place] : [],
          supportStops: place && !isSightseeingPlace(place) ? [place] : []
        };
      });
  }, [guide.cityVisits, guide.places, routeStops]);

  const isCityTransferDay =
    Boolean(guide.cityVisits?.length) ||
    citySegments.length >= 2 &&
    (isSmartFill || guide.region.includes("/") || routeStops.some((stop) => (stop.legDistanceKm ?? 0) >= 20));

  const explicitRouteOverviewStops = useMemo<RouteStopSummary[]>(() => {
    if (!guide.routeOverview?.length) return [];

    return guide.routeOverview.map((point, index, all) => {
      const previous = all[index - 1];
      let distanceKm = previous
        ? calculateDistanceKm(previous.coordinates, point.coordinates)
        : null;
      let timeLabel = distanceKm === null ? "출발" : estimateRouteTime(distanceKm);

      if (previous) {
        const key = `${previous.coordinates.lat},${previous.coordinates.lng}-${point.coordinates.lat},${point.coordinates.lng}`;
        if (routeMetrics[key]) {
          distanceKm = routeMetrics[key].distanceKm;
          timeLabel = routeMetrics[key].durationStr;
        }
      }

      return {
        id: `route-overview-${point.id}`,
        label: String(index + 1),
        name: point.name,
        detail: point.detail ?? "",
        legDistanceKm: distanceKm,
        legTimeLabel: timeLabel,
        kind: "city" as const
      };
    });
  }, [guide.routeOverview, routeMetrics]);

  const compactRouteStops = useMemo(
    () => explicitRouteOverviewStops.length
      ? explicitRouteOverviewStops
      : buildCompactRouteStops(routeStops, citySegments, isCityTransferDay),
    [citySegments, explicitRouteOverviewStops, isCityTransferDay, routeStops]
  );
  const routeOverviewNames = useMemo(
    () => (compactRouteStops.length ? compactRouteStops.map((stop) => stop.name) : guide.places.map((place) => place.name)),
    [compactRouteStops, guide.places]
  );
  const overviewRouteMarkers = useMemo(() => {
    if (guide.routeOverview?.length) {
      return guide.routeOverview.map((point, index) => ({
        lat: point.coordinates.lat,
        lng: point.coordinates.lng,
        label: String(index + 1),
        id: `route-overview-${point.id}`
      }));
    }

    if (citySegments.length > 0) {
      return citySegments
        .map((segment, index) => {
          const coordinates =
            segment.cityVisit?.coordinates ??
            segment.place?.coordinates ??
            segment.innerStops.find((place) => place.coordinates)?.coordinates;

          if (!coordinates) return null;

          return {
            lat: coordinates.lat,
            lng: coordinates.lng,
            label: String(index + 1),
            id: `city-segment-${segment.id}`
          };
        })
        .filter((marker): marker is { lat: number; lng: number; label: string; id: string } => Boolean(marker));
    }

    const routeMarkers = routeStops
      .filter((stop) => stop.coordinates)
      .map((stop, index) => ({
        lat: stop.coordinates!.lat,
        lng: stop.coordinates!.lng,
        label: String(index + 1),
        id: `route-stop-${stop.id}`
      }));

    if (isCityTransferDay) return routeMarkers;

    const firstMarker = routeMarkers[0];
    const lastMarker = routeMarkers[routeMarkers.length - 1];
    if (!firstMarker || !lastMarker || firstMarker.id === lastMarker.id) {
      return firstMarker ? [firstMarker] : markers.slice(0, 1);
    }

    const routeHasMeaningfulSpan = routeStops.some((stop) => (stop.legDistanceKm ?? 0) >= 20);
    return routeHasMeaningfulSpan ? [firstMarker, lastMarker] : [firstMarker];
  }, [citySegments, guide.routeOverview, isCityTransferDay, markers, routeStops]);

  const cityLabel = guide.region?.split(" / ")[0] || guide.region || "Route";
  const activeDayIndex = Math.max(0, dailyGuides.findIndex((item) => item.day === guide.day));
  const isLastGuideDay = activeDayIndex === dailyGuides.length - 1;
  const headerDateLabel = formatDailyHeaderDate(guide.date);
  const firstPlaceImage = guide.places.find((place) => place.image)?.image;
  const statusChips = [
    `${guide.places.length} stops`,
    markers.length ? `${markers.length} mapped` : "map pending",
    guide.accommodation ? "basecamp set" : "no lodging",
    getTransportModeLabel(guide.transportMode)
  ];
  const guidePlaceGroups = useMemo(() => groupGuidePlaces(guide.places), [guide.places]);
  const totalRouteDistanceKm = routeStops.reduce((total, stop) => total + (stop.legDistanceKm ?? 0), 0);
  const dailyFlightTickets = useMemo(() => {
    const guideData = getGuideDataForTrip(trip);
    return getFlightTicketsForDate(guideData.flightTickets, guide.date, isLastGuideDay);
  }, [guide.date, isLastGuideDay, trip]);
  const isFlightOnlyDay =
    guide.transportMode === "flight" &&
    dailyFlightTickets.length > 0 &&
    guide.places.every(isTravelLogisticsPlace);
  const hasNightTrainSegments = citySegments.some(isNightTrainSegment);

  useEffect(() => {
    const activeTab = dayTabsRef.current?.querySelector<HTMLElement>('[data-active-day="true"]');
    activeTab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [guide.day]);

  // Daily 페이지 전용 커스텀 하단 탭 구성
  const dailyAppStructure = {
    ...(appStructure || {}),
    navigationType: "bottom-tab" as const,
    tabs: [
      { id: "home", label: "Home", iconType: "home" },
      { id: "overview", label: "Overview", iconType: "overview" },
      { id: "stays", label: "Accommodations", iconType: "accommodations" }
    ]
  };

  const handleOptimizeRoute = async () => {
    setIsOptimizing(true);
    const city = guide.region?.split(" / ")[0] || guide.region;
    const stops = routeOverviewNames.map((name) => ({ name, category: "route overview" }));
    
    try {
      const res = await optimizeRouteAction(city, stops);
      if (res.data) {
        alert("동선 최적화가 완료되었습니다!\n\n" + JSON.stringify(res.data, null, 2));
      } else {
        alert("최적화 실패: " + res.error);
      }
    } catch (e) {
      alert("오류 발생");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleOpenMap = async () => {
    setIsMapLoading(true);
    const city = guide.region?.split(" / ")[0] || guide.region;
    const stops = routeOverviewNames.map((name) => ({ name }));
    
    try {
      const res = await generateMapLinkAction(city, stops);
      const mapUrl =
        res.data && typeof res.data === "object" && "map_url" in res.data
          ? String((res.data as { map_url?: unknown }).map_url || "")
          : "";

      if (mapUrl) {
        window.open(mapUrl, "_blank");
      } else {
        alert("지도 링크 생성 실패: " + res.error);
      }
    } catch (e) {
      alert("오류 발생");
    } finally {
      setIsMapLoading(false);
    }
  };

  return (
    <main className="flex h-[100dvh] w-full max-w-[24rem] flex-col overflow-hidden bg-field-surface font-sans text-field-ink selection:bg-field-forest selection:text-field-surface sm:mx-auto sm:max-w-none">
      <header className="z-40 shrink-0 border-b border-field-line bg-field-surface/95">
        <div className="relative flex items-start gap-2 px-4 py-4 sm:gap-3">
          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border border-field-line bg-white text-field-forest transition hover:border-field-forest"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1 pr-[6.25rem]">
            <span className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-field-teal">Field Guide</span>
            <h1 className="mt-1 truncate text-2xl font-extrabold leading-7 tracking-normal text-field-ink">
              Day {guide.day}
            </h1>
            <p className="mt-1 truncate text-sm font-semibold text-field-forest/70">{guide.title} · {guide.region}</p>
          </div>
          <div className="fixed right-[max(1rem,calc(100vw-24rem))] top-4 z-50 w-[5.75rem] rounded border border-field-line bg-white px-2 py-2 text-right sm:right-4">
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-field-forest/50">Date</span>
            <span className="block whitespace-nowrap text-xs font-extrabold text-field-forest sm:text-sm">{headerDateLabel}</span>
          </div>
        </div>

        <div
          ref={dayTabsRef}
          className="flex gap-2 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {dailyGuides.map((item) => {
            const isActive = item.day === guide.day;
            const label = getDailyTabLabel(item);

            return (
              <Link
                key={item.id}
                href={`/trips/${trip.id}/day/${item.day}`}
                data-active-day={isActive ? "true" : undefined}
                className={`grid min-h-[3.9rem] min-w-[6.2rem] max-w-[7.5rem] shrink-0 content-start gap-1 rounded border px-2.5 py-2 text-left transition sm:min-w-[8.65rem] sm:px-3 ${
                  isActive
                    ? "border-field-forest bg-field-forest text-white"
                    : "border-field-line bg-white text-field-forest hover:border-field-teal"
                }`}
              >
                <span className={`whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.12em] ${isActive ? "text-field-brass" : "text-field-forest/50"}`}>
                  Day {item.day}
                </span>
                <span className="whitespace-normal break-words text-xs font-bold leading-[1.15] [overflow-wrap:anywhere]">{label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {!isFlightOnlyDay && (
        <section className={`relative z-0 w-full shrink-0 overflow-hidden border-b border-field-line bg-field-mist transition-[height] duration-300 ${
          isOverviewMapCollapsed ? "h-14" : "h-52 sm:h-56 lg:h-60"
        }`}>
          {!isOverviewMapCollapsed && (
            <>
              {isMapMarkersLoading && overviewRouteMarkers.length === 0 ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-field-mist text-sm font-bold text-field-forest/70">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-field-forest/30 border-t-field-forest" />
                  도시 이동 동선을 지도에 표시하는 중...
                </div>
              ) : overviewRouteMarkers.length > 1 ? (
                <MultiOsmMap
                  markers={overviewRouteMarkers}
                  className="h-full w-full"
                  onMarkerClick={(id) => {
                    if (id.startsWith("city-segment-")) {
                      const segmentId = id.replace("city-segment-", "");
                      setExpandedCitySegmentId(segmentId);
                      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                      return;
                    }

                    const place = guide.places.find((p) => p.id === id);
                    if (place) {
                      setExpandedPlaceId(id);
                      document.getElementById(`timeline-place-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                />
              ) : overviewRouteMarkers.length === 1 && overviewRouteMarkers[0] ? (
                <OsmMap
                  query={`${overviewRouteMarkers[0].lat},${overviewRouteMarkers[0].lng}`}
                  className="h-full w-full"
                />
              ) : guide.region || guide.places.length > 0 ? (
                <OsmMap
                  query={guide.region?.split(" / ")[0] || guide.places[0]?.name || "Seoul"}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-field-mist text-sm font-bold text-field-forest/70">
                  지도 데이터가 부족합니다.
                </div>
              )}
            </>
          )}
          <div className={`pointer-events-none absolute inset-x-0 border-field-forest/10 bg-field-surface/94 px-4 ${
            isOverviewMapCollapsed ? "inset-y-0 flex items-center" : "bottom-0 border-t py-2.5"
          }`}>
            <div className="flex w-full items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-field-teal">City Route Map</span>
                <p className="mt-0.5 truncate text-base font-extrabold leading-5 text-field-ink">{cityLabel}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right text-xs font-bold text-field-forest/70">
                  {isCityTransferDay
                    ? overviewRouteMarkers.length ? `${overviewRouteMarkers.length} cities` : "city map pending"
                    : overviewRouteMarkers.length ? `${overviewRouteMarkers.length} pins` : "unmapped"}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOverviewMapCollapsed((value) => !value)}
                  className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-md border border-field-line bg-white px-2.5 text-xs font-extrabold text-field-forest transition hover:border-field-teal hover:text-field-teal"
                >
                  {isOverviewMapCollapsed ? "지도 보기" : "접기"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOverviewMapCollapsed ? "" : "rotate-180"}`} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="relative z-10 flex-1 overflow-y-auto bg-field-surface">
        <div className="mx-auto max-w-3xl px-4 pb-32 pt-6">
          {dailyFlightTickets.length > 0 && (
            <DailyFlightSchedule tickets={dailyFlightTickets} date={guide.date} />
          )}

          {!isFlightOnlyDay && (
            <GuideSummary
              guide={guide}
              statusChips={statusChips}
              mustSeeCount={guidePlaceGroups.mustSee.length}
              hiddenGemCount={guidePlaceGroups.hidden.length}
              totalDistanceLabel={totalRouteDistanceKm > 0 ? formatDistance(totalRouteDistanceKm) : "거리 확인 필요"}
            />
          )}

          {!isFlightOnlyDay && compactRouteStops.length > 0 && (
            <CompactTodayRoute
              guide={guide}
              stops={compactRouteStops}
              isMapLoading={isMapLoading}
              isOptimizing={isOptimizing}
              onOpenMap={handleOpenMap}
              onOptimize={handleOptimizeRoute}
            />
          )}

          {!isFlightOnlyDay && !isSmartFill && !isCityTransferDay && guide.places.length > 0 && (
            <PlacePrioritySections
              groups={guidePlaceGroups}
              onSelectPlace={(place) => {
                setSelectedPlace(place);
                setExpandedPlaceId(place.id);
              }}
            />
          )}

          {!isFlightOnlyDay && isCityTransferDay && citySegments.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-field-teal">
                  {hasNightTrainSegments ? "City & train plan" : "City plan"}
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-field-ink">
                  {hasNightTrainSegments ? "도시별 일정 + 야간열차" : "도시별 일정"}
                </h2>
              </div>
              </div>

              <div className="grid gap-3">
                {citySegments.map((segment) => {
                  const isExpanded = expandedCitySegmentId === segment.id;
                  const isNightTrain = isNightTrainSegment(segment);

                  return (
                    <div
                      key={`city-segment-${segment.id}`}
                      id={`city-segment-${segment.id}`}
                      className="rounded-lg border border-field-line bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                    >
                      <div className="grid gap-3 px-4 py-4">
                        <button
                          onClick={() => setExpandedCitySegmentId(isExpanded ? null : segment.id)}
                          className="grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-3 text-left"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-field-forest text-[11px] font-extrabold text-white">
                            {segment.index + 1}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="block truncate text-sm font-extrabold text-field-ink">{segment.name}</span>
                              <span className="shrink-0 rounded bg-field-surface px-1.5 py-0.5 text-[9px] font-extrabold text-field-forest/60">
                                {segment.stayLabel}
                              </span>
                            </span>
                          </span>
                          <span className="flex items-center gap-2 text-right">
                            <ChevronDown className={`h-4 w-4 text-field-forest/50 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </span>
                        </button>

                        <div className="grid min-w-0 gap-3">
                          {isNightTrain ? (
                            <NightTrainInfoCard segment={segment} />
                          ) : (
                            <>
                              <CityCardMapPreview
                                segment={segment}
                                onSelectPlace={(place) => setSelectedPlace(place)}
                              />
                              <CitySightseeingTimeline
                                places={segment.sightseeingStops}
                                onSelectPlace={(place) => setSelectedPlace(place)}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-field-mist/30"
                          >
                            <div className="grid gap-3 px-4 pb-4">
                              {isNightTrain ? (
                                <NightTrainDetailPanel segment={segment} />
                              ) : (
                                <CityAttractionThread
                                  segment={segment}
                                  onSelectPlace={(place) => setSelectedPlace(place)}
                                />
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {!isFlightOnlyDay && !isCityTransferDay && (
            <>
            {/* Place details */}
            <div className="relative mb-3 flex items-center justify-between pb-2">
              <div>
                <h2 className="text-xl font-extrabold text-field-ink">장소별 상세</h2>
              </div>
              <Clock3 className="h-5 w-5 text-field-brass" />
            </div>

            <div className="relative mt-3">
            {/* AI Smart Fill (임시 일정이거나 비어있는 날에만 MCP가 빈 공간을 채움) */}
            {isSmartFill ? (
              (guide.region ? guide.region.split("/").map(s => s.trim()).filter(Boolean) : []).map((city, idx, arr) => (
                <motion.div
                  key={`city-node-${city}`}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  className="group relative flex gap-4 pb-6 sm:gap-5"
                >
                  {/* Vertical Connection Line */}
                  <div className={`absolute left-[23px] top-10 bottom-[-10px] w-[2px] transition-all duration-300 ${idx === arr.length - 1 && !guide.accommodation ? 'hidden' : 'bg-gradient-to-b from-field-teal/40 via-field-line to-field-line group-hover:from-field-teal/80'}`} />

                  {/* City Node Marker */}
                  <div className="relative flex w-12 shrink-0 flex-col items-center pt-1">
                    <span className="mb-2 block rounded-full bg-field-forest border border-field-forest px-2 py-1 text-[10px] font-extrabold tracking-wider text-white shadow-sm">
                      City
                    </span>
                    <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-field-surface bg-field-ink shadow-sm transition-transform group-hover:scale-110">
                      <MapPinned className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>

                  {/* City Card with MCP Integration */}
                  <div className="flex-1 overflow-hidden rounded-3xl border border-field-line/60 bg-field-mist/40 backdrop-blur-xl shadow-sm transition-all hover:border-field-teal/50 hover:shadow-md">
                    <div className="p-5">
                      <h3 className="mb-4 text-xl font-extrabold text-field-ink tracking-tight">📍 {city}</h3>
                      <div className="rounded-2xl border border-field-line bg-white/90 p-4 shadow-sm">
                        <DynamicCityAttractions city={city} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
            /* Detailed Place Nodes (상세 일정이 존재할 경우 깔끔하게 장소 타임라인만 노출) */
            guide.places.map((place, idx) => (
              <motion.div
                key={place.id}
                id={`timeline-place-${place.id}`}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="group relative flex gap-3 pb-4 sm:gap-4"
              >
                {/* Vertical Connection Line */}
                <div className={`absolute left-[19px] top-9 bottom-[-8px] w-[2px] transition-all duration-300 ${idx === guide.places.length - 1 && !guide.accommodation ? 'hidden' : 'bg-gradient-to-b from-field-teal/40 via-field-line to-field-line group-hover:from-field-teal/80 group-hover:via-field-teal/50 group-hover:to-field-line'}`} />

                {/* Time & Node */}
                <div className="relative flex w-10 shrink-0 flex-col items-center pt-1">
                  <span className="mb-1.5 block rounded bg-white border border-field-line px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-field-forest shadow-sm">
                    {place.timeLabel || "--:--"}
                  </span>
                  <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-field-surface bg-field-teal shadow-sm transition-transform group-hover:scale-110">
                    <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  </div>
                </div>

                {/* Card */}
                <div
                  className="flex-1 overflow-hidden rounded-lg border border-field-line/70 bg-white/95 shadow-sm transition-all hover:border-field-teal/50 hover:shadow-md"
                >
                  <div 
                    onClick={() => setExpandedPlaceId(expandedPlaceId === place.id ? null : place.id)}
                    className="flex cursor-pointer flex-row items-center gap-3 p-3"
                  >
                    {place.image && (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-field-line/30 shadow-sm sm:h-[4.5rem] sm:w-[4.5rem]">
                        <GuideImage
                          src={place.image}
                          alt={place.imageAlt || place.name}
                          className="absolute inset-0 h-full w-full"
                          imageClassName="transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-[10px] font-extrabold uppercase tracking-widest text-field-teal">
                          {place.category}
                        </span>
                        <div className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest transition-colors ${expandedPlaceId === place.id ? "bg-field-forest text-white" : "bg-field-teal-soft text-field-teal"}`}>
                          <Sparkles className="h-3 w-3" /> {expandedPlaceId === place.id ? "Close" : "Guide"}
                        </div>
                      </div>
                      <h3 className="mb-1 truncate text-base font-extrabold leading-tight text-field-ink transition-colors group-hover:text-field-teal">
                        {place.name}
                      </h3>
                      <p className="line-clamp-1 text-xs leading-relaxed text-field-forest/70 sm:line-clamp-2">
                        {place.description}
                      </p>
                    </div>
                  </div>

                  {/* Inline AI Docent Expansion (Stitch MCP) */}
                  <AnimatePresence>
                    {expandedPlaceId === place.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-field-line bg-field-mist/30"
                      >
                        <div className="p-4 sm:p-5">
                          <StaticPlaceGuide place={place} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))
          )}

            {/* Basecamp as the final node */}
            {guide.accommodation && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.4, delay: guide.places.length * 0.1 }}
                className="group relative flex gap-4 pt-2 sm:gap-5"
              >
                <div className="relative flex w-12 shrink-0 flex-col items-center pt-1">
                  <span className="mb-2 block text-[10px] font-extrabold tracking-wider text-field-forest">
                    {guide.accommodation.checkIn ? "Check-in" : "Stay"}
                  </span>
                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-field-surface bg-field-ink shadow-sm transition-transform group-hover:scale-110">
                    <Hotel className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="flex-1 rounded-xl border border-field-line bg-white p-4 shadow-sm transition hover:border-field-ink hover:shadow-md">
                  <div className="flex justify-between gap-4">
                    <div>
                      <div className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-field-forest/60">
                        Basecamp
                      </div>
                      <h3 className="mb-1 text-base font-extrabold leading-tight text-field-ink">
                        {guide.accommodation.name}
                      </h3>
                      <p className="text-xs leading-relaxed text-field-forest/70">
                        {guide.accommodation.address}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-md bg-field-surface px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-field-forest/70">
                          Check-in {guide.accommodation.checkIn ?? "-"}
                        </span>
                        <span className="rounded-md bg-field-surface px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-field-forest/70">
                          Check-out {guide.accommodation.checkOut ?? "-"}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      {guide.accommodation.googleMapsUrl && (
                        <a href={guide.accommodation.googleMapsUrl} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-field-surface text-field-ink transition hover:bg-field-line" aria-label={`${guide.accommodation.name} Google Maps`}>
                          <Navigation className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {guide.accommodation.airbnbUrl && (
                        <a href={guide.accommodation.airbnbUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center justify-center rounded-full bg-[#FF385C] px-2 text-[9px] font-extrabold text-white">
                          Airbnb
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            </div>
            </>
          )}
        </div>
      </div>

      {/* City Overview Slide-up Details Layer */}
      <AnimatePresence>
        {selectedCityOverview && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedCityOverview(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92dvh] min-h-[70dvh] flex-col overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:max-w-2xl md:mx-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-3xl"
            >
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />
              <button
                onClick={() => setSelectedCityOverview(null)}
                className="absolute right-6 top-6 z-10 rounded-full bg-white/80 backdrop-blur-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600">{formatDailyHeaderDate(selectedCityOverview.date)} Overview</span>
              <h2 className="mb-4 mt-1 font-serif text-3xl font-bold text-slate-900">{selectedCityOverview.region}</h2>

              {selectedCityOverview.places[0]?.image && (
                <div className="relative mb-6 h-56 w-full overflow-hidden rounded-2xl border border-slate-100">
                  <GuideImage src={selectedCityOverview.places[0].image} alt={selectedCityOverview.region} className="absolute inset-0 h-full w-full" />
                </div>
              )}

              <p className="mb-8 font-serif text-sm leading-loose text-slate-600">
                {selectedCityOverview.deck}
              </p>

              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-serif text-xl font-bold text-slate-900">Sights & Places</h3>
                <span className="text-xs font-bold text-slate-400">{selectedCityOverview.places.length} spots</span>
              </div>

              <div className="space-y-4">
                {selectedCityOverview.places.map((place) => (
                  <div
                    key={place.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition-all"
                  >
                    <div 
                      onClick={() => setExpandedOverviewPlaceId(expandedOverviewPlaceId === place.id ? null : place.id)}
                      className="cursor-pointer"
                    >
                      {place.image && (
                        <div className="relative h-48 w-full shrink-0 border-b border-slate-200">
                          <GuideImage src={place.image} alt={place.name} className="absolute inset-0 h-full w-full" />
                          <div className="absolute left-4 top-4 rounded bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 backdrop-blur-sm">
                            {place.category}
                          </div>
                        </div>
                      )}
                      <div className="p-5">
                        <h4 className="font-serif text-xl font-bold text-slate-900 mb-2">{place.name}</h4>
                        <p className="text-sm leading-relaxed text-slate-600">
                          {place.description}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-100 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-700 transition-colors hover:bg-sky-200">
                          <Sparkles className="h-3.5 w-3.5" /> 
                          {expandedOverviewPlaceId === place.id ? "Close Docent" : "AI Docent"}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedOverviewPlaceId === place.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-200 bg-white"
                        >
                          <div className="p-5 sm:p-6">
                            <StaticPlaceGuide place={place} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <DynamicCityAttractions city={selectedCityOverview.region} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <PlaceBottomSheet place={selectedPlace} region={guide.region} onClose={() => setSelectedPlace(null)} />
      <AppNavigation appStructure={dailyAppStructure} themeColor={uiConfig?.themeColor} />
    </main>
  );
}

function DynamicCityAttractions({ city }: { city: string }) {
  return (
    <div className="rounded-xl border border-field-line bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-field-teal" />
        <h3 className="font-serif text-lg font-bold text-field-ink">정적 관광지 데이터 필요</h3>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-field-forest/70">
        {city}의 관광지 후보는 앱 실행 중 MCP로 불러오지 않습니다. 개발 중 `scripts/enrich-attractions-from-mcp.mjs`를 실행해 정적 데이터로 채워주세요.
      </p>
    </div>
  );
}

function DailyFlightSchedule({ tickets, date }: { tickets: FlightTicket[]; date: string }) {
  const dateLabel = formatTicketDateLabel(date);

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-field-forest bg-white shadow-[0_10px_30px_rgba(31,54,43,0.08)]">
      <div className="border-b border-field-line bg-field-forest px-4 py-4 text-white">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-field-brass">Flight first</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-extrabold">오늘의 항공편 일정</h2>
          <span className="rounded border border-white/20 px-2.5 py-1 text-[10px] font-extrabold text-white/80">
            {dateLabel}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4">
        {tickets.map((ticket) => {
          const firstSegment = ticket.segments[0];
          const flightNumbers = ticket.segments.map((segment) => segment.flightNo).join(" / ");

          return (
          <article key={ticket.id} className="rounded-lg border border-field-line bg-field-surface/45 p-4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <AirlineLogo code={firstSegment?.airlineCode} name={firstSegment?.airlineName} />
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-field-teal">{ticket.title}</p>
                  <h3 className="mt-1 break-words text-base font-extrabold leading-snug text-field-ink">{ticket.routeLabel}</h3>
                </div>
              </div>
              <span className="shrink-0 rounded-md border border-field-line bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-field-forest/70">
                {ticket.connectionLabel}
              </span>
            </div>

            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              {ticket.reservationCode && <FlightMetaChip label="예약 번호" value={ticket.reservationCode} />}
              {ticket.totalDuration && <FlightMetaChip label="총 소요" value={ticket.totalDuration} />}
              <FlightMetaChip label="항공편" value={flightNumbers} />
            </div>

            <div className="grid gap-3">
              {ticket.segments.map((segment, index) => (
                <div key={`${ticket.id}-${segment.flightNo}-${index}`}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-field-forest px-2 py-1 text-[11px] font-black text-white">{segment.flightNo}</span>
                      <AirlineLogo code={segment.airlineCode} name={segment.airlineName} size="sm" />
                      <span className="text-xs font-extrabold text-field-forest">{segment.airlineName}</span>
                    </div>
                    {segment.aircraft && (
                      <span className="text-[11px] font-bold text-field-forest/60">{segment.aircraft}</span>
                    )}
                  </div>
                  <div className="grid gap-3 rounded-md border border-field-line bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                    <DailyAirportPoint icon={<PlaneTakeoff className="h-4 w-4" />} label="출발" point={segment.from} />
                    <div className="flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase text-field-forest/60 sm:grid sm:justify-items-center">
                      <span className="h-px w-full bg-field-line sm:w-16" />
                      <span className="rounded border border-field-line px-2 py-1">{segment.duration}</span>
                      <span className="h-px w-full bg-field-line sm:w-16" />
                    </div>
                    <DailyAirportPoint align="right" icon={<PlaneLanding className="h-4 w-4" />} label="도착" point={segment.to} />
                  </div>
                  {index < ticket.segments.length - 1 && (
                    <div className="mx-auto my-2 w-fit rounded-full bg-field-teal-soft px-3 py-1 text-[10px] font-extrabold text-field-teal">
                      환승 · {ticket.connectionLabel}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}

function FlightMetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-field-line bg-white px-3 py-2">
      <div className="text-[10px] font-extrabold text-field-forest/50">{label}</div>
      <div className="mt-0.5 break-words text-xs font-extrabold text-field-ink">{value}</div>
    </div>
  );
}

function DailyAirportPoint({
  point,
  icon,
  label,
  align = "left"
}: {
  point: FlightTicket["segments"][number]["from"];
  icon: ReactNode;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <div className={`min-w-0 ${align === "right" ? "sm:text-right" : ""}`}>
      <div className={`flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-field-teal ${align === "right" ? "sm:justify-end" : ""}`}>
        {icon}
        {label} · {point.code}
      </div>
      <div className="mt-1 text-3xl font-extrabold leading-none text-field-ink">{point.time}</div>
      <div className="mt-1 truncate text-sm font-extrabold text-field-forest">{point.city}</div>
      <div className="mt-0.5 break-words text-xs font-semibold leading-5 text-field-forest/65">
        {point.airport}
        {point.dateLabel ? <span className="ml-1 font-extrabold text-field-teal">{point.dateLabel}</span> : null}
        {point.terminal ? <span className="ml-1 font-extrabold text-field-forest/55">{point.terminal}</span> : null}
      </div>
    </div>
  );
}

type RouteStopSummary = {
  id: string;
  label: string;
  name: string;
  detail: string;
  legDistanceKm: number | null;
  legTimeLabel: string;
  kind: "transport" | "city";
};

function CompactTodayRoute({
  guide,
  stops,
  isOptimizing,
  isMapLoading,
  onOptimize,
  onOpenMap
}: {
  guide: DailyGuide;
  stops: RouteStopSummary[];
  isOptimizing: boolean;
  isMapLoading: boolean;
  onOptimize: () => void;
  onOpenMap: () => void;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-field-line bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 px-4 pt-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-field-teal">Today route</p>
          <h2 className="mt-1 text-lg font-extrabold text-field-ink">도시 이동 타임라인</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1 px-4 pt-4">
          <button
            onClick={onOptimize}
            disabled={isOptimizing}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-field-line bg-field-surface text-field-teal transition hover:border-field-teal disabled:opacity-50"
            title="스마트 동선 최적화"
          >
            {isOptimizing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-field-teal/30 border-t-field-teal" /> : <Sparkles className="h-4 w-4" />}
          </button>
          <button
            onClick={onOpenMap}
            disabled={isMapLoading}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-field-line bg-field-surface text-field-ink transition hover:border-field-teal disabled:opacity-50"
            title="지도 앱에서 보기"
          >
            {isMapLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-field-ink/30 border-t-field-ink" /> : <MapPin className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="border-t border-field-line bg-field-surface/45 px-4 py-4">
        <ol className="flex snap-x gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stops.map((stop, index) => {
            const nextStop = stops[index + 1];

            return (
              <li key={`compact-route-${stop.id}`} className="grid min-w-[10.75rem] snap-start grid-cols-[minmax(0,1fr)_4rem] gap-2 last:grid-cols-[minmax(0,1fr)]">
                <div className="rounded-md border border-field-line bg-white p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${
                      stop.kind === "city" ? "bg-field-teal" : "bg-field-ink"
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-[10px] font-extrabold text-field-forest/60">
                      {index === 0 ? "출발" : stop.legTimeLabel}
                    </span>
                  </div>
                  <span className="block min-h-[2.25rem] text-sm font-extrabold leading-[1.15] text-field-ink [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">
                    {stop.name}
                  </span>
                </div>
                {nextStop && (
                  <div className="grid content-center justify-items-center gap-1 text-center">
                    <span className="rounded-md border border-field-teal/25 bg-white px-1.5 py-1 text-[8.5px] font-extrabold leading-tight text-field-teal shadow-sm">
                      {formatDistance(nextStop.legDistanceKm)}
                      <br />
                      {nextStop.legTimeLabel}
                    </span>
                    <div className="flex w-full items-center">
                      <div className="h-[2px] flex-1 bg-field-teal/35" />
                      <ChevronRight className="-ml-1 h-4 w-4 shrink-0 text-field-teal" />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function CityCardMapPreview({
  segment,
  onSelectPlace
}: {
  segment: CityThreadSegment;
  onSelectPlace: (place: DailyGuidePlace) => void;
}) {
  const mapPlaces = segment.sightseeingStops.length > 0 ? segment.sightseeingStops : segment.innerStops;
  const markerPlaces = mapPlaces.filter((place) => place.coordinates);

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-field-line bg-field-surface/45">
      <div className="flex items-center justify-between border-b border-field-line bg-white px-3 py-2">
        <span className="min-w-0">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-field-teal">Map</span>
          <span className="block truncate text-xs font-extrabold text-field-ink">{segment.name}</span>
        </span>
        <span className="rounded bg-field-surface px-2 py-1 text-[10px] font-extrabold text-field-forest/60">
          {markerPlaces.length} pins
        </span>
      </div>
      {markerPlaces.length > 0 ? (
        <MultiOsmMap
          className="h-56 w-full sm:h-64 lg:h-72"
          fitPadding={44}
          maxZoom={16}
          markers={markerPlaces.map((place, index) => ({
            lat: place.coordinates!.lat,
            lng: place.coordinates!.lng,
            label: String(index + 1),
            id: place.id
          }))}
          onMarkerClick={(id) => {
            const place = mapPlaces.find((item) => item.id === id);
            if (place) onSelectPlace(place);
          }}
        />
      ) : (
        <div className="flex h-56 items-center justify-center text-xs font-bold text-field-forest/55 sm:h-64 lg:h-72">
          지도 좌표가 부족합니다.
        </div>
      )}
    </div>
  );
}

function NightTrainInfoCard({ segment }: { segment: CityThreadSegment }) {
  const trainInfo = segment.cityVisit?.trainInfo;
  if (!trainInfo) return null;

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-field-line bg-white">
      <div className="grid gap-0">
        <NightTrainPhoto src={trainInfo.image} alt={trainInfo.imageAlt} />
        <div className="grid gap-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-field-teal">
                Overnight train
              </p>
              <h3 className="mt-1 break-words text-base font-extrabold leading-snug text-field-ink">
                {trainInfo.title}
              </h3>
              <p className="mt-1 text-xs font-bold text-field-forest/60">{trainInfo.cabinType}</p>
            </div>
            <span className="shrink-0 rounded-md bg-field-forest px-2.5 py-1.5 text-[10px] font-extrabold text-white">
              {trainInfo.durationLabel}
            </span>
          </div>

          <div className="grid gap-2 rounded-md border border-field-line bg-field-surface/45 p-3">
            <TrainScheduleRow label="열차" value={trainInfo.serviceName} />
            <TrainScheduleRow label="출발" value={trainInfo.departureLabel} />
            <TrainScheduleRow label="도착" value={trainInfo.arrivalLabel} />
            <TrainScheduleRow label="구간" value={trainInfo.routeLabel} />
          </div>

          {trainInfo.mapUrl && (
            <a
              href={trainInfo.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-field-forest px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-field-ink"
            >
              <MapPinned className="h-4 w-4" />
              야간열차 경로 지도
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {(trainInfo.sourceUrl || trainInfo.routeSourceUrl) && (
            <div className="flex flex-wrap gap-2">
              {trainInfo.sourceUrl && (
                <a
                  href={trainInfo.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-field-line bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-field-forest transition hover:border-field-teal hover:text-field-teal"
                >
                  객실 안내
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {trainInfo.routeSourceUrl && (
                <a
                  href={trainInfo.routeSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-field-line bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-field-forest transition hover:border-field-teal hover:text-field-teal"
                >
                  시칠리아 노선
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          <ul className="grid gap-2">
            {trainInfo.highlights.map((item) => (
              <li key={item} className="rounded-md bg-field-teal-soft px-3 py-2 text-xs font-semibold leading-relaxed text-field-forest">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function NightTrainPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[21/10] w-full overflow-hidden bg-white sm:aspect-[5/2] lg:aspect-[3/1]">
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="lazy"
      />
    </div>
  );
}

function TrainScheduleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 text-sm">
      <span className="font-extrabold text-field-teal">{label}</span>
      <span className="break-words font-bold text-field-ink">{value}</span>
    </div>
  );
}

function NightTrainDetailPanel({ segment }: { segment: CityThreadSegment }) {
  const notes = segment.cityVisit?.practicalNotes ?? [];

  return (
    <div className="rounded-lg border border-field-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-field-teal">Boarding plan</p>
          <h3 className="mt-1 text-sm font-extrabold text-field-ink">야간열차 탑승 체크리스트</h3>
        </div>
        <span className="rounded bg-field-surface px-2 py-1 text-[10px] font-extrabold text-field-forest/60">
          실전 메모
        </span>
      </div>
      <ul className="grid gap-2">
        {notes.map((note) => (
          <li key={note} className="rounded-md border border-field-line bg-field-surface/45 px-3 py-2 text-xs font-semibold leading-relaxed text-field-forest/75">
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CitySightseeingTimeline({
  places,
  onSelectPlace
}: {
  places: DailyGuidePlace[];
  onSelectPlace: (place: DailyGuidePlace) => void;
}) {
  const timelinePlaces = places;
  const [metrics, setMetrics] = useState<Record<string, { distanceKm: number; durationStr: string }>>({});

  useEffect(() => {
    const coords: Coordinates[] = [];
    const keys: string[] = [];
    for (const p of timelinePlaces) {
      if (p.coordinates) coords.push(p.coordinates);
    }

    if (coords.length > 1) {
      for (let i = 0; i < coords.length - 1; i++) {
        keys.push(`${coords[i].lat},${coords[i].lng}-${coords[i+1].lat},${coords[i+1].lng}`);
      }
      fetchOsrmRouteMetrics(coords, "foot").then((legs) => {
        if (legs) {
          const next: Record<string, { distanceKm: number; durationStr: string }> = {};
          legs.forEach((leg, i) => {
            if (keys[i]) {
              next[keys[i]] = { distanceKm: leg.distance / 1000, durationStr: formatDuration(leg.duration) };
            }
          });
          setMetrics(next);
        }
      });
    }
  }, [timelinePlaces]);

  if (timelinePlaces.length === 0) return null;

  return (
    <div className="min-w-0 rounded-lg border border-field-line bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-field-teal">Timeline</p>
          <h3 className="text-xs font-extrabold text-field-ink">관광지 이동 타임라인</h3>
        </div>
        <span className="rounded bg-field-surface px-2 py-1 text-[10px] font-extrabold text-field-forest/60">
          {timelinePlaces.length} stops
        </span>
      </div>

      <ol className="flex max-w-full snap-x gap-2 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-color:#2f7f7b_#eef4f1] [scrollbar-width:thin]">
        {timelinePlaces.map((place, index) => {
          const next = timelinePlaces[index + 1];
          let distanceKm =
            place.coordinates && next?.coordinates
              ? calculateDistanceKm(place.coordinates, next.coordinates)
              : null;
          let timeLabel = distanceKm === null ? "거리 확인" : `${formatDistance(distanceKm)} · ${estimateRouteTime(distanceKm)}`;

          if (place.coordinates && next?.coordinates) {
            const key = `${place.coordinates.lat},${place.coordinates.lng}-${next.coordinates.lat},${next.coordinates.lng}`;
            if (metrics[key]) {
              distanceKm = metrics[key].distanceKm;
              timeLabel = `${formatDistance(distanceKm)} · ${metrics[key].durationStr}`;
            }
          }

          return (
            <li
              key={`city-sightline-${place.id}`}
              className="grid min-w-[9.5rem] snap-start grid-cols-[minmax(0,1fr)_3rem] items-center gap-1 last:grid-cols-[minmax(0,1fr)]"
            >
              <button
                type="button"
                onClick={() => onSelectPlace(place)}
                className="overflow-hidden rounded-md border border-field-line bg-field-surface/45 text-left transition hover:border-field-teal hover:bg-field-teal-soft/20"
              >
                <div className="relative h-20 overflow-hidden bg-field-mist">
                  <GuideImage
                    src={place.image}
                    alt={place.imageAlt || place.name}
                    className="absolute inset-0 h-full w-full"
                  />
                  <span className="absolute left-2 top-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-field-teal text-[10px] font-extrabold text-white shadow-sm">
                    {index + 1}
                  </span>
                  {place.timeLabel && (
                    <span className="absolute right-2 top-2 max-w-[4.75rem] truncate rounded bg-white/92 px-1.5 py-0.5 text-[9px] font-extrabold text-field-forest/65 shadow-sm">
                      {place.timeLabel}
                    </span>
                  )}
                </div>
                <span className="grid min-h-[4.5rem] content-start gap-1 p-2">
                  <span className="break-words text-[11px] font-extrabold leading-[1.15] text-field-ink">
                    {place.name}
                  </span>
                  {getSpotDuration(place) && (
                    <span className="text-[9px] font-bold leading-tight text-field-forest/55">{getSpotDuration(place)}</span>
                  )}
                </span>
              </button>

              {next && (
                <div className="grid justify-items-center gap-1 text-center">
                  <ChevronRight className="h-4 w-4 text-field-teal" />
                  <span className="rounded bg-field-teal-soft px-1.5 py-1 text-[8px] font-extrabold leading-tight text-field-teal">
                    {distanceKm === null ? "거리 확인" : `${formatDistance(distanceKm)} · ${estimateRouteTime(distanceKm)}`}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type CityThreadSegment = {
  id: string;
  name: string;
  index: number;
  stayLabel: string;
  legDistanceKm: number | null;
  legTimeLabel: string;
  innerStops: DailyGuidePlace[];
  sightseeingStops: DailyGuidePlace[];
  supportStops: DailyGuidePlace[];
  cityVisit: DailyCityVisit | null;
};

function isNightTrainSegment(segment: CityThreadSegment) {
  return segment.cityVisit?.displayMode === "train" || Boolean(segment.cityVisit?.trainInfo);
}

function CityAttractionThread({
  segment,
  onSelectPlace
}: {
  segment: CityThreadSegment;
  onSelectPlace: (place: DailyGuidePlace) => void;
}) {
  const sightseeingPlaces = segment.sightseeingStops;
  const supportPlaces = segment.supportStops;
  const mapPlaces = sightseeingPlaces.length > 0 ? sightseeingPlaces : segment.innerStops;
  const sections = [
    {
      id: "sightseeing",
      label: "관광지",
      places: sightseeingPlaces,
      tone: "sightseeing" as const
    },
    {
      id: "support",
      label: "이동/기준 지점",
      places: supportPlaces,
      tone: "support" as const
    }
  ].filter((section) => section.places.length > 0);

  const notes = segment.cityVisit?.practicalNotes?.length
    ? segment.cityVisit.practicalNotes
    : [
        "도시 이동일에는 핵심 관광지와 복귀 시간을 먼저 고정하세요.",
        "지도 핀 번호와 카드 번호를 함께 보며 시내 동선을 확인하세요.",
        "식사·카페·짐 보관은 이동 기준 지점 근처에 붙이면 흐름이 깔끔합니다."
      ];

  return (
    <div className="relative grid gap-3">
      <div className="absolute bottom-4 left-[15px] top-2 w-[2px] bg-field-line" />

      <ThreadNode badge="도착" tone="dark">
        <div className="rounded-lg border border-field-line bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-field-teal">City thread</p>
              <h3 className="mt-1 text-base font-extrabold text-field-ink">{segment.name}</h3>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-field-forest/65">
                {segment.stayLabel} · {formatDistance(segment.legDistanceKm)} · {segment.legTimeLabel}
              </p>
            </div>
            <span className="rounded-md bg-field-surface px-2 py-1 text-[10px] font-extrabold text-field-forest/65">
              {mapPlaces.length} pins
            </span>
          </div>
        </div>
      </ThreadNode>

      {mapPlaces.some((spot) => spot.coordinates) && (
        <ThreadNode badge="지도" tone="teal">
          <div className="overflow-hidden rounded-lg border border-field-line bg-white">
            <div className="flex items-center justify-between border-b border-field-line px-3 py-2">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-field-teal">Mini map</p>
                <h3 className="truncate text-sm font-extrabold text-field-ink">{segment.name} 시내 지도</h3>
              </div>
              <span className="text-[10px] font-extrabold text-field-forest/55">번호 카드와 연결</span>
            </div>
            <MultiOsmMap
              className="h-72 w-full sm:h-80 lg:h-[22rem]"
              fitPadding={52}
              maxZoom={16}
              markers={mapPlaces
                .filter((spot) => spot.coordinates)
                .map((spot, spotIndex) => ({
                  lat: spot.coordinates!.lat,
                  lng: spot.coordinates!.lng,
                  label: String(spotIndex + 1),
                  id: spot.id
                }))}
              onMarkerClick={(id) => {
                const place = mapPlaces.find((spot) => spot.id === id);
                if (place) onSelectPlace(place);
              }}
            />
          </div>
        </ThreadNode>
      )}

      {sections.map((section) => (
        <ThreadNode
          key={`city-thread-${segment.id}-${section.id}`}
          badge={section.tone === "sightseeing" ? "장소" : "이동"}
          tone={section.tone === "sightseeing" ? "teal" : "dark"}
        >
          <div className="rounded-lg border border-field-line bg-white p-3">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-field-ink">{section.label}</h3>
              </div>
              <span className="rounded bg-field-surface px-2 py-1 text-[10px] font-extrabold text-field-forest/65">
                {section.places.length}
              </span>
            </div>

            <div className="grid gap-2">
              {section.places.map((place) => (
                section.tone === "sightseeing" ? (
                  <MustSeePlaceCard
                    key={`sight-card-${place.id}`}
                    place={place}
                    pin={getPlacePin(mapPlaces, place)}
                    onSelect={() => onSelectPlace(place)}
                  />
                ) : (
                  <CompactPlaceCard
                    key={`compact-card-${place.id}`}
                    place={place}
                    pin={getPlacePin(segment.innerStops, place)}
                    tone={section.tone}
                    onSelect={() => onSelectPlace(place)}
                  />
                )
              ))}
            </div>
          </div>
        </ThreadNode>
      ))}

      <ThreadNode badge="팁" tone="dark">
        <div className="rounded-lg border border-field-line bg-white p-3">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-field-forest/50">Guide hints</p>
          <ul className="grid gap-1.5 text-xs font-semibold leading-relaxed text-field-forest/70">
            {notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-field-teal" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </ThreadNode>
    </div>
  );
}

function ThreadNode({
  badge,
  tone,
  children
}: {
  badge: string;
  tone: "teal" | "brass" | "dark";
  children: ReactNode;
}) {
  const toneClass =
    tone === "brass"
      ? "bg-field-brass text-white"
      : tone === "teal"
        ? "bg-field-teal text-white"
        : "bg-field-ink text-white";

  return (
    <div className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
      <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-[9px] font-extrabold ${toneClass}`}>
        {badge}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function MustSeePlaceCard({
  place,
  pin,
  onSelect
}: {
  place: DailyGuidePlace;
  pin: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="overflow-hidden rounded-lg border border-field-line bg-field-surface/45 text-left transition hover:border-field-teal"
    >
      <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] gap-3 p-2.5">
        <div className="relative h-24 overflow-hidden rounded-md bg-field-mist">
          {place.image ? (
            <GuideImage src={place.image} alt={place.imageAlt || place.name} className="absolute inset-0 h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-field-teal-soft text-field-teal">
              <MapPinned className="h-6 w-6" />
            </div>
          )}
          <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-field-teal text-[10px] font-extrabold text-white">
            {pin}
          </span>
        </div>
        <div className="min-w-0 py-0.5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="rounded bg-white px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-field-teal">
              Place
            </span>
            {getSpotDuration(place) && (
              <span className="shrink-0 text-[10px] font-extrabold text-field-forest/60">{getSpotDuration(place)}</span>
            )}
          </div>
          <h4 className="truncate text-base font-extrabold text-field-ink">{place.name}</h4>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-field-forest/70">
            {getPlaceWhyLine(place)}
          </p>
        </div>
      </div>
    </button>
  );
}

function CompactPlaceCard({
  place,
  pin,
  tone,
  onSelect
}: {
  place: DailyGuidePlace;
  pin: number;
  tone: "support";
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-field-line bg-field-surface/45 p-2 text-left transition hover:border-field-teal"
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${
        "bg-field-ink"
      }`}>
        {pin}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-extrabold text-field-ink">{place.name}</span>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase ${
            "bg-white text-field-forest/60"
          }`}>
            Move
          </span>
        </span>
        <span className="mt-0.5 block line-clamp-1 text-[11px] font-semibold text-field-forest/60">
          {getSpotSummary(place)}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-field-teal" />
    </button>
  );
}

function getPlacePin(places: DailyGuidePlace[], place: DailyGuidePlace) {
  return Math.max(1, places.findIndex((item) => item.id === place.id) + 1);
}

function getPlaceWhyLine(place: DailyGuidePlace) {
  if (Array.isArray(place.whyVisit) && place.whyVisit.length > 0) {
    return place.whyVisit[0];
  }
  return getSpotSummary(place);
}

function GuideSummary({
  guide,
  statusChips,
  mustSeeCount,
  hiddenGemCount,
  totalDistanceLabel
}: {
  guide: DailyGuide;
  statusChips: string[];
  mustSeeCount: number;
  hiddenGemCount: number;
  totalDistanceLabel: string;
}) {
  const baseLabel = guide.accommodation?.name || "숙소 확인 필요";

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-field-line bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="border-b border-field-line bg-field-mist/45 px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-field-teal">Guide summary</p>
            <h2 className="mt-1 text-xl font-extrabold leading-6 text-field-ink">{guide.title}</h2>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-field-forest/65">{guide.deck}</p>
          </div>
          <span className="shrink-0 rounded-md bg-field-forest px-2.5 py-1.5 text-[10px] font-extrabold text-white">
            {formatDailyHeaderDate(guide.date)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-field-line sm:grid-cols-4">
        <SummaryMetric icon={<CalendarDays className="h-4 w-4" />} label="Date" value={formatDailyHeaderDate(guide.date)} />
        <SummaryMetric icon={<Navigation className="h-4 w-4" />} label="Move" value={getTransportModeLabel(guide.transportMode)} />
        <SummaryMetric icon={<MapPinned className="h-4 w-4" />} label="Route" value={totalDistanceLabel} />
        <SummaryMetric icon={<Hotel className="h-4 w-4" />} label="Base" value={baseLabel} />
      </div>

      {guide.accommodation && (
        <div className="border-b border-field-line px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-field-teal">Accommodation</p>
              <h3 className="mt-1 truncate text-sm font-extrabold text-field-ink">{guide.accommodation.name}</h3>
            </div>
            <div className="flex shrink-0 gap-1.5">
              {guide.accommodation.googleMapsUrl && (
                <a href={guide.accommodation.googleMapsUrl} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-md border border-field-line bg-white text-field-forest transition hover:bg-field-surface" aria-label={`${guide.accommodation.name} Google Maps`}>
                  <Navigation className="h-3.5 w-3.5" />
                </a>
              )}
              {guide.accommodation.airbnbUrl && (
                <a href={guide.accommodation.airbnbUrl} target="_blank" rel="noreferrer" className="flex h-8 items-center justify-center gap-1 rounded-md bg-[#FF385C] px-2 text-[10px] font-extrabold text-white">
                  Airbnb
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          <p className="flex min-w-0 gap-1.5 break-words text-xs font-semibold leading-relaxed text-field-forest/70 [overflow-wrap:anywhere]">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-field-teal" />
            <span className="min-w-0">{guide.accommodation.address}</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-md bg-field-surface px-3 py-2">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-field-forest/55">Check-in</p>
              <p className="mt-0.5 text-sm font-extrabold text-field-ink">{guide.accommodation.checkIn ?? "-"}</p>
            </div>
            <div className="rounded-md bg-field-surface px-3 py-2">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-field-forest/55">Check-out</p>
              <p className="mt-0.5 text-sm font-extrabold text-field-ink">{guide.accommodation.checkOut ?? "-"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-4">
        <GuideCount label="Places" value={mustSeeCount + hiddenGemCount} tone="plain" />
        <GuideCount label="Mapped" value={statusChips[1]} tone="plain" />
        <GuideCount label="Stops" value={statusChips[0]} tone="plain" />
        <GuideCount label="Guide" value="Ready" tone="plain" />
      </div>
    </section>
  );
}

function SummaryMetric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 border-field-line px-4 py-3 odd:border-r sm:border-r sm:last:border-r-0">
      <div className="mb-1 flex items-center gap-1.5 text-field-teal">
        {icon}
        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="truncate text-xs font-extrabold text-field-ink">{value}</p>
    </div>
  );
}

function GuideCount({
  label,
  value,
  tone
}: {
  label: string;
  value: number | string;
  tone: "must" | "hidden" | "plain";
}) {
  const toneClass =
    tone === "must"
      ? "border-field-brass/40 bg-field-brass/10 text-field-brass"
      : tone === "hidden"
        ? "border-field-teal/35 bg-field-teal-soft/65 text-field-teal"
        : "border-field-line bg-field-surface text-field-forest/70";

  return (
    <div className={`rounded-md border px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-sm font-extrabold">{value}</p>
    </div>
  );
}

function PlacePrioritySections({
  groups,
  onSelectPlace
}: {
  groups: ReturnType<typeof groupGuidePlaces>;
  onSelectPlace: (place: DailyGuidePlace) => void;
}) {
  const sightseeingPlaces = [...groups.mustSee, ...groups.hidden];
  const sections = [
    {
      id: "sightseeing",
      label: "관광지",
      places: sightseeingPlaces,
      tone: "plain" as const
    }
  ].filter((section) => section.places.length > 0);

  if (sections.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-field-teal">Curated guide</p>
          <h2 className="mt-1 text-lg font-extrabold text-field-ink">도시 내 관광지</h2>
        </div>
        <span className="rounded-md border border-field-line bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-field-forest/60">
          {sightseeingPlaces.length} places
        </span>
      </div>

      <div className="grid gap-3">
        {sections.map((section) => (
          <div key={section.id} className="rounded-lg border border-field-line bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.035)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-field-ink">{section.label}</h3>
              </div>
              <span className="rounded bg-field-surface px-2 py-1 text-[10px] font-extrabold text-field-forest/65">
                {section.places.length}
              </span>
            </div>

            <div className="grid gap-2">
              {section.places.map((place) => (
                <button
                  key={`priority-${place.id}`}
                  onClick={() => onSelectPlace(place)}
                  className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-field-line/70 bg-field-surface/45 p-2 text-left transition hover:border-field-teal hover:bg-field-teal-soft/25"
                >
                  <div className="relative h-14 overflow-hidden rounded-md border border-field-line bg-field-mist">
                    {place.image ? (
                      <GuideImage src={place.image} alt={place.imageAlt || place.name} className="absolute inset-0 h-full w-full" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-extrabold text-field-forest/45">
                        Place
                      </div>
                    )}
                  </div>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-field-ink">{place.name}</span>
                    <span className="mt-0.5 block line-clamp-2 text-[11px] font-semibold leading-relaxed text-field-forest/65">
                      {getSpotSummary(place)}
                    </span>
                  </span>
                  <span className="grid justify-items-end gap-1">
                    {getSpotDuration(place) && (
                      <span className="rounded bg-white px-2 py-1 text-[9px] font-extrabold text-field-forest/60">
                        {getSpotDuration(place)}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-field-teal" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function getTransportModeLabel(mode: DailyGuide["transportMode"]) {
  switch (mode) {
    case "rental-car":
      return "렌트카 이동";
    case "taxi":
      return "택시 이동";
    case "flight":
      return "항공 이동";
    case "train":
      return "기차 이동";
    case "ferry":
      return "페리 이동";
    case "walk":
      return "도보 이동";
    case "transit":
      return "대중교통";
    default:
      return "이동수단 확인";
  }
}

function getSpotSummary(place: DailyGuidePlace) {
  if ("shortDescription" in place && typeof place.shortDescription === "string" && place.shortDescription.trim()) {
    return place.shortDescription;
  }

  return place.description || place.category;
}

function getSpotDuration(place: DailyGuidePlace) {
  if ("duration" in place && typeof place.duration === "string" && place.duration.trim()) {
    return place.duration;
  }

  return null;
}

function getFlightTicketsForDate(tickets: FlightTicket[], date: string, includeFinalArrival = false) {
  const dateLabel = formatTicketDateLabel(date);
  const airTickets = tickets.filter(isAirTicket);
  const departingTickets = airTickets.filter((ticket) => ticket.segments[0]?.from.dateLabel === dateLabel);

  if (departingTickets.length > 0 || !includeFinalArrival) {
    return departingTickets;
  }

  return airTickets.filter((ticket) => {
    const finalSegment = ticket.segments[ticket.segments.length - 1];
    return finalSegment?.to.dateLabel === dateLabel;
  });
}

function isAirTicket(ticket: FlightTicket) {
  return ticket.segments.some((segment) => {
    const text = `${segment.flightNo} ${segment.airlineName} ${segment.airlineCode}`.toLowerCase();
    return !text.includes("intercity") && !text.includes("train") && !text.includes("notte");
  });
}

function isTravelLogisticsPlace(place: DailyGuidePlace) {
  const text = `${place.name} ${place.category}`.toLowerCase();
  return (
    text.includes("공항") ||
    text.includes("airport") ||
    text.includes("기차역") ||
    text.includes("station") ||
    text.includes("termini") ||
    text.includes("centrale")
  );
}

function isSightseeingPlace(place: DailyGuidePlace) {
  const text = `${place.name} ${place.category}`.toLowerCase();
  const logisticsTerms = [
    "공항",
    "airport",
    "기차역",
    "station",
    "termini",
    "centrale",
    "숙소",
    "거점",
    "체크인",
    "도착",
    "터미널",
    "terminal",
    "ferry terminal",
    "이동 기준",
    "mgarr harbour gozo"
  ];

  return !logisticsTerms.some((term) => text.includes(term));
}

function getSegmentSightseeingStops(spots: DailyGuidePlace[]) {
  const filtered = spots.filter(isSightseeingPlace);
  const groups = groupGuidePlaces(filtered);
  const prioritized = [...groups.mustSee, ...groups.hidden];
  return prioritized.length > 0 ? prioritized : filtered;
}

function formatTicketDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`;
}

function formatDailyHeaderDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  ];

  return `${month}/${day} ${weekday}`;
}

function buildCompactRouteStops(
  routeStops: Array<{
    id: string;
    label: string;
    name: string;
    detail: string;
    legDistanceKm: number | null;
    legTimeLabel: string;
  }>,
  citySegments: Array<{
    id: string;
    name: string;
    detail: string;
    index: number;
    legDistanceKm: number | null;
    legTimeLabel: string;
    innerStops: DailyGuidePlace[];
    cityVisit?: DailyCityVisit | null;
  }>,
  isCityTransferDay: boolean
): RouteStopSummary[] {
  if (!isCityTransferDay) {
    return routeStops.map((stop) => ({
      ...stop,
      kind: "transport" as const
    }));
  }

  const compactStops = citySegments.map((segment) => ({
    id: `city-${segment.id}`,
    label: String(segment.index + 1),
    name: segment.name,
    detail: "",
    legDistanceKm: segment.legDistanceKm,
    legTimeLabel: segment.legTimeLabel,
    kind: "city" as const
  }));

  return compactStops.filter((stop, index, all) => {
    const previous = all[index - 1];
    return !(previous && previous.name === stop.name && previous.kind === stop.kind);
  });
}

function groupGuidePlaces(places: DailyGuidePlace[]) {
  return places.reduce(
    (groups, place) => {
      const category = place.category.toLowerCase();

      if (category.includes("꼭") || category.includes("must")) {
        groups.mustSee.push(place);
      } else if (category.includes("숨은") || category.includes("hidden")) {
        groups.hidden.push(place);
      } else {
        groups.other.push(place);
      }

      return groups;
    },
    {
      mustSee: [] as DailyGuidePlace[],
      hidden: [] as DailyGuidePlace[],
      other: [] as DailyGuidePlace[]
    }
  );
}

function inferStayLabel(distanceKm: number | null, category?: string) {
  const normalized = category?.toLowerCase() ?? "";

  if (normalized.includes("meal") || normalized.includes("식사") || normalized.includes("카페")) {
    return "45-75m stay";
  }

  if (normalized.includes("전망") || normalized.includes("view")) {
    return "30-60m stay";
  }

  if (distanceKm !== null && distanceKm >= 40) {
    return "short stop";
  }

  return "1-2h stay";
}
