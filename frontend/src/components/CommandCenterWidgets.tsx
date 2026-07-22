import { Card, Badge } from "./ui";
import { Activity, MapPin, Users, HeartPulse, Building, TriangleAlert, ShieldAlert, CheckCircle, TrendingDown, RefreshCw } from "lucide-react";
import type { DashboardData } from "../lib/types";

/* ── Metric Card ── */
export function MetricCard({ title, value, subtitle, icon, valueColor = "text-text-primary" }: { title: string, value: string | number, subtitle: string, icon: React.ReactNode, valueColor?: string }) {
  return (
    <Card className="p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider">{title}</div>
        <div className="text-text-secondary">{icon}</div>
      </div>
      <div>
        <div className={`text-3xl font-display font-extrabold ${valueColor}`}>{value}</div>
        <div className="text-xs text-text-secondary mt-1">{subtitle}</div>
      </div>
    </Card>
  );
}

/* ── Action Queue ── */
export function ActionQueue({ actions }: { actions: DashboardData["action_queue"] }) {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 p-5 pb-0">
        <CheckCircle size={18} className="text-primary" />
        <h3 className="font-display font-bold text-lg">Municipal Action Queue</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
        {actions.map((act, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-bg-base">
            <div className={`mt-0.5 p-1.5 rounded-lg text-white ${act.priority === 'Critical' ? 'bg-danger' : act.priority === 'High' ? 'bg-warning' : 'bg-success'}`}>
              <Activity size={14} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-sm font-bold">{act.action}</span>
                <span className="text-xs font-mono font-semibold text-text-muted">{act.implementation_time_label}</span>
              </div>
              <div className="text-xs text-text-secondary mt-1 line-clamp-2">{act.description}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" size="xs">{act.department}</Badge>
                <Badge variant="outline" size="xs">₹{act.cost_inr_lakhs}L</Badge>
              </div>
            </div>
          </div>
        ))}
        {actions.length === 0 && (
          <div className="text-sm text-text-muted text-center py-4">No pending actions.</div>
        )}
      </div>
    </Card>
  );
}

/* ── Health Panel ── */
export function HealthPanel({ data }: { data: DashboardData["health_summary"] }) {
  const isHigh = data.risk_category === "High";
  return (
    <Card className={`h-full border ${isHigh ? 'border-danger/30 bg-danger/5' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HeartPulse size={18} className={isHigh ? "text-danger" : "text-primary"} />
          <h3 className="font-display font-bold text-lg">Public Health Risk</h3>
        </div>
        <Badge variant={isHigh ? "danger" : "success"}>{data.risk_category} Risk</Badge>
      </div>
      
      <div className="space-y-4 mt-6">
        <div>
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Population at Risk (High-Risk Wards)</div>
          <div className="text-2xl font-extrabold text-text-primary">{(data.population_at_risk / 100000).toFixed(2)} Lakhs</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-lg border border-border flex items-center gap-3">
            <Building size={20} className="text-success" />
            <div>
              <div className="text-lg font-bold">{data.hospitals_affected}</div>
              <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Hospitals</div>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-border flex items-center gap-3">
            <Users size={20} className="text-primary" />
            <div>
              <div className="text-lg font-bold">{data.schools_affected}</div>
              <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Schools</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── Simulator Summary Panel ── */
export function SimulatorSummaryPanel({ sim }: { sim: DashboardData["simulation_summary"] }) {
  if (!sim) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-text-muted">
        <RefreshCw size={24} className="animate-spin mb-2 opacity-50" />
        <p className="text-sm">Simulation not available</p>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-slate-900 text-white border-none flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown size={18} className="text-blue-400" />
        <h3 className="font-display font-bold text-lg text-white">Policy Impact Projection</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
        <div className="bg-slate-800/50 p-4 rounded-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Quo</div>
          <div className="text-3xl font-extrabold">{sim.baseline_aqi}</div>
          <Badge variant="outline" size="xs" className="mt-2 bg-slate-800 border-slate-700 text-slate-300">AQI Current</Badge>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
          <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1">If Actions Taken</div>
          <div className="text-3xl font-extrabold text-blue-400">{sim.simulated_aqi}</div>
          <Badge variant="outline" size="xs" className="mt-2 bg-blue-900/50 border-blue-800 text-blue-300">-{sim.aqi_improvement} AQI</Badge>
        </div>
      </div>

      {sim.most_effective_lever && (
        <div className="bg-slate-800/80 rounded-lg p-3 flex items-start gap-3 text-sm">
          <div className="text-blue-400 mt-0.5"><ShieldAlert size={16} /></div>
          <div>
            <div className="font-bold text-slate-200">Most Effective Lever</div>
            <div className="text-slate-400 text-xs mt-0.5">{sim.most_effective_lever.lever_label}</div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── Analytics Charts Panel ── */
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function AnalyticsCharts({ data }: { data: DashboardData }) {
  const chartData = data?.culprits?.map(c => ({
    name: c.name.split(" ")[0], // Keep it short for the YAxis
    val: Math.round(c.pct)
  })) || [];

  return (
    <Card className="h-full flex flex-col p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display font-bold text-lg">Analytics Overview</h3>
        <Badge variant="outline" size="xs">Source Contributions</Badge>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: 'transparent' }} />
            <Bar dataKey="val" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
