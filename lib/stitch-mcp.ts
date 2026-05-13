import fs from "node:fs";
import path from "node:path";
import type { PrintGuideDesign } from "./print-guide-design";
import type { TravelPayload, Trip, AppDesignConfig } from "./types";

type JsonRpcResponse = {
  result?: {
    content?: Array<{ text?: string }>;
  };
};

type StitchRuntimeConfig = {
  endpoint: string;
  apiKey: string;
  toolName: string;
};

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || fallback;
}

function readStitchConfigFromMcpJson(): Pick<StitchRuntimeConfig, "endpoint" | "apiKey"> | null {
  const candidates = [
    path.resolve(process.cwd(), ".vscode", "mcp.json"),
    path.resolve(process.cwd(), "..", ".vscode", "mcp.json")
  ];

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, "utf8");
      const config = JSON.parse(raw) as {
        servers?: {
          stitch?: {
            url?: string;
            headers?: Record<string, string>;
          };
        };
      };
      const stitch = config.servers?.stitch;
      const apiKey = stitch?.headers?.["X-Goog-Api-Key"];
      if (stitch?.url && apiKey) {
        return {
          endpoint: stitch.url,
          apiKey
        };
      }
    } catch (error) {
      console.error("[Stitch MCP] Could not read mcp.json config:", error);
    }
  }

  return null;
}

function getStitchRuntimeConfig(): StitchRuntimeConfig | null {
  const mcpJsonConfig = readStitchConfigFromMcpJson();
  const endpoint = process.env.STITCH_MCP_URL || mcpJsonConfig?.endpoint || "https://stitch.googleapis.com/mcp";
  const apiKey = process.env.STITCH_MCP_API_KEY || mcpJsonConfig?.apiKey;
  const toolName = process.env.STITCH_TRAVEL_TOOL ?? "travel_context";

  if (!endpoint || !apiKey) {
    console.error("[Stitch MCP] API Key is missing");
    return null;
  }

  return { endpoint, apiKey, toolName };
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

function cleanJsonText(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
}

function normalizePrintGuideDesign(value: unknown): PrintGuideDesign | null {
  if (!value || typeof value !== "object") return null;
  const maybe = value as Partial<PrintGuideDesign>;

  return {
    source: "stitch-mcp",
    title: typeof maybe.title === "string" ? maybe.title : "Boutique Travel Guidebook",
    subtitle: typeof maybe.subtitle === "string" ? maybe.subtitle : "A polished offline companion for the whole journey",
    themeColor: typeof maybe.themeColor === "string" ? maybe.themeColor : "#0F766E",
    accentColor: typeof maybe.accentColor === "string" ? maybe.accentColor : "#D96C4A",
    inkColor: typeof maybe.inkColor === "string" ? maybe.inkColor : "#17201D",
    mutedColor: typeof maybe.mutedColor === "string" ? maybe.mutedColor : "#66716D",
    layoutDensity: maybe.layoutDensity === "compact" || maybe.layoutDensity === "expanded" ? maybe.layoutDensity : "balanced",
    coverLabel: typeof maybe.coverLabel === "string" ? maybe.coverLabel : "Boutique Travel Guidebook",
    sectionLabels: {
      flights: maybe.sectionLabels?.flights ?? "Travel Essentials",
      schedule: maybe.sectionLabels?.schedule ?? "Journey Planner",
      stays: maybe.sectionLabels?.stays ?? "Stay Guide",
      daily: maybe.sectionLabels?.daily ?? "Daily Guide"
    },
    designNote: typeof maybe.designNote === "string" ? maybe.designNote : "Designed by Stitch MCP for field-ready PDF reading."
  };
}

function normalizePrintGuideDesignFromProject(value: unknown): PrintGuideDesign | null {
  if (!value || typeof value !== "object") return null;
  const project = value as {
    title?: string;
    designTheme?: {
      customColor?: string;
      namedColors?: Record<string, string>;
      designMd?: string;
    };
  };
  const colors = project.designTheme?.namedColors ?? {};

  return {
    source: "stitch-mcp",
    title: project.title ?? "Boutique Travel Guidebook",
    subtitle: "A polished offline companion with maps, imagery, daily plans, and field notes",
    themeColor: colors.primary ?? project.designTheme?.customColor ?? "#006565",
    accentColor: colors.secondary_container ?? "#fe7e4f",
    inkColor: colors.on_surface ?? "#1a1c1c",
    mutedColor: colors.on_surface_variant ?? "#3e4949",
    layoutDensity: "compact",
    coverLabel: "Boutique Travel Guidebook",
    sectionLabels: {
      flights: "Travel Essentials",
      schedule: "Journey Planner",
      stays: "Stay Guide",
      daily: "Daily Guide"
    },
    designNote: "Stitch MCP design system: Mediterranean Field Manual, A4 20mm margins, pragmatic editorial layout, maps and images included."
  };
}

function normalizePrintGuideDesignFromDesignSystem(value: unknown): PrintGuideDesign | null {
  if (!value || typeof value !== "object") return null;
  const maybe = value as {
    name?: string;
    designSystem?: {
      displayName?: string;
      styleGuidelines?: string;
      theme?: {
        customColor?: string;
        namedColors?: Record<string, string>;
      };
    };
  };
  const designSystem = maybe.designSystem;
  const colors = designSystem?.theme?.namedColors ?? {};
  if (!designSystem) return null;

  return {
    source: "stitch-mcp",
    title: designSystem.displayName ?? "Boutique Travel Guidebook",
    subtitle: "Polished offline travel guidebook with maps, destination imagery, daily plans, and field notes",
    themeColor: colors.primary ?? designSystem.theme?.customColor ?? "#00464f",
    accentColor: colors.tertiary_container ?? colors.secondary_container ?? "#c98a4a",
    inkColor: colors.on_surface ?? "#1b1c1c",
    mutedColor: colors.on_surface_variant ?? "#3f484a",
    layoutDensity: "balanced",
    coverLabel: "Boutique Travel Guidebook",
    sectionLabels: {
      flights: "Travel Essentials",
      schedule: "Journey Planner",
      stays: "Stay Guide",
      daily: "Daily Guide"
    },
    designNote:
      designSystem.styleGuidelines?.split("\n").find((line) => line.trim().length > 40)?.trim() ??
      "Stitch MCP premium travel guidebook design system."
  };
}

export async function fetchTravelPayloadFromStitch(): Promise<TravelPayload | null> {
  const config = getStitchRuntimeConfig();
  if (!config) {
    return null;
  }

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Goog-Api-Key": config.apiKey
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "travel-home-context",
        method: "tools/call",
        params: {
          name: config.toolName,
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

    // AI 응답에 마크다운 블록이 포함될 경우 제거
    return normalizeTravelPayload(JSON.parse(cleanJsonText(text)));
  } catch (error) {
    console.error("[Stitch MCP] Exception:", error);
    return null;
  }
}

export async function fetchPrintGuideDesignFromStitch(payload: TravelPayload): Promise<PrintGuideDesign | null> {
  const config = getStitchRuntimeConfig();
  if (!config) {
    return null;
  }
  const projectId = process.env.STITCH_PRINT_PROJECT_ID ?? "10266002859224487694";

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Goog-Api-Key": config.apiKey
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "print-guidebook-design",
        method: "tools/call",
        params: {
          name: "list_design_systems",
          arguments: {
            projectId
          }
        }
      }),
      cache: "no-store"
    });

    if (!response.ok) return null;

    const json = (await response.json()) as JsonRpcResponse;
    const text = json.result?.content?.find((item) => item.text)?.text;
    if (!text) return null;

    const parsed = JSON.parse(cleanJsonText(text)) as { designSystems?: unknown[] };
    const latestDesignSystem = parsed.designSystems?.[0];
    return normalizePrintGuideDesignFromDesignSystem(latestDesignSystem);
  } catch (error) {
    console.error("[Stitch MCP] Print design exception:", error);
    return null;
  }
}
