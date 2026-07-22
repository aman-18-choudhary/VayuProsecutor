import { motion } from "framer-motion";
import { useLiveData, useMapData } from "../lib/api";
import { getSeverity, severityColor, severityLabel } from "../lib/aqi";
import { AQICard, PollutantStatCard, KPICard } from "../components/AQICard";
import { PollutantBars } from "../components/PollutantBars";
import { PollutionMap } from "../components/PollutionMap";
import { ForecastChart } from "../components/ForecastChart";
import { WeatherPanel } from "../components/WeatherPanel";
import { HealthAdvisory } from "../components/HealthAdvisory";
import { MotionCard, LiveDot, GradientButton } from "../components/ui";

/* ── Top-row KPI strip ──────────────────────────────────── */
function KPIStrip({ live, loading }: { live: any; loading: boolean }) {
  const sev   = getSeverity(live?.aqi ?? 0);
  const color = severityColor(sev);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <AQICard
        aqi={live?.aqi ?? 0}
        severity={sev}
        stationAqi={live?.stationAqi ?? null}
        loading={loading}
      />
      <KPICard
        title="Dominant Pollutant"
        value="PM2.5"
        subtitle={`${live?.pm25?.value ?? "—"} µg/m³`}
        icon={<span className="text-xs">🔬</span>}
        color="#8B5CF6"
        loading={loading}
        delay={0.05}
      />
      <KPICard
        title="Health Risk"
        value={loading ? "—" : severityLabel(sev)}
        subtitle="Current assessment"
        icon={<span className="text-xs">🫀</span>}
        color={color}
        loading={loading}
        delay={0.1}
      />
      <KPICard
        title="Wind Speed"
        value={live?.weather?.windSpeed ?? "—"}
        subtitle={`Direction: ${live?.weather?.windDirLabel ?? "—"}`}
        icon={<span className="text-xs">💨</span>}
        unit="km/h"
        color="#3B82F6"
        loading={loading}
        delay={0.15}
      />
      <KPICard
        title="Temperature"
        value={live?.weather?.temperature ?? "—"}
        subtitle={`Humidity: ${live?.weather?.humidity ?? "—"}%`}
        icon={<span className="text-xs">🌡️</span>}
        unit="°C"
        color="#F59E0B"
        loading={loading}
        delay={0.2}
      />
    </div>
  );
}

/* ── AI Intervention panel ──────────────────────────────── */
import { useRecommendations } from "../lib/api";

function AIInterventionPanel({ live, loading, city }: { live: any; loading: boolean; city: any }) {
  const { data: recs, isLoading: recsLoading } = useRecommendations(city);

  if (loading || recsLoading) {
    return (
      <MotionCard delay={0.25} className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-4 rounded bg-bg-muted w-3/4" />
          <div className="h-20 rounded bg-bg-muted w-full" />
          <div className="h-4 rounded bg-bg-muted w-1/2" />
        </div>
      </MotionCard>
    );
  }

  const sev = getSeverity(live?.aqi ?? 0);
  
  const topRec = recs?.recommendations?.[0];
  const interventions = recs?.recommendations?.slice(0, 3) || [];

  const impactColor: Record<string, string> = {
    High:   "#EF4444",
    Medium: "#F59E0B",
    Low:    "#22C55E",
  };

  return (
    <MotionCard delay={0.25} className="h-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            AI Recommended
          </p>
          <h3 className="font-display text-base font-bold text-text-primary">
            Top Intervention
          </h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          AI Active
        </span>
      </div>

      {/* Primary recommendation card */}
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-primary/8 to-secondary/5 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm text-xl">
            {topRec?.action.includes("Traffic") || topRec?.action.includes("Vehicle") ? "🚗" : topRec?.action.includes("Construction") ? "🏗️" : topRec?.action.includes("Industr") ? "🏭" : "✅"}
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm line-clamp-1">
              {topRec?.action || "Evaluating strategies..."}
            </p>
            <p className="text-[11px] text-text-secondary">Focus: {live?.city} CBD</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/80 p-2">
            <p className="font-display text-lg font-extrabold text-success">
              {topRec ? `${Math.round(topRec.expected_aqi_drop * 0.8)}–${Math.round(topRec.expected_aqi_drop * 1.2)}` : "—"}
            </p>
            <p className="text-[9px] text-text-muted uppercase">AQI Reduction</p>
          </div>
          <div className="rounded-xl bg-white/80 p-2">
            <p className="font-display text-lg font-extrabold text-primary">
              {topRec ? `${Math.round((topRec.confidence_pct || 0))}%` : "—"}
            </p>
            <p className="text-[9px] text-text-muted uppercase">Confidence</p>
          </div>
          <div className="rounded-xl bg-white/80 p-2">
            <p className="font-display text-xs font-extrabold text-danger mt-1.5 mb-1.5">
              {topRec?.priority || "—"}
            </p>
            <p className="text-[9px] text-text-muted uppercase">Priority</p>
          </div>
        </div>
      </div>

      {/* Key actions list */}
      <div className="mb-4 space-y-2">
        {interventions.map((iv, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex items-center justify-between rounded-xl bg-bg-muted px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{iv.source_icon}</span>
              <span className="text-xs font-medium text-text-secondary">{iv.action}</span>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{ color: impactColor[iv.priority] || "#888", backgroundColor: `${impactColor[iv.priority] || "#888"}15` }}
            >
              {iv.priority}
            </span>
          </motion.div>
        ))}
      </div>

      <GradientButton 
        variant="primary" 
        size="md" 
        className="w-full"
        onClick={() => {
          const evt = new CustomEvent("change-tab", { detail: "interventions" });
          window.dispatchEvent(evt);
        }}
      >
        View Complete Action Plan →
      </GradientButton>
    </MotionCard>
  );
}

import { City } from "../lib/types";

/* ── Page ───────────────────────────────────────────────── */
export function LiveIntelligence({ city }: { city: City }) {
  const { data: live, isLoading }          = useLiveData(city);
  const { data: map,  isLoading: mapLoad } = useMapData(city);

  return (
    <div className="space-y-6">
      {/* Updated at + live indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2"
      >
        <LiveDot />
        <span className="text-xs text-text-muted">
          Real-time data for{" "}
          <span className="font-semibold text-text-primary">{city.name}</span>
          {live?.updatedAt && (
            <>
              {" "}· Updated{" "}
              {new Date(live.updatedAt).toLocaleTimeString("en-IN", {
                hour:   "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </>
          )}
        </span>
      </motion.div>

      {/* Row 1: KPI strip */}
      <KPIStrip live={live} loading={isLoading} />

      {/* Row 2: Pollutant sparkline cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "PM2.5", key: "pm25" as const, color: "#6366F1" },
          { label: "PM10",  key: "pm10" as const, color: "#8B5CF6" },
          { label: "NO₂",   key: "no2"  as const, color: "#3B82F6" },
          { label: "CO",    key: "co"   as const, color: "#EF4444" },
          { label: "O₃",    key: "o3"   as const, color: "#22C55E" },
          { label: "SO₂",   key: "so2"  as const, color: "#F59E0B" },
        ].map(({ label, key, color }, i) => (
          <PollutantStatCard
            key={label}
            label={label}
            pollutant={live?.[key]}
            color={color}
            loading={isLoading}
            delay={i * 0.05}
          />
        ))}
      </div>

      {/* Row 3: Map (65%) + AI Intervention panel (35%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PollutionMap data={map} loading={mapLoad} />
        </div>
        <div className="lg:col-span-4">
          <AIInterventionPanel live={live} loading={isLoading} city={city} />
        </div>
      </div>

      {/* Row 4: Forecast + Pollutant bars + Weather */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ForecastChart forecast={live?.forecast} loading={isLoading} />
        </div>
        <div className="lg:col-span-3">
          <PollutantBars data={live} loading={isLoading} />
        </div>
        <div className="lg:col-span-3">
          <WeatherPanel weather={live?.weather} loading={isLoading} />
        </div>
      </div>

      {/* Row 5: Health advisory */}
      <HealthAdvisory
        advisory={live?.advisory}
        severity={getSeverity(live?.aqi ?? 0)}
        aqi={live?.aqi ?? 0}
        loading={isLoading}
      />
    </div>
  );
}
