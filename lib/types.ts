export type Coordinates = {
  lat: number;
  lng: number;
};

export type WeatherSnapshot = {
  condition: string;
  tempC: number;
  highC: number;
  lowC: number;
  weatherCode?: number;
  source?: "forecast" | "estimate" | "unavailable";
  updatedAt?: string;
};

export type ItineraryDay = {
  day: number;
  date: string;
  city: string;
  country: string;
  title: string;
  image: string;
  coordinates: Coordinates;
  weather: WeatherSnapshot;
  highlights: string[];
  size?: "wide" | "tall" | "standard";
};

export type Recommendation = {
  id: string;
  title: string;
  city: string;
  category: string;
  distanceKm: number;
};

export type AppDesignConfig = {
  themeColor?: string;
  homeStyle?: "grid" | "magazine" | "carousel" | "list" | "asymmetric-grid";
  overviewLayout?: "timeline" | "map-centric";
  dailyViewStyle?: "stepper" | "cards";
  sightDetailMode?: "full-page" | "modal" | "bottom-sheet";
  colorScheme?: "light" | "dark";
  typographyStyle?: "sans" | "serif" | "elegant" | "modern" | "modern-sans";
  cardDesign?: {
    cardStyle?: "flat" | "elevated" | "glass";
    borderRadius?: "none" | "sm" | "md" | "lg" | "full";
    imageOverlay?: "none" | "dark-gradient" | "light-gradient" | "vignette";
    shadowIntensity?: "none" | "soft" | "medium" | "deep";
    hoverEffect?: "none" | "scale-up" | "lift";
  };
  animation?: {
    transitionEffect?: "none" | "fade";
    transitionSpeed?: "fast" | "normal" | "slow";
  };
};

export type AppRouteConfig = {
  path: string;
  name: string;
  layoutType: "full-screen" | "modal" | "bottom-sheet" | "nested";
  allowedTransitions?: string[];
};

export type AppStructureConfig = {
  navigationType: "bottom-tab" | "sidebar" | "minimal";
  tabs: { id: string; label: string; iconType: string }[];
  routingFlow?: AppRouteConfig[];
};

export type Trip = {
  id: string;
  title: string;
  subtitle: string;
  dateRange: string;
  status: "upcoming" | "active" | "draft";
  heroImage: string;
  countries: string[];
  routeSummary: string;
  itinerary: ItineraryDay[];
};

export type TravelPayload = {
  source: "stitch-mcp" | "fallback";
  updatedAt: string;
  trip: Trip;
  trips?: Trip[];
  recommendations: Recommendation[];
  uiConfig?: AppDesignConfig;
  appStructure?: AppStructureConfig;
};
