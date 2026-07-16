import { motion } from "framer-motion";
import type { CausalData, Culprit, Counterfactual } from "../lib/types";
import { Card, Skeleton } from "./ui";

function pickPrimary(culprits: Culprit[]): Culprit | undefined {
  const flagged = culprits.find((c) => c.type === "primary");
  if (flagged) return flagged;
  return [...culprits].sort((a, b) => b.pct - a.pct)[0];
}

function AnimatedBar({
  pct,
  color,
  delay = 0,
}: {
  pct: number;
  color: string;
  delay?: number;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex items-center gap-3">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: "0%" }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1.1, delay, ease: "easeOut" }}
        />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-sm font-semibold text-slate-800">
        {clamped}%
      </span>
    </div>
  );
}

export function VerdictCard({
  data,
  loading,
}: {
  data?: CausalData;
  loading?: boolean;
}) {
  if (loading || !data) {
    return (
      <Card className="relative overflow-hidden">
        <Skeleton className="mx-auto mb-6 h-6 w-56" />
        <Skeleton className="mb-2 h-3 w-32" />
        <Skeleton className="mb-6 h-8 w-full" />
        <Skeleton className="mb-2 h-3 w-40" />
        <Skeleton className="mb-2 h-6 w-full" />
        <Skeleton className="mb-6 h-6 w-full" />
        <Skeleton className="mb-2 h-3 w-40" />
        <Skeleton className="h-14 w-full" />
      </Card>
    );
  }

  const primary = pickPrimary(data.culprits);
  const secondaries = data.culprits.filter((c) => c !== primary);
  const counterfactual: Counterfactual | undefined = primary
    ? data.counterfactuals.find(
        (cf) =>
          cf.source.toLowerCase() === primary.name.toLowerCase() ||
          cf.source.toLowerCase().includes(primary.name.toLowerCase()) ||
          primary.name.toLowerCase().includes(cf.source.toLowerCase())
      ) ?? data.counterfactuals[0]
    : data.counterfactuals[0];

  return (
    <motion.div
      initial={{ scale: 0.85, rotate: -3, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 16 }}
    >
      <Card
        className="relative overflow-hidden border-crimson/40"
        glow="0 0 32px rgba(192,57,43,0.35)"
      >
        {/* Sound-wave ripple rings behind the header */}
        <div
          className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2"
          aria-hidden="true"
        >
          <div className="relative">
            <span className="animate-ripple absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-crimson/50" />
            <span
              className="animate-ripple absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-crimson/40"
              style={{ animationDelay: "0.5s" }}
            />
            <span
              className="animate-ripple absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-crimson/30"
              style={{ animationDelay: "1s" }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="relative z-10 mb-6 text-center">
          <div className="mb-1 text-3xl" aria-hidden="true">
            ⚖️
          </div>
          <h2 className="text-lg font-bold uppercase tracking-[0.25em] text-crimson-light">
            Prosecution Verdict
          </h2>
          <div className="mx-auto mt-2 h-px w-24 bg-crimson/50" />
        </div>

        {/* Primary culprit */}
        {primary && (
          <div className="relative z-10 mb-6">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Primary Culprit
            </div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">
                {primary.icon}
              </span>
              <span className="text-xl font-bold text-crimson-light">
                {primary.name}
              </span>
            </div>
            <AnimatedBar pct={primary.pct} color="#C0392B" delay={0.3} />
          </div>
        )}

        {/* Contributing factors */}
        {secondaries.length > 0 && (
          <div className="relative z-10 mb-6">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Contributing Factors
            </div>
            <div className="space-y-3">
              {secondaries.map((c, i) => (
                <div key={c.name}>
                  <div className="mb-1 flex items-center gap-2 text-sm text-slate-700">
                    <span aria-hidden="true">{c.icon}</span>
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <AnimatedBar
                    pct={c.pct}
                    color="#F39C12"
                    delay={0.5 + i * 0.15}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Counterfactual */}
        {counterfactual && (
          <div className="relative z-10 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Counterfactual
            </div>
            <p className="font-mono text-sm text-slate-800">
              Remove {counterfactual.source} → AQI drops{" "}
              <span className="font-semibold text-crimson-light">
                {counterfactual.aqiDrop}
              </span>{" "}
              pts
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-teal">
              {counterfactual.resultLabel}
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
