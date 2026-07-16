import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MotionCard, Skeleton, GradientButton } from "./ui";

const CHARS_PER_TICK = 6;
const TICK_MS        = 10;

/* ── Typewriter effect ──────────────────────────────────── */
function useTypewriter(text: string | undefined) {
  const [revealed, setRevealed] = useState("");
  const [done, setDone]         = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!text) return;
    if (hasRun.current) {
      setRevealed(text);
      setDone(true);
      return;
    }
    hasRun.current = true;
    let i = 0;
    setRevealed("");
    setDone(false);
    const timer = setInterval(() => {
      i += CHARS_PER_TICK;
      if (i >= text.length) {
        setRevealed(text);
        setDone(true);
        clearInterval(timer);
      } else {
        setRevealed(text.slice(0, i));
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [text]);

  return { revealed, done };
}

/* ── Section block parser (render ## headers bold) ────── */
function BriefBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <div key={i} className="pb-1 pt-4 first:pt-0">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
                {line.replace("## ", "")}
              </p>
              <div className="mt-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
            </div>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <p key={i} className="pt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              {line.replace("### ", "")}
            </p>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-mono text-xs font-bold text-text-primary">
              {line.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }
        return (
          <p key={i} className="font-mono text-xs leading-relaxed text-text-secondary">
            {line}
          </p>
        );
      })}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */
export function LegalBrief({
  brief,
  city,
  loading,
}: {
  brief?: string;
  city: string;
  loading?: boolean;
}) {
  const { revealed, done } = useTypewriter(brief);

  const handleCopy = () => {
    if (brief) void navigator.clipboard.writeText(brief);
  };

  const handleDownload = () => {
    if (!brief) return;
    const blob = new Blob([brief], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `VayuProsecutor_Brief_${city.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || !brief) {
    return (
      <MotionCard delay={0.3} className="w-full">
        <Skeleton className="mx-auto mb-6 h-8 w-2/3" />
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className={`h-3 ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />
          ))}
        </div>
      </MotionCard>
    );
  }

  return (
    <MotionCard delay={0.3} className="w-full overflow-hidden">
      {/* Gradient header bar */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand shadow-glow-primary">
            <span className="text-lg">⚖️</span>
          </div>
          <div>
            <h2 className="font-display font-extrabold tracking-tight text-text-primary">
              IN THE MATTER OF AIR QUALITY
            </h2>
            <p className="font-mono text-xs font-semibold tracking-widest text-primary">
              CITY OF {city.toUpperCase()} · FORMAL PROSECUTION BRIEF
            </p>
          </div>
          {done && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="ml-auto flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-[10px] font-semibold text-success">Analysis Complete</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Document body */}
      <div className="relative min-h-[180px] rounded-2xl border border-border bg-bg-muted/40 p-6">
        {/* Scan line while typing */}
        {!done && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <motion.div
              className="absolute left-0 right-0 h-8 bg-gradient-to-b from-primary/5 to-transparent"
              animate={{ y: [-32, 400] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}

        <BriefBody text={revealed} />

        {/* Blinking cursor */}
        {!done && (
          <span
            className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-primary align-middle"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3">
        <GradientButton
          variant="outline"
          size="sm"
          onClick={handleCopy}
          icon={<span className="text-sm">📋</span>}
        >
          Copy Brief
        </GradientButton>
        <GradientButton
          variant="outline"
          size="sm"
          onClick={handleDownload}
          icon={<span className="text-sm">⬇️</span>}
        >
          Download .txt
        </GradientButton>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-text-muted">
          <span>🤖</span>
          <span>
            Generated by{" "}
            <span className="font-semibold text-primary">Llama 3.3 70B</span> via Groq
          </span>
        </div>
      </div>
    </MotionCard>
  );
}
