import React from "react";
import { motion } from "framer-motion";
import type { WeatherData } from "../lib/types";
import { MotionCard, SectionTitle, Skeleton } from "./ui";

/* ── SVG compass needle ─────────────────────────────────── */
function Compass({ weather }: { weather: WeatherData }) {
  const size = 130;
  const c    = size / 2;
  const r    = c - 12;

  const cardinals = [
    { label: "N", angle: 0 },
    { label: "E", angle: 90 },
    { label: "S", angle: 180 },
    { label: "W", angle: 270 },
  ];

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer ring */}
        <circle cx={c} cy={c} r={r} fill="none" stroke="#E5E7EB" strokeWidth="2" />
        {/* Inner ring */}
        <circle cx={c} cy={c} r={r - 12} fill="none" stroke="#F3F4F6" strokeWidth="1" />
        {/* Minor ticks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a  = (i * 30 * Math.PI) / 180;
          const x1 = c + (r - 5) * Math.sin(a);
          const y1 = c - (r - 5) * Math.cos(a);
          const x2 = c + r * Math.sin(a);
          const y2 = c - r * Math.cos(a);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#D1D5DB" strokeWidth="1.5" />
          );
        })}
        {/* Cardinal labels */}
        {cardinals.map((t) => {
          const a  = (t.angle * Math.PI) / 180;
          const lr = r - 16;
          return (
            <text
              key={t.label}
              x={c + lr * Math.sin(a)}
              y={c - lr * Math.cos(a)}
              fill="#9CA3AF"
              fontSize="10"
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              {t.label}
            </text>
          );
        })}
        {/* Animated needle */}
        <motion.g
          initial={false}
          animate={{ rotate: weather.windDir }}
          transition={{ type: "spring", stiffness: 80, damping: 14 }}
          style={{ transformOrigin: `${c}px ${c}px` }}
        >
          {/* North tip (colored) */}
          <polygon
            points={`${c},${c - r + 20} ${c - 5},${c + 4} ${c + 5},${c + 4}`}
            fill="#6366F1"
          />
          {/* South tip (grey) */}
          <polygon
            points={`${c},${c + r - 20} ${c - 5},${c - 4} ${c + 5},${c - 4}`}
            fill="#D1D5DB"
          />
          <circle cx={c} cy={c} r="4.5" fill="#6366F1" />
          <circle cx={c} cy={c} r="2" fill="white" />
        </motion.g>
      </svg>

      {/* Center overlay text */}
      <div className="pointer-events-none absolute flex flex-col items-center">
        <span className="font-mono text-sm font-bold text-text-primary">
          {weather.windSpeed}
        </span>
        <span className="text-[9px] text-text-muted">km/h</span>
      </div>
    </div>
  );
}

/* ── Stat chip ──────────────────────────────────────────── */
function WeatherStat({
  icon,
  label,
  value,
  unit,
}: {
  icon: string;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-bg-muted px-3 py-3">
      <span className="text-lg" aria-hidden="true">{icon}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <span className="font-mono text-base font-bold text-text-primary">
        {value}
        <span className="ml-0.5 text-[10px] font-normal text-text-secondary">{unit}</span>
      </span>
    </div>
  );
}

/* ── Wind direction label ────────────────────────────────── */
function WindInfo({ weather }: { weather: WeatherData }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Wind</span>
      <span className="font-mono text-sm font-bold text-primary">
        {weather.windDirLabel}
      </span>
      <span className="text-text-secondary">·</span>
      <span className="font-mono text-sm font-bold text-text-primary">
        {weather.windSpeed} km/h
      </span>
    </div>
  );
}

/* ── Main export ────────────────────────────────────────── */
export function WeatherPanel({
  weather,
  loading,
}: {
  weather?: WeatherData;
  loading?: boolean;
}) {
  if (loading || !weather) {
    return (
      <MotionCard delay={0.2}>
        <SectionTitle>Weather Conditions</SectionTitle>
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-[130px] w-[130px] rounded-full" />
          <Skeleton className="h-8 w-full" />
          <div className="flex w-full gap-2">
            <Skeleton className="h-20 flex-1" />
            <Skeleton className="h-20 flex-1" />
          </div>
        </div>
      </MotionCard>
    );
  }

  return (
    <MotionCard delay={0.2}>
      <SectionTitle>Weather Conditions</SectionTitle>
      <div className="flex flex-col items-center gap-3">
        <Compass weather={weather} />
        <WindInfo weather={weather} />
        <div className="flex w-full gap-2">
          <WeatherStat icon="💧" label="Humidity" value={weather.humidity} unit="%" />
          <WeatherStat icon="🌡️" label="Temperature" value={weather.temperature} unit="°C" />
        </div>
      </div>
    </MotionCard>
  );
}
