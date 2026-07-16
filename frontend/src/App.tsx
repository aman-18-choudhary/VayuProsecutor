import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "./components/Navbar";
import { Sidebar, TabId } from "./components/Sidebar";
import { LiveIntelligence } from "./pages/LiveIntelligence";
import { CausalProsecutor } from "./pages/CausalProsecutor";
import { WardIntelligence } from "./pages/WardIntelligence";
import { LandingPage } from "./pages/LandingPage";
import { DEFAULT_CITY } from "./lib/cities";

/* ── Placeholder for unimplemented features ─────────────── */
function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-5xl mb-6 opacity-80">🚧</div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
      <p className="text-text-secondary max-w-sm">
        This module is currently under development and will be available in a future release.
      </p>
    </div>
  );
}

/* ── App root ────────────────────────────────────────────── */
export default function App() {
  const [city, setCity] = useState<string>(DEFAULT_CITY);
  const [tab, setTab] = useState<TabId>("live");
  const [entered, setEntered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!entered) {
    return <LandingPage onEnter={() => setEntered(true)} />;
  }

  // Determine what to render based on active tab
  const renderContent = () => {
    switch (tab) {
      case "live":
        return <LiveIntelligence city={city} />;
      case "causal":
        return <CausalProsecutor city={city} />;
      case "ward":
        return <WardIntelligence city={city} />;
      case "simulator":
        return <PlaceholderView title="Policy Simulator" />;
      case "interventions":
        return <PlaceholderView title="Interventions" />;
      case "alerts":
        return <PlaceholderView title="Alerts & Advisories" />;
      case "reports":
        return <PlaceholderView title="Reports" />;
      case "settings":
        return <PlaceholderView title="Settings" />;
      default:
        return <LiveIntelligence city={city} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base text-text-primary">
      {/* Permanent Left Sidebar */}
      <Sidebar 
        activeTab={tab} 
        onTabChange={setTab} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg-muted/30">
        <Navbar 
          city={city} 
          onCityChange={setCity} 
          onMenuClick={() => setMobileOpen(true)} 
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 scrollbar-hide">
          <div className="mx-auto max-w-[1440px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
