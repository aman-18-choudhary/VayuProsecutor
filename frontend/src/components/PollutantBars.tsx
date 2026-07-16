import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { LiveData, Pollutant } from "../lib/types";
import { Card, SectionTitle, Skeleton } from "./ui";

interface Row {
  name: string;
  value: number;
  whoLimit: number;
  unit: string;
  over: boolean;
}

function buildRows(data: LiveData): Row[] {
  const defs: [string, Pollutant][] = [
    ["PM2.5", data.pm25],
    ["PM10", data.pm10],
    ["NO₂", data.no2],
    ["CO", data.co],
    ["O₃", data.o3],
    ["SO₂", data.so2],
  ];
  return defs.map(([name, p]) => ({
    name,
    value: p.value,
    whoLimit: p.whoLimit,
    unit: p.unit,
    over: p.value > p.whoLimit,
  }));
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const row: Row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">{row.name}</p>
      <p className="font-mono text-slate-700">
        {row.value} {row.unit}
      </p>
      <p className="font-mono text-slate-500">WHO limit: {row.whoLimit}</p>
      <p className={row.over ? "text-crimson-light" : "text-teal"}>
        {row.over ? "Over safe limit" : "Within safe limit"}
      </p>
    </div>
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
      <Card>
        <SectionTitle icon="🧪">Pollutants vs WHO Safe Limit</SectionTitle>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const rows = buildRows(data);
  const maxLimit = Math.max(...rows.map((r) => r.whoLimit));

  return (
    <Card>
      <SectionTitle icon="🧪">Pollutants vs WHO Safe Limit</SectionTitle>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
            barCategoryGap="28%"
          >
            <XAxis
              type="number"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#E2E8F0" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={52}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
            />
            {rows.map((r) => (
              <ReferenceLine
                key={`ref-${r.name}`}
                x={r.whoLimit}
                stroke="transparent"
              />
            ))}
            <ReferenceLine
              x={maxLimit}
              stroke="#F39C12"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {rows.map((r) => (
                <Cell
                  key={`cell-${r.name}`}
                  fill={r.over ? "#C0392B" : "#00D4FF"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal" />
          Within limit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-crimson" />
          Over WHO limit
        </span>
      </div>
    </Card>
  );
}
