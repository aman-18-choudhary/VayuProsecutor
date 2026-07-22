import { useState } from "react";
import { X, FileText, Activity, Map, BarChart2, Zap, LayoutList, Calendar as CalendarIcon } from "lucide-react";
import { Card } from "../ui";
import type { City } from "../../lib/types";
import { useGenerateReport, useReportTemplates } from "../../lib/api";
import toast from "react-hot-toast";

export function CreateReportModal({
  city,
  isOpen,
  onClose,
  onGenerated
}: {
  city: City;
  isOpen: boolean;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const { data: templates } = useReportTemplates();
  const generateMutation = useGenerateReport();
  
  const [selectedType, setSelectedType] = useState<string>("Executive Summary");
  const [dateRange, setDateRange] = useState<string>("today");
  
  // Section states
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeMaps, setIncludeMaps] = useState(true);
  const [includeWardInt, setIncludeWardInt] = useState(true);
  const [includeCausal, setIncludeCausal] = useState(true);
  const [includeRecs, setIncludeRecs] = useState(true);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync({
        city,
        type: selectedType,
        user: "City Admin",
        // In a more complex backend, we would pass these toggles:
        // dateRange, includeCharts, includeMaps, includeWardInt, includeCausal, includeRecs
      });
      toast.success("Report generated successfully");
      onGenerated();
      onClose();
    } catch (e) {
      toast.error("Failed to generate report");
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <Card className="w-full max-w-2xl p-0 overflow-hidden my-auto" hover={false}>
        <div className="p-5 border-b border-border flex justify-between items-center bg-bg-muted/50">
          <h3 className="font-bold text-text-primary flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            New Intelligence Report
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-border text-text-muted transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Report Type
              </label>
              <select 
                className="w-full p-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {(templates || []).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CalendarIcon size={14} /> Date Range
              </label>
              <select 
                className="w-full p-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">Today (Live)</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>
          </div>
          
          <div>
             <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                Include Sections
              </label>
              <div className="grid grid-cols-2 gap-3">
                 <CheckboxItem icon={<BarChart2 size={16}/>} label="Charts & Graphs" checked={includeCharts} onChange={setIncludeCharts} />
                 <CheckboxItem icon={<Map size={16}/>} label="Heatmaps" checked={includeMaps} onChange={setIncludeMaps} />
                 <CheckboxItem icon={<LayoutList size={16}/>} label="Ward Intelligence" checked={includeWardInt} onChange={setIncludeWardInt} />
                 <CheckboxItem icon={<Activity size={16}/>} label="Causal Analysis" checked={includeCausal} onChange={setIncludeCausal} />
                 <CheckboxItem icon={<Zap size={16}/>} label="AI Recommendations" checked={includeRecs} onChange={setIncludeRecs} />
              </div>
          </div>
          
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 text-sm">
            <Activity className="text-primary shrink-0 mt-0.5" size={18} />
            <p className="text-primary/90 leading-relaxed font-medium">
              Generating this report will compile live AQI metrics, causal attributions, ward-level risks, and active alerts into a unified briefing for {city.name}.
            </p>
          </div>
          
          <div className="pt-2 border-t border-border flex justify-end gap-3">
             <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-muted transition-colors">
               Cancel
             </button>
             <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              {generateMutation.isPending ? "Compiling..." : "Generate Report"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CheckboxItem({ icon, label, checked, onChange }: { icon: React.ReactNode, label: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-text-secondary hover:border-text-muted'}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
      <div className={`w-5 h-5 rounded flex items-center justify-center border ${checked ? 'bg-primary border-primary text-white' : 'border-text-muted'}`}>
        {checked && <X size={12} className="rotate-45" style={{ filter: 'brightness(0) invert(1)' }} />}
      </div>
      <div className="flex items-center gap-2 font-semibold text-sm">
        {icon}
        {label}
      </div>
    </label>
  );
}
