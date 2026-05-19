/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      fontFamily: {
        display: ["Outfit", "system-ui", "sans-serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bg: { DEFAULT: "#FAFAFA", dark: "#09090B" },
        surface: { DEFAULT: "#FFFFFF", dark: "#18181B" },
        primary: { DEFAULT: "#FF6B6B", fg: "#FFFFFF" },
        secondary: { DEFAULT: "#0EA5E9", fg: "#FFFFFF" },
        accent: {
          yellow: "#FBBF24",
          green: "#10B981",
          flame: "#F97316",
          gem: "#3B82F6",
          gold: "#EAB308",
        },
        ink: { DEFAULT: "#0F172A", muted: "#64748B" },
        border: { DEFAULT: "#E2E8F0", dark: "#27272A" },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "blob": "blob 18s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        blob: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(30px,-40px) scale(1.1)" },
          "66%": { transform: "translate(-20px,20px) scale(0.95)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
