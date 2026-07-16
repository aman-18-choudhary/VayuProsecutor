import { Severity } from "./types";

export function getSeverity(aqi: number): Severity {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "usg";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "veryUnhealthy";
  return "hazardous";
}

export function severityColor(sev: Severity): string {
  switch (sev) {
    case "good":
      return "#22c55e";
    case "moderate":
      return "#eab308";
    case "usg":
      return "#f97316";
    case "unhealthy":
      return "#C0392B";
    case "veryUnhealthy":
      return "#a855f7";
    case "hazardous":
      return "#7f1d1d";
  }
}

export function severityLabel(sev: Severity): string {
  switch (sev) {
    case "good":
      return "Good";
    case "moderate":
      return "Moderate";
    case "usg":
      return "Unhealthy for Sensitive Groups";
    case "unhealthy":
      return "Unhealthy";
    case "veryUnhealthy":
      return "Very Unhealthy";
    case "hazardous":
      return "Hazardous";
  }
}

export function severityGlow(sev: Severity): string {
  const color = severityColor(sev);
  return `0 0 24px ${hexToRgba(color, 0.5)}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
