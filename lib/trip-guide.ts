import {
  swissGuideData,
  type DailyGuide,
  type MasterTimelineItem,
  type SwissGuideData
} from "@/lib/swiss-guide-data";
import { sicilyGuideData } from "@/lib/sicily-guide-data";
import type { Trip } from "@/lib/types";

export type { SwissGuideData };

export function getGuideDataForTrip(trip: Trip): SwissGuideData {
  if (trip.id === swissGuideData.tripId) {
    return swissGuideData;
  }

  if (trip.id === sicilyGuideData.tripId) {
    return sicilyGuideData;
  }

  const firstDay = trip.itinerary[0];
  const lastDay = trip.itinerary[trip.itinerary.length - 1] ?? firstDay;

  return {
    tripId: trip.id,
    sourcePdf: "fallback",
    flightTickets: [
      {
        id: `${trip.id}-flight-placeholder`,
        title: "Flight Block",
        routeLabel: `${firstDay?.city ?? "Arrival"} / ${lastDay?.city ?? "Departure"}`,
        dateLabel: trip.dateRange,
        connectionLabel: "경유 정보는 확정 전입니다",
        segments: [
          {
            flightNo: "TBD",
            airlineCode: "TBD",
            airlineName: "확정 예정",
            from: {
              city: firstDay?.city ?? "Arrival",
              airport: "도착 게이트웨이",
              code: "ARR",
              time: "--:--"
            },
            to: {
              city: lastDay?.city ?? "Departure",
              airport: "출발 게이트웨이",
              code: "DEP",
              time: "--:--"
            },
            duration: "TBD"
          }
        ]
      }
    ],
    masterTimeline: trip.itinerary.map((day) => ({
      id: `${trip.id}-day-${day.day}`,
      day: day.day,
      date: day.date,
      dateLabel: formatTimelineDate(day.date),
      weekday: formatWeekday(day.date),
      primaryRoute: `${day.city}, ${day.country}`,
      cities: [day.city, ...day.highlights.slice(0, 4)],
      note: `${day.title} 구간의 이동과 현장 체크포인트를 확인합니다.`
    })),
    dailyGuides: trip.itinerary.map((day) =>
      createDailyGuideFromTimeline(
        {
          id: `${trip.id}-day-${day.day}`,
          day: day.day,
          date: day.date,
          dateLabel: formatTimelineDate(day.date),
          weekday: formatWeekday(day.date),
          primaryRoute: `${day.city}, ${day.country}`,
          cities: [day.city, ...day.highlights.slice(0, 4)],
          note: `${day.title} 구간의 이동과 현장 체크포인트를 확인합니다.`
        },
        trip.heroImage,
        day.image,
        day.coordinates
      )
    )
  };
}

export function buildDailyGuidesForTrip(trip: Trip, guideData = getGuideDataForTrip(trip)) {
  const guideByDay = new Map(guideData.dailyGuides.map((guide) => [guide.day, guide]));
  const itineraryByDay = new Map(trip.itinerary.map((day) => [day.day, day]));

  return guideData.masterTimeline.map((item) => {
    const day = itineraryByDay.get(item.day);
    const explicitGuide = guideByDay.get(item.day);

    if (explicitGuide) {
      return {
        ...explicitGuide,
        accommodation: explicitGuide.accommodation ?? item.accommodation,
        transportMode: explicitGuide.transportMode ?? item.transportMode
      };
    }

    return createDailyGuideFromTimeline(item, trip.heroImage, day?.image, day?.coordinates);
  });
}

export function findPlaceInTripGuide(trip: Trip, placeId: string) {
  const guideData = getGuideDataForTrip(trip);
  const guides = buildDailyGuidesForTrip(trip, guideData);

  for (const guide of guides) {
    const place = guide.places.find((item) => item.id === placeId);
    if (place) {
      const timelineItem = guideData.masterTimeline.find((item) => item.day === guide.day);
      return { guideData, guides, guide, place, timelineItem };
    }
  }

  return { guideData, guides, guide: null, place: null, timelineItem: null };
}

export function createDailyGuideFromTimeline(
  item: MasterTimelineItem,
  fallbackImage: string,
  dayImage?: string,
  dayCoordinates?: { lat: number; lng: number }
): DailyGuide {
  const places = item.cities.slice(0, 5).map((city, index) => ({
    id: `${item.id}-place-${index + 1}`,
    name: city,
    category: getGeneratedPlaceCategory(city, index),
    timeLabel: index === 0 ? "거점" : undefined,
    description:
      index === 0
        ? getGeneratedPlaceDescription(city, item.primaryRoute, true)
        : getGeneratedPlaceDescription(city, item.primaryRoute, false),
    detailDescription: getGeneratedPlaceDetail(city, item.primaryRoute),
    whyVisit: getGeneratedPlaceWhyVisit(city),
    whatToSee: getGeneratedPlaceWhatToSee(city),
    tips: getGeneratedPlaceTips(city),
    image: index === 0 ? dayImage ?? fallbackImage : fallbackImage,
    imageAlt: `${city} 여행 이미지`,
    coordinates: index === 0 ? dayCoordinates : undefined,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}`,
    mapPosition: {
      x: 18 + ((index * 17) % 64),
      y: 24 + ((index * 19) % 54)
    }
  }));

  return {
    id: `${item.id}-guide`,
    day: item.day,
    date: item.date,
    title: item.primaryRoute,
    region: item.cities.slice(0, 3).join(" / ") || item.primaryRoute,
    deck: item.note ?? `${item.primaryRoute} 구간의 이동, 장소, 숙소 메모를 한 화면에 정리했습니다.`,
    mapLabel: `Day ${item.day} route map`,
    editorial: [
      `${item.primaryRoute}는 일정표의 한 줄보다 더 많은 결을 가진 날입니다. 이동 순서와 휴식 지점을 먼저 읽어두면, 현장에서는 선택지가 단순해집니다.`,
      "지도 위의 장소들은 하루의 리듬을 만드는 기준점입니다. 각 지점을 눌러 사진과 현장 메모를 확인하고, 숙소 정보는 하루의 마지막 체크포인트로 고정합니다."
    ],
    transportMode: item.transportMode,
    accommodation: item.accommodation
      ? {
          ...item.accommodation,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            item.accommodation.address
          )}`
        }
      : undefined,
    places
  };
}

function getGeneratedPlaceCategory(city: string, index: number) {
  const key = normalizePlaceName(city);
  const baseOrTransfer = new Set([
    "contrada piano milano",
    "strada provinciale 24b",
    "via metauro",
    "via della riserva dell albaceto",
    "fiumicino",
    "helsinki",
    "seoul",
    "incheon"
  ]);
  const hidden = new Set(["erice", "scopello", "monreale", "realmonte", "campania", "calabria"]);

  if (index === 0 && baseOrTransfer.has(key)) return "숙소/이동 기준";
  return hidden.has(key) ? "숨은 명소" : "꼭 가봐야 할 곳";
}

function normalizePlaceName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").trim();
}

function getGeneratedPlaceDescription(city: string, route: string, isBase: boolean) {
  const key = normalizePlaceName(city);
  const known: Record<string, string> = {
    agrigento: "Agrigento는 고대 그리스 유적과 남서부 시칠리아 풍경을 함께 보는 핵심 도시입니다.",
    realmonte: "Realmonte는 Scala dei Turchi와 Agrigento를 연결하기 좋은 남서부 시칠리아 숙박 거점입니다.",
    "valley of the temples": "신전의 계곡은 Agrigento를 대표하는 고대 그리스 유적지로, 하루 동선의 중심이 되는 장소입니다.",
    trapani: "Trapani는 서부 시칠리아의 항구 도시로, Erice와 해안 마을을 연결하는 이동 거점입니다.",
    erice: "Erice는 산 위의 중세 마을로, Trapani 해안과 염전 풍경을 내려다보는 전망지입니다.",
    scopello: "Scopello는 서부 해안의 작은 마을로, 맑은 바다와 바위 해안 풍경을 보기 좋은 곳입니다.",
    palermo: "Palermo는 시칠리아의 수도로, 노르만 건축과 시장, 바로크 골목이 겹쳐지는 도시입니다.",
    monreale: "Monreale는 황금 모자이크로 유명한 대성당을 중심으로 Palermo 근교에서 들르기 좋은 장소입니다.",
    campania: "Campania 구간은 시칠리아 이후 이탈리아 본토로 이동하며 숙소를 기준으로 동선을 정리하는 구간입니다.",
    calabria: "Calabria 구간은 시칠리아와 로마 사이를 북상하며 남부 이탈리아의 해안과 이동 리듬을 잇는 구간입니다.",
    rome: "Rome은 6/7 FCO 출국 전 마지막 숙박과 공항 이동을 정리하는 최종 거점입니다."
  };

  if (known[key]) return known[key];

  return isBase
    ? `${route}의 숙소와 이동 방향을 잡는 기준 지점입니다.`
    : `${city}는 ${route} 동선에서 숙소 위치와 함께 확인할 경유 지점입니다.`;
}

function getGeneratedPlaceDetail(city: string, route: string) {
  const key = normalizePlaceName(city);
  const known: Record<string, string> = {
    agrigento:
      "Agrigento는 시칠리아 남서부에서 가장 중요한 고대 유적 도시입니다. 신전의 계곡을 중심으로 고대 그리스 도시의 흔적을 보고, Realmonte 숙소와 묶으면 이동 부담을 줄이면서 반나절 또는 하루 코스로 정리하기 좋습니다.",
    realmonte:
      "Realmonte는 Agrigento와 해안 명소 사이에 놓인 숙소 거점입니다. 숙박 위치를 기준으로 신전의 계곡, Scala dei Turchi, 남서부 해안 동선을 나눠 보기 좋습니다.",
    "valley of the temples":
      "신전의 계곡은 Agrigento 여행의 핵심입니다. 넓은 고고학 구역 안에 여러 고대 신전이 이어져 있어, 더운 시간대를 피해 오전이나 늦은 오후에 보는 구성이 편합니다.",
    trapani:
      "Trapani는 서부 시칠리아의 항구 도시입니다. Erice, Scopello, 염전 지역과 연결하기 좋고, 숙소가 서부에 있을 때 하루 동선의 출발점이나 식사 거점으로 쓰기 좋습니다.",
    erice:
      "Erice는 Trapani 위쪽 산에 자리한 중세 마을입니다. 골목 자체가 산책 코스이고, 날씨가 맑으면 해안과 섬 방향 전망이 좋아 서부 시칠리아 일정의 밀도를 높여줍니다.",
    scopello:
      "Scopello는 작은 마을과 바위 해안 풍경이 인상적인 곳입니다. 긴 관람보다 해안 풍경, 짧은 산책, 사진 정차에 어울리는 장소입니다.",
    palermo:
      "Palermo는 시칠리아의 역사와 생활감이 가장 짙게 겹치는 도시입니다. 대성당, 노르만 궁전, 시장 골목을 묶으면 도시의 층위를 빠르게 읽을 수 있습니다.",
    monreale:
      "Monreale는 Palermo 근교의 대표적인 대성당 도시입니다. 내부 모자이크와 수도원 회랑이 핵심이라 Palermo 일정과 함께 반나절 단위로 묶기 좋습니다."
  };

  return known[key] ?? `${city}는 ${route} 일정에서 숙소 위치, 이동 시간, 주변 관광지를 함께 보며 판단할 장소입니다.`;
}

function getGeneratedPlaceWhyVisit(city: string) {
  const key = normalizePlaceName(city);
  const known: Record<string, string[]> = {
    agrigento: ["시칠리아 대표 고대 유적", "Realmonte 숙소와 동선 궁합이 좋음", "사진과 역사 관람을 함께 해결"],
    realmonte: ["숙소 기준점", "Agrigento와 해안 명소 접근이 좋음", "남서부 시칠리아 동선을 나누기 쉬움"],
    trapani: ["서부 시칠리아 이동 거점", "Erice와 해안 동선 연결", "항구 도시 분위기"],
    erice: ["전망이 좋은 산 위 마을", "중세 골목 산책", "Trapani와 가까운 반나절 코스"],
    palermo: ["시칠리아 수도", "시장과 건축이 밀집", "Monreale와 연결 가능"],
    monreale: ["황금 모자이크 대성당", "Palermo 근교 핵심 명소", "짧지만 밀도 높은 관람"]
  };

  return known[key] ?? ["숙소 기준 동선 확인", "주변 장소와 연결", "이동 중 휴식 지점"];
}

function getGeneratedPlaceWhatToSee(city: string) {
  const key = normalizePlaceName(city);
  const known: Record<string, string[]> = {
    agrigento: ["신전의 계곡", "Temple of Concordia", "고고학 구역 산책로"],
    realmonte: ["Scala dei Turchi 방향", "남서부 해안", "Agrigento 연결 동선"],
    trapani: ["항구 주변", "구시가지", "Erice 방향 전망"],
    erice: ["성곽과 전망대", "중세 골목", "마을 광장"],
    palermo: ["Palermo Cathedral", "Quattro Canti", "Ballaro 시장"],
    monreale: ["Monreale Cathedral", "모자이크 내부", "수도원 회랑"]
  };

  return known[key] ?? ["숙소 주변", "이동 경로", "주변 전망/식사 포인트"];
}

function getGeneratedPlaceTips(city: string) {
  const key = normalizePlaceName(city);
  const known: Record<string, string[]> = {
    agrigento: ["여름 햇빛이 강하니 오전이나 늦은 오후가 편합니다.", "신전의 계곡은 넓어 물과 모자를 챙기는 편이 좋습니다."],
    realmonte: ["숙소 위치를 먼저 지도에 고정하고 주변 명소를 붙이면 동선이 깔끔합니다."],
    trapani: ["Erice와 함께 보면 주차와 이동 시간을 먼저 확인하세요."],
    erice: ["산 위 마을이라 날씨에 따라 안개가 낄 수 있습니다.", "골목이 돌길이라 편한 신발이 좋습니다."],
    palermo: ["도심 주차와 ZTL을 미리 확인하세요.", "시장 주변은 소지품에 주의하면 좋습니다."],
    monreale: ["대성당 입장 시간과 복장 규정을 미리 확인하세요."]
  };

  return known[key] ?? ["운영시간과 주차 위치는 전날 확인하세요.", "숙소 체크인/아웃 시간과 함께 동선을 조정하세요."];
}

function formatTimelineDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatWeekday(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
}
