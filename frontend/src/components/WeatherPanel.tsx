import React from "react";
import { motion } from "framer-motion";
import type { WeatherData } from "../lib/types";
import { Card, SectionTitle, Skeleton } from "./ui";

function Compass({ weather }: { weather: WeatherData }) {
  const size = 140;
  const c = size / 2;
  const r = c - 14;
  const ticks = [
    { label: "N", angle: 0 },
    { label: "E", angle: 90 },
    { label: "S", angle: 180 },
    { label: "W", angle: 270 },
  ];

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="2"
        />
        {/* minor ticks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = c + (r - 4) * Math.sin(a);
          const y1 = c - (r - 4) * Math.cos(a);
          const x2 = c + r * Math.sin(a);
          const y2 = c - r * Math.cos(a);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
          );
        })}
        {/* cardinal labels */}
        {ticks.map((t) => {
          const a = (t.angle * Math.PI) / 180;
          const lr = r - 14;
          const x = c + lr * Math.sin(a);
          const y = c - lr * Math.cos(a);
          return (
            <text
              key={t.label}
              x={x}
              y={y}
              fill="#94a3b8"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {t.label}
            </text>
          );
        })}
        {/* needle */}
        <motion.g
          initial={false}
          animate={{ rotate: weather.windDir }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          style={{ transformOrigin: `${c}px ${c}px` }}
        >
          <polygon
            points={`${c},${c - r + 22} ${c - 6},${c + 6} ${c + 6},${c + 6}`}
            fill="#00D4FF"
          />
          <circle cx={c} cy={c} r="4" fill="#00D4FF" />
        </motion.g>
      </svg>
      <div className="pointer-events-none absolute flex flex-col items-center">
        <span className="font-mono text-lg font-bold text-slate-800">
          {weather.windSpeed}
        </span>
        <span className="text-[10px] text-slate-400">km/h</span>
        <span className="mt-0.5 text-[11px] font-semibold text-teal">
          {weather.windDirLabel}
        </span>
      </div>
    </div>
  );
}

function StatChip({
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
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="font-mono text-lg font-bold text-slate-800">
        {value}
        <span className="ml-0.5 text-xs font-normal text-slate-500">
          {unit}
        </span>
      </span>
    </div>
  );
}

export function WeatherPanel({
  weather,
  loading,
}: {
  weather?: WeatherData;
  loading?: boolean;
}) {
  if (loading || !weather) {
    return (
      <Card>
        <SectionTitle icon="🌦️">Weather Conditions</SectionTitle>
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-[140px] w-[140px] rounded-full" />
          <div className="flex w-full gap-3">
            <Skeleton className="h-20 flex-1" />
            <Skeleton className="h-20 flex-1" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle icon="🌦️">Weather Conditions</SectionTitle>
      <div className="flex flex-col items-center gap-4">
        <Compass weather={weather} />
        <div className="flex w-full gap-3">
          <StatChip
            icon="💧"
            label="Humidity"
            value={weather.humidity}
            unit="%"
          />
          <StatChip
            icon="🌡️"
            label="Temperature"
            value={weather.temperature}
            unit="°C"
          />
        </div>
      </div>
    </Card>
  );
}
