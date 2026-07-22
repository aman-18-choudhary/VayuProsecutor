import React, { useState } from "react";
import { Alert } from "../../lib/types";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationCenter({ alerts }: { alerts: Alert[] }) {
  const [open, setOpen] = useState(false);
  const critical = alerts.filter(a => a.severity === "Critical" || a.severity === "High");

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-bg-muted transition-colors relative"
      >
        <Bell size={20} className="text-text-secondary" />
        {critical.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-base" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-bg-base rounded-2xl shadow-xl border border-border z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-border bg-bg-muted/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                  {critical.length} Critical
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {critical.length === 0 ? (
                  <div className="p-6 text-center text-sm text-text-muted">
                    No critical notifications
                  </div>
                ) : (
                  critical.map(alert => (
                    <div key={alert.id} className="p-3 border-b border-border hover:bg-bg-muted transition-colors cursor-pointer">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-red-600">{alert.category}</span>
                        <span className="text-[10px] text-text-muted">Now</span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
