import { fallbackTravelPayload } from "@/lib/fallback-travel";
import { AppNavigation } from "@/components/app-navigation";
import { MultiOsmMap } from "@/components/multi-osm-map";

export default function ExplorePage() {
  const payload = fallbackTravelPayload;
  const { trips, uiConfig, appStructure } = payload;

  const isDark = uiConfig?.colorScheme === "dark";
  const fontClass =
    uiConfig?.typographyStyle === "serif" || uiConfig?.typographyStyle === "elegant"
      ? "font-serif"
      : "font-sans";

  // 모든 여행지의 일자별 방문 좌표를 추출하여 마커 배열로 만듭니다.
  const markers =
    trips?.flatMap((trip) =>
      trip.itinerary
        .filter((day) => day.coordinates)
        .map((day) => ({
          lat: day.coordinates.lat,
          lng: day.coordinates.lng,
          label: day.city,
        }))
    ) || [];

  return (
    <div className={`flex h-[100dvh] flex-col overflow-hidden ${fontClass} ${isDark ? "bg-[#0a0a0a] text-white" : "bg-white text-gray-900"}`}>
      {/* 상단 미니멀 타이틀 영역 */}
      <header className="relative z-10 shrink-0 border-b border-gray-200/50 bg-white/80 px-6 pb-6 pt-16 backdrop-blur-xl dark:border-gray-800/50 dark:bg-black/80 md:pt-24">
        <h1 className="text-5xl font-extrabold tracking-tighter md:text-7xl">Explore.</h1>
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
          나의 모든 여정과 목적지를 지도에서 한눈에 확인하세요.
        </p>
      </header>

      {/* 전체 화면 지도 영역 */}
      <main className="relative z-0 flex-1 w-full bg-[#E9E0D1] dark:bg-gray-900">
        <MultiOsmMap markers={markers} className="absolute inset-0 h-full w-full" mapVariant="atlas" />
      </main>

      {/* 공통 하단 네비게이션 탭바 */}
      <AppNavigation appStructure={appStructure} themeColor={uiConfig?.themeColor} />
    </div>
  );
}
