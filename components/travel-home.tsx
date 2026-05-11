import Link from "next/link";
import type { AppDesignConfig, AppStructureConfig, ItineraryDay, TravelPayload, Trip } from "@/lib/types";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CloudSun,
  Compass,
  Hotel,
  Luggage,
  Map,
  MapPin,
  Navigation2,
  Route
} from "lucide-react";
import { AppNavigation } from "./app-navigation";
import { GuideImage } from "./guide-image";

type DesignTokens = {
  accent: string;
  coral: string;
  page: string;
  surface: string;
  subtle: string;
  ink: string;
  muted: string;
  border: string;
  shadow: string;
  font: string;
};

function getDesign(uiConfig?: AppDesignConfig): DesignTokens {
  const isDark = uiConfig?.colorScheme === "dark";
  const elevated = uiConfig?.cardDesign?.cardStyle === "elevated";

  return {
    accent: uiConfig?.themeColor || "#0E7C7B",
    coral: "#D96C4A",
    page: isDark ? "bg-neutral-950 text-white" : "bg-[#F7F4EE] text-[#17201D]",
    surface: isDark ? "bg-neutral-900" : "bg-white",
    subtle: isDark ? "bg-white/5" : "bg-[#ECE7DD]",
    ink: isDark ? "text-white" : "text-[#17201D]",
    muted: isDark ? "text-neutral-300" : "text-[#6F746F]",
    border: isDark ? "border-white/10" : "border-black/10",
    shadow: elevated ? "shadow-[0_18px_45px_rgba(31,36,33,0.10)]" : "shadow-none",
    font:
      uiConfig?.typographyStyle === "serif" || uiConfig?.typographyStyle === "elegant"
        ? "font-serif"
        : "font-sans"
  };
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNextDay(trip: Trip): ItineraryDay {
  const today = new Date();
  return trip.itinerary.find((day) => new Date(day.date) >= today) ?? trip.itinerary[0];
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
    <header className={`sticky top-0 z-40 border-b ${design.border} bg-[#F7F4EE]/92 backdrop-blur-xl`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
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

function HeroPanel({ trip, design }: { trip: Trip; design: DesignTokens }) {
  const nextDay = getNextDay(trip);
  const titleParts = splitHeroTitle(trip.title);

  return (
    <section className="grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <Link href={`/trips/${trip.id}`} className={`group relative min-h-[16rem] w-full min-w-0 overflow-hidden rounded-lg sm:min-h-[29rem] ${design.shadow}`}>
        <GuideImage
          src={trip.heroImage}
          alt={trip.title}
          className="absolute inset-0 h-full w-full"
          imageClassName="transition duration-700 group-hover:scale-[1.025]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/5" />
        <div className="absolute left-3 right-3 top-3 flex min-w-0 items-center gap-2 sm:left-4 sm:right-4 sm:top-4">
          <span className="shrink-0 rounded-md bg-white/92 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-normal text-neutral-900 backdrop-blur sm:px-3 sm:text-xs">
            {trip.status}
          </span>
          <span className="ml-auto hidden min-w-0 max-w-xs truncate rounded-md bg-black/45 px-3 py-1.5 text-xs font-bold text-white backdrop-blur sm:block">{countryLabel(trip)}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 min-w-0 p-4 text-white sm:p-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70 sm:mb-3 sm:text-xs">Curated guide</p>
          <h1 className="max-w-full text-[2rem] font-black leading-[1.05] tracking-normal sm:max-w-4xl sm:text-6xl">
            <span className="block break-words [overflow-wrap:anywhere]">{titleParts.name}</span>
            {titleParts.meta && (
              <span className="mt-0.5 block break-words text-[1.75rem] [overflow-wrap:anywhere] sm:text-5xl">
                {titleParts.meta}
              </span>
            )}
          </h1>
          <p className="mt-2 line-clamp-2 w-full max-w-full min-w-0 break-words text-sm font-semibold leading-relaxed text-white/82 [overflow-wrap:anywhere] sm:mt-4 sm:max-w-2xl sm:text-base">{trip.subtitle}</p>
        </div>
      </Link>

      <aside className={`grid w-full min-w-0 max-w-full content-between rounded-lg border ${design.border} ${design.surface} p-3.5 sm:p-5 ${design.shadow}`}>
        <div className="min-w-0">
          <div className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
            <div className="min-w-0">
              <p className={`text-[11px] font-extrabold uppercase tracking-[0.14em] sm:text-xs ${design.muted}`}>Next stop</p>
              <h2 className="mt-1.5 break-words text-2xl font-black tracking-normal [overflow-wrap:anywhere] sm:mt-2 sm:text-3xl">{nextDay.city}</h2>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white sm:h-11 sm:w-11" style={{ backgroundColor: design.coral }}>
              <Navigation2 className="h-5 w-5" />
            </span>
          </div>
          <p className={`line-clamp-2 w-full max-w-full min-w-0 break-words text-sm font-semibold leading-relaxed [overflow-wrap:anywhere] sm:line-clamp-3 ${design.muted}`}>{trip.routeSummary}</p>
        </div>

        <div className="mt-3 min-w-0 sm:mt-6">
          <div className={`mb-2.5 min-w-0 rounded-md ${design.subtle} p-2.5 sm:mb-4 sm:p-4`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-extrabold" style={{ color: design.accent }}>Day {nextDay.day}</span>
              <span className={`text-xs font-bold ${design.muted}`}>{formatDateLabel(nextDay.date)}</span>
            </div>
            <h3 className="break-words text-base font-black tracking-normal [overflow-wrap:anywhere]">{nextDay.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {nextDay.highlights.slice(0, 3).map((highlight) => (
                <span key={highlight} className="max-w-full whitespace-normal rounded-md bg-white px-2.5 py-1 text-[11px] font-bold leading-tight text-neutral-600 [overflow-wrap:anywhere]">
                  {highlight}
                </span>
              ))}
            </div>
          </div>
          <div className="grid w-full min-w-0 grid-cols-3 gap-2">
            <Link href={`/trips/${trip.id}`} className="inline-flex min-h-11 w-full min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-md px-3 py-2 text-xs font-extrabold text-white sm:min-h-12 sm:py-2.5 sm:text-sm" style={{ backgroundColor: design.accent }}>
              <span className="min-w-0 truncate">Overview</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
            <Link href={`/trips/${trip.id}/day/${nextDay.day}`} className={`inline-flex min-h-11 w-full min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-md border px-3 py-2 text-xs font-extrabold sm:min-h-12 sm:py-2.5 sm:text-sm ${design.border}`}>
              <span className="min-w-0 truncate sm:hidden">Day</span>
              <span className="hidden min-w-0 truncate sm:inline">Day plan</span>
              <CalendarDays className="h-4 w-4 shrink-0" />
            </Link>
            <Link href={`/trips/${trip.id}/stays`} className={`inline-flex min-h-11 w-full min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-md border px-3 py-2 text-xs font-extrabold sm:min-h-12 sm:py-2.5 sm:text-sm ${design.border}`}>
              <span className="min-w-0 truncate">Stays</span>
              <Hotel className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </div>
      </aside>
    </section>
  );
}

function MetricsBand({ payload, design }: { payload: TravelPayload; design: DesignTokens }) {
  const trip = payload.trip;
  const nextDay = getNextDay(trip);
  const items = [
    { label: "Days", mobileLabel: "Days", value: trip.itinerary.length, icon: CalendarDays },
    { label: "Countries", mobileLabel: "Nations", value: trip.countries.length, icon: Map },
    { label: "Next temp", mobileLabel: "Temp", value: `${nextDay.weather.tempC}°`, icon: CloudSun },
    { label: "Guides", mobileLabel: "Guides", value: payload.recommendations.length, icon: Luggage }
  ];

  return (
    <section className="grid min-w-0 grid-cols-4 gap-1.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={`min-w-0 rounded-lg border ${design.border} ${index === 2 ? "text-white" : `${design.surface} ${design.ink}`} p-2.5 sm:p-4 ${design.shadow}`} style={index === 2 ? { backgroundColor: design.accent } : undefined}>
            <div className="mb-1.5 flex items-center justify-between gap-1 sm:mb-5">
              <span className={`min-w-0 truncate text-[9px] font-extrabold uppercase tracking-normal sm:hidden ${index === 2 ? "text-white/72" : design.muted}`}>{item.mobileLabel}</span>
              <span className={`hidden min-w-0 truncate text-xs font-extrabold uppercase tracking-[0.14em] sm:inline ${index === 2 ? "text-white/72" : design.muted}`}>{item.label}</span>
              <Icon className="hidden h-3.5 w-3.5 shrink-0 sm:block sm:h-4 sm:w-4" />
            </div>
            <div className="text-lg font-black tracking-normal sm:text-3xl">{item.value}</div>
          </div>
        );
      })}
    </section>
  );
}

function TimelineRail({ trip, design }: { trip: Trip; design: DesignTokens }) {
  return (
    <section id="trip-library">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className={`text-xs font-extrabold uppercase tracking-[0.16em] ${design.muted}`}>Route rhythm</p>
          <h2 className="mt-1 text-2xl font-black tracking-normal">Itinerary timeline</h2>
        </div>
        <Link href={`/trips/${trip.id}`} className="hidden items-center gap-1 text-sm font-extrabold sm:inline-flex" style={{ color: design.accent }}>
          Full route
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {trip.itinerary.slice(0, 12).map((day, index) => (
          <Link key={day.day} href={`/trips/${trip.id}/day/${day.day}`} className={`group min-w-[12rem] snap-start overflow-hidden rounded-lg border ${design.border} ${design.surface} ${design.shadow}`}>
            <div className="relative h-28 overflow-hidden">
              <GuideImage
                src={day.image}
                alt={day.title}
                className="h-full w-full"
                imageClassName="transition duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute left-3 top-3 rounded-md bg-white/92 px-2.5 py-1 text-[11px] font-extrabold text-neutral-900">
                {index + 1}
              </div>
            </div>
            <div className="p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-extrabold" style={{ color: design.accent }}>Day {day.day}</span>
                <span className={`text-[11px] font-bold ${design.muted}`}>{formatDateLabel(day.date)}</span>
              </div>
              <h3 className="line-clamp-1 text-sm font-black tracking-normal">{day.city}</h3>
              <p className={`mt-1 line-clamp-2 text-xs font-semibold leading-relaxed ${design.muted}`}>{day.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecommendationGrid({ payload, design }: { payload: TravelPayload; design: DesignTokens }) {
  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <p className={`text-xs font-extrabold uppercase tracking-[0.16em] ${design.muted}`}>Field notes</p>
        <h2 className="mt-1 text-2xl font-black tracking-normal">Curated stops</h2>
        <p className={`mt-3 max-w-md text-sm font-semibold leading-relaxed ${design.muted}`}>
          일정 중 놓치기 쉬운 전망, 느린 정차, 이동 사이의 짧은 회복 지점을 따로 모았습니다.
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
        {payload.recommendations.slice(0, 3).map((item) => (
          <div key={item.id} className={`min-w-0 rounded-lg border ${design.border} ${design.surface} p-4 ${design.shadow}`}>
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md text-white" style={{ backgroundColor: design.coral }}>
              <MapPin className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-black leading-snug tracking-normal">{item.title}</h3>
            <p className={`mt-3 text-xs font-bold ${design.muted}`}>{item.city} / {item.category}</p>
            <p className="mt-1 text-xs font-extrabold" style={{ color: design.accent }}>{item.distanceKm}km nearby</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TripLibrary({ trips, mainTrip, design }: { trips: Trip[]; mainTrip: Trip; design: DesignTokens }) {
  const otherTrips = trips.filter((trip) => trip.id !== mainTrip.id);
  if (!otherTrips.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className={`text-xs font-extrabold uppercase tracking-[0.16em] ${design.muted}`}>Guide library</p>
          <h2 className="mt-1 text-2xl font-black tracking-normal">Other journeys</h2>
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        {otherTrips.map((trip) => (
          <Link key={trip.id} href={`/trips/${trip.id}`} className={`group grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden rounded-lg border ${design.border} ${design.surface} ${design.shadow} sm:grid-cols-[12rem_1fr]`}>
            <GuideImage
              src={trip.heroImage}
              alt={trip.title}
              className="min-h-44"
              imageClassName="transition duration-500 group-hover:scale-[1.04]"
            />
            <div className="flex flex-col justify-between p-4">
              <div>
                <p className={`text-xs font-bold ${design.muted}`}>{trip.dateRange}</p>
                <h3 className="mt-2 text-lg font-black leading-tight tracking-normal">{trip.title}</h3>
                <p className={`mt-2 line-clamp-2 text-sm font-semibold leading-relaxed ${design.muted}`}>{trip.routeSummary}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold" style={{ color: design.accent }}>
                  <Route className="h-3.5 w-3.5" />
                  {countryLabel(trip)}
                </span>
                <ChevronRight className={`h-4 w-4 ${design.muted}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TravelHome({ payload }: { payload: TravelPayload }) {
  const design = getDesign(payload.uiConfig);
  const trips = payload.trips?.length ? payload.trips : [payload.trip];
  const mainTrip = payload.trip ?? trips[0];
  const homeNavigation: AppStructureConfig = {
    navigationType: "bottom-tab",
    tabs: [
      { id: "home", label: "Home", iconType: "home" },
      { id: "overview", label: "Overview", iconType: "overview" },
      { id: "daily", label: "Daily", iconType: "calendar" },
      { id: "stays", label: "Stays", iconType: "hotel" }
    ]
  };

  if (!mainTrip || trips.length === 0) {
    return <div className="flex min-h-[50vh] items-center justify-center text-neutral-500">진행 중인 여행이 없습니다.</div>;
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden pb-28 ${design.font} ${design.page}`}>
      <AppHeader trip={mainTrip} design={design} />
      <main className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)] gap-5 px-3 py-4 sm:gap-6 sm:px-6 sm:py-5">
        <HeroPanel trip={mainTrip} design={design} />
        <MetricsBand payload={payload} design={design} />
        <TimelineRail trip={mainTrip} design={design} />
        <RecommendationGrid payload={payload} design={design} />
        <TripLibrary trips={trips} mainTrip={mainTrip} design={design} />
      </main>
      <AppNavigation appStructure={homeNavigation} themeColor={design.accent} tripIdOverride={mainTrip.id} />
    </div>
  );
}
