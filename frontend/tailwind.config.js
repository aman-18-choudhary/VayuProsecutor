/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        navy: "#FFFFFF",
        "navy-light": "#F1F5F9",
        "navy-card": "#FFFFFF",
        crimson: "#C0392B",
        "crimson-light": "#E74C3C",
        amber: "#F39C12",
        teal: "#0891b2",
        "slate-line": "#E2E8F0",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 255, 0.25)",
        "glow-crimson": "0 0 24px rgba(192, 57, 43, 0.45)",
        "glow-amber": "0 0 20px rgba(243, 156, 18, 0.35)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(192,57,43,0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(192,57,43,0.8)" },
        },
        ripple: {
          "0%": { transform: "scale(0.8)", opacity: "0.6" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        ripple: "ripple 1.5s ease-out infinite",
      },
    },
  },
  plugins: [],
};
