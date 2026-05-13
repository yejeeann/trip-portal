"use client";

import { sicilyGuideData } from "@/lib/sicily-guide-data";
import type { DailyGuide, DailyGuidePlace, FlightTicket } from "@/lib/swiss-guide-data";
import type { TravelPayload } from "@/lib/types";
import { useEffect } from "react";
import { MultiOsmMap } from "./multi-osm-map";

const MagazineInfoBox = ({ title, items, colorClass }: { title: string; items: string[]; colorClass: string }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className={`avoid-break-inside ${colorClass}`}>
      <h4 className="font-sans font-bold uppercase tracking-widest text-xs mb-2">{title}</h4>
      <ul className="list-none space-y-1 text-sm font-sans text-stone-600">
        {items.map((item, i) => (
          <li key={i} className="pl-3 relative">
            <span className="absolute left-0 top-0 text-current opacity-50">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const PlaceCard = ({ place }: { place: DailyGuidePlace }) => (
  <div className="avoid-break-inside mt-16 mb-16">
    <h3 className="text-3xl text-[var(--print-theme)] mb-2">{place.name}</h3>
    <div className="text-xs font-sans uppercase tracking-widest text-stone-400 mb-6 border-b border-stone-200 pb-3">
      {place.category} | {place.duration}
    </div>
    
    {place.image && (
      <div className="mb-8 w-full h-[320px] overflow-hidden">
        <img src={place.image} alt={place.imageAlt} className="w-full h-full object-cover grayscale-[15%]" />
      </div>
    )}

    {/* 매거진 스타일 2단 텍스트 + Drop Cap */}
    <div className="multi-column drop-cap mb-8 text-stone-800">
      {place.detailDescription}
    </div>
    
    {/* 3단 정보 박스 배열 */}
    <div className="grid grid-cols-3 gap-8 pt-6 border-t border-stone-100">
      <MagazineInfoBox title="Why Visit" items={place.whyVisit ?? []} colorClass="text-[var(--print-theme)]" />
      <MagazineInfoBox title="What to See" items={place.whatToSee ?? []} colorClass="text-stone-700" />
      <MagazineInfoBox title="Tips" items={place.tips ?? []} colorClass="text-stone-700" />
    </div>
  </div>
);

export const PrintLayout = ({ payload }: { payload: TravelPayload }) => {
  const guideData = sicilyGuideData;
  const stitchThemeColor = payload.uiConfig?.themeColor || "#84947b";

  useEffect(() => {
    document.body.classList.add("print-body");
    return () => document.body.classList.remove("print-body");
  }, []);

  // 2단계: 전체 지도를 위한 모든 좌표 추출
  const allMarkers = guideData.dailyGuides.flatMap(guide =>
    guide.cityVisits?.flatMap(visit =>
      visit.spots.filter(spot => spot.coordinates).map(spot => ({
        lat: spot.coordinates!.lat,
        lng: spot.coordinates!.lng,
        label: spot.name
      }))
    ) || []
  );

  return (
    <div 
      className="print-container max-w-4xl mx-auto p-8 bg-white"
      style={{ "--print-theme": stitchThemeColor } as React.CSSProperties}
    >
      {/* 1. Cover Page */}
      <section 
        className="print-cover" 
        style={{ backgroundImage: `url('/travel-photos/sicily-day10-12/valley-of-the-temples.jpg')` }}
      >
        <h1>{payload.trip.title || "Sicily & Malta Guidebook"}</h1>
        <p className="mt-4">A Curated Journey • {payload.trip.dateRange || "May 21 – Jun 08"}</p>
      </section>

      {/* 2. Route Atlas & Overview */}
      <section className="page-break-before py-12">
        <h2 className="section-header">Route Atlas</h2>
        <div className="w-full h-[500px] border border-stone-200 mb-8 p-1">
           <div className="w-full h-full relative grayscale-[20%]">
             <MultiOsmMap markers={allMarkers} className="absolute inset-0 h-full w-full" />
           </div>
        </div>
        <div className="multi-column text-lg text-stone-700 italic font-serif leading-relaxed">
          <p>이 지도는 앞으로 우리가 펼쳐나갈 19일간의 여정을 보여줍니다. 북유럽을 거쳐 로마에 닿고, 이내 야간열차를 타고 시칠리아의 화산과 마주합니다. 고대 그리스의 웅장한 신전부터 몰타 기사단의 성벽 도시, 그리고 바로크의 황금빛 골목까지 지중해의 깊은 시간 속으로 떠나는 기록입니다.</p>
        </div>
      </section>

      {/* 3 & 4. Logistics & Accommodations */}
      <section className="page-break-before py-12">
        <h2 className="section-header">Accommodations</h2>
        <table className="w-full text-left border-collapse magazine-table mb-16">
            <thead>
                <tr>
                    <th className="w-1/3">Property</th>
                    <th className="w-1/2">Address</th>
                    <th className="w-1/6">Dates</th>
                </tr>
            </thead>
            <tbody>
                {guideData.masterTimeline.map(item => item.accommodation && (
                    <tr key={item.id} className="avoid-break-inside">
                        <td className="font-serif text-lg">{item.accommodation.name}</td>
                        <td className="font-sans text-sm text-stone-500 pr-4">{item.accommodation.address}</td>
                        <td className="font-sans text-sm">{item.accommodation.checkIn} — {item.accommodation.checkOut}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </section>

      {/* 5. Daily Guides */}
      {guideData.dailyGuides.map((guide: DailyGuide) => (
        <section key={guide.id} className="daily-guide page-break-before">
          <header className="daily-guide-header">
            <div className="day-number">Day {guide.day}</div>
            <h2>{guide.title}</h2>
            <p className="font-sans text-sm uppercase tracking-widest text-stone-500">
              {new Date(guide.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'long' })} &nbsp;•&nbsp; {guide.region}
            </p>
          </header>
          
          <p className="text-xl italic text-stone-600 mb-12 text-center max-w-2xl mx-auto leading-relaxed">
            "{guide.deck}"
          </p>

          {(() => {
            const dailyMarkers = guide.cityVisits?.flatMap(visit =>
              visit.spots.filter(spot => spot.coordinates).map(spot => ({
                lat: spot.coordinates!.lat,
                lng: spot.coordinates!.lng,
                label: spot.name
              }))
            ) || [];

            if (dailyMarkers.length > 0) {
              return (
                <div className="avoid-break-inside relative z-0 h-[300px] w-full mb-12 p-1 border border-stone-200">
                  <div className="w-full h-full relative grayscale-[20%]">
                    <MultiOsmMap markers={dailyMarkers} className="absolute inset-0 h-full w-full" />
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {guide.cityVisits?.map(visit => (
            <div key={visit.id} className="city-visit-section">
              {visit.spots.map(spot => (
                <PlaceCard key={spot.id} place={spot} />
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
};

export default PrintLayout;
