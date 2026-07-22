import { motion } from "framer-motion";
import { useCausalData } from "../lib/api";
import { VerdictCard } from "../components/VerdictCard";
import { CausalDAG } from "../components/CausalDAG";
import { LegalBrief } from "../components/LegalBrief";
import { MotionCard, Skeleton, LiveDot } from "../components/ui";
import type { SourceStatus, City } from "../lib/types";

/* ── Step names for the progress tracker ────────────────── */
const STEPS = [
  { id: "data",       label: "Data Collection",   icon: "🗄️",  desc: "Fetching 6 months historical data" },
  { id: "causal",     label: "Causal Analysis",   icon: "🔬",  desc: "Running DoWhy do-calculus" },
  { id: "verdict",    label: "Verdict",            icon: "⚖️",  desc: "Ranking pollution sources" },
  { id: "report",     label: "Legal Report",       icon: "📋",  desc: "Generating prosecution brief" },
];

/* ── Investigation progress tracker ─────────────────────── */
function InvestigationProgress({ loading }: { loading: boolean }) {
  const done = !loading;
  return (
    <MotionCard delay={0} className="overflow-hidden">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-text-primary">
          Investigation Pipeline
        </h3>
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${done ? "text-success" : "text-primary"}`}>
          {done ? (
            <>✓ Analysis Complete</>
          ) : (
            <>
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Analyzing…
            </>
          )}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-0">
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          return (
            <div key={step.id} className="flex flex-1 items-center last:flex-none">
              <div className="group flex flex-col items-center gap-1.5 text-center">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.12 + 0.1 }}
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-2xl text-sm transition-all duration-300",
                    done
                      ? "bg-primary text-white shadow-glow-primary"
                      : "border-2 border-border bg-white text-text-muted",
                  ].join(" ")}
                >
                  {done ? "✓" : step.icon}
                </motion.div>
                <div>
                  <p className={`text-[10px] font-bold leading-tight ${done ? "text-text-primary" : "text-text-muted"}`}>
                    {step.label}
                  </p>
                  <p className="hidden text-[9px] text-text-muted sm:block">{step.desc}</p>
                </div>
              </div>
              {!isLast && (
                <div className="relative mx-2 flex-1 h-0.5 bg-border rounded-full overflow-hidden -mt-5">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-brand"
                    initial={{ width: "0%" }}
                    animate={{ width: done ? "100%" : "30%" }}
                    transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </MotionCard>
  );
}

/* ── Known data sources ──────────────────────────────────── */
const KNOWN_SOURCES = ["Open-Meteo", "AQICN", "TomTom", "NASA FIRMS", "OpenStreetMap"];

const SOURCE_ICONS: Record<string, string> = {
  "Open-Meteo":    "🌤️",
  "AQICN":         "📡",
  "TomTom":        "🗺️",
  "NASA FIRMS":    "🛰️",
  "OpenStreetMap": "🌍",
};

/* ── Evidence Locker ─────────────────────────────────────── */
function EvidenceLocker({
  loading,
  months,
  rows,
  sources,
}: {
  loading: boolean;
  months?: number;
  rows?: number;
  sources?: SourceStatus[];
}) {
  const statusFor = (name: string): "ok" | "down" =>
    sources?.find((s) => s.name === name)?.status ?? "ok";

  return (
    <MotionCard delay={0.1} className="h-full">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Evidence Locker
        </p>
        <h3 className="font-display text-base font-bold text-text-primary">Data Sources</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          {KNOWN_SOURCES.map((s) => (
            <Skeleton key={s} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-primary/5 p-3 text-center">
              <p className="font-display text-2xl font-extrabold text-primary">{months ?? 0}</p>
              <p className="text-[10px] text-text-muted">Months Data</p>
            </div>
            <div className="rounded-xl bg-success/5 p-3 text-center">
              <p className="font-display text-2xl font-extrabold text-success">
                {((rows ?? 0) / 1000).toFixed(1)}K
              </p>
              <p className="text-[10px] text-text-muted">Records</p>
            </div>
          </div>

          {/* Source list */}
          <div className="space-y-2">
            {KNOWN_SOURCES.map((name, i) => {
              const ok = statusFor(name) === "ok";
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 + 0.2 }}
                  className="flex items-center justify-between rounded-xl bg-bg-muted px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{SOURCE_ICONS[name] ?? "📊"}</span>
                    <span className="text-xs font-medium text-text-secondary">{name}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${ok ? "text-success" : "text-danger"}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-success" : "bg-danger"}`} />
                    <span className="text-[10px] font-semibold">{ok ? "Online" : "Down"}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Methodology note */}
          <div className="mt-4 rounded-xl bg-gradient-to-br from-primary/8 to-transparent p-3">
            <p className="text-[10px] leading-relaxed text-text-secondary">
              🔬 <span className="font-semibold">Methodology:</span> Microsoft DoWhy, Judea Pearl's
              do-calculus, backdoor linear regression with refutation testing.
            </p>
          </div>
        </>
      )}
    </MotionCard>
  );
}

/* ── Page Component ───────────────────────────────────────── */
export function CausalProsecutor({ city }: { city: City }) {
  const { data: causal, isLoading } = useCausalData(city);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-2xl font-extrabold text-text-primary">
            Causal Prosecutor
          </h2>
          <p className="text-sm text-text-secondary">
            Causal Source Analysis for{" "}
            <span className="font-semibold text-text-primary">{city.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LiveDot color={isLoading ? "#F59E0B" : "#22C55E"} />
          <span className="text-xs text-text-muted">
            {isLoading ? "Analyzing…" : "Analysis ready"}
          </span>
        </div>
      </motion.div>

      {/* Step progress */}
      <InvestigationProgress loading={isLoading} />

      {/* Main investigation grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Evidence locker */}
        <div className="lg:col-span-3">
          <EvidenceLocker
            loading={isLoading}
            months={causal?.dataSummary.months}
            rows={causal?.dataSummary.rows}
            sources={causal?.dataSummary.sources}
          />
        </div>

        {/* Verdict card */}
        <div className="lg:col-span-5">
          <VerdictCard data={causal} loading={isLoading} />
        </div>

        {/* Causal DAG */}
        <div className="lg:col-span-4">
          <CausalDAG dag={causal?.dag} loading={isLoading} />
        </div>
      </div>

      {/* Legal brief — full width */}
      <LegalBrief brief={causal?.brief} city={city} loading={isLoading} />
    </div>
  );
}
