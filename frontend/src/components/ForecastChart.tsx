import React from "react";
import { motion } from "framer-motion";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { ForecastPoint } from "../lib/types";
import { MotionCard, Skeleton, SectionTitle } from "./ui";

/* ── Custom tooltip ─────────────────────────────────────── */
function ForecastTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as ForecastPoint | undefined;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3 shadow-card-xl">
      <p className="mb-1.5 text-xs font-semibold text-text-secondary">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-xl font-extrabold text-text-primary">
          {Math.round(point.aqi)}
        </span>
        <span className="text-xs text-text-muted">AQI</span>
      </div>
      <p className="mt-1 font-mono text-[10px] text-text-muted">
        Range: {Math.round(point.lower)} – {Math.round(point.upper)}
      </p>
    </div>
  );
}

/* ── AQI color gradient for line ────────────────────────── */
function AQILinearGradient() {
  return (
    <defs>
      <linearGradient id="aqiGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#6366F1" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="bandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#EF4444" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/* ── Legend pill ─────────────────────────────────────────── */
function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-0.5 w-4 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */
export function ForecastChart({
  forecast,
  loading,
}: {
  forecast?: ForecastPoint[];
  loading?: boolean;
}) {
  if (loading || !forecast) {
    return (
      <MotionCard delay={0.15}>
        <SectionTitle>24-Hour AQI Forecast</SectionTitle>
        <Skeleton className="h-[260px] w-full" />
      </MotionCard>
    );
  }

  const interval = Math.max(0, Math.floor(forecast.length / 6));

  return (
    <MotionCard delay={0.15}>
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle>24-Hour AQI Forecast</SectionTitle>
        <div className="flex items-center gap-4">
          <LegendPill color="#6366F1" label="Forecast" />
          <LegendPill color="#EF4444" label="Upper Bound" />
          <LegendPill color="#22C55E" label="Lower Bound" />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart
          data={forecast}
          margin={{ top: 8, right: 20, bottom: 0, left: -4 }}
        >
          <AQILinearGradient />
          <CartesianGrid
            stroke="#F3F4F6"
            strokeDasharray="3 3"
            vertical={false}
          />

          {/* Confidence band upper fill */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="url(#bandGradient)"
            fillOpacity={1}
            isAnimationActive={false}
          />
          {/* Confidence band lower fill (masks to white) */}
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#FFFFFF"
            fillOpacity={1}
            isAnimationActive={false}
          />

          {/* Main AQI line with gradient fill */}
          <Area
            type="monotone"
            dataKey="aqi"
            stroke="#6366F1"
            strokeWidth={2.5}
            fill="url(#aqiGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#6366F1", stroke: "white", strokeWidth: 2 }}
          />

          {/* WHO reference lines */}
          <ReferenceLine
            y={100}
            stroke="#F59E0B"
            strokeDasharray="4 3"
            label={{
              value: "Moderate",
              position: "right",
              fill: "#F59E0B",
              fontSize: 9,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          <ReferenceLine
            y={200}
            stroke="#EF4444"
            strokeDasharray="4 3"
            label={{
              value: "Unhealthy",
              position: "right",
              fill: "#EF4444",
              fontSize: 9,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />

          <XAxis
            dataKey="time"
            tick={{
              fill: "#9CA3AF",
              fontSize: 10,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            interval={interval}
          />
          <YAxis
            tick={{
              fill: "#9CA3AF",
              fontSize: 10,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ForecastTooltip />} cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </MotionCard>
  );
}
