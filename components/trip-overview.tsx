"use client";

import type { Trip, AppDesignConfig } from "@/lib/types";
import { getGuideDataForTrip, type SwissGuideData } from "@/lib/trip-guide";
import { collectStays } from "@/lib/stays";
import { Calendar, ExternalLink, Flag, Hotel, MapPin } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppNavigation } from "./app-navigation";
import { MultiOsmMap } from "./multi-osm-map";
import { GuideImage } from "./guide-image";

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Rome: { lat: 41.9028, lng: 12.4964 },
  Roma: { lat: 41.9028, lng: 12.4964 },
  "Rome Fiumicino Airport": { lat: 41.8003, lng: 12.2389 },
  "Roma Termini": { lat: 41.9012873, lng: 12.5015756 },
  Catania: { lat: 37.5079, lng: 15.083 },
  "Catania Centrale": { lat: 37.507496, lng: 15.099303 },
  "Piazza del Duomo": { lat: 37.502415, lng: 15.087212 },
  Etna: { lat: 37.7518413, lng: 14.994712 },
  "Mount Etna": { lat: 37.7518413, lng: 14.994712 },
  Taormina: { lat: 37.8516, lng: 15.2853 },
  Castelmola: { lat: 37.8584036, lng: 15.2773601 },
  "Teatro Antico": { lat: 37.8523175, lng: 15.2921343 },
  Naxos: { lat: 37.8277558, lng: 15.2651969 },
  "Forza d'Agro": { lat: 37.9145179, lng: 15.3342203 },
  Savoca: { lat: 37.9557389, lng: 15.3398339 },
  Syracuse: { lat: 37.0755, lng: 15.2866 },
  Siracusa: { lat: 37.0755, lng: 15.2866 },
  Ortigia: { lat: 37.0612, lng: 15.2936 },
  Noto: { lat: 36.8924433, lng: 15.0651945 },
  Ragusa: { lat: 36.9239306, lng: 14.7198951 },
  Modica: { lat: 36.8589716, lng: 14.7608405 },
  Marzamemi: { lat: 36.7420487, lng: 15.1175207 },
  "Aci Trezza": { lat: 37.5615555, lng: 15.1574868 },
  Adrano: { lat: 37.6627603, lng: 14.8325995 },
  Caltagirone: { lat: 37.2371653, lng: 14.5133945 },
  "Piazza Armerina": { lat: 37.3856182, lng: 14.3705567 },
  Enna: { lat: 37.5676891, lng: 14.2877167 },
  Valletta: { lat: 35.8997, lng: 14.5147 },
  Malta: { lat: 35.937496, lng: 14.375416 },
  Gozo: { lat: 36.0443, lng: 14.2512 },
  Citadel: { lat: 36.0465151, lng: 14.2397758 },
  "Blue Lagoon": { lat: 36.0139773, lng: 14.3228273 },
  Amalfi: { lat: 40.634, lng: 14.6027 },
  Naples: { lat: 40.8518, lng: 14.2681 },
  Napoli: { lat: 40.8518, lng: 14.2681 },
  Venice: { lat: 45.4408, lng: 12.3155 },
  Venezia: { lat: 45.4408, lng: 12.3155 },
  Verona: { lat: 45.4384, lng: 10.9916 },
  Sirmione: { lat: 45.4923, lng: 10.6086 },
  Milano: { lat: 45.4642, lng: 9.19 },
  Milan: { lat: 45.4642, lng: 9.19 },
  Florence: { lat: 43.7696, lng: 11.2558 },
  Firenze: { lat: 43.7696, lng: 11.2558 },
  Turin: { lat: 45.0703, lng: 7.6869 },
  Bologna: { lat: 44.4949, lng: 11.3426 },
  Pisa: { lat: 43.7228, lng: 10.4017 },
  Siena: { lat: 43.3188, lng: 11.3308 },
  Sorrento: { lat: 40.6263, lng: 14.3758 },
  Capri: { lat: 40.5532, lng: 14.2245 },
  Como: { lat: 45.8081, lng: 9.0852 },
  Positano: { lat: 40.6281, lng: 14.4850 },
  Matera: { lat: 40.6664, lng: 16.6043 },
  Bari: { lat: 41.1171, lng: 16.8719 },
  Pompeii: { lat: 40.7462, lng: 14.4989 },
  Palermo: { lat: 38.1157, lng: 13.3615 },
  Realmonte: { lat: 37.3087064, lng: 13.462396 },
  Agrigento: { lat: 37.3088381, lng: 13.5857818 },
  "Valley of the Temples": { lat: 37.2923664, lng: 13.5937011 },
  Trapani: { lat: 38.0174282, lng: 12.5364464 },
  Erice: { lat: 38.03778, lng: 12.5879274 },
  Scopello: { lat: 38.0702839, lng: 12.8179128 },
  Monreale: { lat: 38.0807591, lng: 13.28809 },
  Cefalu: { lat: 38.0349976, lng: 14.021222 },
  Corleone: { lat: 37.8137744, lng: 13.2989432 },
  Padua: { lat: 45.4064, lng: 11.8768 },
  Padova: { lat: 45.4064, lng: 11.8768 },
  Lucca: { lat: 43.8429, lng: 10.5027 },
  "San Gimignano": { lat: 43.4674, lng: 11.0432 },
  Chur: { lat: 46.8509, lng: 9.5323 },
  Tirano: { lat: 46.2155, lng: 10.1691 },
  Tasch: { lat: 46.0667, lng: 7.7778 },
  Täsch: { lat: 46.0667, lng: 7.7778 },
  Kandersteg: { lat: 46.4960, lng: 7.6740 },
  Torino: { lat: 45.0703, lng: 7.6869 },
  Genoa: { lat: 44.4056, lng: 8.9463 },
  Genova: { lat: 44.4056, lng: 8.9463 },
  Stalden: { lat: 46.2336, lng: 7.8721 },
  Chamonix: { lat: 45.9237, lng: 6.8694 },
  Zermatt: { lat: 46.0207, lng: 7.7491 },
  Interlaken: { lat: 46.6863, lng: 7.8632 },
  Spiez: { lat: 46.6886, lng: 7.6792 },
  Thun: { lat: 46.7579, lng: 7.6279 },
  "St. Beatus-Hohlen": { lat: 46.6839, lng: 7.7818 },
  "Harder Kulm": { lat: 46.6978, lng: 7.8517 },
  Brienz: { lat: 46.7545, lng: 8.0385 },
  Aareschlucht: { lat: 46.7187, lng: 8.2057 },
  Iseltwald: { lat: 46.7109, lng: 7.9646 },
  Grindelwald: { lat: 46.6242, lng: 8.0414 },
  "Kleine Scheidegg": { lat: 46.5851, lng: 7.9614 },
  Mannlichen: { lat: 46.6113, lng: 7.9426 },
  First: { lat: 46.6595, lng: 8.0534 },
  Wilderswil: { lat: 46.6635, lng: 7.8617 },
  Lauterbrunnen: { lat: 46.5935, lng: 7.9091 },
  Wengen: { lat: 46.6057, lng: 7.9216 },
  Murren: { lat: 46.5594, lng: 7.8928 },
  "Schynige Platte": { lat: 46.656, lng: 7.9084 },
  Jungfraujoch: { lat: 46.5483, lng: 7.9806 },
  Lucerne: { lat: 47.0502, lng: 8.3093 },
  Luzern: { lat: 47.0502, lng: 8.3093 },
  Bern: { lat: 46.9480, lng: 7.4474 },
  Berne: { lat: 46.9480, lng: 7.4474 },
  Basel: { lat: 47.5596, lng: 7.5886 },
  Lausanne: { lat: 46.5197, lng: 6.6323 },
  Montreux: { lat: 46.4312, lng: 6.9107 },
  "St. Moritz": { lat: 46.4908, lng: 9.8355 },
  Lugano: { lat: 46.0037, lng: 8.9511 },
  Sion: { lat: 46.2293, lng: 7.3585 },
  Brig: { lat: 46.3150, lng: 7.9866 },
  Visp: { lat: 46.2940, lng: 7.8821 },
  Andermatt: { lat: 46.3313, lng: 8.5960 },
  Bellinzona: { lat: 46.1928, lng: 9.0233 },
  Locarno: { lat: 46.0044, lng: 8.9520 },
  Innsbruck: { lat: 47.2692, lng: 11.4041 },
  Innsbruk: { lat: 47.2692, lng: 11.4041 },
  Salzburg: { lat: 47.8095, lng: 13.055 },
  Salzkammergut: { lat: 47.671, lng: 13.545 },
  Hallstatt: { lat: 47.5622, lng: 13.6493 },
  "Cesky Krumlov": { lat: 48.8127, lng: 14.3175 },
  "Ceske Budejovice": { lat: 48.9745, lng: 14.4743 },
  Telc: { lat: 49.1842, lng: 15.4528 },
  Rodvinov: { lat: 49.1566, lng: 15.003 },
  Praha: { lat: 50.0755, lng: 14.4378 },
  Prague: { lat: 50.0755, lng: 14.4378 },
  "Kutna Hora": { lat: 49.9484, lng: 15.2682 },
  Znojmo: { lat: 48.8555, lng: 16.0488 },
  Vienna: { lat: 48.2082, lng: 16.3738 },
  Wien: { lat: 48.2082, lng: 16.3738 },
  Graz: { lat: 47.0707, lng: 15.4395 },
  Ljubljana: { lat: 46.0569, lng: 14.5058 },
  Bled: { lat: 46.3683, lng: 14.1146 },
  Villach: { lat: 46.6103, lng: 13.8558 },
  Lienz: { lat: 46.8297, lng: 12.769 },
  Dolomites: { lat: 46.4102, lng: 11.844 },
  "Tre Cime di Lavaredo": { lat: 46.6187, lng: 12.3023 },
  "Cortina d'Ampezzo": { lat: 46.5405, lng: 12.1357 },
  "Gardena Pass": { lat: 46.5496, lng: 11.808 },
  "Cinque Torri": { lat: 46.508, lng: 12.0526 },
  "Sella Pass": { lat: 46.5085, lng: 11.7587 },
  Ortisei: { lat: 46.5754, lng: 11.6721 },
  Bolzano: { lat: 46.4983, lng: 11.3548 },
  Brixen: { lat: 46.7150, lng: 11.6570 },
  Merano: { lat: 46.6710, lng: 11.1520 },
  Munich: { lat: 48.1351, lng: 11.582 },
  München: { lat: 48.1351, lng: 11.582 },
  Frankfurt: { lat: 50.1109, lng: 8.6821 },
  Berlin: { lat: 52.52, lng: 13.405 },
  Zurich: { lat: 47.3769, lng: 8.5417 },
  Zürich: { lat: 47.3769, lng: 8.5417 },
  Geneva: { lat: 46.2044, lng: 6.1432 },
  Geneve: { lat: 46.2044, lng: 6.1432 },
  Genève: { lat: 46.2044, lng: 6.1432 },
  Paris: { lat: 48.8566, lng: 2.3522 },
  Nice: { lat: 43.7102, lng: 7.2620 },
  London: { lat: 51.5074, lng: -0.1278 },
  Madrid: { lat: 40.4168, lng: -3.7038 },
  Barcelona: { lat: 41.3851, lng: 2.1734 },
  Amsterdam: { lat: 52.3676, lng: 4.9041 },
  Brussels: { lat: 50.8503, lng: 4.3517 },
  Budapest: { lat: 47.4979, lng: 19.0402 },
  Warsaw: { lat: 52.2297, lng: 21.0122 },
  Krakow: { lat: 50.0647, lng: 19.9450 },
  Bratislava: { lat: 48.1486, lng: 17.1077 },
  Zagreb: { lat: 45.8153, lng: 15.9665 },
  Sofia: { lat: 42.6977, lng: 23.3219 },
  Bucharest: { lat: 44.4268, lng: 26.1025 },
  Belgrade: { lat: 44.8125, lng: 20.4612 },
  Athens: { lat: 37.9838, lng: 23.7275 },
  Istanbul: { lat: 41.0082, lng: 28.9784 },
  Lisbon: { lat: 38.7223, lng: -9.1393 },
  Porto: { lat: 41.1579, lng: -8.6291 },
  Copenhagen: { lat: 55.6761, lng: 12.5683 },
  Stockholm: { lat: 59.3293, lng: 18.0686 },
  Oslo: { lat: 59.9139, lng: 10.7522 },
  Helsinki: { lat: 60.1695, lng: 24.9354 },
  Reykjavik: { lat: 64.1466, lng: -21.9426 },
  Dublin: { lat: 53.3498, lng: -6.2603 },
  Edinburgh: { lat: 55.9533, lng: -3.1883 },
  Incheon: { lat: 37.4563, lng: 126.7052 },
  Doha: { lat: 25.2854, lng: 51.531 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  "Abu Dhabi": { lat: 24.4539, lng: 54.3773 },
  Seoul: { lat: 37.5665, lng: 126.978 }
};

function splitOverviewTitle(title: string) {
  const parts = title.split(/\s+[—-]\s+/);
  if (parts.length < 2) return { name: title, meta: "" };
  return { name: parts.slice(0, -1).join(" — "), meta: parts[parts.length - 1] };
}

function TimelineItem({ tripId, item }: { tripId: string; item: SwissGuideData["masterTimeline"][0] }) {
  return (
    <Link href={`/trips/${tripId}/day/${item.day}`} className="group flex h-full min-w-0 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md sm:p-5 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500">
      <div className="min-w-0">
        <div className="mb-2 sm:mb-4 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            Day {item.day}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">{item.dateLabel} <span className="hidden sm:inline">· {item.weekday}</span></span>
        </div>
        <h3 className="mb-1 break-words text-base font-bold leading-tight text-slate-900 transition-colors [overflow-wrap:anywhere] group-hover:text-blue-600 sm:mb-2 sm:text-lg dark:text-slate-100 dark:group-hover:text-blue-400">
          {item.primaryRoute}
        </h3>
        <p className="line-clamp-2 break-all text-xs leading-relaxed text-slate-500 sm:break-words dark:text-slate-400">
          {item.note}
        </p>
      </div>
      {item.cities && item.cities.length > 0 && (
         <div className="mt-3 sm:mt-5 flex flex-wrap gap-1 sm:gap-1.5 border-t border-slate-100 pt-3 sm:pt-4 dark:border-slate-700">
           {item.cities.slice(0, 3).map((city) => (
             <span key={city} className="rounded-md bg-slate-50 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8.5px] sm:text-[9.5px] font-bold text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
               {city}
             </span>
           ))}
         </div>
      )}
    </Link>
  );
}

export function TripOverview({ trip, uiConfig, appStructure }: { trip: Trip; uiConfig?: AppDesignConfig; appStructure?: any }) {
  const guideData = getGuideDataForTrip(trip);
  const overviewLayout = uiConfig?.overviewLayout ?? "timeline";
  const titleParts = splitOverviewTitle(trip.title);

  // 개요 페이지 전용 커스텀 하단 탭 구성
  const overviewAppStructure = {
    ...(appStructure || {}),
    navigationType: "bottom-tab",
    tabs: [
      { id: "home", label: "Home", iconType: "home" },
      { id: "daily", label: "Daily", iconType: "calendar" },
      { id: "stays", label: "Stays", iconType: "hotel" }
    ]
  };

  // 전체 일정 좌표 추출 (지도 마커용)
  const duplicateOffsets = new Map<string, number>();
  const seenCities = new Set<string>();
  let sequence = 1;
  
  const isExcludedOverviewCity = (city: string) => {
    if (!city) return false;
    const normalizedCity = city.trim().toLowerCase();
    return ["seoul", "서울", "incheon", "인천", "helsinki", "hel", "doha", "dubai", "abu dhabi", "transit"].some(ex => normalizedCity.includes(ex));
  };

  const overviewCityAliases: Record<string, string> = {
    "rome fiumicino airport": "Rome",
    fiumicino: "Rome",
    "roma termini": "Rome",
    "catania centrale": "Catania",
    "piazza del duomo": "Catania",
    etna: "Catania",
    "mount etna": "Catania",
    "teatro antico": "Taormina",
    naxos: "Taormina",
    castelmola: "Taormina",
    "forza d agro": "Taormina",
    savoca: "Taormina",
    ortigia: "Syracuse",
    siracusa: "Syracuse",
    "val di noto": "Noto",
    "aci trezza": "Catania",
    adrano: "Catania",
    "piazza armerina": "Piazza Armerina",
    "valley of the temples": "Agrigento",
    citadel: "Gozo",
    "blue lagoon": "Gozo",
    "three cities": "Valletta",
    "catania airport": "Catania"
  };

  const markers: { lat: number; lng: number; label: string; city: string; day: number; onClickUrl?: string }[] = [];
  const normalizeLegendKey = (city: string) => city.toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").trim();

  const findOverviewCoordinates = (city: string) => {
    const exact = CITY_COORDINATES[city];
    if (exact) return exact;

    return Object.entries(CITY_COORDINATES).find(([name]) => {
      return normalizeLegendKey(name) === normalizeLegendKey(city);
    })?.[1];
  };

  const getOverviewCityName = (city: string) => overviewCityAliases[normalizeLegendKey(city)] ?? city.trim();
  const dailyGuideByDay = new Map(guideData.dailyGuides.map((dailyGuide) => [dailyGuide.day, dailyGuide]));
  const accommodations = collectStays(guideData.dailyGuides);

  guideData.masterTimeline.forEach((item) => {
    const itineraryCity = trip.itinerary.find((d) => d.day === item.day)?.city;
    const dailyGuide = dailyGuideByDay.get(item.day);
    const routeParts = item.primaryRoute.split(/[-/]/).map(s => s.trim());
    const guideRegionParts = dailyGuide?.region?.split("/").map(s => s.trim()) ?? [];
    const guideCityVisitParts = dailyGuide?.cityVisits?.map((visit) => visit.city.trim()) ?? [];
    const candidates = [
      ...(item.cities ?? []),
      ...routeParts,
      ...(itineraryCity ? [itineraryCity] : []),
      ...guideRegionParts,
      ...guideCityVisitParts
    ];

    candidates.forEach((candidate) => {
      const city = getOverviewCityName(candidate);
      if (!city || isExcludedOverviewCity(city)) return;

      const seenKey = normalizeLegendKey(city);
      if (!seenKey || seenCities.has(seenKey)) return;

      const coords = trip.itinerary.find((d) => d.city === city)?.coordinates ?? findOverviewCoordinates(city);
      if (!coords) return;

      seenCities.add(seenKey);
      const key = `${coords.lat.toFixed(3)}-${coords.lng.toFixed(3)}`;
      const count = duplicateOffsets.get(key) ?? 0;
      duplicateOffsets.set(key, count + 1);

      markers.push({
        lat: coords.lat - count * 0.025,
        lng: coords.lng + count * 0.025,
        label: String(sequence++),
        city,
        day: item.day,
        onClickUrl: `/trips/${trip.id}/day/${item.day}`
      });
    });
  });

  // 지도 마커 범례 (번호 - 도시명 표시)
  const renderMapLegend = () => {
    if (markers.length === 0) return null;
    const featuredMarkers = markers.slice(0, 12);
    const remainingCount = Math.max(0, markers.length - featuredMarkers.length);

    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white/92 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Major cities</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {markers.length} cities
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featuredMarkers.map((m) => (
            <Link
              key={m.city}
              href={`/trips/${trip.id}/day/${m.day}`}
              className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm transition-colors group-hover:bg-blue-700 dark:bg-blue-500 dark:group-hover:bg-blue-400">
                {m.label}
              </span>
              <span className="text-slate-700 transition-colors group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-400">{m.city}</span>
            </Link>
          ))}
          {remainingCount > 0 && (
            <span className="inline-flex shrink-0 items-center rounded-full border border-dashed border-slate-300 px-2.5 py-1.5 text-xs font-extrabold text-slate-500 dark:border-slate-700 dark:text-slate-400">
              +{remainingCount}
            </span>
          )}
        </div>
        {remainingCount > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-bold text-blue-600 dark:text-blue-400">전체 도시 보기</summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {markers.slice(12).map((m) => (
                <Link
                  key={`extra-${m.city}`}
                  href={`/trips/${trip.id}/day/${m.day}`}
                  className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {m.label}. {m.city}
                </Link>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  };

  const renderTimeline = () => (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {guideData.masterTimeline.map((item, index) => (
        <motion.div
          key={item.id}
          className="h-full min-w-0"
          /* 타임라인 스태거 애니메이션 임시 주석 처리
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          */
        >
          <TimelineItem tripId={trip.id} item={item} />
        </motion.div>
      ))}
    </div>
  );

  const renderMapCentric = () => (
    <div className="space-y-8">
      <div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative h-[50vh] min-h-[350px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800"
        >
          <MultiOsmMap markers={markers} className="absolute inset-0 h-full w-full" />
        </motion.div>
        {renderMapLegend()}
      </div>
      {renderTimeline()}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-3 pb-32 pt-4 sm:px-4 sm:pt-8">
      {/* 히어로 섹션 */}
      <div className="relative mb-5 h-[22rem] min-w-0 overflow-hidden rounded-lg sm:mb-8 md:h-80">
        <GuideImage src={trip.heroImage} alt={trip.title} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 min-w-0 p-4 sm:p-6">
          <h1 className="max-w-full text-3xl font-bold leading-tight text-white md:text-4xl">
            <span className="block break-words [overflow-wrap:anywhere]">{titleParts.name}</span>
            {titleParts.meta && (
              <span className="block break-words [overflow-wrap:anywhere]">{titleParts.meta}</span>
            )}
          </h1>
          <p className="mt-2 line-clamp-3 max-w-full break-all text-sm font-semibold leading-relaxed text-gray-200 sm:break-words sm:text-lg">{trip.subtitle}</p>
        </div>
      </div>

      {/* 경로 요약 */}
      <div className="mb-6 min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:mb-8 sm:p-6 dark:border-gray-700 dark:bg-gray-800/50">
        <h2 className="mb-3 text-2xl font-semibold sm:mb-4">경로 요약</h2>
        <p className="mb-4 break-all text-sm leading-7 text-gray-600 sm:break-words sm:text-base dark:text-gray-300">{trip.routeSummary}</p>
        <div className="grid gap-3 text-sm sm:flex sm:flex-wrap sm:gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="min-w-0 break-words">{trip.dateRange}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Flag className="h-4 w-4 text-gray-500" />
            <span className="min-w-0 break-words">{trip.countries.join(", ")}</span>
          </div>
        </div>
      </div>

      {accommodations.length > 0 && (
        <section className="mb-6 min-w-0 sm:mb-8">
          <div className="mb-3 flex min-w-0 items-center justify-between gap-3 sm:mb-4">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Stay plan</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">숙소 정보</h2>
            </div>
            <Hotel className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accommodations.map((accommodation) => (
              <article key={`${accommodation.address}-${accommodation.checkIn ?? ""}-${accommodation.checkOut ?? ""}`} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[10px] font-extrabold uppercase tracking-normal text-slate-600 dark:bg-slate-700/60 dark:text-slate-200">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 truncate">{accommodation.checkIn ?? "-"} - {accommodation.checkOut ?? "-"}</span>
                    </div>
                    <h3 className="break-words text-base font-bold leading-tight text-slate-900 [overflow-wrap:anywhere] dark:text-slate-100">
                      {accommodation.name}
                    </h3>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {accommodation.googleMapsUrl && (
                      <a href={accommodation.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300" aria-label={`${accommodation.name} Google Maps`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {accommodation.airbnbUrl && (
                      <a href={accommodation.airbnbUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center justify-center rounded-md bg-[#FF385C] px-2 text-[10px] font-extrabold text-white transition hover:bg-[#E03152]">
                        Airbnb
                      </a>
                    )}
                  </div>
                </div>
                <p className="mt-3 flex min-w-0 gap-2 break-words text-xs leading-relaxed text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0">{accommodation.address}</span>
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 마스터 타임라인 */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold sm:mb-6">전체 일정</h2>
        
        {/* 일반 타임라인 뷰일 때도 지도를 상단에 표시하여 경로를 한눈에 파악 가능하게 함 */}
        {overviewLayout !== "map-centric" && markers.length > 0 && (
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative h-[35vh] min-h-[250px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-800"
            >
              <MultiOsmMap markers={markers} className="absolute inset-0 h-full w-full" />
            </motion.div>
            {renderMapLegend()}
          </div>
        )}
        
        {overviewLayout === "map-centric" ? renderMapCentric() : renderTimeline()}
      </div>

      <AppNavigation appStructure={overviewAppStructure} themeColor={uiConfig?.themeColor} />
    </div>
  );
}
