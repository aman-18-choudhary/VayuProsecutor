import React from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import type { Pollutant, Severity } from "../lib/types";
import { severityColor, severityLabel, severityGlow } from "../lib/aqi";
import { Card, Skeleton } from "./ui";

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
      <Card className="flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-40" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-28" />
      </Card>
    );
  }

  const color = severityColor(severity);
  const isHigh = aqi > 200;
  const glow = isHigh ? "0 0 32px rgba(192, 57, 43, 0.55)" : severityGlow(severity);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <Card
        glow={glow}
        className={`flex flex-col items-center justify-center gap-1 text-center ${
          isHigh ? "animate-pulseGlow" : ""
        }`}
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Live Air Quality Index
        </span>
        <motion.div
          className="font-mono text-5xl font-black leading-none sm:text-6xl"
          style={{ color }}
          animate={{ opacity: [1, 0.65, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {Math.round(aqi)}
        </motion.div>
        <span
          className="mt-1 text-sm font-semibold"
          style={{ color }}
        >
          {severityLabel(severity)}
        </span>
        {stationAqi != null && (
          <span className="mt-1 font-mono text-xs text-slate-400">
            🛰️ Station: {stationAqi}
          </span>
        )}
      </Card>
    </motion.div>
  );
}

export function PollutantStatCard({
  label,
  pollutant,
  color,
  loading,
}: {
  label: string;
  pollutant?: Pollutant;
  color?: string;
  loading?: boolean;
}) {
  const stroke = color || "#00D4FF";

  if (loading || !pollutant) {
    return (
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-20" />
      </Card>
    );
  }

  const over = pollutant.value > pollutant.whoLimit;
  const valueColor = over
    ? pollutant.value > pollutant.whoLimit * 2
      ? "#C0392B"
      : "#F39C12"
    : "#0f172a";
  const data = pollutant.sparkline.map((n) => ({ v: n }));

  return (
    <Card className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span
          className="font-mono text-2xl font-bold leading-none"
          style={{ color: valueColor }}
        >
          {pollutant.value}
        </span>
        <span className="text-xs font-medium text-slate-500">
          {pollutant.unit}
        </span>
      </div>
      <div className="h-10 w-full">
        <ResponsiveContainer width="100%" height={40}>
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={stroke}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <span
        className={`text-[11px] font-medium ${
          over ? "text-amber" : "text-slate-500"
        }`}
      >
        WHO {pollutant.whoLimit}
        {over ? " • over limit" : ""}
      </span>
    </Card>
  );
}
