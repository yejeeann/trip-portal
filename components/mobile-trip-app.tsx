"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Route,
  CalendarDays,
  Images,   
  Luggage,
  MapPin,
  MapPinned,
  Clock3,
  ChevronRight,
  Plane,
  Hotel,
  Navigation,
  X,
  ExternalLink,
  Sparkles
} from "lucide-react";
import type { Trip, AppDesignConfig } from "@/lib/types";
import type { DailyGuide, DailyGuidePlace, FlightTicket, MasterTimelineItem } from "@/lib/swiss-guide-data";
import { OsmMap } from "./osm-map";
import { MultiOsmMap } from "./multi-osm-map";
import { optimizeRouteAction, generateMapLinkAction } from "@/lib/mcp-actions";
import { PlaceBottomSheet } from "./place-detail";
import { useDailyMapMarkers } from "@/lib/daily-map-markers-client";
import { AirlineLogo } from "./airline-logo";

type MobileTripTab = "home" | "route" | "daily" | "sights" | "logistics";

export function MobileTripApp({
  trip,
  dailyGuides,
  guideData,
  uiConfig
}: {
  trip: Trip;
  dailyGuides: DailyGuide[];
  guideData: { flightTickets: FlightTicket[]; masterTimeline: MasterTimelineItem[] };
  uiConfig?: AppDesignConfig;
}) {
  const [activeTab, setActiveTab] = useState<MobileTripTab>("daily");
  const [selectedPlace, setSelectedPlace] = useState<{place: DailyGuidePlace, region: string} | null>(null);
  const allPlaces = useMemo(
    () => dailyGuides.flatMap((g) => g.places.map((p) => ({ ...p, day: g.day, region: g.region }))),
    [dailyGuides]
  );

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#F9F7F2] font-sans text-[#2D2D2D] selection:bg-[#1A434E]/20">
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
          {activeTab === "daily" && <DailyMenu guides={dailyGuides} trip={trip} uiConfig={uiConfig} onSelectPlace={(place, region) => setSelectedPlace({ place, region })} />}
          {activeTab === "home" && <HomeMenu trip={trip} items={guideData.masterTimeline} />}
          {activeTab === "route" && <RouteMenu trip={trip} items={guideData.masterTimeline} />}
          {activeTab === "sights" && <SightsMenu places={allPlaces} tripId={trip.id} onSelectPlace={(place, region) => setSelectedPlace({ place, region })} />}
          {activeTab === "logistics" && <LogisticsMenu tickets={guideData.flightTickets} />}
          
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <PlaceBottomSheet 
        place={selectedPlace?.place || null} 
        region={selectedPlace?.region || ""} 
        onClose={() => setSelectedPlace(null)} 
      />
    </div>
  );
}

function DailyMenu({ guides, trip, uiConfig, onSelectPlace }: { guides: DailyGuide[]; trip: Trip; uiConfig?: AppDesignConfig; onSelectPlace: (place: DailyGuidePlace, region: string) => void }) {
  const [selectedDay, setSelectedDay] = useState(guides[0]?.day || 1);
  const [selectedCityOverview, setSelectedCityOverview] = useState<DailyGuide | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const guide = guides.find((g) => g.day === selectedDay) || guides[0];
  const { markers, isLoading: isMapMarkersLoading, isSmartFill } = useDailyMapMarkers({ guide, trip });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setActionMessage(null);
  }, [selectedDay]);

  const handleOptimizeRoute = async () => {
    if (!guide) return;
    setIsOptimizing(true);
    const city = guide.region?.split(" / ")[0] || guide.region;
    const stops = guide.places.map(p => ({ name: p.name, category: p.category }));
    
    try {
      const res = await optimizeRouteAction(city, stops);
      if (res.data) {
        setActionMessage("동선 최적화가 완료되었습니다. 지도와 방문 순서를 확인해 주세요.");
      } else {
        setActionMessage(`최적화 실패: ${res.error}`);
      }
    } catch (e) {
      setActionMessage("최적화 중 오류가 발생했습니다.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleOpenMap = async () => {
    if (!guide) return;
    setIsMapLoading(true);
    const city = guide.region?.split(" / ")[0] || guide.region;
    const stops = guide.places.map(p => ({ name: p.name }));
    
    try {
      const res = await generateMapLinkAction(city, stops);
      const mapUrl =
        res.data && typeof res.data === "object" && "map_url" in res.data
          ? String((res.data as { map_url?: unknown }).map_url || "")
          : "";

      if (mapUrl) {
        window.open(mapUrl, "_blank");
      } else {
        setActionMessage(`지도 링크 생성 실패: ${res.error}`);
      }
    } catch (e) {
      setActionMessage("지도 링크 생성 중 오류가 발생했습니다.");
    } finally {
      setIsMapLoading(false);
    }
  };

  if (!guide) return null;
  const headerDateLabel = formatDailyHeaderDate(guide.date);

  return (
    <div className="flex h-full flex-col bg-[#F9F7F2]">
      {/* Fixed Header */}
      <div className="z-40 flex shrink-0 flex-col border-b border-[#E6DAC8] bg-[#F9F7F2]/95 backdrop-blur-xl">
        <div className="flex items-end justify-between px-6 py-4">
          <div>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#B98045]">The Journal</span>
            <h1 className="font-serif text-3xl font-semibold leading-none text-[#2D2D2D]">{headerDateLabel}</h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#6B6861]">Day {guide.day}</p>
          </div>
          <div className="pb-0.5 text-right">
            <span className="text-xs font-medium uppercase tracking-widest text-[#1A434E]">{guide.region?.split(" / ")[0]}</span>
          </div>
        </div>
        {/* Day Selector (Instagram Story Style) */}
        <div className="flex gap-4 overflow-x-auto px-6 pb-5 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {guides.map((g) => {
            const isActive = selectedDay === g.day;
            const coverImage = g.places[0]?.image; // 첫 번째 장소 이미지를 스토리 커버로 사용

            return (
              <button
                key={g.id}
                onClick={() => setSelectedDay(g.day)}
                className="group flex flex-col items-center gap-1.5 shrink-0 outline-none"
              >
                <div className={`relative p-[2.5px] rounded-full transition-all duration-300 ${
                  isActive 
                    ? "scale-105 bg-[#D4A373] shadow-md" 
                    : "scale-100 bg-[#E6DAC8] hover:bg-[#D4A373]/55"
                }`}>
                  <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-white bg-[#F9F7F2]">
                    {coverImage ? (
                      <>
                        <Image src={coverImage} alt={`Day ${g.day}`} fill sizes="56px" className="object-cover opacity-90" />
                        <div className="absolute inset-0 bg-black/10" />
                        <span className="relative z-10 font-serif text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {g.day}
                        </span>
                      </>
                    ) : (
                      <span className={`font-serif text-xl font-bold transition-colors ${
                        isActive ? "text-[#2D2D2D]" : "text-[#8A8174] group-hover:text-[#1A434E]"
                      }`}>
                        {g.day}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isActive ? "text-[#2D2D2D]" : "text-[#8A8174]"
                }`}>
                  {formatDailyHeaderDate(g.date, false)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Section (Fixed below header) */}
      <div className="relative z-0 h-[35vh] w-full shrink-0 overflow-hidden bg-[#EFE8DB]">
        {isMapMarkersLoading ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#EFE8DB] text-sm font-bold text-[#6B6861]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E6DAC8] border-t-[#1A434E]" />
            동선 불러오는 중...
          </div>
        ) : markers.length > 1 ? (
          <MultiOsmMap 
            markers={markers} 
            className="h-full w-full" 
            onMarkerClick={(id) => {
              const place = guide.places.find((p) => p.id === id);
              if (place) onSelectPlace(place, guide.region);
            }}
          />
        ) : markers.length === 1 && markers[0] ? (
          <OsmMap
            query={`${markers[0].lat},${markers[0].lng}`}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#EFE8DB] text-sm font-bold text-[#6B6861]">
            지도 데이터가 부족합니다.
          </div>
        )}
      </div>

      {/* Scrollable Timeline Overlay */}
      <div ref={scrollRef} className="relative z-10 -mt-6 flex-1 overflow-y-auto rounded-t-[1.75rem] bg-[#F9F7F2] pt-6 shadow-[0_-8px_20px_rgba(45,45,45,0.08)]">
        <div className="px-4 pb-28">
          {/* Bento Grid Header */}
          <div className="mb-8 grid grid-cols-2 gap-3">
            <div
              onClick={() => setSelectedCityOverview(guide)}
              className="group relative col-span-2 cursor-pointer overflow-hidden rounded-[1.5rem] border border-[#1A434E] bg-[#1A434E] text-white shadow-md transition-transform active:scale-[0.98]"
            >
              {guide.places[0]?.image && (
                <Image src={guide.places[0].image} alt={guide.region} fill className="object-cover opacity-40 mix-blend-overlay transition-transform duration-700 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A434E] via-[#1A434E]/45 to-transparent" />
              <div className="relative p-5 flex flex-col justify-end h-full min-h-[140px]">
                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D4A373]"><Sparkles className="h-3 w-3"/> City Brief</span>
                <div className="flex items-end justify-between">
                  <h3 className="font-serif text-2xl font-bold">{guide.region}</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons in Bento */}
            <button
              onClick={handleOptimizeRoute}
              disabled={isOptimizing}
              className="col-span-1 flex flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-[#E6DAC8] bg-white p-4 shadow-sm transition hover:border-[#D4A373] hover:bg-[#FFFDF8] active:scale-[0.98] disabled:opacity-50"
            >
              {isOptimizing ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E6DAC8] border-t-[#1A434E]" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A434E] text-white shadow-inner"><Sparkles className="h-4 w-4 text-white" /></div>}
              <span className="text-center text-[11px] font-bold tracking-wide text-[#2D2D2D]">스마트 동선<br/>최적화</span>
            </button>
            <button
              onClick={handleOpenMap}
              disabled={isMapLoading}
              className="col-span-1 flex flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-[#E6DAC8] bg-white p-4 shadow-sm transition hover:border-[#D4A373] hover:bg-[#FFFDF8] active:scale-[0.98] disabled:opacity-50"
            >
              {isMapLoading ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E6DAC8] border-t-[#1A434E]" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F9F7F2] text-[#1A434E]"><MapPin className="h-4 w-4" /></div>}
              <span className="text-center text-[11px] font-bold tracking-wide text-[#2D2D2D]">지도 앱에서<br/>보기</span>
            </button>

            {actionMessage && (
              <div className="col-span-2 rounded-lg border border-[#D4A373]/45 bg-[#FFFDF8] px-4 py-3 text-xs font-bold leading-relaxed text-[#1A434E]">
                {actionMessage}
              </div>
            )}
          </div>

          {/* Quick Route Summary */}
          {guide.places.length > 0 && (
            <div className="mb-6 rounded-[1.5rem] border border-[#E6DAC8] bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#B98045]">Movement Route</h3>
              <div className="flex flex-wrap items-center gap-2">
                {guide.places.map((place, idx) => (
                  <div key={`summary-${place.id}`} className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E7F0EE] text-[10px] font-bold text-[#1A434E]">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-[#2D2D2D]">{place.name}</span>
                    {idx < guide.places.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-[#D4A373]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Movement Timeline */}
          <div className="relative mt-2 pb-8">
            {/* AI Smart Fill (임시 일정이거나 비어있는 날에만 MCP가 빈 공간을 채움) */}
            {isSmartFill ? (
              (guide.region ? guide.region.split("/").map(s => s.trim()).filter(Boolean) : []).map((city, idx, arr) => (
                <motion.div
                  key={`city-node-${city}`}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  className="group relative flex gap-3 pb-6"
                >
                  <div className={`absolute bottom-[-10px] left-[19px] top-10 w-[2px] transition-all duration-300 ${idx === arr.length - 1 && !guide.accommodation ? 'hidden' : 'bg-gradient-to-b from-[#D4A373]/60 via-[#E6DAC8] to-[#E6DAC8] group-hover:from-[#1A434E]/75'}`} />

                  <div className="relative flex w-10 shrink-0 flex-col items-center pt-1">
                    <span className="mb-2 block rounded-full border border-[#1A434E] bg-[#1A434E] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white shadow-sm">
                      City
                    </span>
                    <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-[2.5px] border-[#F9F7F2] bg-[#1A434E] shadow-sm transition-transform group-hover:scale-110">
                      <MapPinned className="h-2 w-2 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden rounded-[1.5rem] border border-[#E6DAC8] bg-white/80 shadow-sm backdrop-blur-xl transition-all hover:border-[#D4A373] hover:shadow-md">
                    <div className="p-4">
                      <h3 className="mb-3 text-lg font-bold tracking-tight text-[#2D2D2D]">📍 {city}</h3>
                      <div className="rounded-lg border border-[#E6DAC8] bg-white p-3.5 shadow-sm">
                        <DynamicCityAttractions city={city} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              guide.places.map((place, idx) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="group relative flex gap-3 pb-6"
                >
                  {/* Vertical Connection Line */}
                  <div className={`absolute bottom-[-10px] left-[19px] top-10 w-[2px] transition-all duration-300 ${idx === guide.places.length - 1 && !guide.accommodation ? 'hidden' : 'bg-gradient-to-b from-[#D4A373]/60 via-[#E6DAC8] to-[#E6DAC8] group-hover:from-[#1A434E]/75 group-hover:via-[#D4A373]/50 group-hover:to-[#E6DAC8]'}`} />

                  {/* Time & Node */}
                  <div className="relative flex w-10 shrink-0 flex-col items-center pt-1">
                    <span className="mb-2 block rounded-full border border-[#E6DAC8] bg-white px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#6B6861] shadow-sm">
                      {place.timeLabel || "--:--"}
                    </span>
                    <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-[2.5px] border-[#F9F7F2] bg-[#1A434E] shadow-sm transition-transform group-hover:scale-110">
                      <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                    </div>
                  </div>

                  {/* Card */}
                  <div
                    onClick={() => onSelectPlace(place, guide.region)}
                    className="flex-1 cursor-pointer overflow-hidden rounded-[1.5rem] border border-[#E6DAC8] bg-white/90 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-[#D4A373] hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 p-3 sm:p-4">
                      {place.image && (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#E6DAC8] shadow-sm">
                          <Image
                            src={place.image}
                            alt={place.imageAlt || place.name}
                            fill
                            sizes="80px"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate text-[9px] font-bold uppercase tracking-widest text-[#B98045]">
                            {place.category}
                          </span>
                        </div>
                        <h3 className="mb-1 truncate font-serif text-base font-semibold text-[#2D2D2D] transition-colors group-hover:text-[#1A434E]">
                          {place.name}
                        </h3>
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-[#6B6861]">
                          {place.description}
                        </p>
                      </div>
                    </div>
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
                className="relative flex gap-3 pt-2"
              >
                <div className="relative flex w-10 shrink-0 flex-col items-center pt-1">
                  <span className="mb-2 block text-[9px] font-bold tracking-wider text-[#8A8174]">
                    {guide.accommodation.checkIn ? "Check-in" : "Stay"}
                  </span>
                  <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-[2.5px] border-[#F9F7F2] bg-[#1A434E] shadow-sm transition-transform group-hover:scale-110">
                    <Hotel className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div className="flex-1 rounded-[1.5rem] border border-[#E6DAC8] bg-white p-4 shadow-sm transition hover:border-[#D4A373] hover:shadow-md">
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[#B98045]">
                        Basecamp
                      </div>
                      <h3 className="mb-1 font-serif text-base font-semibold leading-tight text-[#2D2D2D]">
                        {guide.accommodation.name}
                      </h3>
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-[#6B6861]">
                        {guide.accommodation.address}
                      </p>
                    </div>
                    {guide.accommodation.googleMapsUrl && (
                      <a href={guide.accommodation.googleMapsUrl} target="_blank" rel="noreferrer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E6DAC8] bg-[#F9F7F2] text-[#1A434E] transition hover:bg-[#EFE8DB] active:bg-[#EFE8DB]">
                        <Navigation className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
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
              className="fixed inset-0 z-50 bg-[#1A434E]/40 backdrop-blur-sm"
              onClick={() => setSelectedCityOverview(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92dvh] min-h-[70dvh] flex-col overflow-y-auto rounded-t-[1.75rem] border-t border-[#E6DAC8] bg-white p-6 pb-12 shadow-[0_-10px_40px_rgba(45,45,45,0.12)]"
            >
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-[#E6DAC8]" />
              <button
                onClick={() => setSelectedCityOverview(null)}
                className="absolute right-6 top-6 rounded-full bg-slate-50 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Day {selectedCityOverview.day} Overview</span>
              <h2 className="mb-4 mt-1 font-serif text-3xl font-bold text-slate-900">{selectedCityOverview.region}</h2>

              {selectedCityOverview.places[0]?.image && (
                <div className="relative mb-6 h-48 w-full overflow-hidden rounded-2xl border border-slate-100">
                  <Image src={selectedCityOverview.places[0].image} alt={selectedCityOverview.region} fill className="object-cover" />
                </div>
              )}

              <p className="mb-8 font-serif text-sm leading-loose text-slate-600">
                {selectedCityOverview.deck}
              </p>

              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-serif text-xl font-bold text-slate-900">Sights & Places</h3>
                <span className="text-xs font-bold text-slate-400">{selectedCityOverview.places.length} spots</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedCityOverview.places.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => onSelectPlace(place, selectedCityOverview.region)}
                    className="group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-xl border border-slate-100 shadow-sm"
                  >
                    <Image src={place.image} alt={place.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-sky-300">{place.category}</span>
                      <h4 className="font-serif text-sm font-bold leading-tight">{place.name}</h4>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <DynamicCityAttractions city={selectedCityOverview.region} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DynamicCityAttractions({ city }: { city: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-sky-500" />
        <h3 className="font-serif text-base font-bold text-slate-900">정적 관광지 데이터 필요</h3>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-slate-600">
        {city}의 추천 관광지는 앱 실행 중 MCP로 호출하지 않습니다. 개발 중 MCP 보강 스크립트로 정적 데이터에 저장해 표시합니다.
      </p>
    </div>
  );
}

function SightsMenu({ places, tripId, onSelectPlace }: { places: (DailyGuidePlace & { day: number; region: string })[]; tripId: string; onSelectPlace: (place: DailyGuidePlace, region: string) => void }) {

  return (
    <div className="relative flex h-full flex-col overflow-y-auto pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 flex flex-col bg-white/90 backdrop-blur-xl pb-2">
        <div className="flex items-end justify-between px-6 py-4">
          <div>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-sky-600">Travel Gallery</span>
            <h1 className="font-serif text-3xl font-bold leading-none text-slate-900 tracking-tight">Inspiration</h1>
          </div>
          <div className="pb-0.5 text-right">
            <span className="text-xs font-medium uppercase tracking-widest text-slate-500">{places.length} Places</span>
          </div>
        </div>
      </div>

      {/* Places Gallery (Masonry Style) */}
      <div className="columns-2 gap-3 px-4 pt-2">
        {places.map((place, idx) => {
          // 메이슨리 뷰를 위해 랜덤하게 세로 비율을 조금씩 다르게 줍니다.
          const isTall = idx % 3 === 0;
          return (
            <div
              key={place.id}
              onClick={() => onSelectPlace(place, place.region)}
              className={`group relative mb-3 w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-100 shadow-sm break-inside-avoid ${
                isTall ? "aspect-[3/4]" : "aspect-square"
              }`}
            >
              <Image
                src={place.image}
                alt={place.imageAlt || place.name}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent opacity-90" />
              <div className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-md p-1.5 text-white shadow-sm">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <span className="mb-1 inline-block rounded-sm bg-sky-500/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">Day {place.day}</span>
                <h3 className="font-serif text-sm font-bold leading-tight drop-shadow-md">{place.name}</h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HomeMenu({ trip, items }: { trip: Trip; items: MasterTimelineItem[] }) {
  const uniqueCities = Array.from(new Set(items.flatMap((i) => i.cities)));
  const uniqueStays = Array.from(
    new Map(
      items
        .filter((item) => item.accommodation)
        .map((item) => [item.accommodation!.name, item.accommodation])
    ).values()
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto pb-28 bg-white">
      {/* Hero & Intro Section */}
      <div className="relative h-[38svh] min-h-[18rem] max-h-[25rem] w-full shrink-0 bg-slate-900 overflow-hidden">
        <Image src={trip.heroImage} alt={trip.title} fill className="object-cover opacity-50 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-white" />
        <div className="absolute left-4 top-5 z-10 sm:left-6 sm:top-6">
          <span className="backdrop-blur-md bg-white/20 text-white border border-white/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
            {trip.status}
          </span>
        </div>
        <div className="absolute bottom-5 left-4 right-4 z-10 sm:bottom-6 sm:left-6 sm:right-6">
          <h1 className="font-serif text-3xl font-bold leading-tight text-slate-900 drop-shadow-sm sm:text-5xl">{trip.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 drop-shadow-sm sm:gap-3 sm:text-sm">
             <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4 text-sky-600"/> {items.length} Days</span>
             <span className="w-1 h-1 rounded-full bg-slate-300"></span>
             <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-sky-600"/> {trip.countries.join(", ")}</span>
          </div>
        </div>
      </div>

      <div className="px-0 mt-5 space-y-8 sm:mt-6 sm:space-y-10">
        {/* Timeline Carousel */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 sm:px-6">
            <h2 className="text-xl font-serif font-bold text-slate-900">Journey at a Glance</h2>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-4 snap-x snap-mandatory sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((item) => (
              <Link key={item.id} href={`/trips/${trip.id}/day/${item.day}`} className="snap-start shrink-0 w-[8.75rem] sm:w-[150px] relative overflow-hidden bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-center cursor-pointer hover:border-sky-200 hover:shadow-md transition-all">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500" />
                <div className="pl-2 flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Day {item.day}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.dateLabel}</span>
                </div>
                <div className="pl-2 text-sm font-bold text-slate-900 truncate">
                  {item.cities[0] || item.primaryRoute.split(' - ')[0]}
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Basecamps List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 sm:px-6">
            <h2 className="text-xl font-serif font-bold text-slate-900">Basecamps</h2>
          </div>
          
          <div className="flex gap-4 overflow-x-auto px-4 pb-6 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {uniqueStays.map((acc, idx) => (
              <div key={idx} className="shrink-0 w-[13.5rem] sm:w-[240px] flex flex-col gap-3 group cursor-pointer">
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 transition-shadow group-hover:shadow-md">
                  <Hotel className="w-10 h-10 text-slate-300" />
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/80 backdrop-blur-md text-slate-700 flex items-center justify-center font-bold font-serif text-xs shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl"></div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm truncate">{acc!.name}</h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{acc!.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Summary Note */}
        <div className="mx-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm sm:mx-6 sm:p-5">
           <h3 className="font-serif font-bold text-slate-900 mb-2">Trip Summary</h3>
           <p className="text-sm text-slate-600 leading-relaxed">
             총 <strong>{trip.itinerary.length}일</strong> 동안 <strong>{trip.countries.join(", ")}</strong>를 여행하는 일정입니다. 
             상세한 이동 경로와 지도는 <strong>Route</strong> 탭에서, 매일의 방문지와 일정은 <strong>Daily</strong> 탭에서 확인하세요.
           </p>
        </div>
      </div>
    </div>
  );
}

function LogisticsMenu({ tickets }: { tickets: FlightTicket[] }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto pb-28">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex justify-between items-end">
        <div>
          <span className="text-[10px] text-sky-600 font-bold uppercase tracking-widest block mb-1">Preparation</span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 leading-none">Logistics</h1>
        </div>
      </div>

      <div className="px-6 space-y-6 mt-8">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Plane className="w-5 h-5 text-slate-400" />
          <h2 className="text-xl font-serif font-bold text-slate-900">Transport Schedule</h2>
        </div>
        
        {tickets.map((ticket) => {
          const firstSegment = ticket.segments[0];

          return (
          <div key={ticket.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-colors hover:shadow-md">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <AirlineLogo code={firstSegment?.airlineCode} name={firstSegment?.airlineName} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold uppercase tracking-wider text-slate-500">{ticket.title}</div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-400">{firstSegment?.airlineName}</div>
                </div>
              </div>
              <div className="shrink-0 text-[11px] font-semibold text-sky-600">{ticket.dateLabel}</div>
            </div>
            
            {ticket.segments.map((seg, idx) => (
              <div key={seg.flightNo} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center text-slate-900">
                  <div className="text-center min-w-[3rem]">
                    <div className="text-3xl font-serif font-bold">{seg.from.code}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{seg.from.time}</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
                    <div className="w-full border-t border-dashed border-slate-200 absolute top-1/2 -translate-y-1/2" />
                    <Plane className="w-4 h-4 text-slate-300 bg-white px-0.5 relative z-10" />
                    <span className="text-[9px] text-slate-400 mt-1 absolute top-3 bg-white px-1">{seg.duration}</span>
                  </div>
                  <div className="text-center min-w-[3rem]">
                    <div className="text-3xl font-serif font-bold">{seg.to.code}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{seg.to.time}</div>
                  </div>
                </div>
                {idx < ticket.segments.length - 1 && (
                  <div className="flex items-center justify-center my-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-[9px] text-slate-500 font-medium">
                      <Clock3 className="w-3 h-3 text-slate-400" /> {ticket.connectionLabel}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="text-xs font-bold text-slate-400 uppercase">
                {ticket.segments.map(seg => seg.flightNo).join(" / ")}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase">
                {ticket.segments.length - 1} Stop
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function RouteMenu({ trip, items }: { trip: Trip; items: MasterTimelineItem[] }) {
  // 실제 일정 데이터에서 좌표를 추출하여 마커(다중 지도)를 생성합니다.
  const markers = trip.itinerary
    .filter(day => day.coordinates && day.coordinates.lat && day.coordinates.lng)
    .filter(day => {
      const norm = day.city.trim().toLowerCase();
      return !["seoul", "서울", "incheon", "인천", "doha", "dubai", "abu dhabi", "transit"].some(ex => norm.includes(ex));
    })
    .map(day => ({
      lat: day.coordinates.lat,
      lng: day.coordinates.lng,
      label: String(day.day),
      onClickUrl: `/trips/${trip.id}/day/${day.day}`
    }));

  return (
    <div className="flex h-full flex-col">
      <div className="relative z-0 h-[40vh] w-full shrink-0 overflow-hidden bg-slate-200">
        <MultiOsmMap markers={markers} className="h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 relative z-10 rounded-t-3xl -mt-6 pt-8 px-6 pb-28 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-1">Interactive Map</p>
            <h2 className="font-serif text-3xl font-bold text-slate-900">Master Route</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-sky-500">
             <Route className="h-5 w-5" />
          </div>
        </div>

        <div className="relative ml-2 space-y-6 pb-8">
          <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-sky-300 via-slate-200 to-transparent" />

          {items.map((item) => (
            <Link key={item.id} href={`/trips/${trip.id}/day/${item.day}`} className="relative block pl-8 group cursor-pointer">
              <div className="absolute left-[4px] top-6 h-2 w-2 rounded-full bg-sky-500 ring-4 ring-white shadow-sm transition-transform group-hover:scale-125" />
              
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all group-hover:shadow-md group-hover:border-sky-100">
                <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-2xl font-bold text-slate-900">{item.dateLabel}</span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{item.weekday}</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-sky-600">
                    Day {item.day}
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-slate-800 leading-snug mb-4">
                  {item.primaryRoute}
                </h3>
                
                <div className="flex flex-col gap-3 text-xs">
                  {item.cities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {item.cities.map(city => (
                        <span key={city} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {city}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.accommodation ? (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Hotel className="h-4 w-4 shrink-0 text-sky-500 mt-0.5" />
                      <div>
                        <div className="text-slate-900 font-bold text-xs leading-tight mb-1">{item.accommodation.name}</div>
                        <div className="text-[10px] text-slate-500 leading-tight">{item.accommodation.address}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Plane className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="text-slate-500 font-medium">{item.note ?? "이동일입니다."}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDailyHeaderDate(date: string, includeWeekday = true) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  if (!includeWeekday) return `${month}/${day}`;

  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  ];

  return `${month}/${day} ${weekday}`;
}

function BottomNav({ activeTab, onTabChange }: { activeTab: MobileTripTab; onTabChange: (tab: MobileTripTab) => void }) {
  const tabs: Array<{ id: MobileTripTab; label: string; icon: typeof Compass }> = [
    { id: "home", label: "Overview", icon: Compass },
    { id: "route", label: "Route", icon: Route },
    { id: "daily", label: "Daily", icon: CalendarDays },
    { id: "sights", label: "Sights", icon: Images },
    { id: "logistics", label: "Logistics", icon: Luggage },
  ];

  return (
    <div className="absolute bottom-3 left-0 right-0 z-50 flex justify-center pointer-events-none px-3 sm:bottom-6 sm:px-4">
      <nav className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-slate-900/90 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl border border-slate-700/50 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex min-h-10 shrink-0 items-center justify-center rounded-full px-3 py-2 transition-colors duration-300 sm:px-3.5 sm:py-2.5 ${
                isActive ? "text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 z-0 rounded-full bg-sky-500 shadow-[0_0_16px_rgba(14,165,233,0.4)]"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
              <span className="relative z-10 flex items-center">
                <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                <AnimatePresence mode="popLayout">
                  {isActive && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden whitespace-nowrap text-xs font-bold"
                    >
                      <span className="pl-2">{tab.label}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
