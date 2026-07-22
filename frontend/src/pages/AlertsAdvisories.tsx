import React, { useState } from "react";
import { City, Alert } from "../lib/types";
import { useAlerts, useAdvisories, useAlertStats, useAlertTimeline } from "../lib/api";
import { AlertKPIs } from "../components/alerts/AlertKPIs";
import { AlertFeed } from "../components/alerts/AlertFeed";
import { AlertMap } from "../components/alerts/AlertMap";
import { AdvisoriesPanel } from "../components/alerts/AdvisoriesPanel";
import { AlertTimeline } from "../components/alerts/AlertTimeline";
import { AlertDrawer } from "../components/alerts/AlertDrawer";
import { NotificationCenter } from "../components/alerts/NotificationCenter";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

export function AlertsAdvisories({ city }: { city: City }) {
  const { data: alerts, isLoading: isLoadingAlerts } = useAlerts(city);
  const { data: advisories, isLoading: isLoadingAdvisories } = useAdvisories(city);
  const { data: stats, isLoading: isLoadingStats } = useAlertStats(city);
  const { data: timeline, isLoading: isLoadingTimeline } = useAlertTimeline(city);

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterStatus, setFilterStatus] = useState<"Active" | "Acknowledged">("Active");

  const activeAlerts = (alerts || []).filter(a => a.status === "Active");
  const displayedAlerts = (alerts || []).filter(a => a.status === filterStatus);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-2xl font-extrabold text-text-primary flex items-center gap-2">
            <ShieldAlert size={28} className="text-primary" />
            Alerts & Advisories Center
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Real-time intelligence and actionable advisories for{" "}
            <span className="font-semibold text-text-primary">{city.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationCenter alerts={activeAlerts} />
          <div className="flex items-center gap-2 rounded-full border border-border bg-primary/5 px-4 py-2 text-xs font-semibold text-primary shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Live Sync Active
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <AlertKPIs stats={stats} loading={isLoadingStats} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Feed */}
        <div className="xl:col-span-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Live Incident Feed</h3>
            <div className="flex bg-bg-muted rounded-lg p-1">
              <button 
                onClick={() => setFilterStatus("Active")}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${filterStatus === "Active" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"}`}
              >
                Active
              </button>
              <button 
                onClick={() => setFilterStatus("Acknowledged")}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${filterStatus === "Acknowledged" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"}`}
              >
                History
              </button>
            </div>
          </div>
          <AlertFeed 
            alerts={displayedAlerts} 
            onSelectAlert={setSelectedAlert} 
            selectedAlertId={selectedAlert?.id}
          />
        </div>

        {/* Middle Column: Map & Timeline */}
        <div className="xl:col-span-6 flex flex-col gap-6">
           <AlertMap 
             alerts={activeAlerts} 
             onSelectAlert={setSelectedAlert}
           />
           <AlertTimeline data={timeline || []} loading={isLoadingTimeline} />
        </div>

        {/* Right Column: AI Advisories */}
        <div className="xl:col-span-3">
          <AdvisoriesPanel advisories={advisories || []} loading={isLoadingAdvisories} />
        </div>
      </div>

      <AlertDrawer alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}
