"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Home,
  Luggage,
  MapPin,
  Plane,
  Route,
  Clock
} from "lucide-react";
import { getGuideDataForTrip } from "@/lib/trip-guide";
import type { Trip } from "@/lib/types";
import { useTravelPayload } from "@/lib/travel-payload-client";
import { AirlineLogo } from "./airline-logo";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 }
};

export function TripDashboard({ tripId }: { tripId: string }) {
  const { payload, isLoading } = useTravelPayload();

  const trips = useMemo(() => {
    if (!payload) return [];
    return payload.trips?.length ? payload.trips : [payload.trip];
  }, [payload]);

  const trip = trips.find((item) => item.id === tripId) ?? null;
  const guideData = useMemo(() => (trip ? getGuideDataForTrip(trip) : null), [trip]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600"></div>
      </div>
    );
  }

  if (!trip || !guideData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
        <div className="max-w-md text-center">
          <p className="text-xs font-bold uppercase text-slate-500">Trip unavailable</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold">No matching trip found.</h1>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const { masterTimeline, flightTickets } = guideData;
  const uniqueCities = Array.from(new Set(masterTimeline.flatMap((i) => i.cities)));
  const uniqueStays = Array.from(
    new Map(
      masterTimeline
        .filter((item) => item.accommodation)
        .map((item) => [item.accommodation!.name, item.accommodation])
    ).values()
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900 font-sans selection:bg-sky-500/30">
      {/* App Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="font-serif text-xl font-bold text-slate-900">Trip Overview</div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </header>

      {/* Hero Section */}
      <motion.div 
        initial="hidden" animate="visible" variants={fadeUp}
        className="relative h-[35vh] w-full shrink-0 bg-slate-900 overflow-hidden"
      >
        <Image src={trip.heroImage} alt={trip.title} fill className="object-cover opacity-50 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-8 left-6 right-6">
          <span className="inline-block px-2.5 py-1 mb-3 text-[10px] font-bold text-sky-900 uppercase tracking-widest bg-sky-400 rounded-full">
            {trip.status}
          </span>
          <h1 className="font-serif text-4xl font-semibold text-white drop-shadow-lg leading-tight">{trip.title}</h1>
          <p className="mt-2 text-slate-300 text-sm font-medium">{trip.dateRange} · {trip.countries.join(" / ")}</p>
        </div>
      </motion.div>

      <div className="px-6 mt-8 space-y-10 max-w-3xl mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-serif font-bold text-sky-600">{masterTimeline.length}</div>
            <div className="text-[10px] font-bold uppercase text-slate-400 mt-1 tracking-wider">Days</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-serif font-bold text-sky-600">{uniqueCities.length}</div>
            <div className="text-[10px] font-bold uppercase text-slate-400 mt-1 tracking-wider">Cities</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-serif font-bold text-sky-600">{uniqueStays.length}</div>
            <div className="text-[10px] font-bold uppercase text-slate-400 mt-1 tracking-wider">Accommodations</div>
          </div>
        </div>

        {/* Daily Itinerary Cards */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-sky-600" />
            <h2 className="text-2xl font-serif font-bold text-slate-900">Daily Itinerary</h2>
          </div>
          <p className="text-sm text-slate-500 mb-6">원하는 일자를 선택하여 상세 동선과 일정을 확인하세요.</p>
          
          <div className="grid gap-4">
            {masterTimeline.map((item) => (
              <Link 
                key={item.id} 
                href={`/trips/${trip.id}/day/${item.day}`}
                className="group flex flex-col bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-sky-200 transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                      <span className="text-[10px] font-bold uppercase">Day</span>
                      <span className="text-lg font-serif font-bold leading-none">{item.day}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{item.dateLabel}</h3>
                      <p className="text-xs text-slate-500 font-medium">{item.weekday}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                    {item.cities[0] || '이동'}
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">
                  {item.primaryRoute}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Flight & Accommodations Summary */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
            <Luggage className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-serif font-bold text-slate-900">Logistics Summary</h2>
          </div>
          
          {flightTickets.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Plane className="w-4 h-4 text-sky-600" /> 확정 교통편</h3>
              {flightTickets.map((t, idx) => (
                <div key={t.id} className={`${idx > 0 ? "border-t border-slate-100 mt-3 pt-3" : ""}`}>
                  <div className="flex items-center gap-3">
                    <AirlineLogo code={t.segments[0]?.airlineCode} name={t.segments[0]?.airlineName} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-500 mb-1">{t.title}</div>
                      <div className="text-sm">{t.segments[0].from.code} → {t.segments[t.segments.length-1].to.code}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {uniqueStays.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Home className="w-4 h-4 text-sky-600" /> 숙소 (Basecamps)</h3>
              <div className="space-y-3">
                {uniqueStays.map((acc, idx) => (
                  <div key={idx} className={`flex flex-col gap-1 ${idx > 0 ? "border-t border-slate-100 pt-3" : ""}`}>
                    <div className="text-sm font-bold text-slate-800">{acc!.name}</div>
                    <div className="text-xs text-slate-500">{acc!.address}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
