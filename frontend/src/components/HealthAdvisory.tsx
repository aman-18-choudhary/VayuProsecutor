import React from "react";
import { motion } from "framer-motion";
import type { Advisory, Severity } from "../lib/types";
import { severityColor, severityLabel } from "../lib/aqi";
import { MotionCard, Skeleton, SectionTitle } from "./ui";

/* ── Severity icon ─────────────────────────────────────── */
function SeverityIcon({ sev }: { sev: Severity }) {
  const icons: Record<Severity, string> = {
    good:          "✅",
    moderate:      "🟡",
    usg:           "🟠",
    unhealthy:     "🔴",
    veryUnhealthy: "🟣",
    hazardous:     "☣️",
  };
  return <span className="text-2xl">{icons[sev]}</span>;
}

/* ── Vulnerable group pills ─────────────────────────────── */
const VULNERABLE_GROUPS = [
  { emoji: "👶", label: "Children",        color: "#3B82F6" },
  { emoji: "🧓", label: "Elderly",         color: "#8B5CF6" },
  { emoji: "🤰", label: "Pregnant",        color: "#EC4899" },
  { emoji: "🫁", label: "Asthma Patients", color: "#F59E0B" },
  { emoji: "👷", label: "Outdoor Workers", color: "#6366F1" },
];

/* ── Main component ─────────────────────────────────────── */
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
      <MotionCard delay={0.3}>
        <SectionTitle>Health Advisory</SectionTitle>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-24" />
            ))}
          </div>
        </div>
      </MotionCard>
    );
  }

  const color = severityColor(severity);

  return (
    <MotionCard delay={0.3} className="overflow-hidden !p-0">
      {/* Colored top accent strip */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <SeverityIcon sev={severity} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-secondary">
                Health Advisory
              </p>
              <h3
                className="font-display text-xl font-extrabold"
                style={{ color }}
              >
                {severityLabel(severity)}
              </h3>
            </div>
          </div>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-mono text-lg font-extrabold text-white"
            style={{ backgroundColor: color }}
          >
            {aqi}
          </div>
        </div>

        {/* Advisory text — English + Hindi */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: `${color}08` }}
          >
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              🇬🇧 English
            </p>
            <p className="text-sm leading-relaxed text-text-primary">{advisory.en}</p>
          </div>
          <div className="rounded-xl bg-bg-muted p-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              🇮🇳 हिंदी
            </p>
            <p className="text-sm leading-relaxed text-text-primary">{advisory.hi}</p>
          </div>
        </div>

        {/* Vulnerable groups */}
        <div className="mt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Most at Risk
          </p>
          <div className="flex flex-wrap gap-2">
            {VULNERABLE_GROUPS.map((g, i) => (
              <motion.span
                key={g.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 + 0.2, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-primary shadow-sm"
              >
                <span>{g.emoji}</span>
                <span>{g.label}</span>
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </MotionCard>
  );
}
