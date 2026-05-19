"use client";

import type { AppStructureConfig } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, Compass, Heart, House, LayoutGrid, MapPin, User } from "lucide-react";

// Stitch가 반환한 iconType 문자열을 실제 Lucide 아이콘 컴포넌트로 매핑
const IconMap: Record<string, React.ElementType> = {
  home: Compass,
  compass: Compass,
  map: MapPin,
  heart: Heart,
  user: User,
  calendar: Calendar,
  daily: Calendar,
  overview: MapPin,
  places: BookOpen,
  guidebook: BookOpen,
  print: BookOpen,
  hotel: House,
  stays: House,
  accommodations: House,
};

const tabToneMap: Record<string, string> = {
  home: "#1A434E",
  overview: "#1A434E",
  daily: "#D4A373",
  map: "#4F928B",
  places: "#9B6B43",
  guidebook: "#1A434E",
  print: "#1A434E",
  stays: "#C8795A",
  accommodations: "#C8795A",
  logistics: "#8A6F4D",
  saved: "#C8795A",
  explore: "#4F928B"
};

export function AppNavigation({
  appStructure,
  themeColor = "#1A434E",
  tripIdOverride
}: {
  appStructure?: AppStructureConfig;
  themeColor?: string;
  tripIdOverride?: string;
}) {
  const pathname = usePathname();

  // 현재 경로에서 tripId 추출 (예: /trips/123/day/1 -> 123)
  const tripMatch = pathname.match(/\/trips\/([^/]+)/);
  const tripId = tripMatch ? tripMatch[1] : tripIdOverride ?? null;

  const tabs = appStructure?.tabs || [
    { id: "home", label: "Home", iconType: "home" },
    { id: "explore", label: "Explore", iconType: "compass" },
    { id: "saved", label: "Saved", iconType: "heart" }
  ];

  // minimal 라우팅 구조일 때는 렌더링하지 않음
  if (appStructure?.navigationType === "minimal") return null;

  // 탭 ID에 따른 동적 경로 생성
  const getHref = (tabId: string) => {
    if (tabId === "home") return "/";
    if (tabId === "overview" && !tripId) return "/#trip-library";
    if (tabId === "saved" && !tripId) return "/";
    if (tabId === "daily" && tripId) return `/trips/${tripId}/day/1`;
    if (tabId === "overview" && tripId) return `/trips/${tripId}`;
    if (tabId === "stays" && tripId) return `/trips/${tripId}/stays`;
    if (tabId === "map" && tripId) return `/trips/${tripId}/map`;
    if (tabId === "places" && tripId) return `/trips/${tripId}/places`;
    if (tabId === "logistics" && tripId) return `/trips/${tripId}/logistics`;
    return `/${tabId}`;
  };

  // 현재 경로와 탭이 일치하는지 판별
  const checkIsActive = (tabId: string) => {
    if (tabId === "home") return pathname === "/";
    if (tabId === "daily") return pathname.includes("/day/");
    if (tabId === "overview") return pathname === `/trips/${tripId}`;
    if (tabId === "stays") return pathname === `/trips/${tripId}/stays`;
    return pathname.includes(`/${tabId}`);
  };

  return (
    <div className="pointer-events-none fixed bottom-2 left-0 right-0 z-50 flex justify-center px-3 pb-[env(safe-area-inset-bottom)] sm:bottom-4 sm:px-4">
      <nav className="pointer-events-auto flex w-[min(22rem,calc(100vw-1.5rem))] items-center gap-1 overflow-hidden rounded-[1.25rem] border border-[#E6DAC8] bg-white/94 px-1.5 py-1.5 shadow-[0_18px_45px_rgba(45,45,45,0.14)] backdrop-blur-xl sm:w-full sm:max-w-sm sm:px-2">
        {tabs.map((tab) => {
          const Icon = IconMap[tab.iconType] || IconMap[tab.id] || LayoutGrid;
          const isActive = checkIsActive(tab.id);
          const label = tab.id === "stays" ? "Stays" : tab.label;
          const tone = isActive ? themeColor : tabToneMap[tab.id] ?? tabToneMap[tab.iconType] ?? themeColor;

          return (
            <Link
              key={tab.id}
              href={getHref(tab.id)}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-[1rem] px-1.5 py-1.5 transition duration-200 sm:px-2 ${
                isActive ? "bg-[#F4ECE0]" : "hover:bg-[#F9F7F2]"
              }`}
            >
              <div
                className={`relative flex h-8 w-8 items-center justify-center rounded-full transition duration-200 ${
                  isActive ? "shadow-[0_8px_18px_rgba(26,67,78,0.18)]" : "bg-white/70 shadow-[inset_0_0_0_1px_rgba(230,218,200,0.92)]"
                }`}
                style={{ backgroundColor: isActive ? tone : undefined }}
              >
                <Icon
                  className="h-[1.15rem] w-[1.15rem] stroke-[1.45] transition-colors"
                  style={{ color: isActive ? "#F9F7F2" : tone }}
                />
              </div>
              <span
                className="mt-0.5 max-w-full truncate text-[9px] font-black tracking-normal transition-colors sm:text-[10px]"
                style={{ color: isActive ? themeColor : "#2D2D2D" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
