import { fallbackTravelPayload } from "@/lib/fallback-travel";
import { withOpenMeteoWeather } from "@/lib/open-meteo";
import { TravelHome } from "@/components/travel-home";

export default async function HomePage() {
  // 여행 일정과 가이드 설명은 개발 중 MCP로 보강한 정적 데이터로 제공합니다.
  // 런타임 MCP 호출은 날씨/영업시간처럼 실시간성이 필요한 기능에만 제한합니다.
  const payload = await withOpenMeteoWeather(fallbackTravelPayload);

  if (!payload) {
    return <div className="py-20 text-center">여행 데이터를 불러오는 데 실패했습니다.</div>;
  }

  return <TravelHome payload={payload} />;
}
