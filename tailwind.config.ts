import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: "#4a0e20",
          light: "#6b1830",
          deep: "#320818",
          dark: "#22040e",
        },
        cream: "#f3e9dc",
        gold: {
          DEFAULT: "#d3a94f",
          light: "#e9cf9a",
          pale: "#f6e7c1",
        },
        emerald: {
          DEFAULT: "#0f3d2e",
          light: "#1e7a5e",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-cormorant)", "serif"],
        ui: ["var(--font-instrument)", "sans-serif"],
        script: ["var(--font-great-vibes)", "cursive"],
        arab: ["var(--font-amiri)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
