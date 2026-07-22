import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecommendations } from "../lib/api";
import { MotionCard, Skeleton } from "../components/ui";
import type { City, Recommendation } from "../lib/types";
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  DollarSign,
  Shield,
  Building2,
  ArrowDownCircle,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/* ── Colour helpers ─────────────────────────────────────── */
const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Critical: { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",   dot: "bg-red-500"   },
  High:     { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200",dot: "bg-orange-500"},
  Medium:   { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200",dot: "bg-yellow-500"},
  Low:      { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200", dot: "bg-green-500" },
};

const COST_COLOUR: Record<string, string> = {
  Low:    "text-green-600 bg-green-50",
  Medium: "text-orange-600 bg-orange-50",
  High:   "text-red-600 bg-red-50",
};

const DIFFICULTY_COLOUR: Record<string, string> = {
  Easy:     "text-green-600",
  Moderate: "text-orange-600",
  Hard:     "text-red-600",
};

/* ── Summary cards at the top ───────────────────────────── */
function SummaryStrip({ recs, aqi }: { recs: Recommendation[]; aqi: number }) {
  const critical = recs.filter((r) => r.priority === "Critical").length;
  const maxDrop = recs[0]?.expected_aqi_drop ?? 0;
  const easyWins = recs.filter((r) => r.difficulty === "Easy" && r.priority !== "Low").length;
  const totalCost = recs.reduce((s, r) => s + r.cost_inr_lakhs, 0);

  const cards = [
    { icon: <AlertTriangle size={20} />, label: "Critical Actions", value: critical, colour: "text-red-600", bg: "bg-red-50" },
    { icon: <ArrowDownCircle size={20} />, label: "Best AQI Drop", value: `−${maxDrop}`, colour: "text-primary", bg: "bg-primary/5" },
    { icon: <Zap size={20} />, label: "Easy Wins", value: easyWins, colour: "text-green-600", bg: "bg-green-50" },
    { icon: <DollarSign size={20} />, label: "Est. Budget (₹ L)", value: totalCost, colour: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.35 }}
          className={`rounded-2xl border border-border ${c.bg} p-4`}
        >
          <div className={`mb-2 ${c.colour}`}>{c.icon}</div>
          <div className={`text-2xl font-extrabold font-display ${c.colour}`}>{c.value}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mt-1">{c.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Single recommendation card ─────────────────────────── */
function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const ps = PRIORITY_STYLES[rec.priority] ?? PRIORITY_STYLES.Low;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={`rounded-2xl border ${ps.border} bg-white shadow-sm transition-shadow hover:shadow-md`}
    >
      {/* Header row */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: priority badge + title */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${ps.bg}`}>
              {rec.source_icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ps.bg} ${ps.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${ps.dot}`} />
                  {rec.priority}
                </span>
                <span className="text-[11px] text-text-muted font-medium">
                  {rec.source_name} · {rec.source_responsibility_pct}% causal contribution
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-text-primary leading-snug">
                {rec.action}
              </h3>
            </div>
          </div>

          {/* Right: AQI drop chip */}
          <div className="shrink-0 text-center">
            <div className="rounded-xl bg-primary/5 px-3 py-1.5 text-center">
              <div className="text-xl font-extrabold text-primary">−{rec.expected_aqi_drop}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted">AQI Drop</div>
            </div>
          </div>
        </div>

        {/* Metrics strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricPill icon={<Shield size={13} />} label="Confidence" value={`${rec.confidence_pct}%`} />
          <MetricPill icon={<Clock size={13} />} label="Time to Deploy" value={rec.implementation_time_label} />
          <MetricPill
            icon={<DollarSign size={13} />}
            label="Cost"
            value={rec.cost}
            valueClass={COST_COLOUR[rec.cost]}
          />
          <MetricPill icon={<Building2 size={13} />} label="Difficulty" value={rec.difficulty} valueClass={DIFFICULTY_COLOUR[rec.difficulty]} />
        </div>

        {/* Department */}
        <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
          <Building2 size={12} className="shrink-0" />
          <span className="font-semibold">Responsible Authority:</span>
          <span>{rec.department}</span>
        </div>
      </div>

      {/* Expand / Collapse controls */}
      <div className="flex border-t border-border divide-x divide-border">
        <button
          onClick={() => { setExpanded(!expanded); setShowOrder(false); }}
          className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold text-text-secondary hover:bg-bg-muted transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide" : "Causal Explanation"}
        </button>
        <button
          onClick={() => { setShowOrder(!showOrder); setExpanded(false); }}
          className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold text-text-secondary hover:bg-bg-muted transition-colors"
        >
          <FileText size={13} />
          Municipal Order
        </button>
      </div>

      {/* Expanded sections */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="explanation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-5 space-y-4">
              {/* Explanation */}
              <div className="rounded-xl bg-primary/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">Causal Evidence</p>
                <p className="text-sm text-text-secondary leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: rec.explanation.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Health Impact */}
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-green-700 mb-1">Health Impact</p>
                  <p className="text-xs text-green-800 leading-relaxed">{rec.health_impact}</p>
                </div>

                {/* Projected AQI */}
                <div className="rounded-xl border border-border p-4 flex flex-col justify-center items-center text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">Projected AQI</p>
                  <div className="flex items-end gap-3">
                    <div>
                      <div className="text-xs text-text-muted">Current</div>
                      <div className="text-2xl font-extrabold text-danger">{rec.projected_aqi + Math.round(rec.expected_aqi_drop)}</div>
                    </div>
                    <div className="text-xl text-text-muted mb-1">→</div>
                    <div>
                      <div className="text-xs text-text-muted">After</div>
                      <div className="text-2xl font-extrabold text-success">{rec.projected_aqi}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Reference */}
              <div className="flex items-start gap-2 text-xs text-text-muted">
                <FileText size={12} className="shrink-0 mt-0.5" />
                <span><span className="font-semibold text-text-secondary">Legal basis: </span>{rec.legal_reference}</span>
              </div>
            </div>
          </motion.div>
        )}

        {showOrder && (
          <motion.div
            key="order"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-dashed border-border bg-bg-muted/40 p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">Draft Municipal Order</p>
              <pre className="whitespace-pre-wrap text-xs font-mono text-text-secondary leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: rec.municipal_order.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MetricPill({ icon, label, value, valueClass = "" }: {
  icon: React.ReactNode; label: string; value: string; valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-bg-muted px-3 py-2">
      <span className="text-text-muted">{icon}</span>
      <div>
        <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted">{label}</div>
        <div className={`text-xs font-bold ${valueClass || "text-text-primary"}`}>{value}</div>
      </div>
    </div>
  );
}

/* ── Sort & Filter controls ─────────────────────────────── */
type SortKey = "priority_score" | "expected_aqi_drop" | "confidence_pct" | "cost_inr_lakhs" | "implementation_days";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "priority_score",   label: "Priority" },
  { key: "expected_aqi_drop", label: "AQI Impact" },
  { key: "confidence_pct",   label: "Confidence" },
  { key: "cost_inr_lakhs",   label: "Cost (Low→High)" },
  { key: "implementation_days", label: "Speed" },
];

/* ── Loading skeleton ───────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */
export function Interventions({ city }: { city: City }) {
  const { data, isLoading } = useRecommendations(city);
  const [sortKey, setSortKey] = useState<SortKey>("priority_score");
  const [filterPriority, setFilterPriority] = useState<string>("All");

  const recs = data?.recommendations ?? [];
  const message = data?.message;

  const filtered = recs.filter(
    (r) => filterPriority === "All" || r.priority === filterPriority
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "cost_inr_lakhs" || sortKey === "implementation_days") {
      return a[sortKey] - b[sortKey]; // ascending for cost/speed
    }
    return b[sortKey] - a[sortKey]; // descending for impact/priority
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-2xl font-extrabold text-text-primary">
            🛡️ Intervention Recommendations
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Deterministic, causal-evidence-backed actions for{" "}
            <span className="font-semibold text-text-primary">{city.name}</span>
            {data && !isLoading && (
              <span className="ml-2 text-xs text-text-muted">
                · Generated {new Date(data.generated_at).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        {/* Pipeline badge */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-primary/5 px-4 py-2 text-xs font-semibold text-primary shrink-0">
          <CheckCircle2 size={14} />
          DoWhy → Counterfactual → Recommendations
        </div>
      </motion.div>

      {/* No causal data yet */}
      {!isLoading && message && recs.length === 0 && (
        <div className="rounded-2xl border border-border bg-orange-50 p-6 flex items-center gap-4">
          <AlertTriangle size={24} className="text-orange-500 shrink-0" />
          <div>
            <p className="font-semibold text-orange-700">Causal analysis not yet run</p>
            <p className="text-sm text-orange-600 mt-1">
              Navigate to <strong>Causal Prosecutor</strong> first to run DoWhy inference, then return here.
              ({message})
            </p>
          </div>
        </div>
      )}

      {/* Summary strip */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : recs.length > 0 ? (
        <SummaryStrip recs={recs} aqi={data?.current_aqi ?? 0} />
      ) : null}

      {/* Controls */}
      {recs.length > 0 && (
        <MotionCard delay={0.1} className="flex flex-wrap items-center gap-4">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Sort</span>
            <div className="flex gap-1 flex-wrap">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setSortKey(o.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    sortKey === o.key ? "bg-primary text-white" : "bg-bg-muted text-text-secondary hover:bg-border"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Filter</span>
            <div className="flex gap-1">
              {["All", "Critical", "High", "Medium", "Low"].map((p) => {
                const ps = PRIORITY_STYLES[p] ?? { bg: "bg-bg-muted", text: "text-text-secondary", border: "", dot: "" };
                return (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(p)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                      filterPriority === p
                        ? `${ps.bg} ${ps.text} ${ps.border}`
                        : "bg-white border-border text-text-secondary hover:bg-bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </MotionCard>
      )}

      {/* Cards */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : sorted.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {sorted.map((rec, i) => (
              <RecommendationCard key={rec.id} rec={rec} index={i} />
            ))}
          </AnimatePresence>
        </div>
      ) : recs.length > 0 ? (
        <div className="py-12 text-center text-text-muted text-sm">
          No recommendations match the selected filter.
        </div>
      ) : null}

      {/* Methodology note */}
      {!isLoading && recs.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-muted/40 p-4 text-xs text-text-muted">
          🔬 <strong>Methodology:</strong> {data?.methodology}. Priority scores use a deterministic
          weighted formula combining source causal responsibility, AQI severity, vulnerability
          index, implementation difficulty, and DoWhy confidence.
        </div>
      )}
    </div>
  );
}
