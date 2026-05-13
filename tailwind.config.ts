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
        ink: "#2D2D2D",
        paper: "#F9F7F2",
        stone: "#E6DAC8",
        "stone-dark": "#8A8174",
        moss: "#6B6861",
        clay: "#D4A373",
        wine: "#6F1D1B",
        brass: "#D4A373",
        field: {
          surface: "#F9F7F2",
          ink: "#2D2D2D",
          forest: "#1A434E",
          teal: "#1A434E",
          "teal-soft": "#E7F0EE",
          brass: "#D4A373",
          line: "#E6DAC8",
          red: "#BA1A1A",
          porcelain: "#FFFFFF",
          mist: "#EFE8DB"
        }
      },
      boxShadow: {
        editorial: "0 24px 70px rgba(45, 45, 45, 0.13)"
      }
    }
  },
  plugins: []
};

export default config;
