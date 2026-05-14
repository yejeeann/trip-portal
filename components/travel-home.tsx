import Link from "next/link";
import type { AppDesignConfig, ItineraryDay, TravelPayload, Trip } from "@/lib/types";
import { getGuideDataForTrip, type SwissGuideData } from "@/lib/trip-guide";
import { ArrowRight, BookOpen, Calendar, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Cloudy, Compass, House, MapPin, Route, Sparkles, Sun } from "lucide-react";
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

const homePhotos = {
  hero: "/travel-photos/guidebook/sicily-malta-rome-cover.png",
  heroPhoto: "/travel-photos/home-hero-taormina-bright-portrait.png",
  ortigia: "/travel-photos/sicily-day5/piazza-duomo-ortigia.jpg",
  valletta: "/travel-photos/sicily-day7-9/valletta-grand-harbour.jpg",
  agrigento: "/travel-photos/sicily-day10-12/valley-of-the-temples.jpg",
  amalfi: "/travel-photos/sicily-day16-19/pompeii-archaeological-park.jpg"
};

function getDesign(uiConfig?: AppDesignConfig): DesignTokens {
  const isDark = uiConfig?.colorScheme === "dark";
  const elevated = uiConfig?.cardDesign?.cardStyle === "elevated";

  return {
    accent: "#1A434E",
    coral: "#D4A373",
    page: isDark ? "bg-neutral-950 text-white" : "bg-[#F9F7F2] text-[#2D2D2D]",
    surface: isDark ? "bg-neutral-900" : "bg-white",
    soft: isDark ? "bg-white/5" : "bg-[#EFE8DB]",
    ink: isDark ? "text-white" : "text-[#2D2D2D]",
    muted: isDark ? "text-neutral-300" : "text-[#6B6861]",
    border: isDark ? "border-white/10" : "border-[#E7DDCE]",
    shadow: elevated ? "shadow-[0_18px_48px_rgba(45,45,45,0.11)]" : "shadow-[0_18px_44px_rgba(45,45,45,0.10)]",
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

function formatTripDateRange(trip: Trip) {
  const first = trip.itinerary[0]?.date;
  const last = trip.itinerary[trip.itinerary.length - 1]?.date;
  if (!first || !last) return "";

  const start = parseDate(first);
  const end = parseDate(last);
  if (!start || !end) return `${first} - ${last}`;

  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" })
  });
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return `${startLabel} - ${endLabel}`;
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
    <header className="sticky top-0 z-40 bg-[#F8F2E9]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_8px_20px_rgba(14,111,104,0.25)]" style={{ backgroundColor: design.accent }}>
            <Compass className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black leading-tight text-[#17201D]">Sicily & Malta</span>
            <span className={`block truncate text-[10px] font-bold uppercase tracking-[0.12em] ${design.muted}`}>May 21 - Jun 8</span>
          </span>
        </Link>
        <Link href="/print" className="inline-flex h-9 items-center justify-center rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#17201D] shadow-[0_8px_18px_rgba(60,45,34,0.08)]">
          Guide
        </Link>
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

function routeStoryStops(route: string[]) {
  const preferred = ["Rome", "Catania", "Syracuse", "Valletta", "Gozo", "Agrigento", "Trapani", "Palermo", "Scilla", "Tropea", "Amalfi", "Pompeii", "Rome Final"];
  const normalizedRoute = route.map((city) => ({ city, key: city.toLowerCase() }));
  const stops: string[] = [];

  preferred.forEach((name) => {
    const found = normalizedRoute.find((item) => item.key.includes(name.toLowerCase()) || name.toLowerCase().includes(item.key));
    if (found && !stops.includes(found.city)) stops.push(found.city);
  });

  route.forEach((city) => {
    if (stops.length >= 12) return;
    if (!stops.includes(city)) stops.push(city);
  });

  return stops.slice(0, 12);
}

function getHighlightDays(trip: Trip) {
  const preferredDays = [4, 5, 7, 10, 12, 14, 17];
  const preferred = preferredDays.flatMap((dayNumber) => {
    const found = trip.itinerary.find((item) => item.day === dayNumber);
    return found ? [found] : [];
  });

  if (preferred.length >= 5) return preferred.slice(0, 6);

  const extras = trip.itinerary.filter((day) => !preferred.some((item) => item.day === day.day)).slice(0, 6 - preferred.length);
  return [...preferred, ...extras];
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
    <div className="mt-4 rounded-none bg-transparent">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: design.accent }}>
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
                  : "border-[#E6DAC8] bg-white/84 text-[#17201D] shadow-[0_10px_22px_rgba(45,45,45,0.05)] hover:border-[#D4A373]/70"
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

function MainTripHero({ snapshot }: { snapshot: TripSnapshot }) {
  const { trip } = snapshot;
  const tripDateRange = formatTripDateRange(trip);

  return (
    <section className="relative pb-2">
      <Link href={`/trips/${trip.id}`} className="group relative block h-[24.5rem] overflow-hidden bg-[#D8D0C4] shadow-[0_18px_42px_rgba(45,45,45,0.13)] sm:h-[30rem]">
        <img
          src={homePhotos.heroPhoto}
          alt="Sicily Malta Rome guidebook cover"
          className="absolute inset-0 h-full w-full object-cover object-[58%_44%] transition duration-700 group-hover:scale-[1.025]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,43,44,0.66),rgba(24,43,44,0.24)_54%,rgba(24,43,44,0.02)_80%),linear-gradient(180deg,rgba(20,30,28,0.20),rgba(20,30,28,0.05)_35%,rgba(20,24,22,0.40)_82%)]" />
        <div className="absolute inset-0 bg-[#D4A373]/[0.10] mix-blend-soft-light" />
        <div className="absolute left-7 right-7 top-16 text-white sm:left-10 sm:right-10 sm:top-20">
          <h1 className="max-w-xs font-serif text-[3.45rem] font-semibold leading-[0.9] tracking-normal drop-shadow-[0_8px_22px_rgba(0,0,0,0.22)] sm:max-w-md sm:text-7xl">Sicily<br />&amp; Malta</h1>
          <p className="mt-3 max-w-[18rem] text-[0.68rem] font-extrabold uppercase leading-[1.55] tracking-[0.20em] text-white/90 sm:max-w-none sm:text-sm sm:tracking-[0.28em]">Catania · Syracuse · Valletta</p>
          <span className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-[#1A434E]/95 px-4 py-2 text-[9.5px] font-black uppercase tracking-[0.14em] text-white shadow-[0_12px_24px_rgba(0,0,0,0.20)]">
            <span className="h-2 w-2 rounded-full bg-[#D4A373]" />
            {tripDateRange}
          </span>
        </div>
      </Link>
    </section>
  );
}

function RouteStory({ snapshot, design }: { snapshot: TripSnapshot; design: DesignTokens }) {
  const stops = routeStoryStops(snapshot.routeSpine);

  return (
    <section className={`rounded-lg border ${design.border} ${design.surface} p-4 ${design.shadow} sm:p-5`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.14em] ${design.muted}`}>Route story</p>
          <h2 className="mt-1 text-2xl font-black tracking-normal">지중해를 따라 이어지는 큰 흐름</h2>
        </div>
        <Route className="hidden h-7 w-7 sm:block" style={{ color: design.accent }} />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stops.map((stop, index) => (
          <div key={`${stop}-${index}`} className="grid min-h-[7rem] w-[8.5rem] shrink-0 content-between rounded-lg border border-black/10 bg-[#F8F4EA] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ backgroundColor: index % 3 === 0 ? design.accent : index % 3 === 1 ? design.coral : "#233D4D" }}>
                {String(index + 1).padStart(2, "0")}
              </span>
              {index < stops.length - 1 && <ArrowRight className="h-4 w-4 text-[#9D7E4F]" />}
            </div>
            <p className="break-words text-sm font-black leading-tight text-[#17201D]">{stop}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickActions({ snapshot, design }: { snapshot: TripSnapshot; design: DesignTokens }) {
  const { trip, focusItem } = snapshot;
  const actions = [
    { href: `/trips/${trip.id}/day/${focusItem.day}`, label: "Daily", icon: Calendar, tone: design.coral, iconClass: "h-[1.55rem] w-[1.55rem]" },
    { href: `/trips/${trip.id}`, label: "Map", icon: MapPin, tone: "#1A434E", iconClass: "h-[1.8rem] w-[1.8rem]" },
    { href: "/print", label: "Guidebook", icon: BookOpen, tone: "#1A434E", iconClass: "h-[1.62rem] w-[1.62rem]" },
    { href: `/trips/${trip.id}/stays`, label: "Stays", icon: House, tone: "#C8795A", iconClass: "h-[1.62rem] w-[1.62rem]" }
  ];

  return (
    <section className="mx-5 max-w-full overflow-hidden border-y border-[#E6DAC8] bg-[#F9F7F2]/70 sm:mx-10">
      <div className="grid w-full min-w-0 divide-x divide-[#E6DAC8]" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              style={{ minWidth: 0 }}
              className="group relative grid min-h-[5.55rem] min-w-0 place-items-center overflow-hidden px-1 py-3 text-center transition hover:bg-white/45"
            >
              <span
                className="flex h-10 w-10 items-center justify-center transition duration-300 group-hover:-translate-y-0.5"
                style={{ color: action.tone }}
              >
                <Icon className={`${action.iconClass} stroke-[1.38]`} />
              </span>
              <p className="mt-2 max-w-full truncate text-[8.5px] font-black uppercase leading-tight tracking-[0.13em] text-[#2D2D2D]">
                {action.label}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function HighlightGrid({ snapshot, design }: { snapshot: TripSnapshot; design: DesignTokens }) {
  const picks = [
    { day: 5, city: "Ortigia", region: "Sicily", image: homePhotos.ortigia },
    { day: 7, city: "Valletta", region: "Malta", image: homePhotos.valletta },
    { day: 10, city: "Agrigento", region: "Sicily", image: homePhotos.agrigento }
  ];

  return (
    <section className="mx-5 pt-7 sm:mx-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#B98045]">Places to inspire</p>
          <h2 className="mt-3 font-serif text-[2rem] font-semibold leading-tight tracking-normal text-[#2D2D2D]">Timeless places, your way.</h2>
        </div>
        <Link href={`/trips/${snapshot.trip.id}`} className="mb-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D4A373] text-[#B98045] transition hover:-translate-y-0.5" aria-label="Open trip places">
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
      <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-10 sm:px-10 [&::-webkit-scrollbar]:hidden">
        {picks.map((day) => (
          <Link key={day.day} href={`/trips/${snapshot.trip.id}/day/${day.day}`} className="group w-[10.8rem] shrink-0 overflow-hidden sm:w-[12.25rem]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-white shadow-[0_12px_26px_rgba(45,45,45,0.08)]">
              <img src={day.image} alt={day.city} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
            </div>
            <div className="pt-3">
              <p className="truncate font-serif text-xl font-semibold leading-tight text-[#2D2D2D]">{day.city}</p>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#B98045]">
                <MapPin className="h-3 w-3" />
                {day.region}
              </p>
            </div>
          </Link>
        ))}
      </div>
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
    <section className="mt-2 sm:mt-0">
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

function WeatherSection({ snapshot, design }: { snapshot: TripSnapshot; design: DesignTokens }) {
  return (
    <section className="px-5 sm:px-10">
      <div className="border-t border-[#E6DAC8] pt-5" />
      <WeatherTimeline trip={snapshot.trip} activeDay={snapshot.focusItem.day} design={design} />
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
  if (!mainSnapshot || trips.length === 0) {
    return <div className="flex min-h-[50vh] items-center justify-center text-neutral-500">진행 중인 여행이 없습니다.</div>;
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden pb-10 ${design.font} ${design.page}`}>
      <main className="mx-auto grid w-full max-w-full grid-cols-[minmax(0,1fr)] gap-6 overflow-hidden pb-8 sm:max-w-xl">
        <MainTripHero snapshot={mainSnapshot} />
        <QuickActions snapshot={mainSnapshot} design={design} />
        <WeatherSection snapshot={mainSnapshot} design={design} />
        <HighlightGrid snapshot={mainSnapshot} design={design} />
      </main>
    </div>
  );
}
