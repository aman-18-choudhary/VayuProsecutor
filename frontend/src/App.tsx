import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "./components/Navbar";
import { LiveIntelligence } from "./pages/LiveIntelligence";
import { CausalProsecutor } from "./pages/CausalProsecutor";
import { DEFAULT_CITY } from "./lib/cities";

type Tab = "live" | "causal";

const TABS: { id: Tab; label: string }[] = [
  { id: "live", label: "📊 Live Intelligence" },
  { id: "causal", label: "⚖️ Causal Prosecutor" },
];

export default function App() {
  const [city, setCity] = useState<string>(DEFAULT_CITY);
  const [tab, setTab] = useState<Tab>("live");

  return (
    <div className="min-h-screen bg-navy-light text-slate-900">
      <Navbar city={city} onCityChange={setCity} />

      {/* Tab switcher */}
      <div className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  "flex-1 sm:flex-none sm:min-w-[240px] px-6 py-3 rounded-xl text-base font-semibold transition-all duration-200 border",
                  active
                    ? "bg-gradient-to-r from-crimson to-[#e05545] text-white border-crimson shadow-[0_0_24px_rgba(192,57,43,0.5)]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-[1400px] mx-auto px-4 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {tab === "live" ? (
              <LiveIntelligence city={city} />
            ) : (
              <CausalProsecutor city={city} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="text-center text-slate-500 text-xs pb-8">
        VayuProsecutor · ET AI Hackathon 2026 · Powered by Microsoft DoWhy
      </footer>
    </div>
  );
}
