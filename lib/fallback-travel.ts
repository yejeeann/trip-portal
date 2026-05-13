import type { TravelPayload, Trip } from "./types";

const travelArt = {
  mediterranean: "/travel-photos/sicily-malta-hero.jpg",
  rome: "/travel-photos/rome.jpg",
  etna: "https://commons.wikimedia.org/wiki/Special:FilePath/Catania-etna.JPG?width=1600",
  taormina: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Greek%20theatre%20Taormina.jpg?width=1800",
  syracuse: "https://commons.wikimedia.org/wiki/Special:FilePath/Syracuse%20-%20Ortigia%20from%20the%20sea%20-%206.jpg?width=1600",
  valletta: "https://commons.wikimedia.org/wiki/Special:FilePath/Valletta%20and%20the%20Grand%20Harbour.jpg?width=1600",
  gozo: "/travel-photos/gozo.jpg",
  amalfi: "https://commons.wikimedia.org/wiki/Special:FilePath/Amalfi%20Coast%20(Positano).jpg?width=1600",
  venice: "https://commons.wikimedia.org/wiki/Special:FilePath/Venice%20Lagoon,%20Italy.jpg?width=1600",
  alps: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Matterhorn%20in%20Zermatt,%20Switzerland.jpg?width=1800",
  interlaken: "https://commons.wikimedia.org/wiki/Special:FilePath/Interlaken%20Lake.jpg?width=1600",
  hallstatt: "https://commons.wikimedia.org/wiki/Special:FilePath/Hallstatt%20lake.jpg?width=1600",
  dolomites: "https://commons.wikimedia.org/wiki/Special:FilePath/Tre%20Cime%20Dolomites%202.jpg?width=1600"
};

const sicilyTrip: Trip = {
  id: "sicily-malta-rome-17d",
  title: "Sicily & Malta — 19 Days",
  subtitle: "로마에서 시칠리아와 몰타를 지나 칼라브리아, 캄파니아, 폼페이를 거쳐 돌아오는 지중해 루트를 매거진형 가이드로 정리했습니다.",
  dateRange: "May 21, 2026 — Jun 8, 2026",
  status: "upcoming",
  heroImage: travelArt.mediterranean,
  countries: ["Italy", "Malta"],
  routeSummary:
    "Rome에서 Catania로 들어가 Sicily 동부·남부·서부와 Malta를 돈 뒤, Messina 해협을 건너 Calabria, Amalfi, Pompeii를 거쳐 Rome/Fiumicino에서 출국하는 19일 루트입니다.",
  itinerary: [
    {
      day: 1,
      date: "2026-05-21",
      city: "Seoul",
      country: "South Korea",
      title: "Departure to Rome",
      image: travelArt.rome,
      coordinates: { lat: 37.4602, lng: 126.4407 },
      weather: { condition: "출국일", tempC: 20, highC: 24, lowC: 16 },
      highlights: ["ICN 21:50 출발", "헬싱키 경유", "로마 이동 시작"],
      size: "wide"
    },
    {
      day: 2,
      date: "2026-05-22",
      city: "Rome",
      country: "Italy",
      title: "Arrival and Night Train",
      image: travelArt.rome,
      coordinates: { lat: 41.9028, lng: 12.4964 },
      weather: { condition: "맑은 저녁", tempC: 22, highC: 26, lowC: 17 },
      highlights: ["피우미치노 도착", "로마 테르미니", "야간열차"],
      size: "wide"
    },
    {
      day: 3,
      date: "2026-05-23",
      city: "Catania",
      country: "Italy",
      title: "Etna Light and Baroque Streets",
      image: travelArt.etna,
      coordinates: { lat: 37.5079, lng: 15.083 },
      weather: { condition: "맑음", tempC: 25, highC: 29, lowC: 19 },
      highlights: ["Catania", "Aci Trezza", "Adrano"],
      size: "tall"
    },
    {
      day: 4,
      date: "2026-05-24",
      city: "Taormina",
      country: "Italy",
      title: "Greek Theatre and Sea Terraces",
      image: travelArt.taormina,
      coordinates: { lat: 37.8516, lng: 15.2853 },
      weather: { condition: "따뜻한 바람", tempC: 24, highC: 28, lowC: 18 },
      highlights: ["Taormina", "Castelmola", "Giardini Naxos"]
    },
    {
      day: 5,
      date: "2026-05-25",
      city: "Syracuse",
      country: "Italy",
      title: "Ortigia Field Notes",
      image: travelArt.syracuse,
      coordinates: { lat: 37.0755, lng: 15.2866 },
      weather: { condition: "부드러운 햇빛", tempC: 23, highC: 27, lowC: 18 },
      highlights: ["Syracuse", "Noto", "남동부 해안 도시"]
    },
    {
      day: 6,
      date: "2026-05-26",
      city: "Ragusa / Modica",
      country: "Italy",
      title: "Southeast Baroque and Fishing Villages",
      image: travelArt.etna,
      coordinates: { lat: 36.9239306, lng: 14.7198951 },
      weather: { condition: "따뜻함", tempC: 24, highC: 28, lowC: 19 },
      highlights: ["Ragusa / Modica", "Pozzallo / Marzamemi", "Caltagirone / Piazza Armerina / Enna 대안 루프"],
      size: "wide"
    },
    {
      day: 7,
      date: "2026-05-27",
      city: "Valletta",
      country: "Malta",
      title: "Malta Arrival and Harbor Capital",
      image: travelArt.valletta,
      coordinates: { lat: 35.8997, lng: 14.5147 },
      weather: { condition: "바닷바람", tempC: 23, highC: 27, lowC: 19 },
      highlights: ["CTA 09:30 출발", "MLA 10:20 도착", "발레타와 그랜드 하버"]
    },
    {
      day: 8,
      date: "2026-05-28",
      city: "Gozo",
      country: "Malta",
      title: "Gozo and Blue Lagoon",
      image: travelArt.gozo,
      coordinates: { lat: 36.0443, lng: 14.2512 },
      weather: { condition: "맑은 바다", tempC: 24, highC: 28, lowC: 20 },
      highlights: ["Mellieha", "Comino", "Victoria / Xaghra"],
      size: "tall"
    },
    {
      day: 9,
      date: "2026-05-29",
      city: "Mdina / Mosta",
      country: "Italy",
      title: "Mdina, Mosta and Catania Return",
      image: travelArt.valletta,
      coordinates: { lat: 35.8858, lng: 14.4031 },
      weather: { condition: "늦은 귀환", tempC: 24, highC: 28, lowC: 20 },
      highlights: ["Qrendi / Marsaxlokk", "Mdina / Mosta", "Luqa -> Catania"]
    },
    {
      day: 10,
      date: "2026-05-30",
      city: "Realmonte",
      country: "Italy",
      title: "Realmonte and Agrigento",
      image: travelArt.mediterranean,
      coordinates: { lat: 37.3087, lng: 13.4624 },
      weather: { condition: "남서부 시칠리아", tempC: 24, highC: 28, lowC: 19 },
      highlights: ["Augusta 출발", "Realmonte", "Agrigento"],
      size: "tall"
    },
    {
      day: 11,
      date: "2026-05-31",
      city: "Realmonte",
      country: "Italy",
      title: "Agrigento Base",
      image: travelArt.mediterranean,
      coordinates: { lat: 37.3087, lng: 13.4624 },
      weather: { condition: "남서부 시칠리아", tempC: 24, highC: 28, lowC: 18 },
      highlights: ["Realmonte", "Agrigento", "남부 시칠리아 베이스"]
    },
    {
      day: 12,
      date: "2026-06-01",
      city: "Trapani / Erice",
      country: "Italy",
      title: "Western Sicily Transfer",
      image: travelArt.mediterranean,
      coordinates: { lat: 38.0375, lng: 13.0252 },
      weather: { condition: "서부 시칠리아", tempC: 24, highC: 28, lowC: 18 },
      highlights: ["Realmonte 체크아웃", "Trapani / Torre di Ligny", "Erice / Contrada Piano Milano"]
    },
    {
      day: 13,
      date: "2026-06-02",
      city: "Balestrate / Segesta",
      country: "Italy",
      title: "Segesta and Scopello Coast",
      image: travelArt.mediterranean,
      coordinates: { lat: 38.0375, lng: 13.0252 },
      weather: { condition: "서부 시칠리아", tempC: 24, highC: 28, lowC: 18 },
      highlights: ["Balestrate 베이스", "Segesta", "Scopello / Zingaro"]
    },
    {
      day: 14,
      date: "2026-06-03",
      city: "Palermo",
      country: "Italy",
      title: "Palermo and Monreale",
      image: travelArt.mediterranean,
      coordinates: { lat: 38.0375, lng: 13.0252 },
      weather: { condition: "서부 시칠리아", tempC: 24, highC: 28, lowC: 18 },
      highlights: ["Contrada Piano Milano 숙박", "Palermo", "Monreale"]
    },
    {
      day: 15,
      date: "2026-06-04",
      city: "Cefalu / Scilla",
      country: "Italy",
      title: "Cefalu and Calabria Transfer",
      image: travelArt.amalfi,
      coordinates: { lat: 38.4297, lng: 15.8826 },
      weather: { condition: "본토 이동", tempC: 24, highC: 28, lowC: 18 },
      highlights: ["Balestrate 체크아웃", "Cefalu", "Messina Ferry / Scilla / Gioia Tauro"]
    },
    {
      day: 16,
      date: "2026-06-05",
      city: "Tropea / Pizzo",
      country: "Italy",
      title: "Calabria Coast to Campania",
      image: travelArt.mediterranean,
      coordinates: { lat: 38.6786, lng: 15.8972 },
      weather: { condition: "북상 이동", tempC: 24, highC: 28, lowC: 18 },
      highlights: ["Gioia Tauro 출발", "Tropea", "Pizzo / Calvanico"]
    },
    {
      day: 17,
      date: "2026-06-06",
      city: "Amalfi / Pompeii / Rome",
      country: "Italy",
      title: "Amalfi, Pompeii and Rome Final Night",
      image: travelArt.amalfi,
      coordinates: { lat: 40.634, lng: 14.6027 },
      weather: { condition: "출국 전날", tempC: 24, highC: 28, lowC: 18 },
      highlights: ["Calvanico", "Amalfi", "Pompeii / Rome final stay"]
    },
    {
      day: 18,
      date: "2026-06-07",
      city: "Rome",
      country: "Italy",
      title: "Rome Departure",
      image: travelArt.rome,
      coordinates: { lat: 41.8003, lng: 12.2389 },
      weather: { condition: "출국일", tempC: 24, highC: 28, lowC: 18 },
      highlights: ["FCO 10:30 출발", "헬싱키 경유", "ICN행 17:30 탑승"]
    },
    {
      day: 19,
      date: "2026-06-08",
      city: "Seoul",
      country: "South Korea",
      title: "Arrival in Seoul",
      image: travelArt.rome,
      coordinates: { lat: 37.4602, lng: 126.4407 },
      weather: { condition: "도착일", tempC: 22, highC: 26, lowC: 18 },
      highlights: ["ICN 11:20 도착", "여행 종료"]
    }
  ]
};

const swissTrip: Trip = {
  id: "swiss-alps-grand-route-2025",
  title: "Swiss Alps Grand Route — 19 Days",
  subtitle:
    "베니스에서 스위스 알프스와 오스트리아, 프라하, 빈, 블레드, 돌로미티까지 연결한 장거리 알프스 루트입니다.",
  dateRange: "May 30, 2025 — Jun 17, 2025",
  status: "active",
  heroImage: travelArt.alps,
  countries: ["Italy", "Switzerland", "France", "Austria", "Czechia", "Slovenia"],
  routeSummary:
    "베니스에서 출발해 스위스 고산 지대를 지나 오스트리아와 체코를 거치고, 블레드와 돌로미티로 돌아오는 고산 로드트립입니다.",
  itinerary: [
    {
      day: 1,
      date: "2025-05-30",
      city: "Venice",
      country: "Italy",
      title: "Arrival on the Lagoon",
      image: travelArt.venice,
      coordinates: { lat: 45.4408, lng: 12.3155 },
      weather: { condition: "온화한 라군 공기", tempC: 22, highC: 26, lowC: 17 },
      highlights: ["마르코 폴로 공항 도착", "운하 산책", "이른 휴식"],
      size: "wide"
    },
    {
      day: 2,
      date: "2025-05-31",
      city: "Stalden",
      country: "Switzerland",
      title: "Verona, Sirmione and Alpine Base",
      image: travelArt.interlaken,
      coordinates: { lat: 46.2336, lng: 7.8721 },
      weather: { condition: "서늘한 산악 저녁", tempC: 14, highC: 19, lowC: 9 },
      highlights: ["베로나", "가르다 호수", "발레 도착"],
      size: "tall"
    },
    {
      day: 3,
      date: "2025-06-01",
      city: "Chamonix",
      country: "France",
      title: "Aiguille du Midi Field Day",
      image: travelArt.alps,
      coordinates: { lat: 45.9237, lng: 6.8694 },
      weather: { condition: "알프스 햇빛", tempC: 12, highC: 17, lowC: 6 },
      highlights: ["몽블랑", "에귀 뒤 미디", "샤모니 골목"]
    },
    {
      day: 4,
      date: "2025-06-02",
      city: "Zermatt",
      country: "Switzerland",
      title: "Gornergrat and Matterhorn Views",
      image: travelArt.alps,
      coordinates: { lat: 46.0207, lng: 7.7491 },
      weather: { condition: "선명한 봉우리", tempC: 10, highC: 15, lowC: 4 },
      highlights: ["고르너그라트", "마터호른", "산악열차"],
      size: "wide"
    },
    {
      day: 5,
      date: "2025-06-03",
      city: "Interlaken",
      country: "Switzerland",
      title: "Lake Towns and Aare Gorge",
      image: travelArt.alps,
      coordinates: { lat: 46.6863, lng: 7.8632 },
      weather: { condition: "호숫가 바람", tempC: 16, highC: 21, lowC: 10 },
      highlights: ["슈피츠", "툰", "아레 협곡"]
    },
    {
      day: 6,
      date: "2025-06-04",
      city: "Jungfraujoch",
      country: "Switzerland",
      title: "Top of Europe",
      image: travelArt.alps,
      coordinates: { lat: 46.5483, lng: 7.9806 },
      weather: { condition: "눈부신 설원", tempC: -2, highC: 2, lowC: -6 },
      highlights: ["클라이네 샤이덱", "융프라우요흐", "아이거글레처"],
      size: "tall"
    },
    {
      day: 7,
      date: "2025-06-05",
      city: "Hallstatt",
      country: "Austria",
      title: "Salzkammergut Lake Village",
      image: travelArt.hallstatt,
      coordinates: { lat: 47.5622, lng: 13.6493 },
      weather: { condition: "가벼운 비 가능", tempC: 15, highC: 20, lowC: 10 },
      highlights: ["할슈타트", "호수 산책", "소금 마을"]
    },
    {
      day: 8,
      date: "2025-06-06",
      city: "Dolomites",
      country: "Italy",
      title: "Tre Cime and Mountain Passes",
      image: travelArt.dolomites,
      coordinates: { lat: 46.4102, lng: 11.844 },
      weather: { condition: "고개 위 빛", tempC: 13, highC: 18, lowC: 7 },
      highlights: ["트레 치메", "코르티나", "가르데나 패스"],
      size: "wide"
    }
  ]
};

export const fallbackTravelPayload: TravelPayload = {
  source: "fallback",
  updatedAt: new Date().toISOString(),
  trip: sicilyTrip,
  trips: [sicilyTrip, swissTrip],
  uiConfig: {
    themeColor: "#0F766E",
    colorScheme: "light",
    typographyStyle: "modern-sans",
    homeStyle: "magazine",
    overviewLayout: "map-centric",
    dailyViewStyle: "cards",
    sightDetailMode: "bottom-sheet",
    cardDesign: {
      cardStyle: "elevated",
      borderRadius: "lg",
      imageOverlay: "dark-gradient",
      shadowIntensity: "soft",
      hoverEffect: "lift"
    },
    animation: {
      transitionEffect: "fade",
      transitionSpeed: "normal"
    }
  },
  appStructure: {
    navigationType: "bottom-tab",
    tabs: [
      { id: "home", label: "Home", iconType: "home" },
      { id: "overview", label: "Overview", iconType: "overview" },
      { id: "daily", label: "Days", iconType: "calendar" },
      { id: "map", label: "Map", iconType: "map" },
      { id: "places", label: "Places", iconType: "compass" },
      { id: "logistics", label: "Logistics", iconType: "heart" }
    ],
    routingFlow: [
      {
        path: "/",
        name: "Home / Trip Library",
        layoutType: "full-screen",
        allowedTransitions: ["/trips/[tripId]"]
      },
      {
        path: "/trips/[tripId]",
        name: "Trip Overview",
        layoutType: "full-screen",
        allowedTransitions: ["/trips/[tripId]/day/[dayId]", "/trips/[tripId]/map", "/trips/[tripId]/places"]
      },
      {
        path: "/trips/[tripId]/day/[dayId]",
        name: "Daily Plan",
        layoutType: "nested",
        allowedTransitions: ["/trips/[tripId]/places/[placeId]", "/trips/[tripId]/map"]
      },
      {
        path: "/trips/[tripId]/map",
        name: "Route Map",
        layoutType: "full-screen",
        allowedTransitions: ["/trips/[tripId]/day/[dayId]", "/trips/[tripId]/places/[placeId]"]
      },
      {
        path: "/trips/[tripId]/places/[placeId]",
        name: "Place Detail",
        layoutType: "bottom-sheet",
        allowedTransitions: ["/trips/[tripId]/day/[dayId]", "/trips/[tripId]/map"]
      },
      {
        path: "/trips/[tripId]/logistics",
        name: "Logistics",
        layoutType: "nested",
        allowedTransitions: ["/trips/[tripId]"]
      }
    ]
  },
  recommendations: [
    {
      id: "sicily-valletta-harbor",
      title: "Valletta와 Three Cities 항구 저녁 산책",
      city: "Valletta",
      category: "도시 전망",
      distanceKm: 0.8
    },
    {
      id: "sicily-ragusa-modica",
      title: "Ragusa와 Modica 바로크 도시 루프",
      city: "Ragusa",
      category: "남동부 시칠리아",
      distanceKm: 45
    },
    {
      id: "sicily-palermo-monreale",
      title: "Palermo와 Monreale 서부 시칠리아 하루",
      city: "Palermo",
      category: "서부 시칠리아",
      distanceKm: 9
    }
  ]
};
