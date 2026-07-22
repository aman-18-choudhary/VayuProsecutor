import React from "react";
import { Alert } from "../../lib/types";
import { Card, Badge } from "../ui";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, MapPin, Clock } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "success",
  Informational: "outline",
};

export function AlertFeed({ alerts, onSelectAlert, selectedAlertId }: { alerts: Alert[]; onSelectAlert: (alert: Alert) => void; selectedAlertId?: string }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 opacity-50">
        <AlertTriangle size={32} className="mb-2" />
        <p className="text-sm font-semibold">No alerts found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.01 }}
            className="cursor-pointer"
            onClick={() => onSelectAlert(alert)}
          >
            <Card hover={false} className={`p-4 transition-colors ${selectedAlertId === alert.id ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <Badge variant={SEVERITY_COLORS[alert.severity] as any} size="sm">
                  {alert.severity}
                </Badge>
                <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 className="text-sm font-bold text-text-primary leading-tight mb-1">{alert.category}</h4>
              <p className="text-xs text-text-secondary line-clamp-2 mb-3">{alert.message}</p>
              
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-text-muted">
                  <MapPin size={12} />
                  {alert.ward}
                </div>
                {alert.aqi && (
                  <div className="text-[10px] font-bold text-text-secondary">
                    AQI <span className="text-text-primary">{alert.aqi}</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
