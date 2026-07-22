import { Server, Activity, CheckCircle, AlertCircle, Clock } from "lucide-react";

const SOURCES = [
  { name: "Open-Meteo API", type: "Weather", status: "Connected", ping: "45ms", health: 100, lastSync: "2 mins ago" },
  { name: "AQICN Provider", type: "Pollution", status: "Connected", ping: "120ms", health: 98, lastSync: "1 min ago" },
  { name: "NASA FIRMS", type: "Satellite/Fire", status: "Connected", ping: "350ms", health: 100, lastSync: "15 mins ago" },
  { name: "TomTom Traffic", type: "Mobility", status: "Warning", ping: "800ms", health: 85, lastSync: "5 mins ago", error: "Rate limit approaching" },
  { name: "Overpass (OSM)", type: "Geospatial", status: "Connected", ping: "60ms", health: 99, lastSync: "1 hour ago" }
];

export function DataSourcesTab() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-bold text-text-primary mb-1">Data Sources Integration</h3>
          <p className="text-sm text-text-secondary">Live connection status to external telemetry and APIs.</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-muted text-xs font-semibold hover:bg-bg-tertiary transition-colors border border-border">
          <Server size={14} /> Refresh Connections
        </button>
      </div>

      <div className="grid gap-4">
        {SOURCES.map(source => (
          <div key={source.name} className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-primary/50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                source.status === 'Connected' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}>
                {source.status === 'Connected' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <h4 className="font-semibold text-text-primary text-sm">{source.name}</h4>
                <p className="text-xs text-text-secondary">{source.type}</p>
                {source.error && <p className="text-[10px] text-warning mt-0.5">{source.error}</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-8 text-right">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold mb-0.5">Response Time</p>
                <p className="text-sm font-medium font-mono">{source.ping}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold mb-0.5">Health</p>
                <div className="flex items-center justify-end gap-1.5">
                  <div className="h-1.5 w-12 bg-bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${source.health > 90 ? 'bg-success' : 'bg-warning'}`} 
                      style={{ width: `${source.health}%` }} 
                    />
                  </div>
                  <p className="text-sm font-medium font-mono">{source.health}%</p>
                </div>
              </div>
              <div className="w-24">
                <p className="text-[10px] text-text-muted uppercase font-semibold mb-0.5">Last Sync</p>
                <p className="text-xs font-medium flex items-center justify-end gap-1">
                  <Clock size={12} /> {source.lastSync}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
