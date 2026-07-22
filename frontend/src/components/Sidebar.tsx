import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type TabId = 
  | "dashboard"
  | "live" 
  | "causal" 
  | "simulator" 
  | "interventions" 
  | "ward" 
  | "alerts" 
  | "reports" 
  | "settings"
  | "explore";

const NAV_ITEMS = [
  { id: "dashboard", label: "Command Center", icon: "🏠", type: "link" },
  { id: "overview-cat", label: "Overview", type: "category" },
  { id: "live", label: "Live Intelligence", icon: "📊", type: "link" },
  { id: "causal", label: "Causal Prosecutor", icon: "⚖️", type: "link" },
  
  { id: "planning-cat", label: "Planning", type: "category" },
  { id: "simulator", label: "Policy Simulator", icon: "🧪", type: "link" },
  { id: "interventions", label: "Interventions", icon: "🛡️", type: "link" },
  
  { id: "intel-cat", label: "Intelligence", type: "category" },
  { id: "ward", label: "Ward Intelligence", icon: "🗺️", type: "link" },
  { id: "alerts", label: "Alerts & Advisories", icon: "⚠️", type: "link" },
  { id: "reports", label: "Reports", icon: "📄", type: "link" },
  
  { id: "sys-cat", label: "System", type: "category" },
  { id: "settings", label: "Settings", icon: "⚙️", type: "link" },
];

export interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ activeTab, onTabChange, mobileOpen, setMobileOpen }: SidebarProps) {
  const sidebarContent = (
    <div className="flex h-full flex-col bg-white/95 backdrop-blur-xl border-r border-border">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand shadow-glow-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="3" x2="12" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="7" x2="20" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 7 L2 13 A3 3 0 0 0 8 13 Z" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M20 7 L18 13 A3 3 0 0 0 24 13 Z" stroke="white" strokeWidth="1.5" fill="none" />
            <line x1="8" y1="18" x2="16" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M3 21.5 C 6 19.5, 9 23, 12 21 S 18 19, 21 21" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <span className="font-display text-[15px] font-extrabold tracking-tight gradient-text">
          VayuProsecutor
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            if (item.type === "category") {
              return (
                <div key={item.id} className="mt-4 mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  {item.label}
                </div>
              );
            }
            
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id as TabId);
                  setMobileOpen(false);
                }}
                className={[
                  "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "text-text-secondary hover:bg-bg-muted hover:text-text-primary"
                ].join(" ")}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl border border-primary/20 bg-primary/5"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 text-lg opacity-80 group-hover:opacity-100 transition-opacity">
                  {item.icon}
                </span>
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* System Status Panel */}
      <div className="p-4 border-t border-border bg-bg-muted/30">
        <div className="rounded-xl border border-border/60 bg-white p-3 shadow-sm">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">System Status</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                API Health
              </span>
              <span className="font-mono font-medium text-success">100%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Model</span>
              <span className="font-medium text-primary">Active</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Last Sync</span>
              <span className="font-mono font-medium text-text-primary">Just now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Branded Footer */}
      <div className="p-4 border-t border-border bg-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-text-primary text-white font-mono text-[10px] font-bold">
            AI
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-bold text-text-primary">Command Center</span>
            <span className="text-[9px] font-medium text-text-muted">ET Hackathon 2026</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-full shadow-card z-30 relative">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-text-primary/20 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
