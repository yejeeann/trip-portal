import type { TravelPayload, Trip, AppDesignConfig } from "./types";

type JsonRpcResponse = {
  result?: {
    content?: Array<{ text?: string }>;
  };
};

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || fallback;
}

function normalizeTrip(value: unknown, index: number): Trip | null {
  if (!value || typeof value !== "object") return null;
  const trip = value as Partial<Trip>;
  if (!trip.title || !Array.isArray(trip.itinerary)) return null;

  return {
    ...trip,
    id: typeof trip.id === "string" ? trip.id : slugify(trip.title, `trip-${index + 1}`),
    title: trip.title,
    subtitle: trip.subtitle ?? "",
    dateRange: trip.dateRange ?? "",
    status: trip.status ?? "draft",
    heroImage: trip.heroImage ?? trip.itinerary[0]?.image ?? "",
    countries: Array.isArray(trip.countries) ? trip.countries : [],
    routeSummary: trip.routeSummary ?? "",
    itinerary: trip.itinerary
  };
}

function normalizeTravelPayload(value: unknown): TravelPayload | null {
  if (!value || typeof value !== "object") return null;
  const maybe = value as Partial<TravelPayload>;
  const primaryTrip = normalizeTrip(maybe.trip, 0);
  if (!primaryTrip) return null;
  const trips = Array.isArray(maybe.trips)
    ? maybe.trips.map((trip, index) => normalizeTrip(trip, index)).filter((trip): trip is Trip => Boolean(trip))
    : [primaryTrip];

  return {
    source: "stitch-mcp",
    updatedAt: typeof maybe.updatedAt === "string" ? maybe.updatedAt : new Date().toISOString(),
    trip: primaryTrip,
    trips: trips.length ? trips : [primaryTrip],
    recommendations: Array.isArray(maybe.recommendations) ? maybe.recommendations : [],
    uiConfig: maybe.uiConfig as AppDesignConfig | undefined,
    appStructure: maybe.appStructure
  };
}

export async function fetchTravelPayloadFromStitch(): Promise<TravelPayload | null> {
  const endpoint = process.env.STITCH_MCP_URL || "https://stitch.googleapis.com/mcp";
  const apiKey = process.env.STITCH_MCP_API_KEY;
  const toolName = process.env.STITCH_TRAVEL_TOOL ?? "travel_context";

  if (!endpoint || !apiKey) {
    console.error("[Stitch MCP] API Key is missing");
    return null;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "travel-home-context",
      method: "tools/call",
      params: {
        name: toolName,
        arguments: {
          view: "home",
          include: ["trips", "itinerary", "weather", "nearbyRecommendations", "coordinates"],
          outputShape: `
            TravelPayload JSON with trips[] and a primary trip object.
            Each trip must include: id, title, heroImage, dateRange, countries, routeSummary, and a detailed itinerary.
            Crucially, design a UI for a trendy and clean travel app, providing a detailed 'uiConfig' object.
            - For 'uiConfig', define:
              - 'themeColor': A fresh, inviting accent color like '#007bff' (a vibrant blue) or '#28a745' (a fresh green).
              - 'colorScheme': 'light' for a bright and airy feel.
              - 'typographyStyle': 'modern-sans' for a clean, readable, and contemporary look.
              - 'homeStyle': 'minimal-list' or 'magazine' for a content-focused and elegant presentation.
              - 'cardDesign': {
                  'cardStyle': 'elevated' with subtle shadows for depth,
                  'borderRadius': 'lg' for soft, modern corners,
                  'imageOverlay': 'dark-gradient' for better text readability over images,
                  'shadowIntensity': 'soft' for a gentle lift,
                  'hoverEffect': 'lift' for a subtle interactive feel.
              }
            - Additionally, include an 'animation' object within 'uiConfig' to specify:
                - 'transitionEffect': 'fade' for smooth transitions.
                - 'transitionSpeed': 'normal' for a balanced user experience.
            - Finally, define an 'appStructure' with 'navigationType': 'bottom-tab' and a curated array of 'tabs' that are intuitive and user-friendly, including relevant icons (e.g., 'home', 'compass', 'map', 'heart', 'user').
            The overall goal is to create a user-friendly, aesthetically pleasing, and modern travel app experience.
          `
        }
      }
    }),
    cache: "no-store" // 개발 중 캐시 방지: 항상 최신 AI 응답을 받도록 수정
  });

  if (!response.ok) return null;

  const json = (await response.json()) as JsonRpcResponse;
  const text = json.result?.content?.find((item) => item.text)?.text;
  if (!text) {
    console.error("[Stitch MCP] No text content found");
    return null;
  }

  try {
    // AI 응답에 마크다운 블록이 포함될 경우 제거
    const cleanedText = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return normalizeTravelPayload(JSON.parse(cleanedText));
  } catch (error) {
    console.error("[Stitch MCP] Exception:", error);
    return null;
  }
}
