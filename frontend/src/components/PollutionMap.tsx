import { useEffect } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { MapData, MapMarker } from "../lib/types";
import { MotionCard, Skeleton, SectionTitle } from "./ui";

type MarkerType = MapMarker["type"];

const MARKER_STYLE: Record<MarkerType, { color: string; fill: string; emoji: string; label: string }> = {
  school:  { color: "#3B82F6", fill: "#3B82F6", emoji: "🏫", label: "School" },
  hospital:{ color: "#22C55E", fill: "#22C55E", emoji: "🏥", label: "Hospital" },
  factory: { color: "#EF4444", fill: "#EF4444", emoji: "🏭", label: "Factory" },
  station: { color: "#6366F1", fill: "#6366F1", emoji: "📡", label: "AQI Station" },
};

/* ── Heatmap overlay ─────────────────────────────────────── */
function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    const layer = (L as any)
      .heatLayer(points, {
        radius: 28,
        blur: 22,
        maxZoom: 13,
        gradient: {
          0.25: "#3B82F6",
          0.55: "#8B5CF6",
          0.75: "#F59E0B",
          1.0:  "#EF4444",
        },
      })
      .addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map, points]);
  return null;
}

/* ── Custom popup content ────────────────────────────────── */
function MarkerPopup({ marker }: { marker: MapMarker }) {
  const style = MARKER_STYLE[marker.type];
  return (
    <div className="min-w-[140px] p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-base">{style.emoji}</span>
        <span className="text-xs font-bold text-text-primary">{marker.name}</span>
      </div>
      <span
        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
        style={{ backgroundColor: style.color }}
      >
        {style.label}
      </span>
      {marker.aqi != null && (
        <div className="mt-2 rounded-lg bg-bg-muted px-2 py-1 text-center">
          <span className="font-mono text-sm font-bold text-text-primary">
            AQI {marker.aqi}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Premium map legend ──────────────────────────────────── */
function MapLegend() {
  return (
    <div className="map-legend">
      <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-text-muted">
        Legend
      </p>
      <div className="space-y-1.5">
        {(Object.keys(MARKER_STYLE) as MarkerType[]).map((type) => {
          const { color, emoji, label } = MARKER_STYLE[type];
          return (
            <div key={type} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] font-medium text-text-secondary">
                {emoji} {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 border-t border-border pt-2">
        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-text-muted">
          Pollution Heat
        </p>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full">
          {["#3B82F6","#8B5CF6","#F59E0B","#EF4444"].map((c) => (
            <div key={c} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-text-muted">
          <span>Low</span><span>High</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */
export function PollutionMap({
  data,
  loading,
}: {
  data?: MapData;
  loading?: boolean;
}) {
  if (loading || !data) {
    return (
      <MotionCard padding={false}>
        <div className="p-5 pb-0">
          <SectionTitle>Live Pollution Map</SectionTitle>
        </div>
        <Skeleton className="h-[440px] w-full rounded-2xl" />
      </MotionCard>
    );
  }

  return (
    <MotionCard padding={false} className="overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-3">
        <SectionTitle>Live Pollution Map</SectionTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-bg-muted px-3 py-1.5 text-[10px] font-medium text-text-secondary">
            <div className="h-1.5 w-1.5 rounded-full bg-success" />
            Live Data
          </div>
          <div className="rounded-full border border-border bg-bg-muted px-3 py-1.5 text-[10px] font-medium text-text-secondary">
            AQI Heatmap
          </div>
        </div>
      </div>

      <div className="relative h-[440px] w-full">
        <MapContainer
          center={data.center}
          zoom={12}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <HeatLayer points={data.heat} />
          {data.markers.map((marker) => {
            const style = MARKER_STYLE[marker.type];
            return (
              <CircleMarker
                key={marker.id}
                center={[marker.lat, marker.lon]}
                radius={8}
                pathOptions={{
                  color:        "white",
                  fillColor:    style.fill,
                  fillOpacity:  0.9,
                  weight:       2,
                }}
              >
                <Popup>
                  <MarkerPopup marker={marker} />
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <MapLegend />
      </div>
    </MotionCard>
  );
}
