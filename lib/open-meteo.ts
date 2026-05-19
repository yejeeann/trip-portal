import type { ItineraryDay, TravelPayload, Trip, WeatherSnapshot } from "./types";

type OpenMeteoDailyResponse = {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
  };
};

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "맑음",
  1: "대체로 맑음",
  2: "부분 흐림",
  3: "흐림",
  45: "안개",
  48: "서리 안개",
  51: "약한 이슬비",
  53: "이슬비",
  55: "강한 이슬비",
  56: "어는 이슬비",
  57: "강한 어는 이슬비",
  61: "약한 비",
  63: "비",
  65: "강한 비",
  66: "어는 비",
  67: "강한 어는 비",
  71: "약한 눈",
  73: "눈",
  75: "강한 눈",
  77: "싸락눈",
  80: "약한 소나기",
  81: "소나기",
  82: "강한 소나기",
  85: "약한 눈소나기",
  86: "강한 눈소나기",
  95: "뇌우",
  96: "우박 동반 뇌우",
  99: "강한 우박 뇌우"
};

function roundTemp(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
}

function meanTemp(highC: number, lowC: number) {
  return Math.round((highC + lowC) / 2);
}

function weatherCondition(code: number | undefined) {
  if (typeof code !== "number") return "예보";
  return WEATHER_CODE_LABELS[code] ?? "예보";
}

function buildForecastUrl(day: ItineraryDay) {
  const params = new URLSearchParams({
    latitude: String(day.coordinates.lat),
    longitude: String(day.coordinates.lng),
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: "16"
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

async function fetchForecastForDay(day: ItineraryDay): Promise<WeatherSnapshot | null> {
  try {
    const response = await fetch(buildForecastUrl(day), {
      next: { revalidate: 60 * 60 }
    });

    if (!response.ok) return null;

    const data = (await response.json()) as OpenMeteoDailyResponse;
    const times = data.daily?.time ?? [];
    const index = times.indexOf(day.date);
    if (index < 0) return null;

    const highC = roundTemp(data.daily?.temperature_2m_max?.[index]);
    const lowC = roundTemp(data.daily?.temperature_2m_min?.[index]);
    if (highC === null || lowC === null) return null;

    return {
      condition: weatherCondition(data.daily?.weather_code?.[index]),
      tempC: meanTemp(highC, lowC),
      highC,
      lowC,
      weatherCode: data.daily?.weather_code?.[index],
      source: "forecast",
      updatedAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

async function mergeWeatherIntoDay(day: ItineraryDay): Promise<ItineraryDay> {
  const forecast = await fetchForecastForDay(day);

  return {
    ...day,
    weather: forecast ?? {
      ...day.weather,
      condition: "예보 대기",
      source: "unavailable"
    }
  };
}

async function mergeWeatherIntoTrip(trip: Trip): Promise<Trip> {
  const itinerary = await Promise.all(trip.itinerary.map(mergeWeatherIntoDay));
  return { ...trip, itinerary };
}

export async function withOpenMeteoWeather(payload: TravelPayload): Promise<TravelPayload> {
  const trips = payload.trips?.length ? payload.trips : [payload.trip];
  const mergedTrips = await Promise.all(trips.map(mergeWeatherIntoTrip));
  const primaryTrip = mergedTrips.find((trip) => trip.id === payload.trip.id) ?? mergedTrips[0] ?? payload.trip;

  return {
    ...payload,
    updatedAt: new Date().toISOString(),
    trip: primaryTrip,
    trips: mergedTrips
  };
}
