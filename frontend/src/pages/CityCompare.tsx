import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiveData, CausalData } from "../lib/types";
import { getSeverity, severityColor, severityLabel } from "../lib/aqi";
import { mockLive, mockCausal } from "../lib/mock";
import { searchCitiesLocal } from "../lib/cities";
import { Skeleton } from "../components/ui";

/* ── Constants ──────────────────────────────────────────────── */
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "/api";

const DEFAULT_CITIES: CityEntry[] = [
  { name: "Delhi",     lat: 28.6139, lon: 77.2090 },
  { name: "Mumbai",    lat: 19.0760, lon: 72.8777 },
  { name: "Kolkata",   lat: 22.5726, lon: 88.3639 },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Chennai",   lat: 13.0827, lon: 80.2707 },
  { name: "Hyderabad", lat: 17.3850, lon: 78.4867 },
];

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
const WHO_LIMITS = { pm25: 15, pm10: 45, no2: 25 };
const FETCH_TIMEOUT = 30000;

/* ── Types ──────────────────────────────────────────────────── */
type CityEntry  = { name: string; lat: number; lon: number };
type SearchHit  = { name: string; display_name: string; lat: number; lon: number };
type LiveMap    = Record<string, LiveData | null>;
type CausalMap  = Record<string, CausalData | null>;
type LoadingMap = Record<string, boolean>;

/* ── Fetch helpers ──────────────────────────────────────────── */
async function fetchWithFallback<T>(url: string, fallback: () => T, ms = FETCH_TIMEOUT): Promise<T> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) return fallback();
    return (await r.json()) as T;
  } catch { return fallback(); }
  finally { clearTimeout(tid); }
}
async function fetchCityLive(city: CityEntry): Promise<LiveData> {
  return fetchWithFallback(
    `${API_BASE}/live/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`,
    () => mockLive(city.name)
  );
}
async function fetchCityCausal(city: CityEntry): Promise<CausalData> {
  return fetchWithFallback(
    `${API_BASE}/causal/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`,
    () => mockCausal(city.name), 120000
  );
}

/* ── Search with local fallback ─────────────────────────────── */
async function searchCities(q: string): Promise<SearchHit[]> {
  if (!q || q.trim().length < 1) return [];
  try {
    const r = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch { /* fall through */ }
  // Always fall back to local data
  return searchCitiesLocal(q);
}

/* ── Sparkline ──────────────────────────────────────────────── */
function Sparkline({ data, color, w = 120, h = 32 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (!data || data.length < 2) return null;
  const pad = 2;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = pad + (1 - (v - min) / range) * (h - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const gid = `sg-${color.replace("#", "")}-${w}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline points={pts.join(" ")} fill="none"
        stroke={`url(#${gid})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── City Search Input ──────────────────────────────────────── */
function CitySearchInput({ onAdd, existing, placeholder = "Search and add a city…" }: {
  onAdd: (c: CityEntry) => void;
  existing: string[];
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    setBusy(true);
    const hits = await searchCities(query);
    setResults(hits);
    setOpen(hits.length > 0);
    setBusy(false);
  }, []);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => doSearch(q), 200);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [q, doSearch]);

  const pick = (r: SearchHit) => {
    if (!existing.includes(r.name)) onAdd({ name: r.name, lat: r.lat, lon: r.lon });
    setQ(""); setResults([]); setOpen(false);
  };

  return (
    <div className="relative flex-1 max-w-sm">
      <div className="relative">
        <input ref={inputRef} type="text" value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={e => {
            if (e.key === "Enter" && results[0] && !existing.includes(results[0].name)) pick(results[0]);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          {busy ? "⟳" : "🔍"}
        </span>
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            {results.map((r, i) => {
              const added = existing.includes(r.name);
              return (
                <li key={i}>
                  <button type="button" disabled={added} onClick={() => pick(r)}
                    className={["w-full text-left px-4 py-2.5 text-sm transition-colors",
                      added ? "text-slate-400 cursor-not-allowed bg-slate-50"
                            : "text-slate-700 hover:bg-primary/5 hover:text-primary cursor-pointer"
                    ].join(" ")}>
                    <span className="font-medium">{r.name}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {r.display_name?.split(",").slice(1, 3).join(",").trim()}
                    </span>
                    {added && <span className="ml-2 text-[10px] text-slate-400">(added)</span>}
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

/* ── City Card (grid view) ──────────────────────────────────── */
function CityCard({ city, live, causal, liveLoading, causalLoading, onRemove, canRemove, onDuel, index }: {
  city: CityEntry; live: LiveData | null; causal: CausalData | null;
  liveLoading: boolean; causalLoading: boolean;
  onRemove: () => void; canRemove: boolean;
  onDuel: () => void; index: number;
}) {
  const sev = live ? getSeverity(live.aqi) : "moderate";
  const color = severityColor(sev);
  const topCulprit = causal?.culprits?.[0] ?? null;
  const topCf = causal?.counterfactuals?.[0] ?? null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/40 p-4 flex flex-col gap-3 relative group"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.06)" }}>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
        <button onClick={onDuel} title="Duel compare"
          className="h-6 px-2 flex items-center gap-0.5 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 text-[10px] font-bold">
          ⚔️
        </button>
        {canRemove && (
          <button onClick={onRemove}
            className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500 text-xs font-bold">
            ✕
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 pr-16">
        <div>
          <h3 className="text-base font-bold text-text-primary leading-tight">{city.name}</h3>
          {liveLoading ? <Skeleton className="mt-1 h-5 w-16" /> : live ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: color }}>AQI {live.aqi}</span>
          ) : null}
        </div>
        {!liveLoading && live && (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: color }}>{severityLabel(sev)}</span>
        )}
      </div>

      {/* Sparkline */}
      {liveLoading ? <Skeleton className="h-8 w-full rounded-lg" />
        : live?.pm25?.sparkline?.length ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium shrink-0">PM2.5</span>
            <Sparkline data={live.pm25.sparkline} color={color} />
            <span className="text-[10px] font-mono text-slate-500 shrink-0">
              {live.pm25.value} {live.pm25.unit}
            </span>
          </div>
        ) : null}

      {/* Pollutant tags */}
      {liveLoading ? <Skeleton className="h-6 w-full rounded-lg" />
        : live ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: "PM2.5", val: live.pm25?.value, unit: live.pm25?.unit, limit: WHO_LIMITS.pm25 },
              { label: "PM10",  val: live.pm10?.value, unit: live.pm10?.unit, limit: WHO_LIMITS.pm10 },
              { label: "NO₂",   val: live.no2?.value,  unit: live.no2?.unit,  limit: WHO_LIMITS.no2  },
            ].map(({ label, val, unit, limit }) => (
              <span key={label} className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold border"
                style={val != null && val > limit
                  ? { backgroundColor: "#fef2f2", color: "#dc2626", borderColor: "#fca5a5" }
                  : { backgroundColor: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }}>
                <span className="font-bold">{label}</span>
                <span className="font-mono">{val != null ? val.toFixed(1) : "—"}</span>
                <span className="opacity-60">{unit}</span>
              </span>
            ))}
          </div>
        ) : null}

      {/* Culprit */}
      <div className="min-h-[2.5rem]">
        {causalLoading ? <Skeleton className="h-6 w-40 rounded-lg" />
          : topCulprit ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-lg leading-none">{topCulprit.icon}</span>
                <span className="text-xs font-semibold text-slate-700 leading-tight flex-1 truncate">{topCulprit.name}</span>
                <span className="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0"
                  style={{ backgroundColor: `${srcColor(topCulprit.name)}20`, color: srcColor(topCulprit.name) }}>
                  {topCulprit.pct}%
                </span>
              </div>
              {topCf && (
                <p className="text-[10px] italic text-slate-400 leading-tight pl-7">
                  Removing → AQI drops by {topCf.aqiDrop} ({topCf.resultLabel})
                </p>
              )}
            </div>
          ) : <span className="text-[10px] text-slate-400 italic">Causal analysis loading…</span>}
      </div>

      {/* Weather */}
      {liveLoading ? <Skeleton className="h-5 w-full rounded" />
        : live?.weather ? (
          <div className="flex items-center gap-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2 mt-auto">
            <span>🌬 {live.weather.windSpeed} km/h</span>
            <span>💧 {live.weather.humidity}%</span>
            <span>🌡 {live.weather.temperature}°C</span>
          </div>
        ) : null}

      {live?.updatedAt && (
        <p className="text-[9px] text-slate-400 -mt-1">
          ↻ {new Date(live.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
        </p>
      )}
    </motion.div>
  );
}

/* ── Leaderboard ────────────────────────────────────────────── */
function Leaderboard({ cities, liveData, prevAqi }: {
  cities: CityEntry[]; liveData: LiveMap; prevAqi: Record<string, number>;
}) {
  const ranked = [...cities]
    .filter(c => liveData[c.name] != null)
    .sort((a, b) => (liveData[b.name]?.aqi ?? 0) - (liveData[a.name]?.aqi ?? 0));

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/40 p-4"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Leaderboard — Worst Air First</p>
      <ol className="space-y-2">
        {ranked.map((city, i) => {
          const live = liveData[city.name]!;
          const color = severityColor(getSeverity(live.aqi));
          const prev = prevAqi[city.name];
          const delta = prev != null ? live.aqi - prev : null;
          return (
            <li key={city.name} className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-50 transition-colors">
              <span className="font-display text-sm font-extrabold text-slate-300 w-5 shrink-0 text-center">#{i + 1}</span>
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="flex-1 text-sm font-semibold text-text-primary truncate">{city.name}</span>
              {i === 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">WORST</span>
              )}
              <span className="font-mono text-sm font-bold shrink-0" style={{ color }}>{live.aqi}</span>
              {delta != null && Math.abs(delta) >= 1 && (
                <span className={`text-[10px] font-bold shrink-0 ${delta > 0 ? "text-red-500" : "text-green-500"}`}>
                  {delta > 0 ? `▲${Math.round(delta)}` : `▼${Math.round(Math.abs(delta))}`}
                </span>
              )}
            </li>
          );
        })}
        {ranked.length === 0 && <li className="text-xs text-slate-400 italic text-center py-4">Fetching city data…</li>}
      </ol>
    </div>
  );
}

/* ── Insights Strip ─────────────────────────────────────────── */
function InsightsStrip({ cities, liveData, causalData }: {
  cities: CityEntry[]; liveData: LiveMap; causalData: CausalMap;
}) {
  const available = cities.filter(c => liveData[c.name] != null);
  if (available.length < 2) return null;
  const insights: string[] = [];
  const sorted = [...available].sort((a, b) => (liveData[b.name]?.aqi ?? 0) - (liveData[a.name]?.aqi ?? 0));
  const worst = liveData[sorted[0].name]!, best = liveData[sorted[sorted.length - 1].name]!;
  if (worst.aqi > 0 && best.aqi > 0)
    insights.push(`${sorted[0].name}'s AQI is ${(worst.aqi / best.aqi).toFixed(1)}× ${sorted[sorted.length - 1].name}'s today`);
  const pm25Over = available.filter(c => (liveData[c.name]?.pm25?.value ?? 0) > WHO_LIMITS.pm25).length;
  if (pm25Over > 0) insights.push(`PM2.5 exceeds WHO limits in ${pm25Over} of ${available.length} cities`);
  const causalAvail = available.filter(c => causalData[c.name]?.culprits?.length);
  if (causalAvail.length >= 2) {
    const counts: Record<string, number> = {};
    for (const c of causalAvail) { const top = causalData[c.name]!.culprits[0].name; counts[top] = (counts[top] ?? 0) + 1; }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) insights.push(`"${top[0]}" is the primary culprit in ${top[1]} cities`);
  }
  if (!insights.length) return null;
  return (
    <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">AI Insights</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {insights.map((ins, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <span className="text-base leading-none">{"📊⚠️🔬"[i] ?? "💡"}</span>
            <span>{ins}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Attribution Stacked Bars ───────────────────────────────── */
function AttributionBars({ cities, causalData, causalLoading }: {
  cities: CityEntry[]; causalData: CausalMap; causalLoading: LoadingMap;
}) {
  return (
    <div className="space-y-3">
      {cities.map((city, i) => {
        const causal = causalData[city.name];
        if (causalLoading[city.name] || !causal) {
          return (
            <div key={city.name} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs font-semibold text-slate-600 text-right truncate">{city.name}</span>
              <div className="flex-1"><Skeleton className="h-5 w-full rounded-full" /></div>
            </div>
          );
        }
        const culprits = causal.culprits ?? [];
        const total = culprits.reduce((s, c) => s + c.pct, 0) || 100;
        return (
          <div key={city.name} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-semibold text-slate-600 text-right truncate">{city.name}</span>
            <div className="flex-1 h-5 rounded-full overflow-hidden flex">
              {culprits.map((c, ci) => (
                <motion.div key={ci} title={`${c.name}: ${c.pct}%`} className="h-full"
                  style={{ width: `${(c.pct / total) * 100}%`, backgroundColor: srcColor(c.name) }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.07 + ci * 0.03 }} />
              ))}
            </div>
            <span className="shrink-0 text-[10px] text-slate-400 w-20 truncate">
              {culprits[0]?.icon} {culprits[0]?.name?.split(" ")[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DUEL MODAL — split-screen compare for exactly 2 cities
   ═══════════════════════════════════════════════════════════════ */

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
        <motion.div className="h-full rounded-full" style={{ backgroundColor: over ? "#ef4444" : color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  );
}

function DuelSearchInput({ value, onChange, onPick, exclude, placeholder }: {
  value: string; onChange: (v: string) => void;
  onPick: (c: CityEntry) => void; exclude: string[]; placeholder: string;
}) {
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setBusy(true);
    const hits = await searchCities(q);
    setResults(hits); setOpen(hits.length > 0);
    setBusy(false);
  }, []);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => doSearch(value), 200);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [value, doSearch]);

  const pick = (r: SearchHit) => {
    onPick({ name: r.name, lat: r.lat, lon: r.lon });
    onChange(r.name); setResults([]); setOpen(false);
  };

  return (
    <div className="relative w-full">
      <input type="text" value={value}
        onChange={e => { onChange(e.target.value); }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={e => {
          if (e.key === "Enter" && results[0] && !exclude.includes(results[0].name)) pick(results[0]);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-semibold text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{busy ? "⟳" : "🔍"}</span>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            {results.map((r, i) => {
              const added = exclude.includes(r.name);
              return (
                <li key={i}>
                  <button type="button" disabled={added} onClick={() => pick(r)}
                    className={["w-full text-left px-4 py-2.5 text-sm transition-colors",
                      added ? "text-slate-400 bg-slate-50 cursor-not-allowed"
                            : "hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                    ].join(" ")}>
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

function DuelPanel({ city, side }: { city: CityEntry; side: "left" | "right" }) {
  const [live, setLive] = useState<LiveData | null>(null);
  const [causal, setCausal] = useState<CausalData | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [causalLoading, setCausalLoading] = useState(true);

  useEffect(() => {
    setLive(null); setCausal(null);
    setLiveLoading(true); setCausalLoading(true);
    fetchCityLive(city).then(d => { setLive(d); setLiveLoading(false); });
    fetchCityCausal(city).then(d => { setCausal(d); setCausalLoading(false); });
  }, [city.name]);

  const sev = live ? getSeverity(live.aqi) : "moderate";
  const color = severityColor(sev);

  return (
    <motion.div initial={{ opacity: 0, x: side === "left" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4 min-w-0 overflow-y-auto max-h-[70vh] pr-1 scrollbar-hide">

      {/* AQI Hero */}
      <div className="rounded-2xl p-4 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}dd, ${color}88)`, boxShadow: `0 6px 24px ${color}40` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 20%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="relative">
          <h3 className="text-xl font-extrabold tracking-tight">{city.name}</h3>
          <p className="text-white/70 text-xs font-medium">{severityLabel(sev)}</p>
          {liveLoading
            ? <div className="mt-2 h-10 w-24 rounded-xl bg-white/20 animate-pulse" />
            : live && (
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-black">{live.aqi}</span>
                <span className="text-white/60 text-sm mb-0.5">AQI</span>
              </div>
            )}
        </div>
      </div>

      {/* PM2.5 Sparkline */}
      {!liveLoading && live?.pm25?.sparkline?.length ? (
        <div className="rounded-xl bg-white border border-slate-100 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">PM2.5 Trend (12h)</p>
          <div className="flex items-center gap-2">
            <Sparkline data={live.pm25.sparkline} color={color} w={160} h={40} />
            <div className="text-right ml-auto">
              <p className="text-lg font-black text-slate-800">{live.pm25.value}</p>
              <p className="text-[10px] text-slate-400">{live.pm25.unit}</p>
            </div>
          </div>
        </div>
      ) : liveLoading ? <div className="h-20 rounded-xl bg-slate-100 animate-pulse" /> : null}

      {/* Pollutants */}
      <div className="rounded-xl bg-white border border-slate-100 p-3 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pollutants vs WHO Limits</p>
        {liveLoading
          ? [...Array(3)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />)
          : live ? <>
            <PollutantBar label="PM2.5" val={live.pm25.value} unit={live.pm25.unit} limit={WHO_LIMITS.pm25} color={color} />
            <PollutantBar label="PM10"  val={live.pm10.value} unit={live.pm10.unit} limit={WHO_LIMITS.pm10} color={color} />
            <PollutantBar label="NO₂"   val={live.no2.value}  unit={live.no2.unit}  limit={WHO_LIMITS.no2}  color={color} />
            {live.co  && <PollutantBar label="CO"  val={live.co.value}  unit={live.co.unit}  limit={4}   color={color} />}
            {live.o3  && <PollutantBar label="O₃"  val={live.o3.value}  unit={live.o3.unit}  limit={100} color={color} />}
          </> : null}
      </div>

      {/* Weather */}
      {!liveLoading && live?.weather && (
        <div className="rounded-xl bg-white border border-slate-100 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Weather</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🌡", label: "Temp", val: `${live.weather.temperature}°C` },
              { icon: "💧", label: "Humidity", val: `${live.weather.humidity}%` },
              { icon: "🌬", label: "Wind", val: `${live.weather.windSpeed} km/h` },
              { icon: "🧭", label: "Direction", val: live.weather.windDirLabel },
            ].map(({ icon, label, val }) => (
              <div key={label} className="rounded-lg bg-slate-50 p-2">
                <p className="text-xs text-slate-400">{icon} {label}</p>
                <p className="text-sm font-bold text-slate-700">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Causal Attribution */}
      <div className="rounded-xl bg-white border border-slate-100 p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Causal Attribution</p>
        {causalLoading
          ? [...Array(3)].map((_, i) => <div key={i} className="h-10 mb-2 bg-slate-100 rounded-lg animate-pulse" />)
          : causal ? (
            <div className="space-y-3">
              {causal.culprits.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{c.icon}</span>
                    <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{c.name}</span>
                    <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
                      style={{ backgroundColor: `${srcColor(c.name)}18`, color: srcColor(c.name) }}>{c.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-7">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: srcColor(c.name) }}
                      initial={{ width: 0 }} animate={{ width: `${c.pct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.08 }} />
                  </div>
                  {causal.counterfactuals[i] && (
                    <p className="text-[10px] text-slate-400 italic ml-7">
                      Remove → −{causal.counterfactuals[i].aqiDrop} AQI · {causal.counterfactuals[i].resultLabel}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-slate-400 italic">Loading…</p>}
      </div>

      {/* Advisory */}
      {!liveLoading && live?.advisory && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Health Advisory</p>
          <p className="text-xs text-amber-900 leading-relaxed">{live.advisory.en}</p>
        </div>
      )}
    </motion.div>
  );
}

function DuelModal({ cityA: initA, onClose, allCities }: {
  cityA?: CityEntry; onClose: () => void; allCities: CityEntry[];
}) {
  const [cityA, setCityA] = useState<CityEntry>(initA ?? allCities[0]);
  const [cityB, setCityB] = useState<CityEntry>(allCities.find(c => c.name !== (initA ?? allCities[0]).name) ?? allCities[1] ?? { name: "Chandigarh", lat: 30.7333, lon: 76.7794 });
  const [qA, setQA] = useState(cityA.name);
  const [qB, setQB] = useState(cityB.name);

  // AQI for the VS badge
  const [aqiA, setAqiA] = useState<number | null>(null);
  const [aqiB, setAqiB] = useState<number | null>(null);
  useEffect(() => { fetchCityLive(cityA).then(d => setAqiA(d.aqi)); }, [cityA.name]);
  useEffect(() => { fetchCityLive(cityB).then(d => setAqiB(d.aqi)); }, [cityB.name]);

  const winnerName = aqiA != null && aqiB != null
    ? (aqiA < aqiB ? cityA.name : aqiB < aqiA ? cityB.name : null) : null;
  const diff = aqiA != null && aqiB != null ? Math.abs(aqiA - aqiB) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" }}>
      <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-slate-50 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">⚔️ City Duel</h2>
            <p className="text-xs text-slate-400">Split-screen air quality comparison</p>
          </div>
          {diff != null && winnerName != null && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
              <span className="text-[11px] font-bold text-green-700">🏆 {winnerName} has cleaner air by {diff} AQI points</span>
            </div>
          )}
          <button onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold transition-colors">
            ✕
          </button>
        </div>

        {/* City pickers */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-6 py-3 bg-white border-b border-slate-100 shrink-0 items-center">
          <DuelSearchInput value={qA} onChange={setQA} onPick={c => { setCityA(c); setQA(c.name); }} exclude={[cityB.name]} placeholder="City A…" />
          <div className="text-slate-300 font-black px-2 text-sm">VS</div>
          <DuelSearchInput value={qB} onChange={setQB} onPick={c => { setCityB(c); setQB(c.name); }} exclude={[cityA.name]} placeholder="City B…" />
        </div>

        {/* Split panels */}
        <div className="grid grid-cols-[1fr_1px_1fr] gap-0 flex-1 min-h-0 overflow-hidden">
          <div className="p-4 overflow-y-auto scrollbar-hide">
            <DuelPanel key={`A-${cityA.name}`} city={cityA} side="left" />
          </div>
          <div className="bg-slate-200" />
          <div className="p-4 overflow-y-auto scrollbar-hide">
            <DuelPanel key={`B-${cityB.name}`} city={cityB} side="right" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export function CityCompare() {
  const [cities, setCities] = useState<CityEntry[]>(DEFAULT_CITIES);
  const [liveData, setLiveData] = useState<LiveMap>({});
  const [causalData, setCausalData] = useState<CausalMap>({});
  const [liveLoading, setLiveLoading] = useState<LoadingMap>({});
  const [causalLoading, setCausalLoading] = useState<LoadingMap>({});
  const [prevAqi, setPrevAqi] = useState<Record<string, number>>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [duelCity, setDuelCity] = useState<CityEntry | null>(null);
  const [duelOpen, setDuelOpen] = useState(false);

  const fetchLiveForCity = useCallback(async (city: CityEntry) => {
    setLiveLoading(p => ({ ...p, [city.name]: true }));
    const data = await fetchCityLive(city);
    setLiveData(p => {
      const cur = p[city.name];
      if (cur) setPrevAqi(pp => ({ ...pp, [city.name]: cur.aqi }));
      return { ...p, [city.name]: data };
    });
    setLiveLoading(p => ({ ...p, [city.name]: false }));
  }, []);

  const fetchCausalForCity = useCallback(async (city: CityEntry) => {
    setCausalLoading(p => ({ ...p, [city.name]: true }));
    const data = await fetchCityCausal(city);
    setCausalData(p => ({ ...p, [city.name]: data }));
    setCausalLoading(p => ({ ...p, [city.name]: false }));
  }, []);

  const fetchAll = useCallback(async (cityList: CityEntry[]) => {
    setRefreshing(true);
    await Promise.all(cityList.map(fetchLiveForCity));
    setLastRefresh(new Date());
    setRefreshing(false);
    Promise.all(cityList.map(fetchCausalForCity));
  }, [fetchLiveForCity, fetchCausalForCity]);

  useEffect(() => { fetchAll(DEFAULT_CITIES); }, []); // eslint-disable-line

  useEffect(() => {
    const id = setInterval(() => { cities.forEach(fetchLiveForCity); setLastRefresh(new Date()); }, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [cities, fetchLiveForCity]);

  const addCity = useCallback((newCity: CityEntry) => {
    if (cities.length >= 10 || cities.some(c => c.name === newCity.name)) return;
    setCities(p => [...p, newCity]);
    fetchLiveForCity(newCity);
    fetchCausalForCity(newCity);
  }, [cities, fetchLiveForCity, fetchCausalForCity]);

  const removeCity = useCallback((name: string) => {
    if (cities.length <= 2) return;
    setCities(p => p.filter(c => c.name !== name));
    setLiveData(p => { const n = { ...p }; delete n[name]; return n; });
    setCausalData(p => { const n = { ...p }; delete n[name]; return n; });
  }, [cities.length]);

  const openDuel = (city?: CityEntry) => {
    setDuelCity(city ?? null);
    setDuelOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌐</span>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-text-primary leading-tight tracking-tight">
              City Compare
              <span className="ml-2 text-xs font-semibold text-text-muted uppercase tracking-widest align-middle">
                Multi-Urban Air Intelligence
              </span>
            </h1>
            <p className="text-xs text-text-muted">Live air quality across Indian cities, powered by causal AI</p>
          </div>
          {/* Duel CTA */}
          <button onClick={() => openDuel()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all active:scale-95">
            ⚔️ City Duel
          </button>
        </div>
      </motion.div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <CitySearchInput onAdd={addCity} existing={cities.map(c => c.name)} />
        <span className="text-xs text-slate-400 hidden sm:block">{cities.length}/10 cities</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-slate-400 hidden md:block">
            Last refresh: {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
          </span>
          <button onClick={() => fetchAll(cities)} disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-primary hover:text-primary transition-all disabled:opacity-50">
            <span className={refreshing ? "animate-spin inline-block" : "inline-block"}>⟳</span> Refresh All
          </button>
        </div>
      </div>

      {/* City cards + leaderboard */}
      <div className="flex gap-6 flex-col xl:flex-row">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
            City Cards · {cities.length} monitored
          </p>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
            <AnimatePresence>
              {cities.map((city, i) => (
                <CityCard key={city.name} city={city}
                  live={liveData[city.name] ?? null} causal={causalData[city.name] ?? null}
                  liveLoading={liveLoading[city.name] ?? false}
                  causalLoading={causalLoading[city.name] ?? false}
                  onRemove={() => removeCity(city.name)}
                  canRemove={cities.length > 2}
                  onDuel={() => openDuel(city)}
                  index={i} />
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="w-full xl:w-72 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Ranking</p>
          <Leaderboard cities={cities} liveData={liveData} prevAqi={prevAqi} />
        </div>
      </div>

      {/* Insights */}
      <InsightsStrip cities={cities} liveData={liveData} causalData={causalData} />

      {/* Attribution bars */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/40 p-5"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.05)" }}>
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pollution Source Attribution</p>
          <p className="text-xs text-slate-500 mt-0.5">Causal % contribution per city</p>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { label: "Traffic 🚗",   color: SOURCE_COLORS.Traffic   },
            { label: "Industry 🏭",  color: SOURCE_COLORS.Industry  },
            { label: "Fires 🔥",     color: SOURCE_COLORS.Fires     },
            { label: "Inversion 🌡️", color: SOURCE_COLORS.Inversion },
            { label: "Winter ❄️",    color: SOURCE_COLORS.Winter    },
          ].map(s => (
            <span key={s.label} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
              <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />{s.label}
            </span>
          ))}
        </div>
        <AttributionBars cities={cities} causalData={causalData} causalLoading={causalLoading} />
      </motion.div>

      {/* Duel Modal */}
      <AnimatePresence>
        {duelOpen && (
          <DuelModal
            cityA={duelCity ?? undefined}
            allCities={cities}
            onClose={() => { setDuelOpen(false); setDuelCity(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
