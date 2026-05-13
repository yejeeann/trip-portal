"use client";

import type { AppDesignConfig, AppStructureConfig, Trip } from "@/lib/types";
import { buildDailyGuidesForTrip, getGuideDataForTrip } from "@/lib/trip-guide";
import { collectStays, formatStayDays } from "@/lib/stays";
import { ArrowLeft, ExternalLink, House, MapPin } from "lucide-react";
import Link from "next/link";
import { AppNavigation } from "./app-navigation";
import { GuideImage } from "./guide-image";
import { MultiOsmMap, type OsmMarker } from "./multi-osm-map";

export function TripStays({ trip, uiConfig }: { trip: Trip; uiConfig?: AppDesignConfig }) {
  const guideData = getGuideDataForTrip(trip);
  const dailyGuides = buildDailyGuidesForTrip(trip, guideData);
  const stays = collectStays(dailyGuides);
  const stayMarkers: OsmMarker[] = stays.flatMap((stay, index) => {
    const coordinates = parseGoogleMapsCoordinates(stay.googleMapsUrl);
    if (!coordinates) return [];

    return [{
      ...coordinates,
      label: String(index + 1),
      id: stay.id
    }];
  });
  const themeColor = "#1A434E";
  const staysNavigation: AppStructureConfig = {
    navigationType: "bottom-tab",
    tabs: [
      { id: "home", label: "Home", iconType: "home" },
      { id: "overview", label: "Overview", iconType: "overview" },
      { id: "daily", label: "Daily", iconType: "calendar" },
      { id: "stays", label: "Accommodations", iconType: "accommodations" }
    ]
  };

  return (
    <main className="min-h-screen bg-[#F9F7F2] pb-32 text-[#2D2D2D]">
      <div className="w-full max-w-[24rem] px-3 py-4 sm:mx-auto sm:max-w-5xl sm:px-6 sm:py-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link href={`/trips/${trip.id}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E6DAC8] bg-white text-[#1A434E] shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#B98045]">Stay plan</p>
            <h1 className="truncate font-serif text-3xl font-semibold tracking-normal sm:text-5xl">Accommodations</h1>
            <p className="mt-1 truncate text-xs font-bold text-[#6B6861] sm:text-sm">{trip.dateRange}</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: themeColor }}>
            <House className="h-5 w-5" />
          </span>
        </div>

        {stays.length > 0 ? (
          <section className="grid gap-3">
            <div className="overflow-hidden rounded-lg border border-[#E6DAC8] bg-white shadow-[0_14px_34px_rgba(45,45,45,0.09)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#E6DAC8] bg-[#EFE8DB]/55 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#B98045]">Accommodation map</p>
                  <h2 className="mt-1 truncate font-serif text-xl font-semibold">숙소 위치 한눈에 보기</h2>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#1A434E]">
                  {stayMarkers.length}/{stays.length}
                </span>
              </div>
              <div className="relative h-[18rem] w-full overflow-hidden bg-[#EFE8DB] sm:h-[24rem]">
                <MultiOsmMap
                  markers={stayMarkers}
                  className="absolute inset-0 h-full w-full"
                  onMarkerClick={(id) => document.getElementById(`stay-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                />
              </div>
              {stayMarkers.length > 0 && (
                <div className="flex gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {stays.map((stay, index) => (
                    <a
                      key={`map-chip-${stay.id}`}
                      href={`#stay-${stay.id}`}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E6DAC8] bg-[#F9F7F2] py-1.5 pl-1.5 pr-2.5 text-xs font-extrabold text-[#2D2D2D]"
                    >
                      {stay.image && (
                        <GuideImage
                          src={stay.image}
                          alt={stay.imageAlt || stay.name}
                          className="h-7 w-7 rounded-full border border-white shadow-sm"
                        />
                      )}
                      <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white" style={{ backgroundColor: themeColor }}>
                        {index + 1}
                      </span>
                      <span className="max-w-[9rem] truncate">{stay.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {stays.map((stay, index) => (
              <article id={`stay-${stay.id}`} key={stay.id} className="scroll-mt-5 overflow-hidden rounded-lg border border-[#E6DAC8] bg-white shadow-[0_14px_34px_rgba(45,45,45,0.09)]">
                {stay.image && (
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#EFE8DB] sm:aspect-[21/9]">
                    <GuideImage
                      src={stay.image}
                      alt={stay.imageAlt || stay.name}
                      className="absolute inset-0 h-full w-full"
                      imageClassName="transition duration-700 hover:scale-[1.03]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/92 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#2D2D2D] shadow-sm backdrop-blur">
                      <span className="h-2 w-2 rounded-full bg-[#D4A373]" />
                      Airbnb Photo
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 border-b border-[#E6DAC8] bg-[#EFE8DB]/55 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#B98045]">Accommodation {index + 1}</p>
                    <h2 className="mt-1 break-words font-serif text-2xl font-semibold leading-tight [overflow-wrap:anywhere]">{stay.name}</h2>
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-white" style={{ backgroundColor: themeColor }}>
                    {formatStayDays(stay.days)}
                  </span>
                </div>

                <div className="grid gap-4 p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-[#F9F7F2] px-3 py-2">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#6B6861]">Check-in</p>
                      <p className="mt-1 text-sm font-black">{stay.checkIn ?? "-"}</p>
                    </div>
                    <div className="rounded-lg bg-[#F9F7F2] px-3 py-2">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#6B6861]">Check-out</p>
                      <p className="mt-1 text-sm font-black">{stay.checkOut ?? "-"}</p>
                    </div>
                  </div>

                  <p className="flex min-w-0 gap-2 break-words text-sm font-semibold leading-relaxed text-[#6B6861] [overflow-wrap:anywhere]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: themeColor }} />
                    <span className="min-w-0">{stay.address}</span>
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {stay.days.map((day) => (
                      <Link key={day} href={`/trips/${trip.id}/day/${day}`} className="rounded-full border border-[#E6DAC8] bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#2D2D2D] transition hover:border-[#D4A373] hover:text-[#1A434E]">
                        Day {day}
                      </Link>
                    ))}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {stay.googleMapsUrl && (
                      <a href={stay.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold text-white" style={{ backgroundColor: themeColor }}>
                        Google Maps
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {stay.airbnbUrl && (
                      <a href={stay.airbnbUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#D4A373] bg-white px-4 py-2 text-sm font-extrabold text-[#B98045]">
                        Airbnb
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-lg border border-[#E6DAC8] bg-white p-8 text-center text-sm font-bold text-[#6B6861]">
            등록된 숙소 정보가 없습니다.
          </section>
        )}
      </div>

      <AppNavigation appStructure={staysNavigation} themeColor={themeColor} />
    </main>
  );
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
