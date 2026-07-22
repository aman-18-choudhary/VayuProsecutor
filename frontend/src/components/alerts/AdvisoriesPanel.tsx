import React from "react";
import { SystemAdvisory } from "../../lib/types";
import { Card, Badge } from "../ui";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Shield, School, Car, FileText, CheckCircle2 } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  public_health: <Shield size={16} className="text-red-500" />,
  regulation: <FileText size={16} className="text-orange-500" />,
  schools: <School size={16} className="text-yellow-500" />,
  intervention: <Lightbulb size={16} className="text-purple-500" />,
  traffic: <Car size={16} className="text-blue-500" />,
  monitoring: <CheckCircle2 size={16} className="text-green-500" />,
  inspection: <FileText size={16} className="text-indigo-500" />,
};

export function AdvisoriesPanel({ advisories, loading }: { advisories: SystemAdvisory[]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="p-5 h-full min-h-[300px]">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Smart AI Advisories</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-bg-muted animate-pulse rounded-xl" />)}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Lightbulb size={16} className="text-primary" /> Smart AI Advisories
        </h3>
        <Badge variant="primary" size="xs">{advisories.length} Active</Badge>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
        <AnimatePresence>
          {advisories.map((adv, idx) => (
            <motion.div
              key={adv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-3 rounded-xl border border-border bg-bg-base/50"
            >
              <div className="flex gap-3">
                <div className="mt-0.5 p-2 bg-white rounded-lg shadow-sm border border-border h-max">
                  {ICON_MAP[adv.type] || <Lightbulb size={16} />}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold text-text-primary leading-tight">{adv.title}</h4>
                    {adv.impact === "High" && <Badge variant="danger" size="xs">High Impact</Badge>}
                  </div>
                  <p className="text-xs text-text-secondary leading-snug">{adv.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {advisories.length === 0 && (
             <div className="flex flex-col items-center justify-center h-32 opacity-50 text-text-muted">
               <CheckCircle2 size={32} className="mb-2" />
               <p className="text-sm font-semibold">No critical advisories at this time.</p>
             </div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
