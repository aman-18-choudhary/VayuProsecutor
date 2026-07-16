import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, Skeleton } from "./ui";

const CHARS_PER_TICK = 4;
const TICK_MS = 12;

export function LegalBrief({
  brief,
  city,
  loading,
}: {
  brief?: string;
  city: string;
  loading?: boolean;
}) {
  const [revealed, setRevealed] = useState("");
  const [done, setDone] = useState(false);
  const hasTyped = useRef(false);

  useEffect(() => {
    if (!brief) return;
    // Only run the typewriter reveal once on first mount with content.
    if (hasTyped.current) {
      setRevealed(brief);
      setDone(true);
      return;
    }
    hasTyped.current = true;

    let i = 0;
    setRevealed("");
    setDone(false);
    const timer = setInterval(() => {
      i += CHARS_PER_TICK;
      if (i >= brief.length) {
        setRevealed(brief);
        setDone(true);
        clearInterval(timer);
      } else {
        setRevealed(brief.slice(0, i));
      }
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [brief]);

  const handleCopy = () => {
    if (brief) void navigator.clipboard.writeText(brief);
  };

  const handleDownload = () => {
    if (!brief) return;
    const blob = new Blob([brief], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VayuProsecutor_Brief_${city.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || !brief) {
    return (
      <Card className="w-full">
        <Skeleton className="mx-auto mb-6 h-8 w-2/3" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4"
              // vary widths a bit for a document feel
            />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full" >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Letterhead */}
        <div className="mb-5 border-y-4 border-double border-slate-500 py-4 text-center">
          <div className="mb-1 text-2xl" aria-hidden="true">
            ⚖️
          </div>
          <h2 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-slate-800 sm:text-base">
            In the Matter of Air Quality — {city.toUpperCase()}
          </h2>
        </div>

        {/* Body */}
        <div
          className="min-h-[160px] rounded-xl border border-slate-200 p-5 font-mono text-sm leading-relaxed text-slate-800"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <span className="whitespace-pre-wrap">{revealed}</span>
          {!done && (
            <span
              className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-slate-400 align-middle"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Buttons */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-crimson hover:bg-crimson hover:text-white"
          >
            📋 Copy
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-crimson hover:bg-crimson hover:text-white"
          >
            ⬇️ Download
          </button>
        </div>
      </motion.div>
    </Card>
  );
}
