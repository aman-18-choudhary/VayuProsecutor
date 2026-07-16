import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { MapData, MapMarker } from "../lib/types";
import { Card, Skeleton, SectionTitle } from "./ui";

type MarkerType = MapMarker["type"];

const MARKER_STYLE: Record<MarkerType, { color: string; emoji: string; label: string }> = {
  school: { color: "#3b82f6", emoji: "🏫", label: "School" },
  hospital: { color: "#22c55e", emoji: "🏥", label: "Hospital" },
  factory: { color: "#C0392B", emoji: "🏭", label: "Factory" },
  station: { color: "#a855f7", emoji: "📡", label: "AQI Station" },
};

function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;
    const layer = (L as any)
      .heatLayer(points, {
        radius: 25,
        blur: 18,
        maxZoom: 13,
        gradient: { 0.3: "#00D4FF", 0.6: "#F39C12", 0.9: "#C0392B" },
      })
      .addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
      {(Object.keys(MARKER_STYLE) as MarkerType[]).map((type) => {
        const { color, emoji, label } = MARKER_STYLE[type];
        return (
          <span key={type} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span aria-hidden="true">{emoji}</span>
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}

export function PollutionMap({ data, loading }: { data?: MapData; loading?: boolean }) {
  if (loading || !data) {
    return (
      <Card>
        <SectionTitle>🗺️ Live Pollution Map</SectionTitle>
        <Skeleton className="h-[380px] w-full sm:h-[480px]" />
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle>🗺️ Live Pollution Map</SectionTitle>
      <div className="h-[380px] w-full overflow-hidden rounded-xl sm:h-[480px]">
        <MapContainer
          center={data.center}
          zoom={12}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
          className="rounded-xl"
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
                radius={7}
                pathOptions={{
                  color: style.color,
                  fillColor: style.color,
                  fillOpacity: 0.85,
                  weight: 1,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{marker.name}</div>
                    <div>
                      {style.emoji} {style.label}
                    </div>
                    {marker.aqi != null && (
                      <div className="font-mono">AQI {marker.aqi}</div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
      <Legend />
    </Card>
  );
}
