import React from "react";
import { MotionCard } from "../ui";
import { AlertStats } from "../../lib/types";
import { AlertTriangle, Activity, CheckCircle, Flame, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

export function AlertKPIs({ stats, loading }: { stats?: AlertStats; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <KPICard 
        title="Active Alerts" 
        value={stats.total_active} 
        icon={<Activity size={20} className="text-blue-500" />} 
        delay={0.1} 
      />
      <KPICard 
        title="Critical Alerts" 
        value={stats.critical_count} 
        icon={<AlertTriangle size={20} className="text-red-500" />} 
        delay={0.2} 
        urgent={stats.critical_count > 0}
      />
      <KPICard 
        title="High Priority" 
        value={stats.high_count} 
        icon={<Flame size={20} className="text-orange-500" />} 
        delay={0.3} 
      />
      <KPICard 
        title="Resolved Today" 
        value={stats.resolved_today} 
        icon={<CheckCircle size={20} className="text-green-500" />} 
        delay={0.4} 
      />
      <KPICard 
        title="Average AQI" 
        value={stats.avg_aqi} 
        icon={<BarChart2 size={20} className="text-purple-500" />} 
        delay={0.5} 
        subtitle={`Highest: ${stats.highest_aqi_ward}`}
      />
    </div>
  );
}

function KPICard({ title, value, icon, delay, subtitle, urgent }: { title: string, value: string | number, icon: React.ReactNode, delay: number, subtitle?: string, urgent?: boolean }) {
  return (
    <MotionCard delay={delay} className={`p-4 flex flex-col justify-between ${urgent ? "border border-red-500 bg-red-500/5" : ""}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">{title}</h4>
        {icon}
      </div>
      <div>
        <motion.div 
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-3xl font-display font-extrabold ${urgent ? "text-red-600" : "text-text-primary"}`}
        >
          {value}
        </motion.div>
        {subtitle && <p className="text-[10px] text-text-muted mt-1 truncate">{subtitle}</p>}
      </div>
    </MotionCard>
  );
}
