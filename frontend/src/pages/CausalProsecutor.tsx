import { motion } from "framer-motion";
import { useCausalData } from "../lib/api";
import { VerdictCard } from "../components/VerdictCard";
import { CausalDAG } from "../components/CausalDAG";
import { LegalBrief } from "../components/LegalBrief";
import { Card, Skeleton } from "../components/ui";
import type { SourceStatus } from "../lib/types";

const STEPS = ["Data Collection", "Causal Analysis", "Verdict"];

const KNOWN_SOURCES = [
  "Open-Meteo",
  "AQICN",
  "TomTom",
  "NASA FIRMS",
  "OpenStreetMap",
];

function ProgressIndicator({ loading }: { loading: boolean }) {
  const complete = !loading;
  return (
    <div className="w-full">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.15 }}
                  className={[
                    "flex items-center justify-center rounded-full h-9 w-9 text-sm font-bold border-2 shrink-0",
                    complete
                      ? "bg-teal/10 border-teal text-teal"
                      : "bg-slate-100 border-slate-200 text-slate-500",
                  ].join(" ")}
                >
                  {complete ? "✓" : i + 1}
                </motion.div>
                <span
                  className={[
                    "text-sm font-medium whitespace-nowrap",
                    complete ? "text-slate-800" : "text-slate-500",
                  ].join(" ")}
                >
                  {step}
                </span>
              </div>
              {!isLast && (
                <div className="relative flex-1 mx-4 h-0.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-crimson to-teal rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: complete ? "100%" : "35%" }}
                    transition={{ duration: 0.6, delay: i * 0.2 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const statusFor = (name: string): "ok" | "down" => {
    const found = sources?.find((s) => s.name === name);
    return found ? found.status : "ok";
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-3">
        Evidence Locker
      </h3>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2 pt-2">
            {KNOWN_SOURCES.map((s) => (
              <Skeleton key={s} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Time Range</span>
              <span className="font-mono text-slate-800">
                {months ?? 0} months
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Records</span>
              <span className="font-mono text-slate-800">
                {(rows ?? 0).toLocaleString()} rows
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
              Sources
            </p>
            <ul className="space-y-2">
              {KNOWN_SOURCES.map((name) => {
                const ok = statusFor(name) === "ok";
                return (
                  <li
                    key={name}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <span
                      className={[
                        "h-2 w-2 rounded-full shrink-0",
                        ok ? "bg-emerald-400" : "bg-crimson",
                      ].join(" ")}
                      title={ok ? "ok" : "down"}
                    />
                    <span>{name}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </Card>
  );
}

export function CausalProsecutor({ city }: { city: string }) {
  const { data: causal, isLoading } = useCausalData(city);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <Card className="p-5">
        <ProgressIndicator loading={isLoading} />
      </Card>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <EvidenceLocker
            loading={isLoading}
            months={causal?.dataSummary.months}
            rows={causal?.dataSummary.rows}
            sources={causal?.dataSummary.sources}
          />
        </div>
        <div className="lg:col-span-5">
          <VerdictCard data={causal} loading={isLoading} />
        </div>
        <div className="lg:col-span-4">
          <CausalDAG dag={causal?.dag} loading={isLoading} />
        </div>
      </div>

      {/* Legal brief */}
      <LegalBrief brief={causal?.brief} city={city} loading={isLoading} />
    </div>
  );
}
