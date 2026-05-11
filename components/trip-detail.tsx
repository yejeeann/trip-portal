"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Heart,
  Images,
  Home,
  Hotel,
  Luggage,
  MapPin,
  MapPinned,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Route,
  Send
} from "lucide-react";
import {
  type DailyGuide,
  type DailyGuidePlace,
  type FlightTicket,
  type MasterTimelineItem
} from "@/lib/swiss-guide-data";
import { buildDailyGuidesForTrip, getGuideDataForTrip } from "@/lib/trip-guide";
import type { Coordinates, Trip } from "@/lib/types";
import { MobileTripApp } from "./mobile-trip-app";
import { OsmMap } from "./osm-map";
import { MultiOsmMap } from "./multi-osm-map";
import { PlaceBottomSheet } from "./place-detail";
import { useTravelPayload } from "@/lib/travel-payload-client";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 }
};

export function TripDetail({ tripId }: { tripId: string }) {
  const { payload, isLoading } = useTravelPayload();

  const trips = useMemo(() => {
    if (!payload) return [];
    return payload.trips?.length ? payload.trips : [payload.trip];
  }, [payload]);

  const trip = trips.find((item) => item.id === tripId) ?? null;
  const sectionIds = useMemo(() => ["home", "route", "daily", "sights", "logistics"], []);
  const activeSection = useActiveSection(sectionIds);
  const isAnchorVisible = useAnchorVisibility(420);
  const guideData = useMemo(() => (trip ? getGuideDataForTrip(trip) : null), [trip]);
  const dailyGuides = useMemo(() => {
    if (!trip || !guideData) return [];
    const explicitGuides = buildDailyGuidesForTrip(trip, guideData);
    const guideMap = new Map(explicitGuides.map(g => [g.day, g]));
    
    // 모바일 뷰에서도 전체 날짜 탭이 모두 활성화되도록 가짜(Placeholder) 일정을 주입합니다.
    return guideData.masterTimeline.map(item => {
      const explicit = guideMap.get(item.day);
      if (explicit) return explicit;
      
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

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!trip || !guideData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink">
        <div className="max-w-md text-center">
          <p className="text-xs font-bold uppercase text-clay">Dossier unavailable</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold">No matching guide.</h1>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-bold text-paper transition hover:bg-clay"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to desk
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* 모바일 뷰 (태블릿/모바일 사이즈에서 노출) */}
      <div className="block lg:hidden">
        <MobileTripApp trip={trip} dailyGuides={dailyGuides} guideData={guideData} uiConfig={payload?.uiConfig} />
      </div>

      {/* 데스크탑 뷰 (PC 사이즈에서 노출) */}
      <div className="hidden lg:block">
        <main className="min-h-screen bg-paper text-ink">
          <DetailHeader />
          <ScrollAnchorBar activeSection={activeSection} isVisible={isAnchorVisible} />
          <DossierHero trip={trip} />

          <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <DossierNav trip={trip} />
              </aside>
              <div className="space-y-20">
                <FlightSection tickets={guideData.flightTickets} />
                <MasterTimelineSection trip={trip} items={guideData.masterTimeline} />
                <DailyDetailSection
                  tripId={trip.id}
                  trip={trip}
                  items={guideData.masterTimeline}
                  guides={dailyGuides}
                />
                <SightsSection />
                <LogisticsSection />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function DetailHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone/70 bg-paper/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-stone px-3 py-2 text-sm font-bold text-ink transition hover:border-ink hover:bg-ink hover:text-paper"
        >
          <ArrowLeft className="h-4 w-4" />
          Desk
        </Link>
        <div className="font-serif text-2xl font-semibold">Trip Portal</div>
      </div>
    </header>
  );
}

function ScrollAnchorBar({
  activeSection,
  isVisible
}: {
  activeSection: string;
  isVisible: boolean;
}) {
  const items = [
    { id: "home", label: "Overview", icon: <Home className="h-4 w-4" /> },
    { id: "route", label: "Route", icon: <Route className="h-4 w-4" /> },
    { id: "daily", label: "Daily", icon: <CalendarDays className="h-4 w-4" /> },
    { id: "sights", label: "Sights", icon: <Images className="h-4 w-4" /> },
    { id: "logistics", label: "Logistics", icon: <Luggage className="h-4 w-4" /> }
  ];

  return (
    <motion.nav
      initial={false}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={`fixed left-1/2 top-[72px] z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-lg border border-stone bg-paper/95 p-1 shadow-editorial backdrop-blur-xl ${
        isVisible ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-label="Trip section navigation"
    >
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold transition ${
              activeSection === item.id
                ? "bg-ink text-paper"
                : "text-ink hover:bg-ink hover:text-paper"
            }`}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </a>
        ))}
      </div>
    </motion.nav>
  );
}

function DossierHero({ trip }: { trip: Trip }) {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative min-h-[560px] overflow-hidden"
    >
      <Image
        src={trip.heroImage}
        alt={trip.title}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/32 to-black/22" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1320px] px-4 pb-12 text-paper sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase text-paper/72">Editorial Dossier</p>
        <h1 className="mt-4 max-w-5xl font-serif text-[clamp(3.2rem,7vw,8rem)] font-semibold leading-[0.9]">
          {trip.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-paper/80">
          {trip.subtitle}
        </p>
      </div>
    </motion.section>
  );
}

function DossierNav({ trip }: { trip: Trip }) {
  return (
    <nav className="border-y border-ink py-6" aria-label="Dossier structure">
      <p className="text-xs font-bold uppercase text-clay">Sequence</p>
      <div className="mt-5 space-y-2">
        <Anchor href="#home" icon={<Home className="h-4 w-4" />} label="Overview (Transport)" />
        <Anchor href="#route" icon={<Route className="h-4 w-4" />} label="Route (Overview)" />
        <Anchor href="#daily" icon={<CalendarDays className="h-4 w-4" />} label="Daily (Briefs)" />
        <Anchor href="#sights" icon={<Images className="h-4 w-4" />} label="Sights" />
        <Anchor href="#logistics" icon={<Luggage className="h-4 w-4" />} label="Logistics" />
      </div>
      <div className="mt-8 border-t border-stone pt-5 text-sm leading-6 text-moss">
        <strong className="block text-ink">{trip.dateRange}</strong>
        {trip.countries.join(" / ")}
      </div>
    </nav>
  );
}

function Anchor({
  href,
  icon,
  label
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-ink transition hover:bg-ink hover:text-paper"
    >
      {icon}
      {label}
    </a>
  );
}

function FlightSection({ tickets }: { tickets: FlightTicket[] }) {
  return (
    <DossierSection id="home" number="01" label="Overview (Transport)">
      <div className="grid gap-5 xl:grid-cols-2">
        {tickets.map((ticket) => (
          <FlightTicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </DossierSection>
  );
}

function FlightTicketCard({ ticket }: { ticket: FlightTicket }) {
  return (
    <article className="relative overflow-hidden rounded-lg border border-ink bg-[#FCFAF5] shadow-editorial">
      <div className="grid gap-6 border-b border-dashed border-stone p-5 sm:grid-cols-[minmax(0,1fr)_140px] sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <AirlineMark
              code={ticket.segments[0]?.airlineCode ?? "QR"}
              name={ticket.segments[0]?.airlineName ?? "Qatar Airways"}
            />
            <div>
              <p className="text-xs font-bold uppercase text-clay">{ticket.title}</p>
              <h3 className="mt-1 font-serif text-3xl font-semibold leading-tight">
                {ticket.routeLabel}
              </h3>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-stone px-4 py-3 sm:text-right">
          <div className="text-xs font-bold uppercase text-moss">Travel date</div>
          <div className="mt-1 text-sm font-bold text-ink">{ticket.dateLabel}</div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="space-y-5">
          {ticket.segments.map((segment, index) => (
            <div key={segment.flightNo}>
              <FlightSegmentRow segment={segment} />
              {index < ticket.segments.length - 1 ? (
                <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase text-moss">
                  <span className="h-px flex-1 bg-stone" />
                  <Clock3 className="h-4 w-4 text-clay" />
                  {ticket.connectionLabel}
                  <span className="h-px flex-1 bg-stone" />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone pt-4">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-moss">
            <Luggage className="h-4 w-4 text-clay" />
            {ticket.segments.map((segment) => segment.flightNo).join(" / ")}
          </div>
          <div className="text-xs font-bold uppercase text-clay">
            {ticket.segments.length - 1} stop
          </div>
        </div>
      </div>
    </article>
  );
}

function AirlineMark({ code, name }: { code: string; name: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-wine text-lg font-black text-paper">
        {code}
      </div>
      <div className="hidden sm:block">
        <div className="text-xs font-bold uppercase text-moss">Operator</div>
        <div className="text-sm font-bold text-ink">{name}</div>
      </div>
    </div>
  );
}

function FlightSegmentRow({ segment }: { segment: FlightTicket["segments"][number] }) {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)] md:items-center">
      <AirportBlock icon={<PlaneTakeoff className="h-4 w-4" />} point={segment.from} />
      <div className="flex items-center justify-center gap-3 text-moss md:block md:text-center">
        <div className="hidden h-px bg-stone md:block" />
        <div className="my-2 inline-flex items-center gap-2 rounded-lg border border-stone px-3 py-2 text-xs font-bold uppercase">
          <Clock3 className="h-3.5 w-3.5 text-clay" />
          {segment.duration}
        </div>
        <div className="hidden h-px bg-stone md:block" />
      </div>
      <AirportBlock align="right" icon={<PlaneLanding className="h-4 w-4" />} point={segment.to} />
    </div>
  );
}

function AirportBlock({
  point,
  icon,
  align = "left"
}: {
  point: FlightTicket["segments"][number]["from"];
  icon: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "md:text-right" : ""}>
      <div className={`flex items-center gap-2 text-xs font-bold uppercase text-clay ${align === "right" ? "md:justify-end" : ""}`}>
        {icon}
        {point.code}
      </div>
      <div className="mt-2 font-serif text-5xl font-semibold leading-none">{point.time}</div>
      <div className="mt-2 text-sm font-bold text-ink">{point.city}</div>
      <div className="mt-1 text-xs leading-5 text-moss">
        {point.airport}
        {point.dateLabel ? <span className="ml-2 font-bold text-clay">{point.dateLabel}</span> : null}
      </div>
    </div>
  );
}

function MasterTimelineSection({ trip, items }: { trip: Trip; items: MasterTimelineItem[] }) {
  return (
    <DossierSection id="route" number="02" label="Route (Master Schedule)">
      <div className="space-y-6">
        <RouteOverviewMap trip={trip} items={items} />
        <div className="overflow-hidden rounded-lg border border-ink bg-[#FCFAF5]">
        <div className="hidden grid-cols-[96px_minmax(0,1.05fr)_minmax(0,1.25fr)_minmax(240px,0.9fr)] border-b border-ink bg-ink px-5 py-3 text-xs font-bold uppercase text-paper lg:grid">
          <div>Date</div>
          <div>Movement</div>
          <div>Cities</div>
          <div>Accommodation</div>
        </div>
        <ol className="divide-y divide-stone">
          {items.map((item) => (
            <TimelineRow key={item.id} item={item} tripId={trip.id} />
          ))}
        </ol>
        </div>
      </div>
    </DossierSection>
  );
}

function RouteOverviewMap({ trip, items }: { trip: Trip; items: MasterTimelineItem[] }) {
  const routeStops = createRouteStops(trip, items);
  
  return (
    <section className="overflow-hidden rounded-lg border border-ink bg-[#EEE8DD]">
      <div className="grid gap-6 border-b border-ink bg-[#FCFAF5] p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase text-clay">Route Overview Map</p>
          <h3 className="mt-2 font-serif text-4xl font-semibold leading-tight">
            Major cities at a glance
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-moss">
            전체 일정표에 들어가기 전에 주요 도시의 이동 순서를 지도형 패널로 먼저 확인합니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-stone px-4 py-3">
            <div className="text-xs font-bold uppercase text-moss">Route days</div>
            <div className="mt-1 font-serif text-3xl font-semibold">{items.length}</div>
          </div>
          <div className="rounded-lg border border-stone px-4 py-3">
            <div className="text-xs font-bold uppercase text-moss">Major stops</div>
            <div className="mt-1 font-serif text-3xl font-semibold">{routeStops.length}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative min-h-[560px] bg-stone/20">
          {routeStops.length >= 2 ? (
            <MultiOsmMap
              markers={routeStops.map(stop => ({ lat: stop.lat, lng: stop.lng, label: stop.city, onClickUrl: `/trips/${trip.id}/day/${stop.day}` }))}
              className="min-h-[560px]"
            />
          ) : (
            <div className="flex h-full min-h-[560px] items-center justify-center p-6 text-center text-sm font-bold text-moss">
              지도 데이터가 부족합니다. (최소 2개 이상의 경유지 필요)
            </div>
          )}
        </div>

        <aside className="border-t border-ink bg-[#FCFAF5] p-5 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between border-b border-stone pb-3">
            <h4 className="font-serif text-2xl font-semibold">City Index</h4>
            <MapPinned className="h-5 w-5 text-clay" />
          </div>
          <ol className="mt-4 space-y-3">
            {routeStops.map((stop, index) => (
              <li key={`${stop.city}-${index}`} className="grid grid-cols-[32px_1fr] gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-black text-paper">
                  {index + 1}
                </span>
                <div className="border-b border-stone pb-3">
                  <div className="text-sm font-bold text-ink">{stop.city}</div>
                  <div className="mt-1 text-xs font-semibold uppercase text-moss">Day {stop.day}</div>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Rome: { lat: 41.9028, lng: 12.4964 },
  Roma: { lat: 41.9028, lng: 12.4964 },
  Catania: { lat: 37.5079, lng: 15.083 },
  Taormina: { lat: 37.8516, lng: 15.2853 },
  Syracuse: { lat: 37.0755, lng: 15.2866 },
  Valletta: { lat: 35.8997, lng: 14.5147 },
  Gozo: { lat: 36.0443, lng: 14.2512 },
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
  Doha: { lat: 25.2854, lng: 51.531 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  "Abu Dhabi": { lat: 24.4539, lng: 54.3773 },
  Seoul: { lat: 37.5665, lng: 126.978 }
};

type RouteMapStop = {
  city: string;
  day: number;
  lat: number;
  lng: number;
  x: number;
  y: number;
};

type RouteMapTick = {
  value: number;
  x?: number;
  y?: number;
};

type RouteMap = {
  stops: RouteMapStop[];
  latTicks: RouteMapTick[];
  lngTicks: RouteMapTick[];
  boundsLabel: string;
  projection: {
    westX: number;
    northY: number;
    width: number;
    height: number;
  };
};

function createRouteStops(trip: Trip, items: MasterTimelineItem[]): Array<Omit<RouteMapStop, "x" | "y">> {
  if (items.length > trip.itinerary.length) {
    return createTimelineRouteStops(items);
  }

  const mapItinerary = trip.itinerary.filter((day) => !isExcludedOverviewCity(day.city));

  if (mapItinerary.length) {
    const duplicateOffsets = new Map<string, number>();

    return mapItinerary.map((day) => {
      const coords = hasCoordinates(day.coordinates) ? day.coordinates : findKnownCityCoordinates(day.city);
      if (!coords || !coords.lat || !coords.lng) return null;

      const duplicateKey = `${coords.lat}-${coords.lng}`;
      const duplicateCount = duplicateOffsets.get(duplicateKey) ?? 0;
      duplicateOffsets.set(duplicateKey, duplicateCount + 1);

      return {
        city: day.city,
        day: day.day,
        lat: coords.lat + duplicateCount * 0.04,
        lng: coords.lng + duplicateCount * 0.04
      };
    }).filter((stop): stop is NonNullable<typeof stop> => stop !== null);
  }

  return createTimelineRouteStops(items);
}

function createTimelineRouteStops(items: MasterTimelineItem[]): Array<Omit<RouteMapStop, "x" | "y">> {
  const seenStops = new Set<string>();
  const majorStops = items.flatMap((item): Array<Omit<RouteMapStop, "x" | "y">> => {
    const routeParts = item.primaryRoute.split("-").map(s => s.trim());
    let destination = routeParts[routeParts.length - 1];
    if (routeParts.length >= 3 && routeParts[0] === routeParts[routeParts.length - 1]) {
      destination = routeParts[Math.floor(routeParts.length / 2)];
    }

    const city = (destination || routeParts[0]).trim();
    if (isExcludedOverviewCity(city)) return [];
    if (seenStops.has(city)) return [];

    const coordinates = findKnownCityCoordinates(city);
    if (!coordinates) return [];
    seenStops.add(city);
    return [{ city, day: item.day, ...coordinates }];
  });

  return majorStops.slice(0, 18);
}

function isExcludedOverviewCity(city: string) {
  const normalizedCity = city.trim().toLowerCase();
  return ["seoul", "서울", "doha", "dubai", "abu dhabi"].includes(normalizedCity);
}

function findKnownCityCoordinates(city: string): Coordinates | undefined {
  const exact = CITY_COORDINATES[city];
  if (exact) return exact;

  const normalizedCity = city.toLowerCase();
  return Object.entries(CITY_COORDINATES).find(([knownCity]) =>
    normalizedCity.includes(knownCity.toLowerCase())
  )?.[1];
}

function hasCoordinates(coordinates: Coordinates | undefined): coordinates is Coordinates {
  return Boolean(coordinates?.lat && coordinates.lng);
}

function TimelineRow({ item, tripId }: { item: MasterTimelineItem; tripId: string }) {
  return (
    <li className="group">
      <Link href={`/trips/${tripId}/day/${item.day}`} className="grid gap-5 px-5 py-5 lg:grid-cols-[96px_minmax(0,1.05fr)_minmax(0,1.25fr)_minmax(240px,0.9fr)] lg:items-start group-hover:bg-[#f5f0e6] transition-colors cursor-pointer">
      <div className="flex items-baseline gap-3 lg:block">
        <div className="font-serif text-4xl font-semibold leading-none text-ink">
          {item.dateLabel}
        </div>
        <div className="mt-2 text-xs font-bold uppercase text-clay">{item.weekday}</div>
      </div>

      <div>
        <div className="text-xs font-bold uppercase text-moss">Day {item.day}</div>
        <div className="mt-2 text-sm font-bold leading-6 text-ink">{item.primaryRoute}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.cities.map((city) => (
          <span
            key={`${item.id}-${city}`}
            className="rounded-lg border border-stone px-3 py-2 text-xs font-bold text-ink"
          >
            {city}
          </span>
        ))}
      </div>

      <div className="text-sm leading-6">
        {item.accommodation ? (
          <div className="flex gap-3">
            <Hotel className="mt-1 h-4 w-4 shrink-0 text-clay" />
            <div>
              <div className="font-bold text-ink">{item.accommodation.name}</div>
              <div className="text-xs text-moss">{item.accommodation.address}</div>
              {item.accommodation.checkIn || item.accommodation.checkOut ? (
                <div className="mt-1 text-xs font-bold text-clay">
                  {item.accommodation.checkIn ?? ""} - {item.accommodation.checkOut ?? ""}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex gap-3 text-moss">
            <Plane className="mt-1 h-4 w-4 shrink-0 text-clay" />
            <span>{item.note ?? "이동일입니다."}</span>
          </div>
        )}
      </div>
      </Link>
    </li>
  );
}

function DailyDetailSection({
  tripId,
  trip,
  items,
  guides
}: {
  tripId: string;
  trip: Trip;
  items: MasterTimelineItem[];
  guides: DailyGuide[];
}) {
  const guideByDay = useMemo(() => new Map(guides.map((guide) => [guide.day, guide])), [guides]);
  const missingMapDays = items.filter((item) => {
    const guide = guideByDay.get(item.day);
    return !guide || guide.places.length === 0;
  });
  const totalPlaces = guides.reduce((total, guide) => total + guide.places.length, 0);
  
  const [selectedPlace, setSelectedPlace] = useState<{place: DailyGuidePlace, region: string} | null>(null);

  return (
    <DossierSection id="daily" number="03" label="Daily Briefs">
      <DailyMapAudit
        mappedDays={items.length - missingMapDays.length}
        totalDays={items.length}
        totalPlaces={totalPlaces}
        missingDays={missingMapDays.map((item) => item.day)}
      />
      <div className="space-y-20">
        {items.map((item, index) => {
          const guide = guideByDay.get(item.day)!;

          return (
            <DailyGuideArticle
              key={guide.id}
              tripId={tripId}
              guide={guide}
              item={item}
              index={index}
              onSelectPlace={(place) => setSelectedPlace({ place, region: guide.region })}
            />
          );
        })}
      </div>
      <PlaceBottomSheet 
        place={selectedPlace?.place || null} 
        region={selectedPlace?.region || ""} 
        onClose={() => setSelectedPlace(null)} 
      />
    </DossierSection>
  );
}

function DailyMapAudit({
  mappedDays,
  totalDays,
  totalPlaces,
  missingDays
}: {
  mappedDays: number;
  totalDays: number;
  totalPlaces: number;
  missingDays: number[];
}) {
  const isComplete = missingDays.length === 0;

  return (
    <section className="mb-10 rounded-lg border border-ink bg-[#FCFAF5] p-5 shadow-editorial">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-clay">
            <CheckCircle2 className="h-4 w-4" />
            Map Coverage
          </div>
          <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight">
            Daily map audit
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-moss">
            일자별 브리프에 방문지 지도와 클릭 가능한 관광지 목록이 모두 연결되어 있는지 확인합니다.
          </p>
        </div>
        <div className="grid min-w-[260px] grid-cols-2 gap-3">
          <div className="rounded-lg border border-stone px-4 py-3">
            <div className="text-xs font-bold uppercase text-moss">Mapped days</div>
            <div className="mt-1 font-serif text-3xl font-semibold">
              {mappedDays}/{totalDays}
            </div>
          </div>
          <div className="rounded-lg border border-stone px-4 py-3">
            <div className="text-xs font-bold uppercase text-moss">Places</div>
            <div className="mt-1 font-serif text-3xl font-semibold">{totalPlaces}</div>
          </div>
        </div>
      </div>
      <div className="mt-5 border-t border-stone pt-4 text-sm font-semibold text-moss">
        {isComplete
          ? "모든 일자에 방문지 지도와 관광지 상세 링크가 준비되어 있습니다."
          : `지도 데이터가 비어 있는 일자: Day ${missingDays.join(", Day ")}`}
      </div>
    </section>
  );
}

function DailyGuideArticle({
  tripId,
  guide,
  item,
  index,
  onSelectPlace
}: {
  tripId: string;
  guide: DailyGuide;
  item: MasterTimelineItem;
  index: number;
  onSelectPlace: (place: DailyGuidePlace) => void;
}) {
  return (
    <motion.article
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      transition={{ duration: 0.5, delay: Math.min(index * 0.03, 0.18) }}
      className="border-t border-ink pt-8"
    >
      <div className="mb-8 grid gap-6 lg:grid-cols-[150px_minmax(0,1fr)]">
        <div>
          <div className="font-serif text-6xl font-semibold leading-none">
            {String(item.day).padStart(2, "0")}
          </div>
          <div className="mt-3 text-sm font-bold text-clay">
            {formatDate(item.date)} · {item.weekday}
          </div>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-moss">
            <MapPin className="h-4 w-4" />
            {guide.region}
          </div>
          <h3 className="mt-3 font-serif text-5xl font-semibold leading-[1.02]">{guide.title}</h3>
          <p className="mt-4 max-w-3xl text-base leading-7 text-moss">{guide.deck}</p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]">
        <div className="xl:sticky xl:top-32 xl:self-start">
          <GuideMap tripId={tripId} guide={guide} onSelectPlace={onSelectPlace} />
        </div>

        <div className="space-y-8">
          <EditorialText paragraphs={guide.editorial} />
          <ActivityList tripId={tripId} places={guide.places} onSelectPlace={onSelectPlace} />
          {guide.accommodation ? <AccommodationCard accommodation={guide.accommodation} /> : null}
        </div>
      </div>
    </motion.article>
  );
}

function GuideMap({
  tripId,
  guide,
  onSelectPlace
}: {
  guide: DailyGuide;
  tripId: string;
  onSelectPlace: (place: DailyGuidePlace) => void;
}) {
  const points = guide.places.map((place) => `${place.mapPosition.x},${place.mapPosition.y}`);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-sky-500">Map UI</div>
          <h4 className="mt-1 font-serif text-xl font-bold text-slate-900">{guide.mapLabel}</h4>
        </div>
        <MapPinned className="h-5 w-5 text-sky-500" />
      </div>

      <div className="relative aspect-[4/5] min-h-[520px] overflow-hidden">
        <div className="absolute inset-0 bg-slate-100" />
        <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(30deg,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(120deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:34px_34px]" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="#0ea5e9"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
        </svg>

        {guide.places.map((place, placeIndex) => (
          <button
            key={place.id}
            onClick={() => onSelectPlace(place)}
            className="absolute z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-sm font-bold text-white shadow-md transition hover:scale-110 hover:bg-sky-500 cursor-pointer"
            style={{ left: `${place.mapPosition.x}%`, top: `${place.mapPosition.y}%` }}
            aria-label={`${place.name} 상세 보기`}
            title={place.name}
          >
            {placeIndex + 1}
          </button>
        ))}

        <div className="absolute inset-x-4 bottom-4 rounded-xl border border-slate-200/50 bg-white/90 p-4 backdrop-blur shadow-sm">
          {guide.places.length ? (
            <ol className="space-y-2">
              {guide.places.slice(0, 5).map((place, placeIndex) => (
                <li key={`${place.id}-map-index`}>
                  <button
                    onClick={() => onSelectPlace(place)}
                    className="flex items-center gap-3 text-xs font-bold transition hover:text-sky-600 text-left w-full cursor-pointer text-slate-700"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      {placeIndex + 1}
                    </span>
                    <span className="truncate">{place.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              이 일자의 방문지 좌표가 아직 준비되지 않았습니다.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function EditorialText({ paragraphs }: { paragraphs: string[] }) {
  return (
    <section className="border-y border-stone py-7">
      <div className="space-y-5">
        {paragraphs.map((paragraph, index) => (
          <p
            key={paragraph}
            className={`indent-8 font-serif text-ink ${
              index === 0 ? "text-2xl leading-10" : "text-xl leading-9"
            }`}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

function ActivityList({
  tripId,
  places,
  onSelectPlace
}: {
  places: DailyGuidePlace[];
  tripId: string;
  onSelectPlace: (place: DailyGuidePlace) => void;
}) {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
        <h4 className="font-serif text-2xl font-bold text-slate-900">Photo Feed</h4>
        <Images className="h-5 w-5 text-sky-500" />
      </div>
      {places.length ? (
        <div className="mx-auto max-w-md space-y-8">
          {places.map((place) => {
            const likes = (place.name.length * 142 + 53) % 1000 + 100;
            return (
              <div
                key={place.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md cursor-pointer"
                onClick={() => onSelectPlace(place)}
              >
                {/* Post Header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 p-[2px]">
                    <div className="h-full w-full overflow-hidden rounded-full border-2 border-white bg-white">
                      <Image src={place.image} alt="profile" width={32} height={32} className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-slate-900 leading-tight">
                      {place.name}
                    </h5>
                    <p className="text-[11px] font-medium text-slate-500">
                      {place.category} {place.timeLabel && `· ${place.timeLabel}`}
                    </p>
                  </div>
                  <MoreHorizontal className="h-5 w-5 text-slate-400" />
                </div>

                {/* Post Image */}
                <div className="relative aspect-square w-full bg-slate-100">
                  <Image
                    src={place.image}
                    alt={place.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                  />
                </div>

                {/* Post Actions & Caption */}
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-4">
                    <Heart className="h-6 w-6 text-slate-800 transition hover:text-rose-500" />
                    <MessageCircle className="h-6 w-6 text-slate-800" />
                    <Send className="h-6 w-6 text-slate-800" />
                    <div className="flex-1" />
                    <Bookmark className="h-6 w-6 text-slate-800" />
                  </div>
                  <div className="mb-2 text-sm font-bold text-slate-900">
                    좋아요 {likes}개
                  </div>
                  <div className="text-sm text-slate-800 line-clamp-2">
                    <span className="mr-2 font-bold text-slate-900">guidedesk</span>
                    {place.description}
                  </div>
                  <div className="mt-2 text-[10px] font-medium uppercase text-slate-400">
                    View details
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">
          아직 업로드된 사진이 없습니다.
        </div>
      )}
    </section>
  );
}

function AccommodationCard({ accommodation }: { accommodation: DailyGuide["accommodation"] }) {
  if (!accommodation) return null;

  return (
    <section className="rounded-lg border border-ink bg-[#FCFAF5] p-5 shadow-editorial">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-clay">
            <Hotel className="h-4 w-4" />
            Accommodation
          </div>
          <h4 className="mt-3 font-serif text-3xl font-semibold leading-tight">
            {accommodation.name}
          </h4>
          <p className="mt-3 max-w-xl text-sm leading-6 text-moss">{accommodation.address}</p>
        </div>
        {accommodation.googleMapsUrl ? (
          <a
            href={accommodation.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-bold text-paper transition hover:bg-clay"
          >
            <Navigation className="h-4 w-4" />
            Google Maps
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-stone px-4 py-3">
          <div className="text-xs font-bold uppercase text-moss">Check in</div>
          <div className="mt-1 font-serif text-2xl font-semibold">{accommodation.checkIn ?? "-"}</div>
        </div>
        <div className="rounded-lg border border-stone px-4 py-3">
          <div className="text-xs font-bold uppercase text-moss">Check out</div>
          <div className="mt-1 font-serif text-2xl font-semibold">{accommodation.checkOut ?? "-"}</div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-stone">
        <OsmMap query={accommodation.address || accommodation.name} className="h-[280px] w-full" />
      </div>
    </section>
  );
}

function SightsSection() {
  return (
    <DossierSection id="sights" number="04" label="Sights & Places">
      <div className="rounded-lg border border-stone bg-[#FCFAF5] p-10 text-center text-sm font-medium text-moss">
        여행 중 방문할 주요 관광지 갤러리 및 상세 설명이 이 섹션에 채워질 예정입니다.
      </div>
    </DossierSection>
  );
}

function LogisticsSection() {
  return (
    <DossierSection id="logistics" number="05" label="Logistics">
      <div className="rounded-lg border border-stone bg-[#FCFAF5] p-10 text-center text-sm font-medium text-moss">
        숙소 바우처, 교통 예약 내역, 준비물 등 기타 여행 물류 정보가 표시될 예정입니다.
      </div>
    </DossierSection>
  );
}

function DossierSection({
  id,
  number,
  label,
  children
}: {
  id: string;
  number: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ duration: 0.56, ease: "easeOut" }}
    >
      <div className="mb-8 flex items-end justify-between gap-6 border-b border-ink pb-4">
        <div>
          <p className="text-sm font-bold text-clay">{number}</p>
          <h2 className="mt-2 font-serif text-5xl font-semibold leading-none">{label}</h2>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-paper px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px] space-y-8">
        <div className="skeleton h-14 rounded-lg" />
        <div className="skeleton h-[560px] rounded-lg" />
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="skeleton h-72 rounded-lg" />
          <div className="space-y-6">
            <div className="skeleton h-44 rounded-lg" />
            <div className="skeleton h-96 rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  );
}

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit"
  }).format(date);
}

function placeDetailHref(tripId: string, placeId: string) {
  return `/trips/${encodeURIComponent(tripId)}/places/${encodeURIComponent(placeId)}`;
}

function useAnchorVisibility(offset: number) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(window.scrollY > offset);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, [offset]);

  return isVisible;
}

function useActiveSection(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? "");

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.05, 0.2, 0.45]
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeSection;
}
