/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Backgrounds
        "bg-base":   "#F8FAFC",
        "bg-card":   "#FFFFFF",
        "bg-muted":  "#F1F5F9",

        // Brand
        primary:    "#6366F1",
        "primary-dark": "#4F46E5",
        "primary-light": "#818CF8",
        secondary:  "#8B5CF6",
        accent:     "#3B82F6",

        // Status
        success:    "#22C55E",
        warning:    "#F59E0B",
        danger:     "#EF4444",
        "danger-dark": "#DC2626",

        // Text
        "text-primary":   "#111827",
        "text-secondary": "#6B7280",
        "text-muted":     "#9CA3AF",

        // Borders
        border:     "#E5E7EB",
        "border-strong": "#D1D5DB",

        // Legacy (kept for backwards compat with existing chart/map code)
        navy:           "#FFFFFF",
        "navy-light":   "#F8FAFC",
        "navy-card":    "#FFFFFF",
        crimson:        "#EF4444",
        "crimson-light":"#F87171",
        amber:          "#F59E0B",
        teal:           "#6366F1",
        "slate-line":   "#E5E7EB",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        display: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card:      "0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.04)",
        "card-xl": "0 12px 40px rgba(0,0,0,0.05)",
        glow:      "0 0 24px rgba(99,102,241,0.2)",
        "glow-primary": "0 0 32px rgba(99,102,241,0.25)",
        "glow-danger": "0 0 32px rgba(239,68,68,0.2)",
        "glow-success": "0 0 24px rgba(34,197,94,0.15)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
        "gradient-brand-r": "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)",
        "gradient-danger": "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
        "gradient-success": "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
        "gradient-card": "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)",
        "gradient-glass": "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 20px rgba(99,102,241,0.3)" },
          "50%":     { boxShadow: "0 0 40px rgba(99,102,241,0.7)" },
        },
        ripple: {
          "0%":   { transform: "scale(0.8)", opacity: "0.4" },
          "100%": { transform: "scale(2.8)", opacity: "0" },
        },
        slideInRight: {
          "0%":   { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        countUp: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-6px)" },
        },
        scanLine: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        shimmer:      "shimmer 1.8s ease-in-out infinite",
        fadeInUp:     "fadeInUp 0.5s ease-out",
        fadeIn:       "fadeIn 0.4s ease-out",
        scaleIn:      "scaleIn 0.4s ease-out",
        pulseGlow:    "pulseGlow 2.5s ease-in-out infinite",
        ripple:       "ripple 1.8s ease-out infinite",
        slideInRight: "slideInRight 0.4s ease-out",
        float:        "float 3s ease-in-out infinite",
        scanLine:     "scanLine 2s linear infinite",
      },
    },
  },
  plugins: [],
};
