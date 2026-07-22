import { useSystemHealth, useSystemStatus } from "../../lib/api";
import { Activity, Server, Database, BrainCircuit, CheckCircle, RefreshCcw } from "lucide-react";

export function SystemHealthTab() {
  const { data: health, isLoading: healthLoading } = useSystemHealth();
  const { data: status, isLoading: statusLoading } = useSystemStatus();

  if (healthLoading || statusLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 text-text-muted">
          <RefreshCcw className="animate-spin" size={16} /> Fetching telemetry...
        </div>
      </div>
    );
  }

  const MetricCard = ({ title, value, icon, colorClass }: { title: string, value: string | number, icon: React.ReactNode, colorClass: string }) => (
    <div className="p-4 rounded-xl border border-border bg-bg-primary shadow-sm flex flex-col justify-between">
      <div className="flex items-center gap-2 text-text-secondary mb-4">
        {icon}
        <span className="text-xs font-bold uppercase">{title}</span>
      </div>
      <p className={`font-display text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-display font-bold text-text-primary mb-1">System Health</h3>
        <p className="text-sm text-text-secondary">Live telemetry from the VayuProsecutor engine.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="CPU Usage" value={health?.cpu_usage || "0%"} icon={<Activity size={16} />} colorClass="text-primary" />
        <MetricCard title="Memory Usage" value={health?.memory_usage || "0%"} icon={<Server size={16} />} colorClass="text-secondary" />
        <MetricCard title="Cache Entries" value={health?.cache_entries || 0} icon={<Database size={16} />} colorClass="text-success" />
        <MetricCard title="AI Models" value={health?.model_status || "Unknown"} icon={<BrainCircuit size={16} />} colorClass="text-amber-500" />
      </div>

      <div className="mt-8">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">Service Status</h4>
        <div className="bg-bg-primary border border-border rounded-xl divide-y divide-border">
          {[
            { name: "Frontend Client", status: status?.frontend },
            { name: "Backend API", status: status?.backend },
            { name: "In-Memory Database", status: status?.database },
            { name: "External APIs", status: status?.api_health },
          ].map((service, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <span className="text-sm font-semibold text-text-primary">{service.name}</span>
              <div className="flex items-center gap-2">
                {service.status?.includes("Connected") || service.status?.includes("Operational") || service.status?.includes("Healthy") ? (
                  <CheckCircle size={14} className="text-success" />
                ) : (
                  <Activity size={14} className="text-warning" />
                )}
                <span className="text-xs font-medium text-text-secondary">{service.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
