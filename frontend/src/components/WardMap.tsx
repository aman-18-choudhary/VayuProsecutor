import { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";

/* ── Map FlyTo Helper ──────────────────────────────────── */
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export function WardMap({ wards, selectedWard, onSelectWard }: any) {
  const [activeLayer, setActiveLayer] = useState<"aqi" | "risk">("aqi");

  if (!wards || !wards.length) return null;

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return "#22C55E";
    if (aqi <= 100) return "#EAB308";
    if (aqi <= 150) return "#F97316";
    if (aqi <= 200) return "#EF4444";
    if (aqi <= 300) return "#8B5CF6";
    return "#831843";
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 30) return "#22C55E";
    if (risk <= 60) return "#EAB308";
    if (risk <= 80) return "#EF4444";
    return "#831843";
  };

  const selectedFeature = wards.find((w: any) => w.id === selectedWard);
  const center: [number, number] | null = selectedFeature ? [selectedFeature.lat, selectedFeature.lon] : (wards[0] ? [wards[0].lat, wards[0].lon] : null);

  const style = (feature: any) => {
    const isSelected = feature.properties.id === selectedWard;
    const fillColor = activeLayer === "aqi" 
      ? getAqiColor(feature.properties.aqi) 
      : getRiskColor(feature.properties.risk_index);
      
    return {
      fillColor,
      weight: isSelected ? 4 : 1,
      opacity: 1,
      color: isSelected ? "#000" : "rgba(255,255,255,0.8)",
      dashArray: feature.properties.is_estimated ? "5" : "",
      fillOpacity: isSelected ? 0.8 : 0.4,
      className: isSelected ? "animate-pulse-slow" : "transition-all duration-300 hover:fill-opacity-80"
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
    <div className="relative h-full w-full">
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-sm border border-border">
        <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2">Map Layers</div>
        <button 
          onClick={() => setActiveLayer("aqi")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeLayer === 'aqi' ? 'bg-primary text-white' : 'hover:bg-bg-muted'}`}
        >
          AQI Heatmap
        </button>
        <button 
          onClick={() => setActiveLayer("risk")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeLayer === 'risk' ? 'bg-danger text-white' : 'hover:bg-bg-muted'}`}
        >
          Vulnerability Risk
        </button>
      </div>

      <MapContainer
        center={center || [28.61, 77.23]}
        zoom={11}
        zoomControl={false}
        style={{ height: "100%", width: "100%", background: "#f8fafc", zIndex: 0 }}
      >
        <MapController center={center} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap"
        />
        <GeoJSON
          key={activeLayer}
          data={geoJsonData as any}
          style={style}
          onEachFeature={(feature, layer) => {
            const p = feature.properties;
            const riskLabel = p.risk_index > 70 ? "High" : p.risk_index > 40 ? "Moderate" : "Low";
            const popLabel = (p.population / 1000).toFixed(1) + "k";
            const aqiBg = getAqiColor(p.aqi);
            const content =
              '<div style="min-width:180px;font-family:Inter,sans-serif">' +
              '<div style="font-weight:800;font-size:15px;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">' + p.name + "</div>" +
              '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">' +
              '<span style="color:#64748b">AQI</span>' +
              '<span style="font-weight:bold;padding:2px 6px;border-radius:4px;background:' + aqiBg + ';color:white">' + p.aqi + "</span></div>" +
              '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">' +
              '<span style="color:#64748b">Risk Level</span>' +
              '<span style="font-weight:bold">' + riskLabel + "</span></div>" +
              '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">' +
              '<span style="color:#64748b">Population</span>' +
              '<span style="font-weight:bold">' + popLabel + "</span></div>" +
              '<div style="margin-top:8px;font-size:10px;color:#3b82f6;font-weight:bold;text-align:center">Click to investigate</div>' +
              "</div>";
            layer.bindTooltip(content, { sticky: true, className: "premium-tooltip" });
            layer.on({
              click: () => onSelectWard(feature.properties.id),
              mouseover: (e) => {
                const l = e.target;
                if (feature.properties.id !== selectedWard) {
                  l.setStyle({ fillOpacity: 0.7, weight: 2 });
                }
              },
              mouseout: (e) => {
                const l = e.target;
                if (feature.properties.id !== selectedWard) {
                  l.setStyle({ fillOpacity: 0.4, weight: 1 });
                }
              }
            });
          }}
        />
      </MapContainer>
    </div>
  );
}
