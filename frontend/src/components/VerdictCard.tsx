import { motion } from "framer-motion";
import type { CausalData, Culprit, Counterfactual } from "../lib/types";
import { MotionCard, Skeleton, ProgressBar, Badge, GradientButton } from "./ui";

/* ── Helper ─────────────────────────────────────────────── */
function pickPrimary(culprits: Culprit[]): Culprit | undefined {
  const flagged = culprits.find((c) => c.type === "primary");
  return flagged ?? [...culprits].sort((a, b) => b.pct - a.pct)[0];
}

/* ── Confidence chip ─────────────────────────────────────── */
function ConfidenceChip({ level }: { level: string }) {
  const styles: Record<string, string> = {
    Strong:   "bg-success/10 text-success",
    Moderate: "bg-warning/10 text-warning",
    Weak:     "bg-danger/10 text-danger",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        styles[level] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {level}
    </span>
  );
}

/* ── Culprit bar card ────────────────────────────────────── */
function CulpritRow({
  culprit,
  index,
  isPrimary,
}: {
  culprit: Culprit;
  index: number;
  isPrimary: boolean;
}) {
  const color  = isPrimary ? "#EF4444" : "#6366F1";
  const bgAcc  = isPrimary ? "rgba(239,68,68,0.06)" : "rgba(99,102,241,0.06)";

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl p-4"
      style={{ backgroundColor: bgAcc }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{culprit.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-text-primary text-sm">{culprit.name}</p>
              {isPrimary && (
                <span className="rounded-full bg-danger/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-danger">
                  Primary
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <ConfidenceChip level={culprit.confidence} />
              <span className="text-[10px] text-text-muted">
                Effect: {culprit.causalEffect > 0 ? "+" : ""}{culprit.causalEffect.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span
            className="font-display text-2xl font-extrabold"
            style={{ color }}
          >
            {culprit.pct}%
          </span>
        </div>
      </div>
      <ProgressBar
        value={culprit.pct}
        max={100}
        color={color}
        height={6}
        delay={index * 0.1 + 0.35}
      />
    </motion.div>
  );
}

/* ── Counterfactual card ─────────────────────────────────── */
function CounterfactualCard({
  cf,
  index,
}: {
  cf: Counterfactual;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 + 0.4, duration: 0.35 }}
      className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3"
    >
      <div>
        <p className="text-xs font-semibold text-text-primary">Remove {cf.source}</p>
        <p className="text-[10px] text-text-muted">{cf.resultLabel}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-display text-lg font-extrabold text-success">
          −{cf.aqiDrop}
        </span>
        <span className="text-xs text-text-muted">AQI</span>
      </div>
    </motion.div>
  );
}

/* ── Main VerdictCard ────────────────────────────────────── */
export function VerdictCard({
  data,
  loading,
}: {
  data?: CausalData;
  loading?: boolean;
}) {
  if (loading || !data) {
    return (
      <MotionCard delay={0.1}>
        <Skeleton className="mb-6 mx-auto h-6 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="mt-5 space-y-2">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </MotionCard>
    );
  }

  const primary     = pickPrimary(data.culprits);
  const secondaries = data.culprits.filter((c) => c !== primary);

  return (
    <MotionCard delay={0.1} className="relative overflow-hidden">
      {/* Subtle crimson glow top-right */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-danger/10 blur-3xl" />

      {/* Header */}
      <div className="relative mb-5 text-center">
        <div className="mb-1 text-3xl">⚖️</div>
        <h2 className="font-display text-lg font-extrabold uppercase tracking-[0.2em] text-text-primary">
          Prosecution Verdict
        </h2>
        <div className="mx-auto mt-2 h-0.5 w-16 rounded-full bg-gradient-brand" />
      </div>

      {/* Culprits */}
      <div className="relative space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Causal Responsibility
        </p>
        {primary && (
          <CulpritRow culprit={primary} index={0} isPrimary />
        )}
        {secondaries.map((c, i) => (
          <CulpritRow key={c.name} culprit={c} index={i + 1} isPrimary={false} />
        ))}
      </div>

      {/* Counterfactuals */}
      {data.counterfactuals.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Counterfactual Analysis — if source removed
          </p>
          <div className="space-y-2">
            {data.counterfactuals.map((cf, i) => (
              <CounterfactualCard key={cf.source} cf={cf} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Methodology badge */}
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2">
        <span className="text-sm">🔬</span>
        <p className="text-[10px] text-text-muted">
          Powered by{" "}
          <span className="font-semibold text-primary">Microsoft DoWhy</span>{" "}
          · Judea Pearl's do-calculus
        </p>
      </div>
    </MotionCard>
  );
}
