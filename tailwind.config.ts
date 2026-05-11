import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "ui-serif", "Georgia"],
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui"]
      },
      colors: {
        ink: "#171512",
        paper: "#F9F7F2",
        stone: "#D8D0C1",
        "stone-dark": "#8A8174",
        moss: "#5F6F5A",
        clay: "#A66346",
        wine: "#6F1D1B",
        brass: "#B08A45",
        field: {
          surface: "#FBF9F8",
          ink: "#051A17",
          forest: "#1A2F2B",
          teal: "#00696C",
          "teal-soft": "#D8F4F0",
          brass: "#B08A45",
          line: "#C2C8C5",
          red: "#BA1A1A",
          porcelain: "#FFFFFF",
          mist: "#EFEDEC"
        }
      },
      boxShadow: {
        editorial: "0 24px 70px rgba(34, 30, 25, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
