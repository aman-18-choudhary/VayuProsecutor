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
import { Card, Skeleton, SectionTitle } from "./ui";

const NAVY = "#FFFFFF";
const CRIMSON = "#C0392B";
const AMBER = "#F39C12";

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
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-slate-500">{label}</div>
      <div className="font-mono font-semibold text-slate-900">AQI {point.aqi}</div>
      <div className="font-mono text-slate-500">
        {point.lower} – {point.upper}
      </div>
    </div>
  );
}

export function ForecastChart({
  forecast,
  loading,
}: {
  forecast?: ForecastPoint[];
  loading?: boolean;
}) {
  if (loading || !forecast) {
    return (
      <Card>
        <SectionTitle>📈 24-Hour AQI Forecast</SectionTitle>
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  const interval = Math.max(0, Math.floor(forecast.length / 8));

  return (
    <Card>
      <SectionTitle>📈 24-Hour AQI Forecast</SectionTitle>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={forecast}
          margin={{ top: 10, right: 16, bottom: 0, left: -8 }}
        >
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />

          {/* Confidence band: draw upper filled crimson, then mask with lower filled navy */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill={CRIMSON}
            fillOpacity={0.12}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill={NAVY}
            fillOpacity={1}
            isAnimationActive={false}
          />

          <ReferenceLine
            y={100}
            stroke={AMBER}
            strokeDasharray="4 4"
            label={{ value: "Moderate", position: "right", fill: AMBER, fontSize: 10 }}
          />
          <ReferenceLine
            y={200}
            stroke={CRIMSON}
            strokeDasharray="4 4"
            label={{ value: "Unhealthy", position: "right", fill: CRIMSON, fontSize: 10 }}
          />

          <Line
            type="monotone"
            dataKey="aqi"
            stroke={CRIMSON}
            strokeWidth={3}
            dot={{ r: 2, fill: CRIMSON }}
            activeDot={{ r: 4 }}
          />

          <XAxis
            dataKey="time"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#E2E8F0" }}
            interval={interval}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#E2E8F0" }}
            label={{
              value: "AQI",
              angle: -90,
              position: "insideLeft",
              fill: "#94a3b8",
              fontSize: 11,
            }}
          />

          <Tooltip content={<ForecastTooltip />} cursor={{ stroke: "#E2E8F0" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
