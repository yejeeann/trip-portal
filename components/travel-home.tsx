import Link from "next/link";
import type { AppDesignConfig, AppStructureConfig, ItineraryDay, TravelPayload, Trip } from "@/lib/types";
import { getGuideDataForTrip, type SwissGuideData } from "@/lib/trip-guide";
import { ArrowRight, Bed, CalendarDays, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Cloudy, Compass, MapPin, Route, Sun } from "lucide-react";
import { AppNavigation } from "./app-navigation";
import { GuideImage } from "./guide-image";

type DesignTokens = {
  accent: string;
  coral: string;
  page: string;
  surface: string;
  soft: string;
  ink: string;
  muted: string;
  border: string;
  shadow: string;
  font: string;
};

type TripSnapshot = {
  trip: Trip;
  guideData: SwissGuideData;
  focusItem: SwissGuideData["masterTimeline"][number];
  focusDay: ItineraryDay;
  days: number;
  routeSpine: string[];
};

function getDesign(uiConfig?: AppDesignConfig): DesignTokens {
  const isDark = uiConfig?.colorScheme === "dark";
  const elevated = uiConfig?.cardDesign?.cardStyle === "elevated";

  return {
    accent: uiConfig?.themeColor || "#0E7C7B",
    coral: "#D96C4A",
    page: isDark ? "bg-neutral-950 text-white" : "bg-[#F6F8F7] text-[#17201D]",
    surface: isDark ? "bg-neutral-900" : "bg-white",
    soft: isDark ? "bg-white/5" : "bg-[#EAF3F0]",
    ink: isDark ? "text-white" : "text-[#17201D]",
    muted: isDark ? "text-neutral-300" : "text-[#66716D]",
    border: isDark ? "border-white/10" : "border-black/10",
    shadow: elevated ? "shadow-[0_16px_42px_rgba(31,36,33,0.10)]" : "shadow-none",
    font:
      uiConfig?.typographyStyle === "serif" || uiConfig?.typographyStyle === "elegant"
        ? "font-serif"
        : "font-sans"
  };
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTripStart(trip: Trip) {
  return parseDate(trip.itinerary[0]?.date) ?? new Date(0);
}

function getTripEnd(trip: Trip) {
  return parseDate(trip.itinerary[trip.itinerary.length - 1]?.date) ?? getTripStart(trip);
}

function selectMainTrip(trips: Trip[], fallback: Trip) {
  const today = startOfToday();
  const sorted = [...trips];
  const active = sorted
    .filter((trip) => getTripStart(trip) <= today && getTripEnd(trip) >= today)
    .sort((a, b) => getTripEnd(a).getTime() - getTripEnd(b).getTime());
  if (active[0]) return active[0];

  const upcoming = sorted
    .filter((trip) => getTripStart(trip) >= today)
    .sort((a, b) => getTripStart(a).getTime() - getTripStart(b).getTime());
  if (upcoming[0]) return upcoming[0];

  return sorted.sort((a, b) => getTripStart(b).getTime() - getTripStart(a).getTime())[0] ?? fallback;
}

function formatDateLabel(value: string) {
  const date = parseDate(value);
  if (!date) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTripState(trip: Trip) {
  const today = startOfToday();
  const start = getTripStart(trip);
  const end = getTripEnd(trip);

  if (start <= today && end >= today) return "Now traveling";
  if (start > today) return "Upcoming";
  return "Recent";
}

function getFocusItem(guideData: SwissGuideData) {
  const today = startOfToday();
  return guideData.masterTimeline.find((item) => parseDate(item.date) && parseDate(item.date)! >= today) ?? guideData.masterTimeline.at(-1)!;
}

function getFocusDay(trip: Trip, focusItem: SwissGuideData["masterTimeline"][number]) {
  return trip.itinerary.find((day) => day.day === focusItem.day) ?? trip.itinerary[0];
}

function cleanCityName(city: string) {
  return city
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\b(Fiumicino|Airport|ICN|FCO|MLA|CTA)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitRouteNames(value: string) {
  return value
    .split(/\s+to\s+|\s+via\s+|\/|,/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildRouteSpine(trip: Trip, guideData: SwissGuideData) {
  const transitOnly = new Set(["incheon", "helsinki", "fiumicino", "luqa", "gzira", "mgarr"]);
  const seen = new Set<string>();
  const route: string[] = [];

  const add = (city: string) => {
    const clean = cleanCityName(city);
    const key = clean.toLowerCase();
    if (!clean || transitOnly.has(key) || seen.has(key)) return;
    seen.add(key);
    route.push(clean);
  };

  trip.itinerary.forEach((day) => {
    splitRouteNames(day.city).forEach(add);
  });

  guideData.masterTimeline.forEach((item) => {
    splitRouteNames(item.primaryRoute).forEach(add);
  });

  return route;
}

function buildTripSnapshot(trip: Trip): TripSnapshot {
  const guideData = getGuideDataForTrip(trip);
  const focusItem = getFocusItem(guideData);

  return {
    trip,
    guideData,
    focusItem,
    focusDay: getFocusDay(trip, focusItem),
    days: guideData.masterTimeline.length,
    routeSpine: buildRouteSpine(trip, guideData)
  };
}

function countryLabel(trip: Trip) {
  return trip.countries.slice(0, 3).join(" / ");
}

function splitHeroTitle(title: string) {
  const parts = title.split(/\s+[—-]\s+/);
  if (parts.length < 2) return { name: title, meta: "" };
  return { name: parts.slice(0, -1).join(" — "), meta: parts[parts.length - 1] };
}

function AppHeader({ trip, design }: { trip: Trip; design: DesignTokens }) {
  return (
    <header className={`sticky top-0 z-40 border-b ${design.border} bg-white/90 backdrop-blur-xl`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white" style={{ backgroundColor: design.accent }}>
            <Compass className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-extrabold tracking-normal">Trip Portal</span>
        </Link>
        <div className={`hidden items-center gap-2 text-xs font-bold md:flex ${design.muted}`}>
          <CalendarDays className="h-4 w-4" />
          {trip.dateRange}
        </div>
      </div>
    </header>
  );
}

function RouteChips({ route, max = 24 }: { route: string[]; max?: number }) {
  const visible = route.slice(0, max);
  const remaining = Math.max(0, route.length - visible.length);

  return (
    <div className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {visible.map((city, index) => (
        <span key={`${city}-${index}`} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-[#33413C]">
          {index > 0 && <span className="h-1 w-1 rounded-full bg-[#D96C4A]" />}
          {city}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex shrink-0 rounded-md border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-[#66716D]">
          +{remaining}
        </span>
      )}
    </div>
  );
}

function getWeatherIcon(code?: number) {
  if (code === 0) return Sun;
  if (code === 1 || code === 2) return CloudSun;
  if (code === 3) return Cloudy;
  if (code === 45 || code === 48) return CloudFog;
  if (code && code >= 51 && code <= 57) return CloudDrizzle;
  if (code && ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))) return CloudRain;
  if (code && ((code >= 71 && code <= 77) || code === 85 || code === 86)) return CloudSnow;
  if (code && code >= 95) return CloudLightning;
  return CloudSun;
}

function WeatherTimeline({
  trip,
  activeDay,
  design
}: {
  trip: Trip;
  activeDay: number;
  design: DesignTokens;
}) {
  const hasForecast = trip.itinerary.some((day) => day.weather.source === "forecast");

  return (
    <div className={`mt-5 rounded-lg ${design.soft} p-2.5 sm:p-3`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: design.accent }}>
            {hasForecast ? "Live forecast" : "Seasonal estimate"}
          </p>
          <p className={`mt-1 truncate text-xs font-bold ${design.muted}`}>
            {trip.dateRange} · Open-Meteo
          </p>
        </div>
        <CloudSun className="hidden h-7 w-7 shrink-0 sm:block" style={{ color: design.coral }} />
      </div>
      <div className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {trip.itinerary.map((day) => {
          const isActive = day.day === activeDay;
          const WeatherIcon = getWeatherIcon(day.weather.weatherCode);

          return (
            <Link
              key={day.day}
              href={`/trips/${trip.id}/day/${day.day}`}
              className={`grid min-h-[5.8rem] w-[5.85rem] shrink-0 content-between rounded-md border p-2 transition sm:w-[6.6rem] ${
                isActive
                  ? "border-transparent text-white"
                  : "border-black/10 bg-white text-[#17201D] hover:border-black/20"
              }`}
              style={isActive ? { backgroundColor: design.accent } : undefined}
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[9px] font-extrabold uppercase ${isActive ? "text-white/75" : design.muted}`}>D{day.day}</span>
                  <span className={`text-[9px] font-bold ${isActive ? "text-white/75" : design.muted}`}>{formatDateLabel(day.date)}</span>
                </div>
                <p className="mt-1 truncate text-[11px] font-extrabold">{day.city}</p>
              </div>
              <div>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-xl font-black leading-none">{day.weather.tempC}°</p>
                  <WeatherIcon className={`h-5 w-5 shrink-0 ${isActive ? "text-white/82" : "text-[#D96C4A]"}`} aria-label={day.weather.condition} />
                </div>
                <p className={`mt-1 whitespace-nowrap text-[9px] font-bold ${isActive ? "text-white/70" : design.muted}`}>H{day.weather.highC}° L{day.weather.lowC}°</p>
                <p className={`mt-0.5 text-[8px] font-extrabold uppercase ${isActive ? "text-white/62" : design.muted}`}>
                  {day.weather.source === "forecast" ? "Forecast" : "Estimate"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MainTripHero({ snapshot, design }: { snapshot: TripSnapshot; design: DesignTokens }) {
  const { trip, focusItem, routeSpine } = snapshot;
  const titleParts = splitHeroTitle(trip.title);

  return (
    <section className="grid w-full min-w-0 max-w-[calc(100vw-2rem)] grid-cols-[minmax(0,1fr)] gap-4 sm:max-w-full lg:grid-cols-[minmax(0,1fr)_21rem]">
      <Link href={`/trips/${trip.id}`} className={`group relative min-h-[23.5rem] w-full min-w-0 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg sm:max-w-full sm:min-h-[27rem] ${design.shadow}`}>
        <GuideImage
          src={trip.heroImage}
          alt={trip.title}
          className="absolute inset-0 h-full w-full"
          imageClassName="transition duration-700 group-hover:scale-[1.025]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/24 to-black/5" />
        <div className="absolute left-3 right-3 top-3 flex min-w-0 items-center gap-2 sm:left-4 sm:right-4 sm:top-4">
          <span className="shrink-0 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-extrabold uppercase text-neutral-900 sm:px-3 sm:text-[11px]">
            {formatTripState(trip)}
          </span>
          <span className="ml-auto hidden min-w-0 max-w-[12rem] truncate rounded-md bg-black/45 px-3 py-1.5 text-xs font-bold text-white backdrop-blur sm:block">
            {countryLabel(trip)}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-8">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70 sm:mb-3 sm:text-xs">Main journey</p>
          <h1 className="max-w-4xl text-[2.05rem] font-black leading-[1.04] tracking-normal sm:text-6xl">
            <span className="block break-words [overflow-wrap:anywhere]">{titleParts.name}</span>
            {titleParts.meta && <span className="mt-1 block text-[1.5rem] sm:text-5xl">{titleParts.meta}</span>}
          </h1>
          <p className="mt-3 line-clamp-3 max-w-2xl break-words text-sm font-semibold leading-relaxed text-white/84 [overflow-wrap:anywhere] sm:mt-4 sm:text-base">
            {trip.subtitle}
          </p>
        </div>
      </Link>

      <aside className={`grid w-full min-w-0 max-w-[calc(100vw-2rem)] content-between rounded-lg border sm:max-w-full ${design.border} ${design.surface} p-4 ${design.shadow}`}>
        <div className="min-w-0">
          <p className={`text-xs font-extrabold uppercase tracking-[0.16em] ${design.muted}`}>Next useful info</p>
          <h2 className="mt-2 text-2xl font-black tracking-normal">Day {focusItem.day}</h2>
          <p className={`mt-1 break-words text-sm font-bold leading-snug ${design.muted}`}>{formatDateLabel(focusItem.date)} · {focusItem.primaryRoute}</p>

          <WeatherTimeline trip={trip} activeDay={focusItem.day} design={design} />

          <div className="mt-5 hidden min-w-0 sm:block">
            <p className={`mb-2 text-xs font-extrabold uppercase tracking-[0.14em] ${design.muted}`}>Route spine</p>
            <RouteChips route={routeSpine} />
          </div>
        </div>

        <div className="mt-5 hidden w-full min-w-0 grid-cols-3 gap-2 sm:grid">
          <Link href={`/trips/${trip.id}`} className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-extrabold text-white sm:gap-1.5 sm:px-3" style={{ backgroundColor: design.accent }}>
            <span className="min-w-0 truncate">Overview</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
          <Link href={`/trips/${trip.id}/day/${focusItem.day}`} className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs font-extrabold sm:gap-1.5 sm:px-3 ${design.border}`}>
            <span className="min-w-0 truncate">Day</span>
            <CalendarDays className="h-4 w-4 shrink-0" />
          </Link>
          <Link href={`/trips/${trip.id}/stays`} className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs font-extrabold sm:gap-1.5 sm:px-3 ${design.border}`}>
            <span className="min-w-0 truncate">Stays</span>
            <Bed className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </aside>
    </section>
  );
}

function TripCard({ snapshot, isMain, design }: { snapshot: TripSnapshot; isMain: boolean; design: DesignTokens }) {
  const { trip, focusItem, focusDay, days, routeSpine } = snapshot;

  return (
    <Link href={`/trips/${trip.id}`} className={`group grid w-full min-w-0 max-w-[calc(100vw-2rem)] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-lg border sm:max-w-full ${design.border} ${design.surface} ${design.shadow} sm:grid-cols-[12rem_minmax(0,1fr)]`}>
      <GuideImage
        src={trip.heroImage}
        alt={trip.title}
        className="h-36 sm:min-h-full"
        imageClassName="transition duration-500 group-hover:scale-[1.04]"
      />
      <div className="min-w-0 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase text-white" style={{ backgroundColor: isMain ? design.accent : design.coral }}>
            {isMain ? "Main" : formatTripState(trip)}
          </span>
          <span className={`truncate text-xs font-bold ${design.muted}`}>{trip.dateRange}</span>
        </div>
        <h3 className="truncate text-lg font-black tracking-normal">{trip.title}</h3>
        <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold ${design.muted}`}>
          <span className="inline-flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5" />
            {days} days
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {countryLabel(trip)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CloudSun className="h-3.5 w-3.5" />
            {focusDay.city} {focusDay.weather.tempC}°
          </span>
        </div>
        <p className={`mt-3 line-clamp-2 text-sm font-semibold leading-relaxed ${design.muted}`}>
          Day {focusItem.day}: {focusItem.primaryRoute}
        </p>
        <div className="mt-4">
          <RouteChips route={routeSpine} max={8} />
        </div>
      </div>
    </Link>
  );
}

function TripLibrary({ snapshots, mainTripId, design }: { snapshots: TripSnapshot[]; mainTripId: string; design: DesignTokens }) {
  return (
    <section className="mt-20 sm:mt-0">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className={`text-xs font-extrabold uppercase tracking-[0.16em] ${design.muted}`}>Trips</p>
          <h2 className="mt-1 text-2xl font-black tracking-normal">여행별로 보기</h2>
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
        {snapshots.map((snapshot) => (
          <TripCard key={snapshot.trip.id} snapshot={snapshot} isMain={snapshot.trip.id === mainTripId} design={design} />
        ))}
      </div>
    </section>
  );
}

export function TravelHome({ payload }: { payload: TravelPayload }) {
  const design = getDesign(payload.uiConfig);
  const trips = payload.trips?.length ? payload.trips : [payload.trip];
  const mainTrip = selectMainTrip(trips, payload.trip);
  const snapshots = trips
    .map(buildTripSnapshot)
    .sort((a, b) => {
      if (a.trip.id === mainTrip.id) return -1;
      if (b.trip.id === mainTrip.id) return 1;
      return getTripStart(b.trip).getTime() - getTripStart(a.trip).getTime();
    });
  const mainSnapshot = snapshots.find((snapshot) => snapshot.trip.id === mainTrip.id) ?? snapshots[0];
  const homeNavigation: AppStructureConfig = {
    navigationType: "bottom-tab",
    tabs: [
      { id: "overview", label: "Overview", iconType: "overview" },
      { id: "daily", label: "Daily", iconType: "calendar" },
      { id: "stays", label: "Stays", iconType: "accommodations" }
    ]
  };

  if (!mainSnapshot || trips.length === 0) {
    return <div className="flex min-h-[50vh] items-center justify-center text-neutral-500">진행 중인 여행이 없습니다.</div>;
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden pb-28 ${design.font} ${design.page}`}>
      <AppHeader trip={mainSnapshot.trip} design={design} />
      <main className="mx-auto grid w-full max-w-full grid-cols-[minmax(0,1fr)] gap-6 overflow-hidden px-4 py-5 sm:max-w-6xl sm:px-6 sm:py-6">
        <MainTripHero snapshot={mainSnapshot} design={design} />
        <TripLibrary snapshots={snapshots} mainTripId={mainSnapshot.trip.id} design={design} />
      </main>
      <AppNavigation appStructure={homeNavigation} themeColor={design.accent} tripIdOverride={mainSnapshot.trip.id} />
    </div>
  );
}
