import { useDashboard } from "../lib/api";
import { City } from "../lib/types";
import { Skeleton, Card, Badge } from "../components/ui";
import { Activity, ShieldAlert, AlertTriangle, Info, MapPin } from "lucide-react";
import { MetricCard, ActionQueue, HealthPanel, SimulatorSummaryPanel, AnalyticsCharts } from "../components/CommandCenterWidgets";
import { WardMap } from "../components/WardMap";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export function SmartCityCommandCenter({ city }: { city: City }) {
  const { data, isLoading, error, refetch } = useDashboard(city);
  
  // Need to fetch wards for the map
  const { data: wardsResponse } = useQuery({
    queryKey: ["wards", city.name],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/wards/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
  const wardsArray = wardsResponse?.wards ?? null;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle size={32} className="mx-auto mb-4 text-danger" />
        <h2 className="text-xl font-bold text-text-primary">Failed to load Command Center</h2>
        <p className="text-sm mt-2 text-text-secondary">{(error as Error)?.message || "Unknown error — ensure backend is running"}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90"
        >
          Retry
        </button>
      </Card>
    );
  }

  const SEVERITY_COLORS: Record<string, string> = {
    good: "text-green-500",
    moderate: "text-yellow-500",
    usg: "text-orange-500",
    unhealthy: "text-red-500",
    veryUnhealthy: "text-purple-500",
    hazardous: "text-rose-700",
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-text-primary">
            🏛️ Smart City Command Center
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Executive overview for <span className="font-semibold text-text-primary">{city.name}</span> municipal authorities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="animate-pulse">Live Sync Active</Badge>
          <span className="text-[10px] text-text-muted">{new Date(data.generated_at).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Current AQI" 
          value={data.live.aqi} 
          subtitle={data.live.severity.toUpperCase()} 
          icon={<Activity size={20} />} 
          valueColor={SEVERITY_COLORS[data.live.severity]}
        />
        <MetricCard 
          title="Critical Wards" 
          value={data.live.critical_wards} 
          subtitle="Risk Index > 20" 
          icon={<MapPin size={20} />} 
          valueColor="text-danger"
        />
        <MetricCard 
          title="Primary Culprit" 
          value={data.live.main_source} 
          subtitle="Top Causal Source" 
          icon={<ShieldAlert size={20} />} 
          valueColor="text-orange-600"
        />
        <MetricCard 
          title="Overall Validation" 
          value={data.validation.confidence} 
          subtitle="Model Confidence" 
          icon={<Info size={20} />} 
          valueColor="text-success"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Map & Health */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Map Section */}
          <Card padding={false} className="h-[450px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center bg-bg-base z-10">
              <h3 className="font-display font-bold text-lg">Ward Intelligence Map</h3>
              <Badge variant="outline" size="xs">GeoSpatial View</Badge>
            </div>
            <div className="flex-1 relative bg-slate-50">
              {wardsArray ? (
                <WardMap wards={wardsArray} selectedWard={null} onSelectWard={() => {}} />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Skeleton className="w-full h-full" /></div>
              )}
            </div>
          </Card>

          {/* Health & Simulation Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <HealthPanel data={data.health_summary} />
            <SimulatorSummaryPanel sim={data.simulation_summary} />
          </div>

          {/* Analytics Row */}
          <div className="h-[250px]">
            <AnalyticsCharts data={data} />
          </div>
        </div>

        {/* RIGHT COLUMN: Action Queue & Validation */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 min-h-[400px]">
            <ActionQueue actions={data.action_queue} />
          </div>
          
          <Card className="bg-bg-muted border-dashed border-2 border-border/60">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg"><Info size={20} className="text-text-muted" /></div>
              <div>
                <h3 className="font-bold text-sm text-text-primary mb-1">Ground Truth Validation</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  This panel is a placeholder and will be connected in Phase 5 to display sensor validation, coverage maps, and hardware health metrics.
                </p>
                <div className="mt-3 inline-block px-2 py-1 rounded bg-black/5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Pending Phase 5
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
