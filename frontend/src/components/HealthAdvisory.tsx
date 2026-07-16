import { motion } from "framer-motion";
import type { Advisory, Severity } from "../lib/types";
import { severityColor, severityLabel } from "../lib/aqi";
import { Card, Skeleton, SectionTitle } from "./ui";

const VULNERABLE_GROUPS = [
  { emoji: "👶", label: "Children" },
  { emoji: "🧓", label: "Elderly" },
  { emoji: "🤰", label: "Pregnant" },
  { emoji: "👷", label: "Outdoor Workers" },
];

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function HealthAdvisory({
  advisory,
  severity,
  aqi,
  loading,
}: {
  advisory?: Advisory;
  severity: Severity;
  aqi: number;
  loading?: boolean;
}) {
  if (loading || !advisory) {
    return (
      <Card>
        <SectionTitle>⚠️ Health Advisory</SectionTitle>
        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </Card>
    );
  }

  const color = severityColor(severity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <Card className="!p-0">
        <div
          className="rounded-2xl border-l-4 p-5"
          style={{
            borderLeftColor: color,
            backgroundColor: hexToRgba(color, 0.08),
          }}
        >
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-xl" aria-hidden="true">
            ⚠️
          </span>
          <span className="text-sm font-bold uppercase tracking-wide text-slate-800">
            Health Advisory
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: hexToRgba(color, 0.2), color }}
          >
            {severityLabel(severity)}
          </span>
          <span
            className="rounded-full px-3 py-1 font-mono text-xs font-semibold text-white"
            style={{ backgroundColor: hexToRgba(color, 0.25) }}
          >
            AQI {aqi}
          </span>
        </div>

        {/* Body: two responsive columns */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              English
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{advisory.en}</p>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              हिंदी
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{advisory.hi}</p>
          </div>
        </div>

        {/* Vulnerable groups */}
        <div className="mt-4 flex flex-wrap gap-2">
          {VULNERABLE_GROUPS.map((group) => (
            <span
              key={group.label}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
            >
              <span aria-hidden="true">{group.emoji}</span>
              <span>{group.label}</span>
            </span>
          ))}
        </div>
        </div>
      </Card>
    </motion.div>
  );
}
