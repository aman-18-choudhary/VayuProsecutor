import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet";
import { MotionCard, Card, KPIValue, GradientButton } from "../components/ui";

const API_BASE = "http://localhost:8000";

/* ── Hooks ─────────────────────────────────────────────── */
function useWards(city: string) {
  const [data, setData] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/wards/${city}`).then((r) => r.json()),
      fetch(`${API_BASE}/api/ward-ranking/${city}`).then((r) => r.json())
    ])
      .then(([wardsData, rankData]) => {
        setData(wardsData);
        setRanking(rankData.ranking || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [city]);

  return { data, ranking, loading };
}

function useWardProfile(city: string, wardId: string | null) {
  const [profile, setProfile] = useState<any>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wardId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/ward/${city}/${wardId}`).then((r) => r.json()),
      fetch(`${API_BASE}/api/ward-recommendation/${city}/${wardId}`).then((r) => r.json())
    ])
      .then(([p, r]) => {
        setProfile(p);
        setRecs(r.recommendations || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [city, wardId]);

  return { profile, recs, loading };
}

/* ── Ward Map ────────────────────────────────────────────── */
function WardMap({ wards, selectedWard, onSelectWard, center }: any) {
  if (!wards || !wards.length) return null;

  const getColor = (aqi: number) => {
    if (aqi <= 50) return "#22C55E";
    if (aqi <= 100) return "#EAB308";
    if (aqi <= 150) return "#F97316";
    if (aqi <= 200) return "#EF4444";
    if (aqi <= 300) return "#8B5CF6";
    return "#831843";
  };

  const style = (feature: any) => {
    const isSelected = feature.properties.id === selectedWard;
    return {
      fillColor: getColor(feature.properties.aqi),
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? "#000" : "rgba(255,255,255,0.8)",
      dashArray: feature.properties.is_estimated ? "5" : "",
      fillOpacity: isSelected ? 0.7 : 0.4
    };
  };

  const geoJsonData = {
    type: "FeatureCollection",
    features: wards.map((w: any) => ({
      type: "Feature",
      properties: w,
      geometry: w.geometry
    }))
  };

  return (
    <MapContainer
      center={center || [28.61, 77.23]}
      zoom={11}
      zoomControl={false}
      style={{ height: "100%", width: "100%", background: "#f8fafc", zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap"
      />
      <GeoJSON
        data={geoJsonData as any}
        style={style}
        onEachFeature={(feature, layer) => {
          const p = feature.properties;
          const estTag = p.is_estimated ? `<div style="margin-top:8px;font-size:9px;color:#6366F1;text-transform:uppercase;font-weight:bold;border-top:1px solid #e2e8f0;padding-top:4px;">Estimated Zone</div>` : "";
          const content = `
            <div style="min-width: 150px; font-family: 'Inter', sans-serif;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${p.name}</div>
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #64748b;">AQI</span>
                <span style="font-weight: bold;">${p.aqi}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #64748b;">Risk Idx</span>
                <span style="font-weight: bold;">${p.risk_index}/100</span>
              </div>
              ${estTag}
            </div>
          `;
          layer.bindTooltip(content, { sticky: true });
          layer.on({
            click: () => onSelectWard(feature.properties.id)
          });
        }}
      />
    </MapContainer>
  );
}

/* ── Ranking Panel ───────────────────────────────────────── */
function RankingPanel({ ranking, selectedWard, onSelectWard }: any) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold">Top 10 Worst Wards</h3>
        <p className="text-xs text-text-muted">Ranked by AQI & Vulnerability</p>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
        {ranking.map((w: any) => {
          const isSelected = selectedWard === w.id;
          return (
            <div
              key={w.id}
              onClick={() => onSelectWard(w.id)}
              className={[
                "cursor-pointer rounded-2xl border p-3 transition-all",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-white hover:border-primary/30 hover:shadow-sm"
              ].join(" ")}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger/10 text-xs font-bold text-danger">
                    #{w.rank}
                  </span>
                  <span className="font-semibold text-sm truncate max-w-[120px]">{w.name}</span>
                </div>
                <span className="text-lg font-bold text-danger">{w.aqi}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Risk: <span className="font-semibold text-text-primary">{w.risk_index}/100</span></span>
                <span className={w.trend === "Rising" ? "text-danger" : "text-success"}>
                  {w.trend === "Rising" ? "↗ Rising" : "↘ Falling"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
export function WardIntelligence({ city }: { city: string }) {
  const { data, ranking, loading } = useWards(city);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const { profile, recs } = useWardProfile(city, selectedWard);
  const [activeTab, setActiveTab] = useState("overview");

  // Auto-select #1 worst ward
  useEffect(() => {
    if (ranking.length > 0 && !selectedWard) {
      setSelectedWard(ranking[0].id);
    }
  }, [ranking, selectedWard]);

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const center = data.wards?.[0] ? [data.wards[0].lat, data.wards[0].lon] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Ward Intelligence
        </h1>
        <p className="text-sm text-text-secondary">
          AI-powered Geospatial Intelligence & Hyperlocal Interventions
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MotionCard delay={0.1}>
          <div className="text-sm font-semibold text-text-secondary">Worst Ward</div>
          <KPIValue value={ranking[0]?.name || "N/A"} color="text-danger" />
          <div className="mt-1 text-xs text-text-muted">AQI: {ranking[0]?.aqi}</div>
        </MotionCard>
        <MotionCard delay={0.15}>
          <div className="text-sm font-semibold text-text-secondary">Avg City AQI</div>
          <KPIValue value={Math.round(ranking.reduce((a, b) => a + b.aqi, 0) / (ranking.length || 1))} />
          <div className="mt-1 text-xs text-text-muted">Across all {ranking.length} wards</div>
        </MotionCard>
        <MotionCard delay={0.2}>
          <div className="text-sm font-semibold text-text-secondary">Critical Wards</div>
          <KPIValue value={ranking.filter(w => w.aqi > 200).length} color="text-danger" />
          <div className="mt-1 text-xs text-text-muted">AQI &gt; 200</div>
        </MotionCard>
        <MotionCard delay={0.25}>
          <div className="text-sm font-semibold text-text-secondary">Pop. at Risk</div>
          <KPIValue 
            value={((ranking.filter(w => w.aqi > 200).reduce((a, b) => a + b.population, 0)) / 1000).toFixed(1) + "k"} 
          />
          <div className="mt-1 text-xs text-text-muted">In critical zones</div>
        </MotionCard>
      </div>

      {/* Map & Ranking Split */}
      <div className="grid h-[500px] grid-cols-1 gap-6 lg:grid-cols-12">
        <MotionCard className="relative overflow-hidden p-0 lg:col-span-8 lg:order-1" delay={0.3}>
          <WardMap 
            wards={data.wards} 
            selectedWard={selectedWard} 
            onSelectWard={setSelectedWard} 
            center={center}
          />
          {/* Overlay Pill */}
          <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-sm text-xs font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live Geospatial Engine
          </div>
        </MotionCard>
        
        <MotionCard className="lg:col-span-4 lg:order-2" delay={0.4}>
          <RankingPanel 
            ranking={ranking} 
            selectedWard={selectedWard} 
            onSelectWard={setSelectedWard} 
          />
        </MotionCard>
      </div>

      {/* Ward Profile Details */}
      <AnimatePresence mode="wait">
        {profile && (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <Card className="overflow-hidden p-0">
              {/* Profile Header */}
              <div className="border-b border-border bg-bg-muted/30 p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-display text-2xl font-bold">{profile.name}</h2>
                    <div className="mt-1 flex items-center gap-3 text-sm text-text-secondary">
                      <span>Pop: {(profile.population / 1000).toFixed(1)}k</span>
                      <span>•</span>
                      <span>Area: {profile.area_sqkm} km²</span>
                      {profile.is_estimated && (
                        <>
                          <span>•</span>
                          <span className="text-primary font-semibold">Estimated Zone</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Score</div>
                      <div className="text-xl font-bold text-primary">{profile.score}/100</div>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="text-right">
                      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">AQI</div>
                      <div className="text-xl font-bold text-danger">{profile.aqi}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-border px-6">
                {["overview", "recommendations", "risk"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={[
                      "py-4 text-sm font-semibold capitalize transition-all",
                      activeTab === t
                        ? "border-b-2 border-primary text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    ].join(" ")}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-border p-4 bg-bg-muted/10">
                      <h4 className="font-bold mb-4">Vulnerability Factors</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Schools (Radius)</span>
                          <span className="font-semibold">{profile.schools_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Hospitals (Radius)</span>
                          <span className="font-semibold">{profile.hospitals_count}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-border">
                          <span className="font-bold">Total Risk Index</span>
                          <span className="font-bold text-danger">{profile.risk_index}/100</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border p-4 bg-bg-muted/10">
                      <h4 className="font-bold mb-4">Status & Action</h4>
                      <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                        This ward is currently categorized as <span className="font-bold text-text-primary">{profile.category}</span>. 
                        Immediate interventions are recommended to lower the risk index and protect vulnerable populations (schools/hospitals).
                      </p>
                      <GradientButton variant="primary" className="w-full" onClick={() => setActiveTab("recommendations")}>
                        View AI Interventions
                      </GradientButton>
                    </div>
                  </div>
                )}

                {activeTab === "recommendations" && (
                  <div className="space-y-4">
                    <p className="text-sm text-text-secondary mb-4">
                      AI-generated causal interventions tailored for {profile.name} based on local emission sources and risk factors.
                    </p>
                    <div className="grid gap-4">
                      {recs.map((r, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-white hover:border-primary/30 transition-all">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                              {i + 1}
                            </div>
                            <div>
                              <div className="font-bold">{r.intervention}</div>
                              <div className="text-xs text-text-secondary mt-1">
                                Dept: {r.department} • Time: {r.time}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 sm:text-right">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-text-muted">Impact</div>
                              <div className="font-bold text-success">↓ {r.reduction}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-text-muted">Priority</div>
                              <div className={`text-xs font-bold px-2 py-1 rounded-md ${r.priority === 'Critical' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                                {r.priority}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "risk" && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-24 h-24 rounded-full border-8 border-danger flex items-center justify-center text-3xl font-bold text-danger mb-4">
                      {profile.risk_index}
                    </div>
                    <h3 className="font-bold text-xl">Critical Vulnerability</h3>
                    <p className="text-text-secondary max-w-md mt-2 text-sm">
                      The risk index is calculated using spatial joins between the ward boundary and OpenStreetMap nodes (Schools, Hospitals) combined with population density.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
