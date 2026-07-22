import { useState } from "react";
import { SystemSettings } from "../../lib/types";
import { useUpdateSettings } from "../../lib/api";
import { GradientButton } from "../ui";
import toast from "react-hot-toast";

export function PreferencesTab({ settings }: { settings: SystemSettings }) {
  const [formData, setFormData] = useState({
    defaultLandingPage: settings.defaultLandingPage,
    refreshInterval: settings.refreshInterval,
    autoRefresh: settings.autoRefresh,
    theme: settings.theme,
    compactMode: settings.compactMode,
    animationToggle: settings.animationToggle,
    defaultMapLayer: settings.defaultMapLayer
  });
  
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const handleSave = () => {
    updateSettings(formData, {
      onSuccess: () => toast.success("Preferences updated"),
      onError: () => toast.error("Failed to update preferences")
    });
  };

  const Toggle = ({ label, field, desc }: { label: string, field: keyof typeof formData, desc: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
      </div>
      <button 
        onClick={() => setFormData(p => ({ ...p, [field]: !(p as any)[field] }))}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${
          (formData as any)[field] ? 'bg-primary' : 'bg-bg-muted border border-border'
        }`}
      >
        <span 
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            (formData as any)[field] ? 'translate-x-2' : '-translate-x-2'
          } ${(formData as any)[field] ? 'shadow-sm' : ''}`} 
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-display font-bold text-text-primary mb-1">Dashboard Preferences</h3>
        <p className="text-sm text-text-secondary">Customize your VayuProsecutor workspace.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">Default Landing Page</label>
          <select 
            value={formData.defaultLandingPage}
            onChange={(e) => setFormData(p => ({ ...p, defaultLandingPage: e.target.value }))}
            className="w-full rounded-lg border border-border bg-bg-primary py-2 px-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="dashboard">Smart City Command Center</option>
            <option value="explore">Product Discovery Tour</option>
            <option value="alerts">Alerts & Advisories</option>
            <option value="reports">Reporting Engine</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">Theme Preference</label>
          <select 
            value={formData.theme}
            onChange={(e) => setFormData(p => ({ ...p, theme: e.target.value }))}
            className="w-full rounded-lg border border-border bg-bg-primary py-2 px-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="system">System Default</option>
            <option value="light">Light (Vayu Clean)</option>
            <option value="dark">Dark (Command Center)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">Default Map Layer</label>
          <select 
            value={formData.defaultMapLayer}
            onChange={(e) => setFormData(p => ({ ...p, defaultMapLayer: e.target.value }))}
            className="w-full rounded-lg border border-border bg-bg-primary py-2 px-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="aqi">Live AQI Heatmap</option>
            <option value="traffic">Traffic Density</option>
            <option value="fire">Fire & Smoke Sources</option>
            <option value="vulnerability">Vulnerability Index</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block flex justify-between">
            <span>Refresh Interval (Minutes)</span>
            <span className="text-primary">{formData.refreshInterval}m</span>
          </label>
          <input 
            type="range" 
            min="1" max="60" 
            value={formData.refreshInterval}
            onChange={(e) => setFormData(p => ({ ...p, refreshInterval: Number(e.target.value) }))}
            className="w-full accent-primary mt-2"
          />
        </div>
      </div>

      <div className="bg-bg-primary border border-border rounded-xl p-4 mt-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">Display Toggles</h4>
        <Toggle label="Auto Refresh Data" field="autoRefresh" desc="Automatically fetch new telemetry" />
        <Toggle label="Compact Mode" field="compactMode" desc="Reduce padding to show more information on screen" />
        <Toggle label="UI Animations" field="animationToggle" desc="Enable smooth page transitions and micro-interactions" />
      </div>

      <div className="pt-4 flex justify-end">
        <GradientButton size="md" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Preferences"}
        </GradientButton>
      </div>
    </div>
  );
}
