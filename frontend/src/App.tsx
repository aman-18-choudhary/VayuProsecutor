import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "./components/Navbar";
import { Sidebar, TabId } from "./components/Sidebar";
import { LiveIntelligence } from "./pages/LiveIntelligence";
import { SmartCityCommandCenter } from "./pages/SmartCityCommandCenter";
import { CausalProsecutor } from "./pages/CausalProsecutor";
import { CityCompare } from "./pages/CityCompare";
import { WardIntelligence } from "./pages/WardIntelligence";
import { Interventions } from "./pages/Interventions";
import { PolicySimulator } from "./pages/PolicySimulator";
import { AlertsAdvisories } from "./pages/AlertsAdvisories";
import { Reports } from "./pages/Reports";
import { ProductDiscovery } from "./pages/ProductDiscovery";
import { Settings } from "./pages/Settings";
import { LandingPage } from "./pages/LandingPage";
import { CITIES, DEFAULT_CITY } from "./lib/cities";
import { City } from "./lib/types";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
  const [city, setCity] = useState<City>(
    CITIES.find((c) => c.name === DEFAULT_CITY) || { name: DEFAULT_CITY, lat: 28.6139, lon: 77.209 }
  );
  const [tab, setTab] = useState<TabId>("dashboard");
  const [entered, setEntered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<TabId>;
      if (customEvent.detail) {
        setTab(customEvent.detail);
      }
    };
    window.addEventListener("change-tab", handleTabChange);
    return () => window.removeEventListener("change-tab", handleTabChange);
  }, []);

  if (!entered) {
    return (
      <LandingPage 
        onEnter={() => setEntered(true)} 
        onExplore={() => {
          setTab("explore");
          setEntered(true);
        }}
      />
    );
  }

  // Determine what to render based on active tab
  const renderContent = () => {
    switch (tab) {
      case "dashboard":
        return <SmartCityCommandCenter city={city} />;
      case "live":
        return <LiveIntelligence city={city} />;
      case "causal":
        return <CausalProsecutor city={city} />;
      case "compare":
        return <CityCompare />;
      case "ward":
        return <WardIntelligence city={city} />;
      case "simulator":
        return <PolicySimulator city={city} />;
      case "interventions":
        return <Interventions city={city} />;
      case "alerts":
        return <AlertsAdvisories city={city} />;
      case "reports":
        return <Reports city={city} />;
      case "explore":
        return <ProductDiscovery onOpenModule={(t) => setTab(t as TabId)} />;
      case "settings":
        return <Settings />;
      default:
        return <SmartCityCommandCenter city={city} />;
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
                <ErrorBoundary key={tab}>
                  {renderContent()}
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
