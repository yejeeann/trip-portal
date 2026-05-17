export type AirportPoint = {
  city: string;
  airport: string;
  code: string;
  time: string;
  dateLabel?: string;
  terminal?: string;
};

export type FlightSegment = {
  flightNo: string;
  airlineCode: string;
  airlineName: string;
  aircraft?: string;
  from: AirportPoint;
  to: AirportPoint;
  duration: string;
};

export type FlightTicket = {
  id: string;
  title: string;
  routeLabel: string;
  dateLabel: string;
  connectionLabel: string;
  reservationCode?: string;
  totalDuration?: string;
  segments: FlightSegment[];
};

export type TimelineAccommodation = {
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  checkIn?: string;
  checkOut?: string;
  googleMapsUrl?: string;
  airbnbUrl?: string;
  image?: string;
  imageAlt?: string;
};

export type MasterTimelineItem = {
  id: string;
  day: number;
  date: string;
  dateLabel: string;
  weekday: string;
  primaryRoute: string;
  cities: string[];
  transportMode?: "flight" | "train" | "rental-car" | "taxi" | "ferry" | "walk" | "transit";
  accommodation?: TimelineAccommodation;
  note?: string;
};

export type DailyGuidePlace = {
  id: string;
  name: string;
  category: string;
  timeLabel?: string;
  description: string;
  shortDescription?: string;
  detailDescription?: string;
  whyVisit?: string[];
  whatToSee?: string[];
  tips?: string[];
  duration?: string;
  nextStop?: {
    name: string;
    distanceText: string;
    durationText: string;
  };
  image: string;
  imageAlt: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  googleMapsUrl?: string;
  mapPosition: {
    x: number;
    y: number;
  };
};

export type CityVisitSpot = DailyGuidePlace & {
};

export type DailyCityVisit = {
  id: string;
  city: string;
  stayDuration: string;
  routeMode: "walk" | "drive" | "transit" | "ferry";
  displayMode?: "city" | "train";
  entryPoint?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  spots: CityVisitSpot[];
  practicalNotes: string[];
  trainInfo?: {
    title: string;
    serviceName: string;
    cabinType: string;
    routeLabel: string;
    departureLabel: string;
    arrivalLabel: string;
    durationLabel: string;
    image: string;
    imageAlt: string;
    sourceLabel?: string;
    sourceUrl?: string;
    routeSourceUrl?: string;
    mapUrl?: string;
    highlights: string[];
  };
};

export type DailyRouteOverviewPoint = {
  id: string;
  name: string;
  detail?: string;
  mode?: MasterTimelineItem["transportMode"];
  mainRoute?: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
};

export type DailyGuideAccommodation = TimelineAccommodation & {
  googleMapsUrl?: string;
};

export type DailyGuide = {
  id: string;
  day: number;
  date: string;
  title: string;
  region: string;
  deck: string;
  mapLabel: string;
  editorial: string[];
  transportMode?: MasterTimelineItem["transportMode"];
  accommodation?: DailyGuideAccommodation;
  routeOverview?: DailyRouteOverviewPoint[];
  cityVisits?: DailyCityVisit[];
  places: DailyGuidePlace[];
};

export type SwissGuideData = {
  tripId: string;
  sourcePdf: string;
  flightTickets: FlightTicket[];
  masterTimeline: MasterTimelineItem[];
  dailyGuides: DailyGuide[];
};

export const swissGuideData: SwissGuideData = {
  tripId: "swiss-alps-grand-route-2025",
  sourcePdf: "Swiss202506.pdf",
  flightTickets: [
    {
      id: "outbound-icn-vce",
      title: "Outbound",
      routeLabel: "Seoul to Venice via Doha",
      dateLabel: "5/30 (Fri)",
      connectionLabel: "도하 경유 · 4시간",
      segments: [
        {
          flightNo: "QR859",
          airlineCode: "QR",
          airlineName: "Qatar Airways",
          from: {
            city: "Seoul",
            airport: "Incheon International",
            code: "ICN",
            time: "01:20"
          },
          to: {
            city: "Doha",
            airport: "Hamad International",
            code: "DOH",
            time: "05:30"
          },
          duration: "10h 10m"
        },
        {
          flightNo: "QR125",
          airlineCode: "QR",
          airlineName: "Qatar Airways",
          from: {
            city: "Doha",
            airport: "Hamad International",
            code: "DOH",
            time: "09:30"
          },
          to: {
            city: "Venice",
            airport: "Marco Polo",
            code: "VCE",
            time: "14:20"
          },
          duration: "5h 50m"
        }
      ]
    },
    {
      id: "return-vce-icn",
      title: "Return",
      routeLabel: "Venice to Seoul via Doha",
      dateLabel: "6/16 (Mon) / +1 6/17 (Tue)",
      connectionLabel: "도하 경유 · 3시간 50분",
      segments: [
        {
          flightNo: "QR126",
          airlineCode: "QR",
          airlineName: "Qatar Airways",
          from: {
            city: "Venice",
            airport: "Marco Polo",
            code: "VCE",
            time: "16:05",
            dateLabel: "6/16"
          },
          to: {
            city: "Doha",
            airport: "Hamad International",
            code: "DOH",
            time: "22:30",
            dateLabel: "6/16"
          },
          duration: "5h 25m"
        },
        {
          flightNo: "QR858",
          airlineCode: "QR",
          airlineName: "Qatar Airways",
          from: {
            city: "Doha",
            airport: "Hamad International",
            code: "DOH",
            time: "02:20",
            dateLabel: "6/17"
          },
          to: {
            city: "Seoul",
            airport: "Incheon International",
            code: "ICN",
            time: "17:05",
            dateLabel: "6/17"
          },
          duration: "8h 45m"
        }
      ]
    }
  ],
  masterTimeline: [
    {
      id: "day-01",
      day: 1,
      date: "2025-05-30",
      dateLabel: "5/30",
      weekday: "Fri",
      primaryRoute: "Venice",
      cities: ["Venice"],
      accommodation: {
        name: "Venice Stay",
        address: "Via Luciano Manara 6, Venezia",
        checkIn: "5/30",
        checkOut: "5/31"
      }
    },
    {
      id: "day-02",
      day: 2,
      date: "2025-05-31",
      dateLabel: "5/31",
      weekday: "Sat",
      primaryRoute: "Venice - Verona - Milano - Stalden",
      cities: ["Verona", "Sirmione", "Milano", "Stalden"],
      accommodation: {
        name: "Stalden Airbnb",
        address: "Kirchweg 8, Stalden",
        checkIn: "5/31",
        checkOut: "6/2"
      }
    },
    {
      id: "day-03",
      day: 3,
      date: "2025-06-01",
      dateLabel: "6/1",
      weekday: "Sun",
      primaryRoute: "Stalden - Chamonix - Stalden",
      cities: ["Chamonix"],
      accommodation: {
        name: "Stalden Airbnb",
        address: "Kirchweg 8, Stalden"
      }
    },
    {
      id: "day-04",
      day: 4,
      date: "2025-06-02",
      dateLabel: "6/2",
      weekday: "Mon",
      primaryRoute: "Stalden - Zermatt - Interlaken",
      cities: ["Zermatt", "Interlaken"],
      accommodation: {
        name: "Interlaken Base",
        address: "Kientalstrasse 116, Scharnachtal",
        checkIn: "6/2",
        checkOut: "6/6"
      }
    },
    {
      id: "day-05",
      day: 5,
      date: "2025-06-03",
      dateLabel: "6/3",
      weekday: "Tue",
      primaryRoute: "Lake towns around Interlaken",
      cities: ["Spiez", "Thun", "St. Beatus-Hohlen", "Harder Kulm", "Brienz", "Aareschlucht", "Iseltwald"],
      accommodation: {
        name: "Interlaken Base",
        address: "Kientalstrasse 116, Scharnachtal"
      }
    },
    {
      id: "day-06",
      day: 6,
      date: "2025-06-04",
      dateLabel: "6/4",
      weekday: "Wed",
      primaryRoute: "Jungfrau rail day",
      cities: ["Grindelwald", "Kleine Scheidegg", "Mannlichen", "First"],
      accommodation: {
        name: "Interlaken Base",
        address: "Kientalstrasse 116, Scharnachtal"
      }
    },
    {
      id: "day-07",
      day: 7,
      date: "2025-06-05",
      dateLabel: "6/5",
      weekday: "Thu",
      primaryRoute: "Lauterbrunnen valley",
      cities: ["Wilderswil", "Lauterbrunnen", "Wengen", "Murren", "Schynige Platte"],
      accommodation: {
        name: "Interlaken Base",
        address: "Kientalstrasse 116, Scharnachtal"
      }
    },
    {
      id: "day-08",
      day: 8,
      date: "2025-06-06",
      dateLabel: "6/6",
      weekday: "Fri",
      primaryRoute: "Interlaken - Lucerne - Innsbruck",
      cities: ["Lucerne", "Innsbruck"],
      accommodation: {
        name: "Mutters Stay",
        address: "Kirchplatz 12, Mutters, Tirol",
        checkIn: "6/6",
        checkOut: "6/7"
      }
    },
    {
      id: "day-09",
      day: 9,
      date: "2025-06-07",
      dateLabel: "6/7",
      weekday: "Sat",
      primaryRoute: "Innsbruck - Salzburg - Hallstatt",
      cities: ["Salzburg", "Salzkammergut", "Hallstatt"],
      accommodation: {
        name: "Traunkirchen Stay",
        address: "Muehlbach 2A, Traunkirchen",
        checkIn: "6/7",
        checkOut: "6/8"
      }
    },
    {
      id: "day-10",
      day: 10,
      date: "2025-06-08",
      dateLabel: "6/8",
      weekday: "Sun",
      primaryRoute: "Hallstatt - Cesky Krumlov - Rodvinov",
      cities: ["Cesky Krumlov", "Ceske Budejovice", "Telc", "Rodvinov"],
      accommodation: {
        name: "Rodvinov Stay",
        address: "Rodvinov 103",
        checkIn: "6/8",
        checkOut: "6/10"
      }
    },
    {
      id: "day-11",
      day: 11,
      date: "2025-06-09",
      dateLabel: "6/9",
      weekday: "Mon",
      primaryRoute: "Rodvinov - Prague - Kutna Hora",
      cities: ["Praha", "Kutna Hora"],
      accommodation: {
        name: "Rodvinov Stay",
        address: "Rodvinov 103"
      }
    },
    {
      id: "day-12",
      day: 12,
      date: "2025-06-10",
      dateLabel: "6/10",
      weekday: "Tue",
      primaryRoute: "Prague - Znojmo - Vienna",
      cities: ["Znojmo", "Vienna"],
      accommodation: {
        name: "Vienna North Stay",
        address: "Gerasdorf bei Wien",
        checkIn: "6/10",
        checkOut: "6/11"
      }
    },
    {
      id: "day-13",
      day: 13,
      date: "2025-06-11",
      dateLabel: "6/11",
      weekday: "Wed",
      primaryRoute: "Vienna - Graz - Ljubljana - Bled",
      cities: ["Graz", "Ljubljana", "Bled"],
      accommodation: {
        name: "Bled Area Stay",
        address: "Spodnje Laze 3, Zgornje Gorje",
        checkIn: "6/11",
        checkOut: "6/12"
      }
    },
    {
      id: "day-14",
      day: 14,
      date: "2025-06-12",
      dateLabel: "6/12",
      weekday: "Thu",
      primaryRoute: "Bled - Villach - Lienz - Dolomites",
      cities: ["Villach", "Lienz", "Dolomites"],
      accommodation: {
        name: "Dolomites Base",
        address: "Localita Saviner di Laste 48",
        checkIn: "6/12",
        checkOut: "6/16"
      }
    },
    {
      id: "day-15",
      day: 15,
      date: "2025-06-13",
      dateLabel: "6/13",
      weekday: "Fri",
      primaryRoute: "Dolomites",
      cities: ["Tre Cime di Lavaredo", "Cortina d'Ampezzo", "Gardena Pass"],
      accommodation: {
        name: "Dolomites Base",
        address: "Localita Saviner di Laste 48"
      }
    },
    {
      id: "day-16",
      day: 16,
      date: "2025-06-14",
      dateLabel: "6/14",
      weekday: "Sat",
      primaryRoute: "Dolomites",
      cities: ["Cinque Torri", "Sella Pass", "Ortisei"],
      accommodation: {
        name: "Dolomites Base",
        address: "Localita Saviner di Laste 48"
      }
    },
    {
      id: "day-17",
      day: 17,
      date: "2025-06-15",
      dateLabel: "6/15",
      weekday: "Sun",
      primaryRoute: "Dolomites reserve day",
      cities: ["Dolomites"],
      accommodation: {
        name: "Dolomites Base",
        address: "Localita Saviner di Laste 48"
      }
    },
    {
      id: "day-18",
      day: 18,
      date: "2025-06-16",
      dateLabel: "6/16",
      weekday: "Mon",
      primaryRoute: "Dolomites - Venice departure",
      cities: ["Venice"],
      note: "QR126편은 베니스에서 16:05에 출발합니다."
    },
    {
      id: "day-19",
      day: 19,
      date: "2025-06-17",
      dateLabel: "6/17",
      weekday: "Tue",
      primaryRoute: "Doha - Seoul arrival",
      cities: ["Seoul"],
      note: "QR858편은 서울에 17:05에 도착합니다."
    }
  ],
  dailyGuides: [
    {
      id: "day-01-venice",
      day: 1,
      date: "2025-05-30",
      title: "Arrival in Venice",
      region: "Venice",
      deck: "긴 비행 끝에 물의 도시에 도착하는 첫날. 여유롭게 숙소에 체크인하고 베니스의 저녁을 맞이합니다.",
      mapLabel: "Day 1 arrival map",
      editorial: [
        "도하를 경유하여 오후에 베니스 마르코 폴로 공항에 도착합니다. 공항을 빠져나와 수로를 따라 이동하며 베니스 본섬의 숙소로 들어가는 여정 자체가 여행의 시작입니다.",
        "첫날은 무리한 일정 대신 가볍게 골목을 걷고 운하 주변의 식당에서 저녁을 먹으며 시차에 적응하는 것을 추천합니다. 좁은 미로 같은 골목길과 운하에 비친 저녁 햇살을 눈에 담아보세요."
      ],
      accommodation: {
        name: "Venice Stay",
        address: "Via Luciano Manara 6, Venezia",
        checkIn: "5/30",
        checkOut: "5/31",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Via+Luciano+Manara+6+Venezia"
      },
      places: [
        {
          id: "marco-polo-airport",
          name: "Marco Polo Airport",
          category: "도착 게이트웨이",
          timeLabel: "오후 2:20",
          description: "베니스로 들어오는 국제공항. 공항을 나서면 버스나 수상 택시를 이용해 베니스 본섬으로 진입하게 됩니다.",
          coordinates: { lat: 45.5052, lng: 12.3519 },
          image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Venice Marco Polo Airport approach",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Marco+Polo+Airport+Venice",
          mapPosition: { x: 80, y: 30 }
        },
        {
          id: "santa-lucia-station",
          name: "Santa Lucia Station",
          category: "본섬 진입로",
          timeLabel: "오후 4:00",
          description: "기차역 앞 광장으로 나서자마자 눈앞에 펼쳐지는 탁 트인 대운하의 풍경은 베니스의 첫인상을 강렬하게 남깁니다.",
          coordinates: { lat: 45.4412, lng: 12.3218 },
          image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Grand canal near Santa Lucia",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Venezia+Santa+Lucia",
          mapPosition: { x: 40, y: 50 }
        },
        {
          id: "rialto-bridge",
          name: "Rialto Bridge",
          category: "첫 산책 코스",
          timeLabel: "저녁",
          description: "베니스의 상징적인 다리. 저녁 무렵 석양이 질 때 운하를 오가는 곤돌라와 어우러지는 모습이 무척 아름답습니다.",
          coordinates: { lat: 45.4386, lng: 12.3359 },
          image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Rialto Bridge in Venice",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Rialto+Bridge+Venice",
          mapPosition: { x: 60, y: 60 }
        }
      ]
    },
    {
      id: "day-02-stalden-approach",
      day: 2,
      date: "2025-05-31",
      title: "Across the Italian Lakes to the Alps",
      region: "Verona / Sirmione / Milano",
      deck: "베니스를 떠나 북부 이탈리아의 호수와 평원을 가로질러 스위스 알프스의 초입인 슈탈덴으로 향하는 긴 이동의 날.",
      mapLabel: "Day 2 driving route",
      editorial: [
        "이탈리아의 클래식한 도시들을 거쳐 스위스로 넘어가는 밀도 높은 드라이브 코스입니다. 베로나의 원형 극장과 시르미오네의 가르다 호수를 짧게 산책하며 여정을 환기합니다.",
        "밀라노를 지나 국경을 넘고 알프스 산맥을 오르기 시작하면 풍경이 완전히 달라집니다. 해가 지기 전 깎아지른 계곡 사이에 자리 잡은 슈탈덴의 베이스캠프에 도착해 짐을 푸는 것이 오늘의 목표입니다."
      ],
      accommodation: {
        name: "Stalden Airbnb",
        address: "Kirchweg 8, Stalden",
        checkIn: "5/31",
        checkOut: "6/2",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kirchweg+8+Stalden"
      },
      cityVisits: [
        {
          id: "verona-city-visit",
          city: "Verona",
          stayDuration: "1-2h stay",
          routeMode: "walk",
          entryPoint: "Parking / Station near Piazza Bra",
          coordinates: { lat: 45.4389, lng: 10.9928 },
          practicalNotes: [
            "구시가지 ZTL 구역에 주의하고, 중심부 외곽 주차 후 도보 이동이 편합니다.",
            "짧은 정차라면 Arena 주변과 Piazza Bra만 봐도 동선이 깔끔합니다.",
            "점심 전후로 붐빌 수 있어 사진은 광장 가장자리에서 빠르게 찍는 편이 좋습니다."
          ],
          spots: [
            {
              id: "arena-di-verona",
              name: "Arena di Verona",
              category: "역사 유적",
              timeLabel: "오전 10:00",
              duration: "30-45분",
              shortDescription: "베로나 중심부의 로마 원형극장으로, 짧은 정차에도 도시의 인상을 강하게 남깁니다.",
              detailDescription:
                "Arena di Verona는 도심 한가운데 남아 있는 고대 로마 원형극장입니다. 외관만 둘러봐도 규모감이 충분하고, Piazza Bra와 이어져 짧은 산책 루트로 보기 좋습니다.",
              whyVisit: ["도시의 대표 랜드마크", "짧은 정차에도 동선 효율이 좋음", "사진과 산책을 동시에 해결"],
              whatToSee: ["원형극장 외벽", "Piazza Bra", "주변 카페 거리"],
              tips: ["내부 관람까지 하면 시간이 늘어납니다.", "차량 이동일이면 외관 중심으로 보는 구성이 좋습니다."],
              nextStop: { name: "Scaligero Castle", distanceText: "약 45km", durationText: "약 40분" },
              description: "고대 로마 시대에 지어진 거대한 원형 극장이 도심 한가운데 자리한 로맨틱한 베로나. 구시가지를 가볍게 산책하며 이탈리아의 정취를 느낍니다.",
              coordinates: { lat: 45.4389, lng: 10.9928 },
              image: "https://images.unsplash.com/photo-1516489376679-0db79f6e6fb1?auto=format&fit=crop&w=1600&q=85",
              imageAlt: "Arena di Verona",
              googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Arena+di+Verona",
              mapPosition: { x: 70, y: 70 }
            },
            {
              id: "piazza-bra",
              name: "Piazza Bra",
              category: "광장",
              timeLabel: "오전 10:35",
              duration: "15-25분",
              shortDescription: "Arena di Verona 앞에 펼쳐진 큰 광장으로 베로나 짧은 산책의 중심축입니다.",
              detailDescription:
                "Piazza Bra는 베로나 원형극장과 카페 테라스, 오래된 건물들이 함께 보이는 넓은 광장입니다. 차량 이동일에는 이 광장을 기준으로 짧게 방향을 잡으면 구시가지 동선이 단순해집니다.",
              whyVisit: ["Arena와 바로 연결되는 중심 광장", "짧은 체류에도 베로나 분위기를 느끼기 좋음", "카페와 휴식 포인트가 많음"],
              whatToSee: ["광장 전경", "Palazzo della Gran Guardia", "Arena di Verona 외관"],
              tips: ["광장 카페는 위치값이 있을 수 있습니다.", "사진은 Arena가 보이는 광장 가장자리에서 찍기 좋습니다."],
              nextStop: { name: "Juliet House", distanceText: "약 800m", durationText: "도보 약 10분" },
              description: "베로나 중심부의 넓은 광장. Arena di Verona와 바로 이어져 짧은 산책과 휴식의 기준점으로 좋습니다.",
              coordinates: { lat: 45.4386, lng: 10.9927 },
              image: "https://commons.wikimedia.org/wiki/Special:FilePath/Piazza%20Bra%20Verona.jpg?width=1600",
              imageAlt: "Piazza Bra in Verona",
              googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Piazza+Bra+Verona",
              mapPosition: { x: 72, y: 68 }
            },
            {
              id: "juliet-house",
              name: "Juliet House",
              category: "문학 명소",
              timeLabel: "오전 11:00",
              duration: "20-30분",
              shortDescription: "로미오와 줄리엣의 도시 이미지를 상징하는 베로나의 대표 포토 스팟입니다.",
              detailDescription:
                "Juliet House는 셰익스피어의 이야기를 도시 관광 경험으로 만든 상징적인 장소입니다. 실제 역사성보다 베로나가 가진 낭만적 이미지를 짧게 체험하는 포인트로 보는 것이 좋습니다.",
              whyVisit: ["베로나의 대표적인 이야기형 관광지", "Arena에서 도보 연결 가능", "짧은 포토 스팟으로 적합"],
              whatToSee: ["줄리엣 발코니", "안뜰", "구시가지 골목"],
              tips: ["항상 붐비는 편이라 오래 머무르기보다 빠르게 보는 구성이 좋습니다.", "안뜰 입장은 짧지만 사진 대기 시간이 생길 수 있습니다."],
              nextStop: { name: "Scaligero Castle", distanceText: "약 45km", durationText: "차량 약 40분" },
              description: "베로나의 낭만적 이미지를 상징하는 장소. 좁은 골목과 안뜰, 발코니를 짧게 둘러보는 코스입니다.",
              coordinates: { lat: 45.4420, lng: 10.9984 },
              image: "https://commons.wikimedia.org/wiki/Special:FilePath/Juliet%27s%20balcony%2C%20Verona.jpg?width=1600",
              imageAlt: "Juliet House balcony in Verona",
              googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Juliet+House+Verona",
              mapPosition: { x: 76, y: 64 }
            }
          ]
        },
        {
          id: "sirmione-city-visit",
          city: "Sirmione",
          stayDuration: "1h stay",
          routeMode: "walk",
          entryPoint: "Lakeside parking before old town",
          coordinates: { lat: 45.4922, lng: 10.6083 },
          practicalNotes: [
            "반도 안쪽은 차량 진입이 제한될 수 있어 외곽 주차 후 걸어 들어가는 편이 안전합니다.",
            "호수 풍경과 성 외관 중심으로 보면 이동일에도 부담이 적습니다.",
            "성 내부까지 보려면 체류 시간을 30분 이상 더 잡는 것이 좋습니다."
          ],
          spots: [
            {
              id: "scaligero-castle",
              name: "Scaligero Castle (Sirmione)",
              category: "호수/고성",
              timeLabel: "오후 1:00",
              duration: "30-45분",
              shortDescription: "가르다 호수 위에 떠 있는 듯한 고성으로, 시르미오네의 첫인상을 만드는 지점입니다.",
              detailDescription:
                "Scaligero Castle은 시르미오네 구시가지 입구에 자리한 수상 요새입니다. 성곽과 호수, 좁은 골목이 바로 이어져 짧은 체류에도 풍경 밀도가 높습니다.",
              whyVisit: ["호수와 성이 한 프레임에 들어옴", "주차 후 접근이 쉬운 핵심 지점", "짧은 산책형 정차에 적합"],
              whatToSee: ["성 외관", "호수 전망", "구시가지 입구 골목"],
              tips: ["성 내부 관람은 줄이 있을 수 있습니다.", "호수 쪽 바람이 강하면 겉옷을 챙기세요."],
              nextStop: { name: "Duomo di Milano", distanceText: "약 135km", durationText: "약 1시간 40분" },
              description: "이탈리아 최대 호수 가르다 호수 위로 튀어나온 시르미오네 반도. 물 위에 떠 있는 듯한 스칼리제로 성과 호수의 윤슬이 그림 같은 풍경을 자아냅니다.",
              coordinates: { lat: 45.4922, lng: 10.6083 },
              image: "https://images.unsplash.com/photo-1510403759976-5991873155aa?auto=format&fit=crop&w=1600&q=85",
              imageAlt: "Sirmione Lake Garda and Castle",
              googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Scaligero+Castle+Sirmione",
              mapPosition: { x: 55, y: 60 }
            },
            {
              id: "grotte-di-catullo",
              name: "Grotte di Catullo",
              category: "고대 유적",
              timeLabel: "오후 1:35",
              duration: "30-45분",
              shortDescription: "시르미오네 반도 끝에 남은 로마 시대 빌라 유적으로 호수 전망이 넓게 열립니다.",
              detailDescription:
                "Grotte di Catullo는 가르다 호수 끝자락의 고대 로마 빌라 유적입니다. 유적 자체와 함께 호수 양쪽으로 펼쳐지는 전망이 좋아, 시르미오네에서 시간이 조금 더 있을 때 넣기 좋은 지점입니다.",
              whyVisit: ["호수 전망이 뛰어난 유적지", "시르미오네 반도의 끝 분위기를 느낄 수 있음", "성 중심 산책보다 한 단계 깊은 코스"],
              whatToSee: ["로마 빌라 유적", "가르다 호수 전망", "반도 끝 산책로"],
              tips: ["왕복 도보 시간이 필요해 짧은 정차라면 생략 가능합니다.", "햇빛이 강한 날은 물과 모자가 필요합니다."],
              nextStop: { name: "Lake Garda promenade", distanceText: "약 1.2km", durationText: "도보 약 15분" },
              description: "시르미오네 반도 끝의 로마 유적. 호수 전망과 유적 산책을 함께 볼 수 있는 장소입니다.",
              coordinates: { lat: 45.4980, lng: 10.6066 },
              image: "https://commons.wikimedia.org/wiki/Special:FilePath/Grotte%20di%20Catullo%20Sirmione.jpg?width=1600",
              imageAlt: "Grotte di Catullo in Sirmione",
              googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Grotte+di+Catullo+Sirmione",
              mapPosition: { x: 58, y: 48 }
            },
            {
              id: "lake-garda-promenade",
              name: "Lake Garda promenade",
              category: "호수 산책",
              timeLabel: "오후 2:10",
              duration: "20-30분",
              shortDescription: "가르다 호수의 물빛과 시르미오네 구시가지를 가볍게 정리하는 산책 구간입니다.",
              detailDescription:
                "Lake Garda promenade는 시르미오네 체류를 마무리하기 좋은 호숫가 산책 구간입니다. 성과 골목을 본 뒤 호수 쪽으로 빠져나오면 이동일의 피로를 줄이는 짧은 휴식이 됩니다.",
              whyVisit: ["호수 풍경을 가장 쉽게 체감", "차량 이동 중 쉬어가기 좋음", "성 관람 후 자연스럽게 이어짐"],
              whatToSee: ["호수 산책로", "보트 선착장", "구시가지 수변 풍경"],
              tips: ["주말에는 산책로와 주차장이 붐빌 수 있습니다.", "일몰 시간대가 아니어도 물빛이 좋아 짧은 사진 정차에 적합합니다."],
              nextStop: { name: "Duomo di Milano", distanceText: "약 135km", durationText: "차량 약 1시간 40분" },
              description: "가르다 호수의 수변 산책로. 시르미오네 정차를 가볍게 마무리하기 좋은 구간입니다.",
              coordinates: { lat: 45.4943, lng: 10.6062 },
              image: "https://commons.wikimedia.org/wiki/Special:FilePath/Sirmione%20Lago%20di%20Garda.jpg?width=1600",
              imageAlt: "Lake Garda promenade in Sirmione",
              googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Lake+Garda+promenade+Sirmione",
              mapPosition: { x: 54, y: 55 }
            }
          ]
        },
        {
          id: "milano-city-visit",
          city: "Milano",
          stayDuration: "45-75m stay",
          routeMode: "walk",
          entryPoint: "Parking / Metro near Duomo",
          coordinates: { lat: 45.4641, lng: 9.1919 },
          practicalNotes: [
            "밀라노 중심부는 교통과 주차 부담이 커서 오래 머무르기보다 대성당 주변만 압축해서 보는 구성이 좋습니다.",
            "두오모 광장 주변은 소매치기와 호객에 주의하세요.",
            "시간이 부족하면 내부 관람보다 외관과 광장 동선이 효율적입니다."
          ],
          spots: [
            {
              id: "duomo-di-milano",
              name: "Duomo di Milano",
              category: "랜드마크",
              timeLabel: "오후 3:30",
              duration: "30-60분",
              shortDescription: "밀라노를 대표하는 고딕 대성당으로, 알프스 이동 전 도심 정차 포인트로 좋습니다.",
              detailDescription:
                "Duomo di Milano는 섬세한 첨탑과 넓은 광장으로 도시의 스케일을 보여주는 장소입니다. 긴 이동일에는 광장과 외관 중심으로 보되, 시간이 맞으면 루프톱 전망까지 고려할 수 있습니다.",
              whyVisit: ["밀라노 대표 랜드마크", "광장 중심이라 짧게 보기 쉬움", "사진 포인트가 명확함"],
              whatToSee: ["두오모 외관", "Piazza del Duomo", "Galleria Vittorio Emanuele II 입구"],
              tips: ["성당 내부/루프톱은 보안 검색과 대기 시간이 있습니다.", "차량 이동일에는 1시간 이내로 압축하는 편이 좋습니다."],
              nextStop: { name: "Simplon Pass", distanceText: "약 160km", durationText: "약 2시간 20분" },
              description: "알프스로 향하는 고속도로를 타기 전 밀라노에 들러 압도적인 고딕 양식의 정수, 밀라노 대성당의 웅장함을 마주합니다.",
              coordinates: { lat: 45.4641, lng: 9.1919 },
              image: "https://images.unsplash.com/photo-1520440229-6469a149ac59?auto=format&fit=crop&w=1600&q=85",
              imageAlt: "Duomo di Milano",
              googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Duomo+di+Milano",
              mapPosition: { x: 35, y: 55 }
            },
            {
              id: "galleria-vittorio-emanuele-ii",
              name: "Galleria Vittorio Emanuele II",
              category: "아케이드",
              timeLabel: "오후 4:05",
              duration: "20-30분",
              shortDescription: "두오모 광장과 바로 이어지는 유리 돔 쇼핑 아케이드로 밀라노의 도시미를 압축해서 보여줍니다.",
              detailDescription:
                "Galleria Vittorio Emanuele II는 유리 천장과 모자이크 바닥, 고급 상점들이 이어지는 밀라노의 대표 아케이드입니다. 두오모 바로 옆이라 짧은 정차에도 함께 보기 쉽습니다.",
              whyVisit: ["두오모와 바로 연결", "밀라노의 고전적 도시미를 짧게 체감", "비가 와도 보기 좋은 실내형 동선"],
              whatToSee: ["유리 돔 천장", "모자이크 바닥", "중앙 팔각 공간"],
              tips: ["중앙부는 항상 붐비므로 소지품에 주의하세요.", "카페는 가격대가 높을 수 있습니다."],
              nextStop: { name: "Piazza della Scala", distanceText: "약 250m", durationText: "도보 약 4분" },
              description: "두오모 옆의 역사적인 쇼핑 아케이드. 유리 돔과 모자이크가 인상적인 밀라노 대표 실내 동선입니다.",
              coordinates: { lat: 45.4658, lng: 9.1900 },
              image: "https://commons.wikimedia.org/wiki/Special:FilePath/Galleria%20Vittorio%20Emanuele%20II%20Milano.jpg?width=1600",
              imageAlt: "Galleria Vittorio Emanuele II in Milan",
              googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Galleria+Vittorio+Emanuele+II+Milan",
              mapPosition: { x: 36, y: 54 }
            },
            {
              id: "piazza-della-scala",
              name: "Piazza della Scala",
              category: "광장/오페라",
              timeLabel: "오후 4:30",
              duration: "10-20분",
              shortDescription: "라 스칼라 극장 앞 광장으로 두오모 주변 산책을 조용하게 마무리하는 지점입니다.",
              detailDescription:
                "Piazza della Scala는 세계적인 오페라 극장 Teatro alla Scala 앞의 광장입니다. 두오모와 갤러리아의 북적임에서 한 걸음 벗어나 밀라노 문화의 또 다른 축을 볼 수 있습니다.",
              whyVisit: ["두오모 주변에서 도보 접근 쉬움", "라 스칼라 극장을 외관으로 확인", "짧은 산책 마무리에 적합"],
              whatToSee: ["Teatro alla Scala 외관", "Leonardo da Vinci 동상", "광장 주변 건축"],
              tips: ["공연 관람이 아니라면 외관 중심으로 충분합니다.", "시간이 부족하면 갤러리아를 지나며 빠르게 확인하세요."],
              nextStop: { name: "Simplon Pass", distanceText: "약 160km", durationText: "차량 약 2시간 20분" },
              description: "라 스칼라 극장 앞 광장. 두오모와 갤러리아를 본 뒤 짧게 이어지는 문화 산책 지점입니다.",
              coordinates: { lat: 45.4675, lng: 9.1897 },
              image: "https://commons.wikimedia.org/wiki/Special:FilePath/Piazza%20della%20Scala%20Milano.jpg?width=1600",
              imageAlt: "Piazza della Scala in Milan",
              googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Piazza+della+Scala+Milan",
              mapPosition: { x: 37, y: 52 }
            }
          ]
        }
      ],
      places: [
        {
          id: "arena-di-verona",
          name: "Arena di Verona",
          category: "역사 유적",
          timeLabel: "오전 10:00",
          description: "고대 로마 시대에 지어진 거대한 원형 극장이 도심 한가운데 자리한 로맨틱한 베로나. 구시가지를 가볍게 산책하며 이탈리아의 정취를 느낍니다.",
          coordinates: { lat: 45.4389, lng: 10.9928 },
          image: "https://images.unsplash.com/photo-1516489376679-0db79f6e6fb1?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Arena di Verona",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Arena+di+Verona",
          mapPosition: { x: 70, y: 70 }
        },
        {
          id: "scaligero-castle",
          name: "Scaligero Castle (Sirmione)",
          category: "호수/고성",
          timeLabel: "오후 1:00",
          description: "이탈리아 최대 호수 가르다 호수 위로 튀어나온 시르미오네 반도. 물 위에 떠 있는 듯한 스칼리제로 성과 호수의 윤슬이 그림 같은 풍경을 자아냅니다.",
          coordinates: { lat: 45.4922, lng: 10.6083 },
          image: "https://images.unsplash.com/photo-1510403759976-5991873155aa?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Sirmione Lake Garda and Castle",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Scaligero+Castle+Sirmione",
          mapPosition: { x: 55, y: 60 }
        },
        {
          id: "duomo-di-milano",
          name: "Duomo di Milano",
          category: "랜드마크",
          timeLabel: "오후 3:30",
          description: "알프스로 향하는 고속도로를 타기 전 밀라노에 들러 압도적인 고딕 양식의 정수, 밀라노 대성당의 웅장함을 마주합니다.",
          coordinates: { lat: 45.4641, lng: 9.1919 },
          image: "https://images.unsplash.com/photo-1520440229-6469a149ac59?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Duomo di Milano",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Duomo+di+Milano",
          mapPosition: { x: 35, y: 55 }
        },
        {
          id: "simplon-pass",
          name: "Simplon Pass",
          category: "드라이브 코스",
          timeLabel: "오후 6:00",
          description: "이탈리아에서 스위스로 국경을 넘는 해발 2,005m의 알프스 산악 고개. 웅장한 바위산과 탁 트인 도로를 달리며 숙소인 슈탈덴으로 넘어갑니다.",
          coordinates: { lat: 46.2505, lng: 8.0315 },
          image: "https://images.unsplash.com/photo-1629163330223-c18357fc5292?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Simplon Pass road",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Simplon+Pass",
          mapPosition: { x: 25, y: 35 }
        }
      ]
    },
    {
      id: "day-03-chamonix",
      day: 3,
      date: "2025-06-01",
      title: "A Glimpse of Mont Blanc",
      region: "Chamonix",
      deck: "프랑스 국경을 넘어 샤모니로 향합니다. 유럽 최고봉 몽블랑을 마주하고 돌아오는 스위스-프랑스 산악 왕복 코스.",
      mapLabel: "Day 3 Chamonix loop",
      editorial: [
        "이날은 슈탈덴에서 출발해 프랑스 샤모니까지 왕복하는 일정입니다. 구불구불한 산악 도로를 달리며 거대한 빙하와 만년설이 빚어내는 장관을 마주하게 됩니다.",
        "에귀 디 미디(Aiguille du Midi) 전망대에 올라 알프스의 파노라마를 감상하거나, 몽블랑이 병풍처럼 둘러싼 샤모니 알파인 타운에서 여유로운 식사를 즐긴 뒤 늦은 오후 숙소로 복귀합니다."
      ],
      accommodation: {
        name: "Stalden Airbnb",
        address: "Kirchweg 8, Stalden",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kirchweg+8+Stalden"
      },
      places: [
        {
          id: "chamonix-mont-blanc",
          name: "Chamonix-Mont-Blanc",
          category: "알파인 타운",
          timeLabel: "오전",
          description: "몽블랑 산자락에 자리 잡은 활기찬 산악 마을. 등반가들과 여행자들로 붐비며 훌륭한 산악 문화와 카페, 장비점들이 늘어서 있습니다.",
          coordinates: { lat: 45.9237, lng: 6.8694 },
          image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Chamonix town and Mont Blanc",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Chamonix+Mont+Blanc",
          mapPosition: { x: 25, y: 50 }
        },
        {
          id: "aiguille-du-midi",
          name: "Aiguille du Midi",
          category: "전망대",
          timeLabel: "오후",
          description: "케이블카를 타고 3,842m까지 단숨에 오르는 세계적인 전망대. 손에 닿을 듯 가까운 몽블랑의 위용과 깎아지른 절벽을 감상할 수 있습니다.",
          coordinates: { lat: 45.8786, lng: 6.8873 },
          image: "https://images.unsplash.com/photo-1601000676646-61dc51a02ab6?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Aiguille du Midi peak",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Aiguille+du+Midi",
          mapPosition: { x: 35, y: 70 }
        },
        {
          id: "mer-de-glace",
          name: "Mer de Glace",
          category: "빙하",
          timeLabel: "예비 일정",
          description: "'얼음 바다'라는 뜻을 가진 프랑스 최대의 빙하. 붉은색 톱니바퀴 산악 열차를 타고 오르며 얼음 동굴 내부를 탐험할 수 있습니다.",
          coordinates: { lat: 45.9333, lng: 6.925 },
          image: "https://images.unsplash.com/photo-1518090013063-e5256e30ebff?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Mer de Glace glacier in Chamonix",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mer+de+Glace",
          mapPosition: { x: 50, y: 40 }
        }
      ]
    },
    {
      id: "day-04-zermatt",
      day: 4,
      date: "2025-06-02",
      title: "Matterhorn Views & Move to Interlaken",
      region: "Zermatt / Interlaken",
      deck: "스위스의 상징 마터호른을 품은 청정 마을 체르마트를 방문하고, 호수 사이의 도시 인터라켄으로 이동합니다.",
      mapLabel: "Day 4 Zermatt to Interlaken",
      editorial: [
        "오전 일찍 체르마트로 향합니다. 체르마트는 내연기관 차량 진입이 금지된 청정 마을로, 맑은 공기와 함께 고르너그라트 전망대에서 마터호른의 웅장한 자태를 감상할 수 있습니다.",
        "오후에는 기차를 타고 인터라켄으로 이동하여 융프라우 지역 탐험을 위한 새로운 베이스캠프에 짐을 풉니다."
      ],
      accommodation: {
        name: "Interlaken Base",
        address: "Kientalstrasse 116, Scharnachtal",
        checkIn: "6/2",
        checkOut: "6/6",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kientalstrasse+116+Scharnachtal"
      },
      places: [
        {
          id: "zermatt-village",
          name: "Zermatt Village",
          category: "알파인 타운",
          timeLabel: "오전",
          description: "휘발유 차량이 없는 친환경 마을. 목조 발코니와 꽃들로 장식된 샬레들이 스위스 특유의 분위기를 자아냅니다.",
          coordinates: { lat: 46.0207, lng: 7.7491 },
          image: "https://images.unsplash.com/photo-1528646961405-b1a999086e3f?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Zermatt village street",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Zermatt",
          mapPosition: { x: 40, y: 80 }
        },
        {
          id: "gornergrat",
          name: "Gornergrat",
          category: "전망대",
          timeLabel: "정오",
          description: "톱니바퀴 열차를 타고 오르는 3,089m 고지의 전망대. 마터호른을 포함한 4,000m급 알프스 영봉들과 거대한 빙하가 파노라마로 펼쳐집니다.",
          coordinates: { lat: 45.9833, lng: 7.7833 },
          image: "https://images.unsplash.com/photo-1533254257121-657c9cc42861?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Matterhorn view from Gornergrat",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Gornergrat",
          mapPosition: { x: 50, y: 90 }
        },
        {
          id: "interlaken",
          name: "Interlaken",
          category: "베이스 타운",
          timeLabel: "늦은 오후",
          description: "툰 호수와 브리엔츠 호수 사이에 위치한 융프라우 지역의 관문. 새로운 베이스캠프에 짐을 풀고 호반 산책을 즐깁니다.",
          coordinates: { lat: 46.6863, lng: 7.8632 },
          image: "https://images.unsplash.com/photo-1587321557007-ec331fce3f0b?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Interlaken town and mountains",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Interlaken",
          mapPosition: { x: 45, y: 30 }
        }
      ]
    },
    {
      id: "day-05-interlaken-lakes",
      day: 5,
      date: "2025-06-03",
      title: "Lake Towns & Alpine Views",
      region: "Spiez / Thun / Brienz",
      deck: "인터라켄을 감싸고 있는 툰 호수와 브리엔츠 호수 주변의 매력적인 소도시들을 여유롭게 탐방합니다.",
      mapLabel: "Day 5 Lakes explorer",
      editorial: [
        "아름다운 고성이 있는 슈피츠와 툰을 둘러보고, 신비로운 동굴 탐험(St. Beatus-Hohlen)으로 오전 일정을 채웁니다.",
        "오후에는 브리엔츠 호수의 에메랄드빛 물결과 사랑의 불시착 촬영지로 유명한 이젤발트를 방문하며, 해 질 녘 하더쿨름 전망대에서 인터라켄의 야경을 감상합니다."
      ],
      accommodation: {
        name: "Interlaken Base",
        address: "Kientalstrasse 116, Scharnachtal",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kientalstrasse+116+Scharnachtal"
      },
      places: [
        {
          id: "spiez",
          name: "Spiez",
          category: "호숫가 마을",
          timeLabel: "오전",
          description: "툰 호수 변에 자리한 동화 같은 마을. 호수를 배경으로 우뚝 선 슈피츠 성과 포도밭이 아름다운 조화를 이룹니다.",
          coordinates: { lat: 46.6886, lng: 7.6792 },
          image: "https://images.unsplash.com/photo-1590401824707-1c6fc8f1e582?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Spiez castle and lake",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Spiez",
          mapPosition: { x: 20, y: 50 }
        },
        {
          id: "thun",
          name: "Thun",
          category: "역사 도시",
          timeLabel: "정오",
          description: "알프스의 관문 역할을 하는 중세 도시. 구시가지의 독특한 2층 구조 테라스와 툰 성에서의 전망이 일품입니다.",
          coordinates: { lat: 46.7579, lng: 7.6279 },
          image: "https://images.unsplash.com/photo-1601618210340-9759c5d351cb?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Thun old town and river",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Thun",
          mapPosition: { x: 15, y: 35 }
        },
        {
          id: "st-beatus-hohlen",
          name: "St. Beatus-Hohlen",
          category: "자연 명소",
          timeLabel: "오후",
          description: "툰 호수가 내려다보이는 절벽에 위치한 신비로운 종유석 동굴. 폭포와 함께 어우러진 입구 풍경이 압도적입니다.",
          coordinates: { lat: 46.6839, lng: 7.7818 },
          image: "https://images.unsplash.com/photo-1518090013063-e5256e30ebff?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "St. Beatus Caves",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=St.+Beatus-Hohlen",
          mapPosition: { x: 30, y: 40 }
        },
        {
          id: "brienz",
          name: "Brienz",
          category: "호숫가 마을",
          timeLabel: "오후",
          description: "브리엔츠 호수 북동쪽 끝에 자리한 목각 세공으로 유명한 아름다운 스위스 전통 마을입니다.",
          coordinates: { lat: 46.7545, lng: 8.0385 },
          image: "https://images.unsplash.com/photo-1596484552834-6a58f850d0fa?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Brienz village",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Brienz",
          mapPosition: { x: 75, y: 25 }
        },
        {
          id: "aareschlucht",
          name: "Aareschlucht",
          category: "자연 명소",
          timeLabel: "오후",
          description: "수천 년 동안 빙하가 녹은 물이 깎아 만든 좁고 깊은 협곡으로, 신비로운 옥빛 계곡물을 감상할 수 있습니다.",
          coordinates: { lat: 46.7187, lng: 8.2057 },
          image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Aareschlucht gorge",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Aareschlucht",
          mapPosition: { x: 85, y: 35 }
        },
        {
          id: "iseltwald",
          name: "Iseltwald",
          category: "포토 스팟",
          timeLabel: "오후",
          description: "브리엔츠 호수의 맑은 물가에 위치한 조용한 어촌 마을. 피어(부두)에서 바라보는 고요한 호수 풍경이 잊지 못할 추억을 선사합니다.",
          coordinates: { lat: 46.7109, lng: 7.9646 },
          image: "https://images.unsplash.com/photo-1617462109581-2fcbf6ccafaf?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Iseltwald pier and Brienz lake",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Iseltwald",
          mapPosition: { x: 65, y: 45 }
        },
        {
          id: "harder-kulm",
          name: "Harder Kulm",
          category: "전망대",
          timeLabel: "저녁",
          description: "인터라켄 시내와 양쪽의 두 호수, 그리고 융프라우 영봉들까지 한눈에 조망할 수 있는 '인터라켄의 지붕'입니다.",
          coordinates: { lat: 46.6978, lng: 7.8517 },
          image: "https://images.unsplash.com/photo-1627885408075-8eb44dfdc0dc?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "View from Harder Kulm",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Harder+Kulm",
          mapPosition: { x: 45, y: 40 }
        }
      ]
    },
    {
      id: "day-06-jungfrau",
      day: 6,
      date: "2025-06-04",
      title: "Top of Europe",
      region: "Grindelwald / Kleine Scheidegg",
      deck: "산악 열차를 타고 유럽에서 가장 높은 기차역인 융프라우요흐로 오르며 대자연의 경이로움을 만끽합니다.",
      mapLabel: "Day 6 Jungfrau route",
      editorial: [
        "그린델발트를 거쳐 클라이네 샤이덱으로 올라가며 점차 가까워지는 아이거, 묀히, 융프라우의 북벽을 감상합니다.",
        "융프라우요흐에 도착해 알레치 빙하의 웅장함을 마주하고 스핑크스 전망대에서 알프스의 눈부신 설원을 내려다봅니다. 멘리헨이나 피르스트에서 짧은 하이킹을 곁들여도 좋습니다."
      ],
      accommodation: {
        name: "Interlaken Base",
        address: "Kientalstrasse 116, Scharnachtal",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kientalstrasse+116+Scharnachtal"
      },
      places: [
        {
          id: "grindelwald",
          name: "Grindelwald",
          category: "알파인 타운",
          timeLabel: "오전",
          description: "아이거 북벽 바로 아래 자리 잡은 아름다운 빙하 마을. 목가적인 풍경과 웅장한 바위산의 대비가 압도적입니다.",
          coordinates: { lat: 46.6242, lng: 8.0414 },
          image: "https://images.unsplash.com/photo-1549005953-b9ea100c5cbb?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Grindelwald village and Eiger",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Grindelwald",
          mapPosition: { x: 60, y: 55 }
        },
        {
          id: "kleine-scheidegg",
          name: "Kleine Scheidegg",
          category: "환승역 / 하이킹",
          timeLabel: "정오",
          description: "융프라우요흐로 가는 산악 열차의 출발점. 아이거, 묀히, 융프라우 세 봉우리가 손에 잡힐 듯 가까이 보입니다.",
          coordinates: { lat: 46.5851, lng: 7.9614 },
          image: "https://images.unsplash.com/photo-1589139589885-3b9994c6f2f2?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Kleine Scheidegg station",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kleine+Scheidegg",
          mapPosition: { x: 45, y: 70 }
        },
        {
          id: "mannlichen",
          name: "Männlichen",
          category: "전망대 / 하이킹",
          timeLabel: "오전",
          description: "융프라우 지역의 파노라마 뷰를 감상할 수 있는 봉우리. 클라이네 샤이덱으로 이어지는 완만한 하이킹 코스가 인기 있습니다.",
          coordinates: { lat: 46.6113, lng: 7.9426 },
          image: "https://images.unsplash.com/photo-1533254257121-657c9cc42861?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Mannlichen view",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mannlichen",
          mapPosition: { x: 40, y: 65 }
        },
        {
          id: "first",
          name: "First",
          category: "액티비티",
          timeLabel: "오후",
          description: "그린델발트에서 케이블카로 오를 수 있는 곳. 절벽을 따라 걷는 클리프 워크와 짚라인 등 다양한 산악 액티비티를 즐길 수 있습니다.",
          coordinates: { lat: 46.6595, lng: 8.0534 },
          image: "https://images.unsplash.com/photo-1601000676646-61dc51a02ab6?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Grindelwald First cliff walk",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Grindelwald+First",
          mapPosition: { x: 65, y: 45 }
        },
        {
          id: "jungfraujoch",
          name: "Jungfraujoch",
          category: "유럽의 지붕",
          timeLabel: "오후",
          description: "해발 3,454m에 위치한 유럽에서 가장 높은 기차역. 유네스코 세계자연유산인 알레치 빙하의 장관을 만날 수 있습니다.",
          coordinates: { lat: 46.5483, lng: 7.9806 },
          image: "https://images.unsplash.com/photo-1558500201-1fc422eb7fde?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Jungfraujoch Top of Europe",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Jungfraujoch",
          mapPosition: { x: 50, y: 85 }
        }
      ]
    },
    {
      id: "day-14-dolomites",
      day: 14,
      date: "2025-06-12",
      title: "Bled to the Dolomites",
      region: "Villach / Lienz / Dolomites",
      deck:
        "슬로베니아 호수 지대에서 오스트리아 남부를 건너 이탈리아 돌로미티의 산악 베이스로 들어가는 날.",
      mapLabel: "Day 14 mountain approach",
      editorial: [
        "블레드의 물빛을 뒤로하고 북쪽으로 방향을 틀면, 풍경은 국경을 지나는 동안 빠르게 변한다. 도로는 빌라흐와 리엔츠를 지나며 낮은 도시의 리듬을 벗고, 저녁이 가까워질수록 석회암 봉우리와 침엽수 숲의 대비가 더 선명해진다.",
        "이 날의 목적지는 무언가를 많이 소비하는 도시가 아니라 며칠간 산을 읽기 위한 베이스다. 도착 후에는 무리한 일정보다 숙소 주변의 고도, 빛, 이동 시간을 몸에 익히는 편이 좋다. 다음 날의 Tre Cime, Cinque Torri, Passo Gardena는 모두 이 조용한 정박지에서 시작된다.",
        "PDF의 Day 14 페이지처럼 숙소 정보를 먼저 단정히 고정하고, 지도 위 장소들은 이후 며칠간 확장될 산악 노트의 목차처럼 배치했다."
      ],
      accommodation: {
        name: "Saviner di Laste Alpine Base",
        address: "Localita Saviner di Laste, 48, 32023 Saviner di Laste BL, Italy",
        checkIn: "6/12",
        checkOut: "6/16",
        googleMapsUrl:
          "https://www.google.com/maps/search/?api=1&query=Localita%20Saviner%20di%20Laste%2048%2032023%20Saviner%20di%20Laste%20BL%20Italy"
      },
      places: [
        {
          id: "villach",
          name: "Villach",
          category: "이동 거점",
          timeLabel: "늦은 오전",
          description:
            "오스트리아로 넘어가는 완충 지점. 긴 산악 드라이브 전에 속도를 낮추고, 주유와 짧은 휴식을 정리하기 좋은 도시다.",
          coordinates: { lat: 46.6103, lng: 13.8558 },
          image:
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Alpine road near Villach",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Villach%20Austria",
          mapPosition: { x: 28, y: 62 }
        },
        {
          id: "lienz",
          name: "Lienz",
          category: "산악 도시",
          timeLabel: "오후",
          description:
            "동티롤의 산악 도시. Dolomites로 들어가기 전 마지막 도시적 호흡이 남아 있는 곳으로, 이후 풍경은 훨씬 더 수직적으로 변한다.",
          coordinates: { lat: 46.8297, lng: 12.769 },
          image:
            "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Mountain valley near Lienz",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Lienz%20Austria",
          mapPosition: { x: 49, y: 48 }
        },
        {
          id: "cortina",
          name: "Cortina d'Ampezzo",
          category: "베이스 타운",
          timeLabel: "골든아워",
          description:
            "돌로미티 동쪽을 읽는 가장 세련된 관문. 카페와 산악 장비점, 오래된 호텔의 정면이 거대한 암벽을 배경으로 정리된다.",
          coordinates: { lat: 46.5405, lng: 12.1357 },
          image:
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Cortina d'Ampezzo alpine lake and peaks",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cortina%20d'Ampezzo",
          mapPosition: { x: 68, y: 36 }
        },
        {
          id: "tre-cime",
          name: "Tre Cime di Lavaredo",
          category: "봉우리 루트",
          timeLabel: "예비 일정",
          description:
            "세 개의 탑처럼 솟은 바위 능선. Day 14에는 도착 노트로 남겨두고, 날씨가 맑은 다음 날 이른 시간에 꺼내기 좋은 핵심 장소다.",
          coordinates: { lat: 46.6187, lng: 12.3023 },
          image:
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Tre Cime di Lavaredo in the Dolomites",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Tre%20Cime%20di%20Lavaredo",
          mapPosition: { x: 77, y: 23 }
        },
        {
          id: "cinque-torri",
          name: "Cinque Torri",
          category: "암봉 지대",
          timeLabel: "예비 일정",
          description:
            "낮은 접근성에 비해 사진의 밀도가 높은 암봉군. 안개가 얇게 끼는 날에는 산악 잡지의 한 페이지처럼 콘트라스트가 깊어진다.",
          coordinates: { lat: 46.508, lng: 12.0526 },
          image:
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Rocky alpine peaks in the Dolomites",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cinque%20Torri",
          mapPosition: { x: 64, y: 58 }
        }
      ]
    }
  ]
};
