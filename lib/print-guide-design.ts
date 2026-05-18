export type PrintGuideDesign = {
  source: "stitch-mcp" | "fallback";
  title: string;
  subtitle: string;
  themeColor: string;
  accentColor: string;
  inkColor: string;
  mutedColor: string;
  layoutDensity: "compact" | "balanced" | "expanded";
  coverLabel: string;
  sectionLabels: {
    flights: string;
    schedule: string;
    stays: string;
    daily: string;
  };
  designNote: string;
};

export const staticPrintGuideDesign: PrintGuideDesign = {
  source: "stitch-mcp",
  title: "Sicily, Malta & Rome",
  subtitle: "A sunlit field guide to coastlines, ancient cities, slow roads, and practical travel days",
  themeColor: "#1A434E",
  accentColor: "#D4A373",
  inkColor: "#2D2D2D",
  mutedColor: "#6B6861",
  layoutDensity: "balanced",
  coverLabel: "Independent Travel Guide",
  sectionLabels: {
    flights: "Travel Essentials",
    schedule: "Travel Framework",
    stays: "Stay Guide",
    daily: "Daily Guide"
  },
  designNote: "Static print tokens aligned with the warm travel home theme: Playfair headings, Inter body type, dark teal, soft gold, warm paper, maps and images included."
};
