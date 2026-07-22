import React, { useEffect, useRef } from "react";
import { Alert } from "../../lib/types";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Card, Badge } from "../ui";
import { Maximize2, ShieldAlert } from "lucide-react";
import "leaflet/dist/leaflet.css";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#EF4444",
  High: "#F97316",
  Medium: "#EAB308",
  Low: "#3B82F6",
  Informational: "#9CA3AF",
};

function MapFitter({ alerts }: { alerts: Alert[] }) {
  const map = useMap();
  useEffect(() => {
    if (alerts.length > 0) {
      const lats = alerts.map(a => a.location.lat);
      const lons = alerts.map(a => a.location.lon);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lats) - 0.05, Math.min(...lons) - 0.05],
        [Math.max(...lats) + 0.05, Math.max(...lons) + 0.05],
      ];
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [alerts, map]);
  return null;
}

export function AlertMap({ alerts, onSelectAlert }: { alerts: Alert[]; onSelectAlert: (alert: Alert) => void }) {
  // Use first alert as initial center, or default to Delhi
  const center: [number, number] = alerts.length > 0 
    ? [alerts[0].location.lat, alerts[0].location.lon] 
    : [28.6139, 77.2090];

  return (
    <Card className="h-[400px] xl:h-full min-h-[400px] relative overflow-hidden p-0 border-none shadow-sm rounded-2xl group">
      <MapContainer 
        center={center} 
        zoom={11} 
        className="w-full h-full z-0" 
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">Carto</a>'
        />
        <MapFitter alerts={alerts} />
        {alerts.map((alert) => (
          <CircleMarker
            key={alert.id}
            center={[alert.location.lat, alert.location.lon]}
            radius={alert.severity === "Critical" ? 12 : 8}
            pathOptions={{
              color: SEVERITY_COLORS[alert.severity],
              fillColor: SEVERITY_COLORS[alert.severity],
              fillOpacity: 0.6,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onSelectAlert(alert),
            }}
          >
            <Popup className="custom-popup" closeButton={false}>
              <div className="p-1">
                <Badge variant={SEVERITY_COLORS[alert.severity] === "#EF4444" ? "danger" : "warning"} size="xs" className="mb-1">
                  {alert.severity}
                </Badge>
                <div className="font-bold text-sm mb-1">{alert.category}</div>
                <div className="text-xs text-text-secondary">{alert.ward}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Map Overlay Info */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
         <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm border border-border flex items-center gap-2 pointer-events-auto">
            <ShieldAlert size={16} className="text-primary" />
            <span className="text-xs font-bold text-text-primary">Live Threat Map</span>
         </div>
      </div>
      
      <button className="absolute bottom-4 right-4 z-[1000] p-2 bg-white rounded-xl shadow-md border border-border text-text-secondary hover:text-primary transition-colors">
        <Maximize2 size={18} />
      </button>
    </Card>
  );
}
