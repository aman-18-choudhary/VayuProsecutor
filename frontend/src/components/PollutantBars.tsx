import React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
} from "recharts";
import type { LiveData, Pollutant } from "../lib/types";
import { MotionCard, SectionTitle, Skeleton } from "./ui";

interface Row {
  name: string;
  value: number;
  whoLimit: number;
  unit: string;
  over: boolean;
  pct: number;
}

function buildRows(data: LiveData): Row[] {
  const defs: [string, Pollutant][] = [
    ["PM2.5", data.pm25],
    ["PM10",  data.pm10],
    ["NO₂",   data.no2],
    ["CO",    data.co],
    ["O₃",    data.o3],
    ["SO₂",   data.so2],
  ];
  return defs.map(([name, p]) => ({
    name,
    value:    p.value,
    whoLimit: p.whoLimit,
    unit:     p.unit,
    over:     p.value > p.whoLimit,
    pct:      Math.round(Math.min((p.value / p.whoLimit) * 100, 300)),
  }));
}

function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row: Row = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3 shadow-card-xl">
      <p className="mb-1 font-semibold text-text-primary">{row.name}</p>
      <p className="font-mono text-sm text-text-secondary">
        {row.value} <span className="text-text-muted">{row.unit}</span>
      </p>
      <p className="font-mono text-xs text-text-muted">WHO limit: {row.whoLimit}</p>
      <p
        className={`mt-1 text-xs font-semibold ${
          row.over ? "text-danger" : "text-success"
        }`}
      >
        {row.over ? `${(row.value / row.whoLimit).toFixed(1)}× over limit` : "✓ Within limit"}
      </p>
    </div>
  );
}

/* ── Horizontal progress row (alternative to recharts) ──── */
function PollutantRow({ row, delay }: { row: Row; delay: number }) {
  const clampedPct = Math.min(row.pct, 300);
  const displayPct = Math.min(clampedPct, 100);
  const color = row.over ? "#EF4444" : "#6366F1";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">{row.name}</span>
          {row.over && (
            <span className="rounded-full bg-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-danger">
              OVER
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-text-primary">{row.value}</span>
          <span className="text-[10px] text-text-muted">{row.unit}</span>
          <span className="text-[10px] text-text-muted">/ WHO {row.whoLimit}</span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: "0%" }}
          animate={{ width: `${displayPct}%` }}
          transition={{ duration: 1, delay: delay + 0.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}

export function PollutantBars({
  data,
  loading,
}: {
  data?: LiveData;
  loading?: boolean;
}) {
  if (loading || !data) {
    return (
      <MotionCard delay={0.1}>
        <SectionTitle>Pollutants vs WHO Limit</SectionTitle>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </MotionCard>
    );
  }

  const rows = buildRows(data);

  return (
    <MotionCard delay={0.1}>
      <SectionTitle>Pollutants vs WHO Limit</SectionTitle>
      <div className="space-y-4">
        {rows.map((row, i) => (
          <PollutantRow key={row.name} row={row} delay={i * 0.06} />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-3 rounded-full bg-primary" />
          <span className="text-[10px] text-text-muted">Within limit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-3 rounded-full bg-danger" />
          <span className="text-[10px] text-text-muted">Over WHO limit</span>
        </div>
      </div>
    </MotionCard>
  );
}
