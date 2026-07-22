import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard, Card } from "../components/ui";
import { WardMap } from "../components/WardMap";
import { City } from "../lib/types";
import { 
  Activity, Users, Building, Truck, ShieldCheck, 
  HelpCircle, Search, X, School, Factory, Clock, AlertTriangle
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer 
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

/* ── Hooks ─────────────────────────────────────────────── */
function useWards(city: City) {
  const [data, setData] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    Promise.all([
      fetch(`${API_BASE}/wards/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`, { signal })
        .then((r) => { if (!r.ok) throw new Error(`HTTP error ${r.status}`); return r.json(); })
        .catch((e) => { console.error("Wards fetch failed:", e); return { wards: [] }; }),
      fetch(`${API_BASE}/ward-ranking/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`, { signal })
        .then((r) => { if (!r.ok) throw new Error(`HTTP error ${r.status}`); return r.json(); })
        .catch((e) => { console.error("Ranking fetch failed:", e); return { ranking: [] }; })
    ])
      .then(([wardsData, rankData]) => {
        if (!signal.aborted) {
          setData(wardsData);
          setRanking(rankData?.ranking || []);
        }
      })
      .catch(console.error)
      .finally(() => {
        clearTimeout(timeout);
        if (!signal.aborted) setLoading(false);
      });
      
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [city]);

  return { data, ranking, loading };
}

function useWardProfile(city: City, wardId: string | null) {
  const [profile, setProfile] = useState<any>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wardId) {
      setProfile(null);
      setRecs([]);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    Promise.all([
      fetch(`${API_BASE}/ward/${encodeURIComponent(city.name)}/${wardId}?lat=${city.lat}&lon=${city.lon}`, { signal })
        .then((r) => { if (!r.ok) throw new Error(`HTTP error ${r.status}`); return r.json(); })
        .catch((e) => { console.error("Profile fetch failed:", e); return null; }),
      fetch(`${API_BASE}/ward-recommendation/${encodeURIComponent(city.name)}/${wardId}?lat=${city.lat}&lon=${city.lon}`, { signal })
        .then((r) => { if (!r.ok) throw new Error(`HTTP error ${r.status}`); return r.json(); })
        .catch((e) => { console.error("Recs fetch failed:", e); return { recommendations: [] }; })
    ])
      .then(([p, r]) => {
        if (!signal.aborted) {
          setProfile(p);
          setRecs(r?.recommendations || []);
        }
      })
      .catch(console.error)
      .finally(() => {
        clearTimeout(timeout);
        if (!signal.aborted) setLoading(false);
      });
      
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [city, wardId]);

  return { profile, recs, loading };
}

/* ── Components ────────────────────────────────────────── */

function ScoreExplanationModal({ profile, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-display">Ward Intelligence Score Formula</h2>
          <button onClick={onClose} className="p-2 hover:bg-bg-muted rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <p className="text-text-secondary mb-6">
          The intelligence score (0-100) is a deterministic metric calculated using real-time geospatial factors. 
          Higher scores indicate better environmental health and lower citizen risk.
        </p>

        <div className="space-y-4 font-mono text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-text-muted">AQI Severity (35%)</span>
            <span className="font-bold text-primary">+{profile.score_breakdown?.aqi} pts</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-text-muted">Forecast Severity (20%)</span>
            <span className="font-bold text-primary">+{profile.score_breakdown?.forecast} pts</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-text-muted">Population Exposure (15%)</span>
            <span className="font-bold text-primary">+{profile.score_breakdown?.population} pts</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-text-muted">Schools Vulnerability (10%)</span>
            <span className="font-bold text-primary">+{profile.score_breakdown?.schools} pts</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-text-muted">Hospitals Vulnerability (10%)</span>
            <span className="font-bold text-primary">+{profile.score_breakdown?.hospitals} pts</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-text-muted">Industrial Density (5%)</span>
            <span className="font-bold text-primary">+{profile.score_breakdown?.industry} pts</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-text-muted">Traffic Density (5%)</span>
            <span className="font-bold text-primary">+{profile.score_breakdown?.traffic} pts</span>
          </div>
          <div className="flex justify-between pt-2 text-lg">
            <span className="font-bold font-display">Overall Score</span>
            <span className="font-bold text-success">{profile.score}/100</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileContent({ profile, recs }: { profile: any, recs: any[] }) {
  const [showScoreModal, setShowScoreModal] = useState(false);

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Overview & AI Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg">Intelligence Score</h3>
              <button onClick={() => setShowScoreModal(true)} className="text-text-muted hover:text-primary transition-colors">
                <HelpCircle size={18} />
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full border-8 border-primary flex items-center justify-center">
                <span className="text-3xl font-extrabold font-display text-primary">{profile.score}</span>
              </div>
              <div>
                <div className="text-sm text-text-secondary uppercase tracking-widest font-bold">Category</div>
                <div className="text-xl font-bold">{profile.category}</div>
                <div className="text-xs text-text-muted mt-2">Calculated from 7 geospatial factors.</div>
              </div>
            </div>
          </div>
          <button onClick={() => setShowScoreModal(true)} className="mt-6 text-xs text-primary font-semibold hover:underline self-start">
            How is this calculated?
          </button>
        </Card>

        {/* AI Explanation */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} className="text-primary" />
            <h3 className="font-display font-bold text-lg">AI Summary</h3>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            {profile.ai_explanation}
          </p>
        </Card>
      </div>

      {/* Citizen Risk & Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citizen Risk */}
        <Card>
          <h3 className="font-display font-bold text-lg mb-4">Citizen Risk Profile</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-text-secondary">Overall Health Risk</span>
                <span className="font-bold">{profile.risk_index}/100</span>
              </div>
              <div className="w-full bg-bg-muted rounded-full h-2">
                <div className="bg-danger h-2 rounded-full" style={{ width: `${profile.risk_index}%` }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg"><School size={16}/></div>
                <div>
                  <div className="text-xs text-text-muted">Schools</div>
                  <div className="font-bold">{profile.schools_count}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger/10 text-danger rounded-lg"><Activity size={16}/></div>
                <div>
                  <div className="text-xs text-text-muted">Hospitals</div>
                  <div className="font-bold">{profile.hospitals_count}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 text-warning rounded-lg"><Users size={16}/></div>
                <div>
                  <div className="text-xs text-text-muted">Population</div>
                  <div className="font-bold">{(profile.population/1000).toFixed(1)}k</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 text-success rounded-lg"><Factory size={16}/></div>
                <div>
                  <div className="text-xs text-text-muted">Industry</div>
                  <div className="font-bold">{profile.industrial_density}/10</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <h3 className="font-display font-bold text-lg mb-4">Pollution Source Breakdown</h3>
          <div className="space-y-3">
            {profile.causal_breakdown?.map((c: any, i: number) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold flex items-center gap-2">{c.icon} {c.source_name}</span>
                  <span className="font-bold">{c.responsibility_pct}%</span>
                </div>
                <div className="w-full bg-bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${c.responsibility_pct}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>Confidence: {c.confidence}</span>
                  <span>Impact: {c.aqi_reduction} AQI</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Interventions & Before/After */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8">
          <h3 className="font-display font-bold text-lg mb-4">Actionable Interventions</h3>
          <div className="space-y-4">
            {recs.map((r, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-white hover:border-primary/30 transition-all">
                <div>
                  <div className="font-bold text-sm mb-1">{r.intervention}</div>
                  <div className="flex gap-3 text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Building size={12}/> {r.department}</span>
                    <span className="flex items-center gap-1"><Clock size={12}/> {r.time}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center sm:text-right">
                  <div>
                    <div className="text-[10px] text-text-muted uppercase font-bold">Reduction</div>
                    <div className="font-bold text-success">-{r.aqi_reduction}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase font-bold">Confidence</div>
                    <div className="font-bold">{r.confidence}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase font-bold">Priority</div>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded ${r.priority === 'Critical' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                      {r.priority}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="lg:col-span-4 bg-bg-muted/50 flex flex-col justify-center items-center text-center">
          <h3 className="font-display font-bold text-lg mb-6">Before vs After</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <div className="text-xs font-bold text-text-muted uppercase mb-1">Current AQI</div>
              <div className="text-3xl font-extrabold text-danger">{profile.aqi}</div>
            </div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <div className="w-px h-8 bg-border"></div>
            </motion.div>
            <div className="text-center">
              <div className="text-xs font-bold text-text-muted uppercase mb-1">Projected AQI</div>
              <div className="text-3xl font-extrabold text-success">
                {profile.aqi - (recs[0]?.aqi_reduction || 0)}
              </div>
            </div>
            <div className="mt-4 text-xs text-text-secondary font-semibold">
              Assumes implementation of top intervention.
            </div>
          </div>
        </Card>
      </div>

      {/* Ward Timeline */}
      <Card>
        <h3 className="font-display font-bold text-lg mb-4">24-Hour Ward Timeline</h3>
        <div className="h-[250px] w-full">
          {profile.timeline && profile.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profile.timeline}>
                <defs>
                  <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString([],{hour:'2-digit'})} stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <RechartsTooltip 
                  labelFormatter={(v) => new Date(v).toLocaleString()}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="aqi" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorAqi)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-text-muted">No historical data available</div>
          )}
        </div>
      </Card>

      {/* Evidence & Confidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-lg">System Evidence</h3>
            <ShieldCheck size={18} className="text-success" />
          </div>
          <div className="space-y-2">
            {profile.evidence?.map((e: any, i: number) => (
              <div key={i} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                <span className="font-semibold text-text-secondary">{e.name}</span>
                <div className="flex gap-4">
                  <span className="text-text-muted">{e.confidence}</span>
                  <span className={e.status === 'ok' ? 'text-success font-bold' : 'text-danger font-bold'}>
                    {e.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-lg">Data Confidence</h3>
            <Activity size={18} className="text-primary" />
          </div>
          <div className="space-y-3">
            {profile.confidence && Object.entries(profile.confidence).map(([key, val]: [string, any], i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text-secondary capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-bold">{val}%</span>
                </div>
                <div className="w-full bg-bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {showScoreModal && <ScoreExplanationModal profile={profile} onClose={() => setShowScoreModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
export function WardIntelligence({ city }: { city: City }) {
  const { data, ranking, loading } = useWards(city);
  
  const [selectedWard1, setSelectedWard1] = useState<string | null>(null);
  const [selectedWard2, setSelectedWard2] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCompareMode, setIsCompareMode] = useState(false);

  const p1 = useWardProfile(city, selectedWard1);
  const p2 = useWardProfile(city, selectedWard2);

  useEffect(() => {
    if (ranking.length > 0 && !selectedWard1) {
      setSelectedWard1(ranking[0].id);
    }
  }, [ranking, selectedWard1]);

  if (loading && !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data || !data.wards || data.wards.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-text-muted">
        <AlertTriangle size={32} className="text-warning" />
        <p className="font-semibold">Unable to load geospatial data for {city.name}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold mt-2">Retry</button>
      </div>
    );
  }

  const filteredRanking = ranking.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleWardClick = (id: string) => {
    if (isCompareMode) {
      if (!selectedWard1) setSelectedWard1(id);
      else if (!selectedWard2 && id !== selectedWard1) setSelectedWard2(id);
      else setSelectedWard2(id); // replace second
    } else {
      setSelectedWard1(id);
      setSelectedWard2(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Ward Intelligence
          </h1>
          <p className="text-sm text-text-secondary">
            Enterprise-grade Geospatial Intelligence & Hyperlocal Interventions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary w-48 bg-white"
            />
          </div>
          <button 
            onClick={() => { setIsCompareMode(!isCompareMode); if(isCompareMode) setSelectedWard2(null); }}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${isCompareMode ? 'bg-primary text-white' : 'bg-bg-muted text-text-secondary hover:bg-bg-muted/80'}`}
          >
            Compare Mode
          </button>
        </div>
      </div>

      {/* Map & Ranking Split */}
      <div className="grid h-[500px] grid-cols-1 gap-6 lg:grid-cols-12">
        <MotionCard className="relative overflow-hidden p-0 lg:col-span-8 lg:order-1" delay={0.1}>
          <WardMap 
            wards={data.wards} 
            selectedWard={selectedWard1} 
            onSelectWard={handleWardClick} 
          />
          <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-sm text-xs font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live Geospatial Engine
          </div>
        </MotionCard>
        
        <MotionCard className="lg:col-span-4 lg:order-2 flex flex-col" delay={0.2}>
          <div className="mb-4">
            <h3 className="font-display text-lg font-bold">Ward Ranking</h3>
            <p className="text-xs text-text-muted">Ranked by overall severity</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
            {filteredRanking.map((w: any) => {
              const isSelected1 = selectedWard1 === w.id;
              const isSelected2 = selectedWard2 === w.id;
              const isSelected = isSelected1 || isSelected2;
              return (
                <div
                  key={w.id}
                  onClick={() => handleWardClick(w.id)}
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
                  {isCompareMode && isSelected && (
                    <div className="text-[10px] uppercase font-bold text-primary mt-1">
                      {isSelected1 ? "Selected 1" : "Selected 2"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </MotionCard>
      </div>

      {/* Profile Views */}
      <div className={`grid grid-cols-1 ${isCompareMode ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Ward 1 */}
        {selectedWard1 && (
          <AnimatePresence mode="wait">
            <motion.div key={selectedWard1} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-4">
                <h2 className="font-display text-2xl font-bold border-b border-border pb-2">{p1.profile?.name}</h2>
              </div>
              {p1.loading ? <div className="p-8 text-center text-text-muted">Loading advanced profile...</div> : (
                <ProfileContent profile={p1.profile} recs={p1.recs} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Ward 2 (Compare) */}
        {isCompareMode && selectedWard2 && (
          <AnimatePresence mode="wait">
            <motion.div key={selectedWard2} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-4 flex justify-between items-end border-b border-border pb-2">
                <h2 className="font-display text-2xl font-bold">{p2.profile?.name}</h2>
                <button onClick={() => setSelectedWard2(null)} className="text-text-muted hover:text-danger text-sm font-semibold flex items-center gap-1">
                  <X size={14}/> Close
                </button>
              </div>
              {p2.loading ? <div className="p-8 text-center text-text-muted">Loading advanced profile...</div> : (
                <ProfileContent profile={p2.profile} recs={p2.recs} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
        
        {isCompareMode && !selectedWard2 && (
          <div className="border-2 border-dashed border-border rounded-2xl flex items-center justify-center h-full min-h-[300px] text-text-muted">
            Select a second ward from the ranking panel to compare
          </div>
        )}
      </div>

    </div>
  );
}
