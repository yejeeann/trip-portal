"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  X
} from "lucide-react";
import type { DailyGuide, DailyGuidePlace } from "@/lib/swiss-guide-data";
import { findPlaceInTripGuide } from "@/lib/trip-guide";
import type { Trip } from "@/lib/types";
import { useTravelPayload } from "@/lib/travel-payload-client";
import { GuideImage } from "./guide-image";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 }
};

export function PlaceDetail({ tripId, placeId }: { tripId: string; placeId: string }) {
  const { payload, isLoading } = useTravelPayload();

  const trips = useMemo(() => {
    if (!payload) return [];
    return payload.trips?.length ? payload.trips : [payload.trip];
  }, [payload]);

  const trip = trips.find((item) => item.id === tripId) ?? null;
  const placeContext = useMemo(() => (trip ? findPlaceInTripGuide(trip, placeId) : null), [placeId, trip]);

  if (isLoading) {
    return <PlaceSkeleton />;
  }

  if (!trip || !placeContext?.place || !placeContext.guide) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink">
        <div className="max-w-md text-center">
          <p className="text-xs font-bold uppercase text-clay">Place unavailable</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold">No matching field note.</h1>
          <Link
            href={`/trips/${encodeURIComponent(tripId)}`}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-bold text-paper transition hover:bg-clay"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to trip
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <PlaceHeader trip={trip} dayId={placeContext.guide.day} />
      <PlaceHero trip={trip} guide={placeContext.guide} place={placeContext.place} />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <motion.article
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.52, ease: "easeOut" }}
            className="py-8"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-clay">{placeContext.place.category}</p>
            <h2 className="mt-4 font-serif text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tight text-slate-900">
              {placeContext.place.name}
            </h2>
            
            <div className="mt-10 sm:mt-14">
              <p className="text-xl sm:text-2xl text-slate-800 font-serif mb-12 leading-[1.8] sm:leading-[1.9] tracking-tight text-justify">
                <span className="float-left mr-4 -mt-2 text-7xl sm:text-8xl font-bold text-slate-900 leading-none">
                  {placeContext.place.description.charAt(0)}
                </span>
                {placeContext.place.description.slice(1)}
              </p>

              <StaticPlaceGuide place={placeContext.place} />
            </div>
          </motion.article>
      </div>
    </main>
  );
}

export function McpIntelligence({ placeName }: { placeName: string; region?: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-8">
      <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
        <Sparkles className="h-6 w-6 text-sky-600" />
        <h3 className="m-0 font-serif text-2xl font-bold text-slate-900">Static Guide Note</h3>
      </div>
      <p className="text-base leading-relaxed text-slate-700">
        <strong>{placeName}</strong> 상세 설명은 앱 실행 중 MCP를 호출하지 않고, 개발 중 MCP/보완 소스로 채운 정적 가이드 데이터를 사용합니다.
      </p>
      <p className="mt-3 text-sm font-semibold text-slate-500">
        정적 상세가 없는 장소는 `scripts/enrich-attractions-from-mcp.mjs`로 보강한 뒤 앱 데이터에 저장하는 흐름을 사용합니다.
      </p>
    </div>
  );
}

export function PlaceBottomSheet({
  place,
  region,
  onClose
}: {
  place: DailyGuidePlace | null;
  region?: string;
  onClose: () => void;
}) {
  const detailDescription =
    place && "detailDescription" in place && typeof place.detailDescription === "string"
      ? place.detailDescription
      : place?.description;
  const whyVisit = place && "whyVisit" in place && Array.isArray(place.whyVisit) ? place.whyVisit : [];
  const whatToSee = place && "whatToSee" in place && Array.isArray(place.whatToSee) ? place.whatToSee : [];
  const tips = place && "tips" in place && Array.isArray(place.tips) ? place.tips : [];
  const duration = place && "duration" in place && typeof place.duration === "string" ? place.duration : null;
  const nextStop =
    place && "nextStop" in place && place.nextStop && typeof place.nextStop === "object"
      ? place.nextStop as { name?: string; distanceText?: string; durationText?: string }
      : null;

  return (
    <AnimatePresence>
      {place && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[60] flex max-h-[92dvh] min-h-[70dvh] flex-col overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:max-w-2xl md:mx-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-3xl"
          >
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />
            <button
              onClick={onClose}
              className="absolute right-6 top-6 z-10 rounded-full bg-white/80 backdrop-blur-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600">{place.category}</span>
            <h2 className="mb-4 mt-1 font-serif text-3xl font-bold text-slate-900">{place.name}</h2>

            {place.image && (
              <div className="relative mb-6 h-56 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-100">
                <GuideImage src={place.image} alt={place.imageAlt || place.name} className="absolute inset-0 h-full w-full" />
              </div>
            )}

            <p className="mb-5 font-serif text-sm leading-loose text-slate-600">
              {detailDescription}
            </p>

            <div className="mb-6 grid gap-3">
              {duration && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">소요시간</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{duration}</p>
                </div>
              )}

              {whyVisit.length > 0 && (
                <GuideList title="왜 가야 하는지" items={whyVisit} />
              )}

              {whatToSee.length > 0 && (
                <GuideList title="현장에서 볼 것" items={whatToSee} />
              )}

              {tips.length > 0 && (
                <GuideList title="방문 팁" items={tips} />
              )}

              {nextStop?.name && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">다음 장소</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{nextStop.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    {[nextStop.distanceText, nextStop.durationText].filter(Boolean).join(" · ")}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function GuideList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
      <ul className="mt-2 grid gap-1.5 text-sm font-semibold leading-relaxed text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sky-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StaticPlaceGuide({ place }: { place: DailyGuidePlace }) {
  const detailDescription =
    "detailDescription" in place && typeof place.detailDescription === "string"
      ? place.detailDescription
      : place.description;
  const whyVisit = "whyVisit" in place && Array.isArray(place.whyVisit) ? place.whyVisit : [];
  const whatToSee = "whatToSee" in place && Array.isArray(place.whatToSee) ? place.whatToSee : [];
  const tips = "tips" in place && Array.isArray(place.tips) ? place.tips : [];
  const duration = "duration" in place && typeof place.duration === "string" ? place.duration : null;
  const nextStop =
    "nextStop" in place && place.nextStop && typeof place.nextStop === "object"
      ? place.nextStop as { name?: string; distanceText?: string; durationText?: string }
      : null;

  return (
    <div className="mt-8 grid gap-4">
      <p className="font-serif text-base leading-loose text-slate-700">{detailDescription}</p>

      {duration && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">소요시간</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{duration}</p>
        </div>
      )}

      {whyVisit.length > 0 && <GuideList title="왜 가야 하는지" items={whyVisit} />}
      {whatToSee.length > 0 && <GuideList title="현장에서 볼 것" items={whatToSee} />}
      {tips.length > 0 && <GuideList title="방문 팁" items={tips} />}

      {nextStop?.name && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">다음 장소</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{nextStop.name}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            {[nextStop.distanceText, nextStop.durationText].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}

    </div>
  );
}

function PlaceHeader({ trip, dayId }: { trip: Trip; dayId: string | number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone/70 bg-paper/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={`/trips/${encodeURIComponent(trip.id)}/day/${dayId}`}
          className="inline-flex items-center gap-2 rounded-lg border border-stone px-3 py-2 text-sm font-bold text-ink transition hover:border-ink hover:bg-ink hover:text-paper"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Day {dayId}
        </Link>
        <div className="truncate font-serif text-2xl font-semibold">{trip.title}</div>
      </div>
    </header>
  );
}

function PlaceHero({
  trip,
  guide,
  place
}: {
  trip: Trip;
  guide: DailyGuide;
  place: DailyGuidePlace;
}) {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ duration: 0.68, ease: "easeOut" }}
      className="relative min-h-[520px] overflow-hidden"
    >
      <GuideImage src={place.image} alt={place.imageAlt} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-black/18" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1320px] px-4 pb-12 text-paper sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase text-paper/70">Sights & Places</p>
        <h1 className="mt-4 max-w-5xl font-serif text-[clamp(3.2rem,7vw,7.8rem)] font-semibold leading-[0.9]">
          {place.name}
        </h1>
      </div>
    </motion.section>
  );
}

function PlaceSkeleton() {
  return (
    <main className="min-h-screen bg-paper px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px] space-y-8">
        <div className="skeleton h-14 rounded-lg" />
        <div className="skeleton h-[520px] rounded-lg" />
        <div className="mx-auto w-full max-w-3xl">
          <div className="skeleton h-96 w-full rounded-lg" />
        </div>
      </div>
    </main>
  );
}
