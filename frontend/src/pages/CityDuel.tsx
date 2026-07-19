import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiveData, CausalData } from "../lib/types";
import { getSeverity, severityColor, severityLabel } from "../lib/aqi";
import { mockLive, mockCausal } from "../lib/mock";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "/api";
const FETCH_TIMEOUT = 30000;

/* ── types ── */
type CityEntry = { name: string; lat: number; lon: number };
type SearchResult = { name: string; display_name: string; lat: number; lon: number };

const SOURCE_COLORS: Record<string, string> = {
  Traffic: "#f97316", Industry: "#6366f1", Fires: "#ef4444",
  Fire: "#ef4444", Burning: "#ef4444", Inversion: "#06b6d4",
  Winter: "#8b5cf6", Default: "#94a3b8",
};
function srcColor(name: string) {
  for (const k of Object.keys(SOURCE_COLORS))
    if (name.toLowerCase().includes(k.toLowerCase())) return SOURCE_COLORS[k];
  return SOURCE_COLORS.Default;
}

const WHO = { pm25: 15, pm10: 45, no2: 25 };

async function fetchWithFallback<T>(url: string, fallback: () => T, timeout = FETCH_TIMEOUT): Promise<T> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) return fallback();
    return (await r.json()) as T;
  } catch { return fallback(); }
  finally { clearTimeout(tid); }
}

async function fetchLive(city: CityEntry): Promise<LiveData> {
  return fetchWithFallback(
    `${API_BASE}/live/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`,
    () => mockLive(city.name)
  );
}
async function fetchCausal(city: CityEntry): Promise<CausalData> {
  return fetchWithFallback(
    `${API_BASE}/causal/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`,
    () => mockCausal(city.name), 120000
  );
}

/* ── Sparkline ── */
function Sparkline({ data, color, w = 160, h = 40 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (!data || data.length < 2) return null;
  const pad = 3;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = pad + (1 - (v - min) / range) * (h - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const gradId = `duel-sg-${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline points={pts.join(" ")} fill="none"
        stroke={`url(#${gradId})`} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Pollutant Bar ── */
function PollutantBar({ label, val, unit, limit, color }: {
  label: string; val: number; unit: string; limit: number; color: string;
}) {
  const pct = Math.min((val / Math.max(limit * 3, val)) * 100, 100);
  const over = val > limit;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className={`text-xs font-mono font-bold ${over ? "text-red-500" : "text-slate-600"}`}>
          {val.toFixed(1)} <span className="font-normal opacity-60">{unit}</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: over ? "#ef4444" : color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>0</span>
        <span className="text-amber-500">WHO {limit}</span>
        <span>{Math.max(limit * 3, Math.ceil(val / 10) * 10)}</span>
      </div>
    </div>
  );
}

/* ── Culprit Row ── */
function CulpritRow({ icon, name, pct, drop, label }: {
  icon: string; name: string; pct: number; drop?: number; label?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">{icon}</span>
        <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{name}</span>
        <span className="text-xs font-bold rounded-full px-2 py-0.5"
          style={{ backgroundColor: `${srcColor(name)}18`, color: srcColor(name) }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-7">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: srcColor(name) }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      {drop != null && label && (
        <p className="text-[10px] text-slate-400 italic ml-7">
          Remove → AQI −{drop} · {label}
        </p>
      )}
    </div>
  );
}

/* ── City Panel ── */
function CityPanel({ city, side }: { city: CityEntry; side: "left" | "right" }) {
  const [live, setLive] = useState<LiveData | null>(null);
  const [causal, setCausal] = useState<CausalData | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [causalLoading, setCausalLoading] = useState(true);

  useEffect(() => {
    setLive(null); setCausal(null);
    setLiveLoading(true); setCausalLoading(true);
    fetchLive(city).then(d => { setLive(d); setLiveLoading(false); });
    fetchCausal(city).then(d => { setCausal(d); setCausalLoading(false); });
  }, [city.name]);

  const sev = live ? getSeverity(live.aqi) : "moderate";
  const color = severityColor(sev);
  const isLeft = side === "left";

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-5 min-w-0"
    >
      {/* City Header */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}dd, ${color}88)`,
          boxShadow: `0 8px 32px ${color}40`,
        }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative">
          <h2 className="text-2xl font-extrabold tracking-tight">{city.name}</h2>
          <p className="text-white/70 text-sm font-medium mt-0.5">{severityLabel(sev)}</p>
          {liveLoading ? (
            <div className="mt-3 h-12 w-28 rounded-xl bg-white/20 animate-pulse" />
          ) : live ? (
            <div className="mt-3 flex items-end gap-3">
              <span className="text-5xl font-black tracking-tight">{live.aqi}</span>
              <div className="mb-1">
                <span className="text-white/60 text-sm">AQI</span>
                {live.stationAqi != null && (
                  <p className="text-white/50 text-[11px]">Station: {live.stationAqi}</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* PM2.5 Sparkline card */}
      {!liveLoading && live?.pm25?.sparkline?.length ? (
        <div className="rounded-2xl bg-white/90 border border-white/40 p-4"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">PM2.5 Trend (12h)</p>
          <div className="flex items-center gap-3">
            <Sparkline data={live.pm25.sparkline} color={color} w={200} h={48} />
            <div className="text-right">
              <p className="text-xl font-black text-slate-800">{live.pm25.value}</p>
              <p className="text-[10px] text-slate-400">{live.pm25.unit}</p>
            </div>
          </div>
        </div>
      ) : liveLoading ? (
        <div className="rounded-2xl bg-slate-100 animate-pulse h-24" />
      ) : null}

      {/* Pollutant Bars */}
      <div className="rounded-2xl bg-white/90 border border-white/40 p-4 space-y-4"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pollutants vs WHO</p>
        {liveLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : live ? (
          <>
            <PollutantBar label="PM2.5" val={live.pm25.value} unit={live.pm25.unit} limit={WHO.pm25} color={color} />
            <PollutantBar label="PM10"  val={live.pm10.value} unit={live.pm10.unit} limit={WHO.pm10} color={color} />
            <PollutantBar label="NO₂"   val={live.no2.value}  unit={live.no2.unit}  limit={WHO.no2}  color={color} />
            <PollutantBar label="CO"    val={live.co?.value ?? 0}  unit={live.co?.unit ?? "mg/m³"}  limit={4}   color={color} />
            <PollutantBar label="O₃"    val={live.o3?.value ?? 0}  unit={live.o3?.unit ?? "µg/m³"}  limit={100} color={color} />
          </>
        ) : null}
      </div>

      {/* Weather */}
      {!liveLoading && live?.weather && (
        <div className="rounded-2xl bg-white/90 border border-white/40 p-4"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Weather Conditions</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🌡", label: "Temperature", val: `${live.weather.temperature}°C` },
              { icon: "💧", label: "Humidity",    val: `${live.weather.humidity}%` },
              { icon: "🌬", label: "Wind Speed",  val: `${live.weather.windSpeed} km/h` },
              { icon: "🧭", label: "Wind Dir",    val: live.weather.windDirLabel },
            ].map(({ icon, label, val }) => (
              <div key={label} className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-lg leading-none">{icon}</p>
                <p className="text-[10px] text-slate-400 mt-1">{label}</p>
                <p className="text-sm font-bold text-slate-700">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Causal Attribution */}
      <div className="rounded-2xl bg-white/90 border border-white/40 p-4"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Causal Attribution</p>
        {causalLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : causal ? (
          <div className="space-y-4">
            {causal.culprits.map((c, i) => (
              <CulpritRow
                key={i}
                icon={c.icon}
                name={c.name}
                pct={c.pct}
                drop={causal.counterfactuals[i]?.aqiDrop}
                label={causal.counterfactuals[i]?.resultLabel}
              />
            ))}
          </div>
        ) : <p className="text-xs text-slate-400 italic">Loading causal model…</p>}
      </div>

      {/* Advisory */}
      {!liveLoading && live?.advisory && (
        <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1.5">Health Advisory</p>
          <p className="text-xs text-amber-900 leading-relaxed">{live.advisory.en}</p>
        </div>
      )}
    </motion.div>
  );
}

/* ── City Search ── */
function CitySearch({ onPick, exclude, placeholder }: {
  onPick: (c: CityEntry) => void;
  exclude: string[];
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) { setResults([]); setOpen(false); return; }
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      const data = await r.json();
      const list = Array.isArray(data) ? data : [];
      setResults(list); setOpen(list.length > 0);
    } catch { setResults([]); setOpen(false); }
    setBusy(false);
  }, []);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => search(q), 300);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [q, search]);

  const pick = (r: SearchResult) => {
    onPick({ name: r.name, lat: r.lat, lon: r.lon });
    setQ(r.name); setResults([]); setOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text" value={q} onChange={e => setQ(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && results[0] && !exclude.includes(results[0].name)) pick(results[0]); if (e.key === "Escape") setOpen(false); }}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        {busy ? "⟳" : "🔍"}
      </span>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            {results.map((r, i) => {
              const added = exclude.includes(r.name);
              return (
                <li key={i}>
                  <button type="button" disabled={added} onClick={() => pick(r)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${added ? "text-slate-400 bg-slate-50 cursor-not-allowed" : "hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"}`}>
                    <span className="font-semibold">{r.name}</span>
                    <span className="ml-2 text-xs text-slate-400">{r.display_name?.split(",").slice(1, 2).join("").trim()}</span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

/* ── VS Divider ── */
function VsDivider({ leftAqi, rightAqi, leftName, rightName }: {
  leftAqi: number | null; rightAqi: number | null;
  leftName: string; rightName: string;
}) {
  const winner = leftAqi != null && rightAqi != null
    ? (leftAqi < rightAqi ? leftName : rightAqi < leftAqi ? rightName : null)
    : null;

  return (
    <div className="flex flex-col items-center justify-center gap-3 shrink-0 px-2">
      <div className="w-px flex-1 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
      <div className="rounded-full bg-white border-2 border-slate-200 px-3 py-2 shadow-md">
        <span className="text-sm font-black text-slate-400">VS</span>
      </div>
      {winner && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-full bg-green-50 border border-green-200 px-2 py-1 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-green-600">Cleaner Air</p>
          <p className="text-[11px] font-bold text-green-700 truncate max-w-[60px]">{winner}</p>
        </motion.div>
      )}
      <div className="w-px flex-1 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
    </div>
  );
}

/* ── AI Insight Banner ── */
function InsightBanner({ cityA, cityB, liveA, liveB, causalA, causalB }: {
  cityA: CityEntry; cityB: CityEntry;
  liveA: LiveData | null; liveB: LiveData | null;
  causalA: CausalData | null; causalB: CausalData | null;
}) {
  if (!liveA || !liveB) return null;
  const diff = Math.abs(liveA.aqi - liveB.aqi);
  const worse = liveA.aqi > liveB.aqi ? cityA.name : cityB.name;
  const better = liveA.aqi > liveB.aqi ? cityB.name : cityA.name;
  const ratio = (Math.max(liveA.aqi, liveB.aqi) / Math.min(liveA.aqi, liveB.aqi)).toFixed(1);

  const culpA = causalA?.culprits?.[0];
  const culpB = causalB?.culprits?.[0];
  const sharedCulprit = culpA && culpB && culpA.name === culpB.name;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-2">🤖 AI Comparative Insight</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <span className="text-sm font-medium text-indigo-900">
          {worse}'s AQI is <strong>{ratio}×</strong> higher than {better}'s — a difference of <strong>{diff} points</strong>.
        </span>
        {sharedCulprit && culpA && (
          <span className="text-sm font-medium text-indigo-900">
            Both cities share <strong>{culpA.name}</strong> as the primary pollution driver.
          </span>
        )}
        {!sharedCulprit && culpA && culpB && (
          <span className="text-sm font-medium text-indigo-900">
            {cityA.name}'s top source is <strong>{culpA.name}</strong>; {cityB.name}'s is <strong>{culpB.name}</strong>.
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Export ── */
export function CityDuel() {
  const [cityA, setCityA] = useState<CityEntry | null>({ name: "Delhi", lat: 28.6139, lon: 77.2090 });
  const [cityB, setCityB] = useState<CityEntry | null>({ name: "Chandigarh", lat: 30.7333, lon: 76.7794 });

  // track live data at parent for VS divider + insight banner
  const [liveA, setLiveA] = useState<LiveData | null>(null);
  const [liveB, setLiveB] = useState<LiveData | null>(null);
  const [causalA, setCausalA] = useState<CausalData | null>(null);
  const [causalB, setCausalB] = useState<CausalData | null>(null);

  useEffect(() => {
    if (!cityA) return;
    setLiveA(null); setCausalA(null);
    fetchLive(cityA).then(setLiveA);
    fetchCausal(cityA).then(setCausalA);
  }, [cityA?.name]);

  useEffect(() => {
    if (!cityB) return;
    setLiveB(null); setCausalB(null);
    fetchLive(cityB).then(setLiveB);
    fetchCausal(cityB).then(setCausalB);
  }, [cityB?.name]);

  const excludeA = cityB ? [cityB.name] : [];
  const excludeB = cityA ? [cityA.name] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚖️</span>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary leading-tight tracking-tight">
              City Duel
              <span className="ml-2 text-xs font-semibold text-text-muted uppercase tracking-widest align-middle">
                Split-Screen Air Compare
              </span>
            </h1>
            <p className="text-xs text-text-muted">Pick any 2 cities — full data side by side</p>
          </div>
        </div>
      </motion.div>

      {/* City pickers */}
      <div className="grid grid-cols-2 gap-4 items-center">
        <CitySearch onPick={setCityA} exclude={excludeA} placeholder="City A (e.g. Delhi)…" />
        <CitySearch onPick={setCityB} exclude={excludeB} placeholder="City B (e.g. Chandigarh)…" />
      </div>

      {/* AI Insight */}
      <InsightBanner
        cityA={cityA ?? { name: "", lat: 0, lon: 0 }}
        cityB={cityB ?? { name: "", lat: 0, lon: 0 }}
        liveA={liveA} liveB={liveB} causalA={causalA} causalB={causalB}
      />

      {/* Split panels */}
      {cityA && cityB ? (
        <div className="grid gap-4"
          style={{ gridTemplateColumns: "1fr auto 1fr" }}>
          <CityPanel key={`A-${cityA.name}`} city={cityA} side="left" />
          <VsDivider
            leftAqi={liveA?.aqi ?? null} rightAqi={liveB?.aqi ?? null}
            leftName={cityA.name} rightName={cityB.name}
          />
          <CityPanel key={`B-${cityB.name}`} city={cityB} side="right" />
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="text-slate-400 text-sm">Search and select two cities above to compare</p>
        </div>
      )}
    </div>
  );
}
