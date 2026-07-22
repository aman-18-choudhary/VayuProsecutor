import React from "react";
import { Alert } from "../../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, MapPin, Clock, Activity, Target, Shield } from "lucide-react";
import { Badge } from "../ui";
import { useAcknowledgeAlert } from "../../lib/api";
import toast from "react-hot-toast";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "success",
  Informational: "outline",
};

export function AlertDrawer({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  const { mutate: acknowledgeAlert, isPending } = useAcknowledgeAlert();

  const handleAcknowledge = () => {
    if (!alert) return;
    acknowledgeAlert(alert.id, {
      onSuccess: () => {
        toast.success("Alert acknowledged successfully");
        onClose();
      },
      onError: () => toast.error("Failed to acknowledge alert")
    });
  };

  return (
    <AnimatePresence>
      {alert && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-bg-base shadow-2xl border-l border-border z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-border flex justify-between items-start bg-bg-muted/50">
              <div>
                <Badge variant={SEVERITY_COLORS[alert.severity] as any} className="mb-2">
                  {alert.severity} Alert
                </Badge>
                <h2 className="text-lg font-display font-bold text-text-primary leading-tight">
                  {alert.category}
                </h2>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary font-mono">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(alert.timestamp).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {alert.ward}</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-bg-muted rounded-full transition-colors text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Incident Summary */}
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Incident Summary
                </h3>
                <div className="p-4 bg-bg-muted rounded-xl text-sm text-text-secondary leading-relaxed border border-border">
                  {alert.message}
                </div>
              </div>

              {/* Metrics */}
              {alert.aqi !== null && (
                <div>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Activity size={14} /> Evidence Data
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <MetricBox label="AQI" value={alert.aqi} />
                    <MetricBox label="PM2.5" value={alert.pm25} unit="µg/m³" />
                    <MetricBox label="PM10" value={alert.pm10} unit="µg/m³" />
                  </div>
                </div>
              )}

              {/* Source & Confidence */}
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Target size={14} /> Causal Source
                </h3>
                <div className="flex justify-between items-center p-3 rounded-xl border border-border">
                  <span className="text-sm font-semibold text-text-primary">{alert.source}</span>
                  <Badge variant="primary" size="xs">Confidence: {alert.confidence_score}%</Badge>
                </div>
              </div>

              {/* Recommended Actions placeholder */}
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield size={14} /> Recommended Actions
                </h3>
                <ul className="space-y-2">
                  {[
                    "Deploy emergency field inspectors to the affected area.",
                    "Issue localized health advisory via SMS.",
                    "Review nearby industrial emission logs."
                  ].map((action, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary bg-bg-muted/50 p-2 rounded-lg border border-border">
                      <span className="text-primary font-bold">•</span> {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-5 border-t border-border bg-bg-muted/50">
              {alert.status === "Acknowledged" ? (
                <button disabled className="w-full py-2.5 bg-bg-muted text-text-muted rounded-xl text-sm font-bold border border-border shadow-sm cursor-not-allowed">
                  Acknowledged
                </button>
              ) : (
                <button 
                  onClick={handleAcknowledge}
                  disabled={isPending}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Acknowledging..." : "Acknowledge Alert"}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MetricBox({ label, value, unit }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="p-3 bg-bg-base border border-border rounded-xl text-center shadow-sm">
      <div className="text-[10px] font-bold text-text-muted uppercase mb-1">{label}</div>
      <div className="text-lg font-display font-extrabold text-text-primary">
        {value !== null ? value : "--"}
      </div>
      {unit && value !== null && <div className="text-[10px] text-text-secondary mt-0.5">{unit}</div>}
    </div>
  );
}
