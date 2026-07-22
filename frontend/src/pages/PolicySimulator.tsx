import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDefaultPolicy, useSimulatePolicy } from "../lib/api";
import { Card, MotionCard, Skeleton, Badge } from "../components/ui";
import type { City, PolicyLevers, PolicySimulationResult } from "../lib/types";
import {
  Activity,
  Car,
  HardHat,
  Factory,
  Flame,
  Bus,
  ShieldAlert,
  TreePine,
  Home,
  Droplets,
  ArrowRight,
  HeartPulse,
  Banknote,
  RefreshCw,
  Scale
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from "recharts";
import debounce from "lodash.debounce";

const SEVERITY_COLORS: Record<string, string> = {
  good: "#22c55e",
  moderate: "#eab308",
  usg: "#f97316",
  unhealthy: "#ef4444",
  veryUnhealthy: "#a855f7",
  hazardous: "#881337",
};

export function PolicySimulator({ city }: { city: City }) {
  const { data: defaultPolicy, isLoading: isLoadingDefault, isError: isDefaultError } = useDefaultPolicy();
  const simulateMutation = useSimulatePolicy();
  
  const [levers, setLevers] = useState<PolicyLevers | null>(null);
  
  // Set initial levers when default loads
  useEffect(() => {
    if (defaultPolicy && !levers) {
      setLevers(defaultPolicy);
    }
  }, [defaultPolicy, levers]);

  // Debounced simulation trigger
  const runSimulation = useMemo(
    () =>
      debounce((currentLevers: PolicyLevers, currentCity: City) => {
        simulateMutation.mutate({ city: currentCity, levers: currentLevers });
      }, 500),
    [simulateMutation.mutate]
  );

  // Run simulation whenever levers change
  useEffect(() => {
    if (levers) {
      runSimulation(levers, city);
    }
    return () => {
      runSimulation.cancel();
    };
  }, [levers, city, runSimulation]);

  const updateLever = <K extends keyof PolicyLevers>(key: K, value: PolicyLevers[K]) => {
    if (!levers) return;
    setLevers((prev) => ({ ...prev!, [key]: value }));
  };

  const result = simulateMutation.data;
  const isSimulating = simulateMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-2xl font-extrabold text-text-primary">
            🎛️ Policy Simulator
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Test interventions safely in a deterministic, causal counterfactual environment for{" "}
            <span className="font-semibold text-text-primary">{city.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-primary/5 px-4 py-2 text-xs font-semibold text-primary shrink-0">
          <Activity size={14} />
          Downstream of DoWhy
        </div>
      </motion.div>

      {isLoadingDefault ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-96" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-96" />
          </div>
        </div>
      ) : isDefaultError || !levers ? (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <ShieldAlert size={40} className="text-danger opacity-60" />
          <h3 className="font-bold text-lg text-text-primary">Policy Simulator Unavailable</h3>
          <p className="text-sm text-text-secondary text-center max-w-md">Could not load policy configuration from the backend. Ensure the backend server is running.</p>
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90">
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* LEFT: Controls */}
          <div className="xl:col-span-4 space-y-6">
            <Card className="p-5" hover={false}>
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Scale size={16} /> Policy Levers
              </h3>

              <div className="space-y-6">
                <SliderControl
                  icon={<Car size={16} />} label="Traffic Reduction"
                  value={levers.traffic_reduction_pct}
                  onChange={(v) => updateLever("traffic_reduction_pct", v)}
                />
                <SliderControl
                  icon={<HardHat size={16} />} label="Construction Curtailment"
                  value={levers.construction_reduction_pct}
                  onChange={(v) => updateLever("construction_reduction_pct", v)}
                />
                <SliderControl
                  icon={<Factory size={16} />} label="Industrial Shutdown"
                  value={levers.industrial_reduction_pct}
                  onChange={(v) => updateLever("industrial_reduction_pct", v)}
                />
                <SliderControl
                  icon={<Flame size={16} />} label="Open Burning Enforcement"
                  value={levers.open_burning_reduction_pct}
                  onChange={(v) => updateLever("open_burning_reduction_pct", v)}
                />
                <SliderControl
                  icon={<Bus size={16} />} label="Public Transport Surge"
                  value={levers.public_transport_increase_pct}
                  onChange={(v) => updateLever("public_transport_increase_pct", v)}
                />

                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Toggles & Ordinances</h4>
                  <div className="space-y-3">
                    <ToggleControl label="Heavy Vehicle Ban" value={levers.vehicle_restriction_enabled} onChange={(v) => updateLever("vehicle_restriction_enabled", v)} />
                    <ToggleControl label="Full Construction Ban" value={levers.construction_ban_enabled} onChange={(v) => updateLever("construction_ban_enabled", v)} />
                    <ToggleControl label="Odd-Even Car Rationing" value={levers.odd_even_enabled} onChange={(v) => updateLever("odd_even_enabled", v)} />
                    <ToggleControl label="Deploy Anti-Smog Guns" value={levers.anti_smog_guns_enabled} onChange={(v) => updateLever("anti_smog_guns_enabled", v)} />
                    <ToggleControl label="Work-from-Home Advisory" value={levers.work_from_home_enabled} onChange={(v) => updateLever("work_from_home_enabled", v)} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1">
                    <TreePine size={14} /> Long-term
                  </h4>
                  <div className="flex gap-2">
                    {(["none", "low", "medium", "high"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => updateLever("tree_plantation_level", lvl)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors border ${
                          levers.tree_plantation_level === lvl
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-white text-text-secondary border-border hover:bg-bg-muted"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      runSimulation.cancel();
                      simulateMutation.mutate({ city, levers });
                    }}
                    disabled={isSimulating}
                    className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSimulating ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Activity size={16} />
                    )}
                    {isSimulating ? "Simulating..." : "Run Simulation"}
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT: Results */}
          <div className="xl:col-span-8 space-y-6">
            {simulateMutation.isError ? (
              <Card className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4">
                <ShieldAlert className="text-danger" size={40} />
                <h3 className="font-bold text-text-primary">Simulation Failed</h3>
                <p className="text-sm text-center text-text-secondary max-w-sm">
                  Requires prior causal analysis. Navigate to <strong>Causal Prosecutor</strong> first to run DoWhy inference, then return here.
                </p>
                <button
                  onClick={() => simulateMutation.mutate({ city, levers: levers! })}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Retry Simulation
                </button>
              </Card>
            ) : !result || result.baseline_aqi === 0 ? (
              <Card className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4 text-text-muted">
                {isSimulating ? (
                  <>
                    <RefreshCw className="animate-spin" size={32} />
                    <p className="text-sm">Running causal simulation…</p>
                  </>
                ) : !result ? (
                  <>
                    <Activity size={32} className="opacity-40" />
                    <p className="text-sm font-semibold">Adjust any lever to run a simulation</p>
                    <p className="text-xs opacity-60">Results will appear here once a lever is moved.</p>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={32} className="opacity-40 text-danger" />
                    <p className="text-sm font-semibold text-danger">Live data unavailable</p>
                    <p className="text-xs opacity-60 max-w-xs text-center">We cannot run the simulation because live AQI data for this city is currently unavailable. Please check backend sensors.</p>
                  </>
                )}
              </Card>
            ) : (
              <>
                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AQI Comparison Card */}
                  <MotionCard delay={0.1} className="relative overflow-hidden p-0">
                    {isSimulating && (
                      <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <RefreshCw className="animate-spin text-primary" size={24} />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Baseline AQI</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-display font-extrabold text-text-primary">
                              {result.baseline_aqi}
                            </span>
                            <Badge variant="outline" size="xs">Current</Badge>
                          </div>
                        </div>
                        <ArrowRight size={24} className="text-text-muted mt-2 opacity-30" />
                        <div className="text-right">
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider text-right">Simulated AQI</p>
                          <div className="flex items-baseline justify-end gap-2 mt-1">
                            <Badge variant="success" size="xs">Projected</Badge>
                            <span className="text-4xl font-display font-extrabold" style={{ color: SEVERITY_COLORS[result.simulated_severity] }}>
                              {result.simulated_aqi}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Big Progress Bar for delta */}
                      <div className="relative h-3 rounded-full bg-border overflow-hidden">
                        <motion.div
                          className="absolute top-0 left-0 h-full rounded-full"
                          style={{ backgroundColor: SEVERITY_COLORS[result.baseline_severity] }}
                          initial={{ width: "100%" }}
                          animate={{ width: "100%" }}
                        />
                        <motion.div
                          className="absolute top-0 right-0 h-full bg-white opacity-40 transition-all duration-700 ease-out"
                          style={{ width: `${Math.min(100, (result.aqi_improvement / Math.max(1, result.baseline_aqi)) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-sm font-bold text-success flex items-center justify-center gap-1">
                          <ArrowRight className="rotate-90" size={14} />
                          {result.aqi_improvement} points ({result.improvement_pct}%) improvement
                        </span>
                      </div>
                    </div>
                  </MotionCard>

                  {/* Health & Economics Card */}
                  <MotionCard delay={0.2} className="p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <HeartPulse size={14} className="text-danger" /> Health Impact
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-text-secondary">Hospitalisation Rate</span>
                          <span className="text-sm font-bold text-success">-{result.health_impact.hospitalisation_reduction_pct}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-text-secondary">PM2.5 Exposure Drop</span>
                          <span className="text-sm font-bold text-text-primary">{result.health_impact.pm25_equivalent_drop} µg/m³</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border">
                      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Banknote size={14} className="text-orange-500" /> Economic Cost
                      </h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-orange-600">₹{result.total_cost_lakhs}</span>
                        <span className="text-xs font-bold text-orange-500 uppercase">Lakhs / day</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-1 leading-tight">
                        Calculated based on active levers ({result.active_levers.length} active). Confidence: {result.confidence_pct}%
                      </p>
                    </div>
                  </MotionCard>
                </div>

                {/* Chart Row */}
                <MotionCard delay={0.3} className="p-6">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-6">
                    Source Contribution (Before vs After)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={result.source_results}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="source_name" type="category" width={150} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          cursor={{ fill: 'transparent' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#6B7280' }} />
                        <Bar dataKey="original_aqi_contribution" name="Baseline AQI" fill="#E5E7EB" radius={[0, 4, 4, 0]} barSize={12} />
                        <Bar dataKey="simulated_aqi_contribution" name="Simulated AQI" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </MotionCard>

                {/* Most/Least Effective summary */}
                {(result.most_effective_lever || result.least_effective_lever) && (
                  <MotionCard delay={0.4} className="p-4 bg-bg-muted border-none">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.most_effective_lever && (
                        <div className="flex items-start gap-3">
                          <div className="mt-1 bg-success/10 text-success p-1.5 rounded-lg"><Activity size={16} /></div>
                          <div>
                            <p className="text-[10px] font-bold text-success uppercase tracking-wider">Most Effective</p>
                            <p className="text-sm font-semibold text-text-primary">{result.most_effective_lever.lever_label}</p>
                            <p className="text-xs text-text-secondary">Dropped AQI by {result.most_effective_lever.aqi_drop}</p>
                          </div>
                        </div>
                      )}
                      {result.least_effective_lever && (
                        <div className="flex items-start gap-3">
                          <div className="mt-1 bg-warning/10 text-warning p-1.5 rounded-lg"><Activity size={16} /></div>
                          <div>
                            <p className="text-[10px] font-bold text-warning uppercase tracking-wider">Least Effective</p>
                            <p className="text-sm font-semibold text-text-primary">{result.least_effective_lever.lever_label}</p>
                            <p className="text-xs text-text-secondary">Dropped AQI by {result.least_effective_lever.aqi_drop}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </MotionCard>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents

function SliderControl({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
          <span className="text-text-muted">{icon}</span> {label}
        </label>
        <span className="text-xs font-mono font-bold text-primary">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}

function ToggleControl({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>
      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-primary' : 'bg-border'}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-4.5' : 'translate-x-1'}`} />
      </div>
      {/* Hidden checkbox for accessibility */}
      <input type="checkbox" className="sr-only" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
