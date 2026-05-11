export const mcpDevelopmentBrief = {
  principle:
    "Use MCP servers as development-time collaborators for design direction, itinerary enrichment, and guide content. Runtime calls should be reserved for data that genuinely changes.",
  designDirection: {
    name: "Atlas Guide",
    productFeel:
      "A premium travel guide app for scanning a prepared trip, not a marketing landing page or trip-generation workflow.",
    visualLanguage: [
      "Large destination photography with restrained overlays",
      "Warm paper background, quiet white surfaces, deep ink text",
      "Teal primary accent with a small coral secondary accent",
      "Compact rounded rectangles with 8px radius",
      "Dense but breathable itinerary cards built for repeated use"
    ],
    firstScreenPriorities: [
      "Primary trip identity",
      "Next stop and day plan",
      "Route metrics",
      "Timeline scanning",
      "Curated field notes"
    ]
  },
  stitchRun: {
    project: "projects/7085487830212499712",
    designSystem: "assets/12595645014709892290",
    session: "1134198604808633029",
    latestSession: "826404351381165095",
    screens: [
      {
        title: "Home / Trip Library",
        id: "projects/7085487830212499712/screens/8d094f9e3b6443888da8aca2760d1faf",
        purpose: "현재 여행, 이어보기, 저장한 가이드와 과거 여행을 빠르게 스캔하는 시작 화면"
      },
      {
        title: "Trip Overview",
        id: "projects/7085487830212499712/screens/53061df7973343cca12c9cd4bfec8929",
        purpose: "전체 루트, 여행 핵심 정보, 일자별 흐름을 한 번에 파악하는 화면"
      },
      {
        title: "Daily Plan",
        id: "projects/7085487830212499712/screens/16c416c3dda74b1ba731fb840734333c",
        purpose: "하루 동선, 방문 순서, 장소 카드, 당일 메모를 보는 실행 화면"
      },
      {
        title: "Route Map",
        id: "projects/7085487830212499712/screens/1bb62609b961402bb477d512d29afc01",
        purpose: "전체 동선을 지도 중심으로 보고 번호 핀과 하단 리스트를 함께 탐색하는 화면"
      },
      {
        title: "Place Detail",
        id: "projects/7085487830212499712/screens/be60a7c7185f4330b5dd8173a32d6d02",
        purpose: "관광지별 사진, 방문 이유, 가이드 노트, 실용 정보를 읽는 상세 화면"
      },
      {
        title: "Logistics",
        id: "projects/7085487830212499712/screens/27d02c714ddc40e398956e640f825212",
        purpose: "항공, 숙소, 교통, 예약, 준비사항을 모아두는 여행 준비 화면"
      },
      {
        title: "Daily Guide: Syracuse",
        id: "projects/7085487830212499712/screens/2cb3e56bec04469d8105e5711e226cdf",
        purpose: "지도, 당일 요약, 숙소 출발 경로, 꼭 가봐야 할 곳/숨은 명소, 펼침형 장소 상세를 한 화면에서 스캔하는 모바일 Daily Guide 기준 화면"
      }
    ]
  },
  informationArchitecture: {
    globalHome: ["Current Trip", "Continue Today", "Trip Library", "Saved Guides"],
    tripTabs: ["Overview", "Days", "Map", "Places", "Logistics"],
    detailDepth: [
      "전체 여행 개요",
      "일자별 일정",
      "관광지별 상세 설명",
      "지도와 동선",
      "예약과 준비 정보"
    ],
    recommendedFlow:
      "홈에서 여행을 선택하고, 여행 내부에서는 Overview로 전체 흐름을 잡은 뒤 Days에서 당일 실행, Places에서 상세 설명, Map과 Logistics로 실용 정보를 보조합니다."
  },
  servers: {
    stitch: {
      role: "Design and UX planning assistant",
      developmentUses: [
        "Generate app design direction and screen structure",
        "Suggest uiConfig, navigation, visual density, and component hierarchy",
        "Review travel guide flows for home, daily plan, map, and place detail screens"
      ],
      runtimeUse: "Avoid runtime calls for static itinerary or guide copy"
    },
    myTravelMcp: {
      role: "Travel intelligence and guide enrichment assistant",
      developmentUses: [
        "Enrich existing itinerary days with local context and visit notes",
        "Draft attraction descriptions, historical background, and practical tips",
        "Pre-compute recommended route order and map-link candidates when stable"
      ],
      runtimeUse:
        "Use only for live or user-triggered data such as current route checks, fresh opening details, or map links"
    }
  },
  appDataPolicy: {
    staticData: [
      "Trip titles, dates, countries, route summaries",
      "Day-by-day itinerary structure",
      "Curated guide descriptions and local notes",
      "Design tokens selected from Stitch exploration"
    ],
    liveData: [
      "Weather snapshots",
      "Opening-hour checks",
      "Temporary closures",
      "Live map links or route validation"
    ]
  }
} as const;
