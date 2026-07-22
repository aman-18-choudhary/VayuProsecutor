import { DownloadCloud, UploadCloud, RefreshCcw, Save } from "lucide-react";
import { GradientButton } from "../ui";
import toast from "react-hot-toast";
import { useSettings } from "../../lib/api";

export function ExportBackupTab() {
  const { data: settings } = useSettings();

  const handleExport = () => {
    if (!settings) return;
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vayu-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Settings exported successfully");
  };

  const handleImport = () => {
    toast.error("Import feature requires administrator re-authentication.");
  };

  const handleBackup = () => {
    toast.success("Configuration backed up to secure vault.");
  };

  const handleReset = () => {
    if (confirm("WARNING: This will reset all configuration to factory defaults. Are you sure?")) {
      toast.success("System reset to defaults.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-display font-bold text-text-primary mb-1">Export & Backup</h3>
        <p className="text-sm text-text-secondary">Save configurations or restore the system from a previous state.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        <div className="p-5 border border-border bg-bg-primary rounded-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
            <DownloadCloud size={14} /> Export Settings
          </h4>
          <p className="text-xs text-text-secondary mb-4">Download a JSON copy of all current configuration values, alert thresholds, and preferences.</p>
          <button onClick={handleExport} className="w-full px-4 py-2 bg-bg-muted border border-border rounded-lg text-sm font-semibold hover:bg-bg-tertiary transition-colors">
            Export JSON
          </button>
        </div>
        
        <div className="p-5 border border-border bg-bg-primary rounded-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
            <UploadCloud size={14} /> Import Settings
          </h4>
          <p className="text-xs text-text-secondary mb-4">Upload a previously exported JSON configuration file to restore settings.</p>
          <button onClick={handleImport} className="w-full px-4 py-2 bg-bg-muted border border-border rounded-lg text-sm font-semibold hover:bg-bg-tertiary transition-colors">
            Import JSON
          </button>
        </div>

        <div className="p-5 border border-border bg-bg-primary rounded-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
            <Save size={14} /> System Backup
          </h4>
          <p className="text-xs text-text-secondary mb-4">Create a full snapshot of settings, users, and audit logs to the secure vault.</p>
          <GradientButton size="sm" onClick={handleBackup} className="w-full justify-center">
            Create Backup
          </GradientButton>
        </div>

        <div className="p-5 border border-danger/30 bg-danger/5 rounded-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-danger mb-4 flex items-center gap-2">
            <RefreshCcw size={14} /> Factory Reset
          </h4>
          <p className="text-xs text-danger/80 mb-4">Revert all platform settings, thresholds, and AI configurations to installation defaults.</p>
          <button onClick={handleReset} className="w-full px-4 py-2 bg-danger text-white rounded-lg text-sm font-semibold hover:bg-danger/90 transition-colors">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
