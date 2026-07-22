import { useState } from "react";
import { SystemSettings } from "../../lib/types";
import { useUpdateSettings } from "../../lib/api";
import { GradientButton } from "../ui";
import toast from "react-hot-toast";

export function NotificationsTab({ settings }: { settings: SystemSettings }) {
  const [formData, setFormData] = useState({
    emailNotifications: settings.emailNotifications,
    browserNotifications: settings.browserNotifications,
    smsNotifications: settings.smsNotifications,
    criticalAlerts: settings.criticalAlerts,
    dailySummary: settings.dailySummary,
    weeklyReport: settings.weeklyReport,
    emergencyAlerts: settings.emergencyAlerts
  });
  
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const handleSave = () => {
    updateSettings(formData, {
      onSuccess: () => toast.success("Notification preferences saved"),
      onError: () => toast.error("Failed to save preferences")
    });
  };

  const Toggle = ({ label, field, desc, disabled = false }: { label: string, field: keyof typeof formData, desc: string, disabled?: boolean }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
      </div>
      <button 
        disabled={disabled}
        onClick={() => setFormData(p => ({ ...p, [field]: !p[field] }))}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${
          formData[field] ? 'bg-primary' : 'bg-bg-muted border border-border'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span 
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            formData[field] ? 'translate-x-2' : '-translate-x-2'
          } ${formData[field] && !disabled ? 'shadow-sm' : ''}`} 
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-display font-bold text-text-primary mb-1">Notification Settings</h3>
        <p className="text-sm text-text-secondary">Configure how and when you receive Command Center updates.</p>
      </div>

      <div className="bg-bg-primary border border-border rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">Delivery Methods</h4>
        <Toggle label="Email Notifications" field="emailNotifications" desc="Receive alerts and summaries via email" />
        <Toggle label="Browser Notifications" field="browserNotifications" desc="Desktop push notifications" />
        <Toggle label="SMS (Coming Soon)" field="smsNotifications" desc="Text messages for critical incidents" disabled={true} />
      </div>

      <div className="bg-bg-primary border border-border rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">Event Types</h4>
        <Toggle label="Emergency Alerts" field="emergencyAlerts" desc="Immediate alerts for hazardous AQI or fire events" />
        <Toggle label="Critical Incident Rules" field="criticalAlerts" desc="When AQI or pollutant breaches safety limits" />
        <Toggle label="Daily Briefing" field="dailySummary" desc="Morning digest of city health and AI recommendations" />
        <Toggle label="Weekly Report" field="weeklyReport" desc="Comprehensive environmental analysis every Monday" />
      </div>

      <div className="pt-4 flex justify-end">
        <GradientButton size="md" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Preferences"}
        </GradientButton>
      </div>
    </div>
  );
}
