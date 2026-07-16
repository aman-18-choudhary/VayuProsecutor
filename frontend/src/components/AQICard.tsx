import React from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import type { Pollutant, Severity } from "../lib/types";
import { severityColor, severityLabel } from "../lib/aqi";
import { Card, MotionCard, Skeleton, Badge, SectionTitle } from "./ui";

/* ── Severity theme map ─────────────────────────────────── */
function sevBg(sev: Severity): string {
  switch (sev) {
    case "good":          return "rgba(34,197,94,0.08)";
    case "moderate":      return "rgba(245,158,11,0.08)";
    case "usg":           return "rgba(249,115,22,0.08)";
    case "unhealthy":     return "rgba(239,68,68,0.08)";
    case "veryUnhealthy": return "rgba(168,85,247,0.08)";
    case "hazardous":     return "rgba(127,29,29,0.08)";
  }
}

function sevBadgeVariant(sev: Severity) {
  switch (sev) {
    case "good":          return "success";
    case "moderate":      return "warning";
    case "usg":           return "warning";
    case "unhealthy":     return "danger";
    case "veryUnhealthy": return "danger";
    case "hazardous":     return "danger";
    default:              return "default";
  }
}

/* ── Tiny sparkline tooltip ─────────────────────────────── */
function SparkTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-white px-2 py-1 text-[10px] shadow-card">
      <span className="font-mono font-semibold">{payload[0]?.value?.toFixed(1)}</span>
    </div>
  );
}

/* ── Main AQI hero card ─────────────────────────────────── */
export function AQICard({
  aqi,
  severity,
  stationAqi,
  loading,
}: {
  aqi: number;
  severity: Severity;
  stationAqi: number | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
        <Skeleton className="mb-4 h-3 w-24" />
        <Skeleton className="mx-auto mb-3 h-16 w-28" />
        <Skeleton className="mx-auto h-4 w-20" />
      </div>
    );
  }

  const color = severityColor(severity);
  const bg    = sevBg(severity);

  return (
    <MotionCard padding={false} delay={0}>
      <div
        className="relative overflow-hidden rounded-2xl p-5"
        style={{ backgroundColor: bg, borderColor: `${color}25` }}
      >
        {/* Radial glow behind number */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at 50% 60%, ${color}18 0%, transparent 70%)`,
          }}
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Label */}
          <span className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
            Live AQI
          </span>

          {/* Number */}
          <motion.div
            key={aqi}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="font-display text-6xl font-extrabold leading-none tabular-nums"
            style={{ color }}
          >
            {Math.round(aqi)}
          </motion.div>

          {/* Severity badge */}
          <span
            className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {severityLabel(severity)}
          </span>

          {/* Station reading */}
          {stationAqi != null && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-[10px] text-text-muted">🛰 Station</span>
              <span className="font-mono text-xs font-semibold text-text-secondary">
                {stationAqi}
              </span>
            </div>
          )}
        </div>
      </div>
    </MotionCard>
  );
}

/* ── Pollutant sparkline card ───────────────────────────── */
export function PollutantStatCard({
  label,
  pollutant,
  color = "#6366F1",
  loading,
  delay = 0,
}: {
  label: string;
  pollutant?: Pollutant;
  color?: string;
  loading?: boolean;
  delay?: number;
}) {
  if (loading || !pollutant) {
    return (
      <div className="rounded-2xl border border-border bg-white p-4 shadow-card">
        <Skeleton className="mb-3 h-3 w-12" />
        <Skeleton className="mb-2 h-7 w-20" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="mt-2 h-3 w-16" />
      </div>
    );
  }

  const over       = pollutant.value > pollutant.whoLimit;
  const valueColor = over ? "#EF4444" : "#111827";
  const data       = pollutant.sparkline.map((v) => ({ v }));
  const overRatio  = Math.min(pollutant.value / pollutant.whoLimit, 3);

  return (
    <MotionCard padding={false} delay={delay} className="overflow-hidden">
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
            {label}
          </span>
          {over && (
            <span className="rounded-full bg-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-danger">
              OVER
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span
            className="font-display text-2xl font-extrabold leading-none"
            style={{ color: valueColor }}
          >
            {pollutant.value}
          </span>
          <span className="text-[11px] font-medium text-text-muted">
            {pollutant.unit}
          </span>
        </div>

        {/* Sparkline */}
        <div className="my-2 h-10 w-full">
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={color}
                dot={false}
                strokeWidth={1.8}
                isAnimationActive
              />
              <Tooltip content={<SparkTooltip />} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* WHO ratio bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-text-muted">
            <span>WHO {pollutant.whoLimit}</span>
            <span style={{ color: over ? "#EF4444" : "#22C55E" }}>
              {over ? `${(overRatio).toFixed(1)}× limit` : "Within limit"}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: over ? "#EF4444" : "#22C55E" }}
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(overRatio / 3 * 100, 100)}%` }}
              transition={{ duration: 1, delay: delay + 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </MotionCard>
  );
}

/* ── KPI row card (for dashboard top strip) ─────────────── */
export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp,
  color,
  loading,
  delay = 0,
  unit,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  loading?: boolean;
  delay?: number;
  unit?: string;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
        <Skeleton className="mb-4 h-3 w-20" />
        <Skeleton className="mb-2 h-8 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  const accentColor = color ?? "#6366F1";

  return (
    <MotionCard delay={delay} className="group relative overflow-hidden">
      {/* Subtle corner accent */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at top right, ${accentColor}12, transparent 70%)` }}
      />

      <div className="mb-3 flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-secondary">
          {title}
        </span>
        {icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            {icon}
          </span>
        )}
      </div>

      <div
        className="font-display text-3xl font-extrabold leading-none tracking-tight"
        style={{ color: accentColor }}
      >
        {value}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {subtitle && (
          <span className="text-xs text-text-secondary">{subtitle}</span>
        )}
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold ${
              trendUp ? "text-danger" : "text-success"
            }`}
          >
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
    </MotionCard>
  );
}
