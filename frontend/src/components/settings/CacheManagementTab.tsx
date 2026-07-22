import { useRefreshCache, useClearCache } from "../../lib/api";
import { GradientButton } from "../ui";
import { HardDrive, RefreshCcw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export function CacheManagementTab() {
  const { mutate: refreshCache, isPending: refreshing } = useRefreshCache();
  const { mutate: clearCache, isPending: clearing } = useClearCache();

  const handleRefresh = () => {
    refreshCache(undefined, {
      onSuccess: () => toast.success("Cache refreshed. Fetching new data..."),
      onError: () => toast.error("Failed to refresh cache")
    });
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to completely clear the cache? This will cause the next dashboard load to be slow.")) {
      clearCache(undefined, {
        onSuccess: () => toast.success("Cache cleared"),
        onError: () => toast.error("Failed to clear cache")
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-display font-bold text-text-primary mb-1">Cache Management</h3>
        <p className="text-sm text-text-secondary">Control the in-memory data cache to manage API limits and data freshness.</p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        <div className="p-5 border border-border bg-bg-primary rounded-xl flex items-center justify-between">
          <div className="flex gap-4">
            <div className="mt-1 text-primary"><RefreshCcw size={20} /></div>
            <div>
              <h4 className="font-semibold text-sm">Force Refresh Cache</h4>
              <p className="text-xs text-text-secondary mt-1 max-w-sm">
                Invalidates current cache and triggers a background sync to fetch the latest telemetry without dropping the current view.
              </p>
            </div>
          </div>
          <GradientButton size="sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh Cache"}
          </GradientButton>
        </div>

        <div className="p-5 border border-danger/30 bg-danger/5 rounded-xl flex items-center justify-between">
          <div className="flex gap-4">
            <div className="mt-1 text-danger"><Trash2 size={20} /></div>
            <div>
              <h4 className="font-semibold text-sm text-danger">Clear All Cache</h4>
              <p className="text-xs text-danger/80 mt-1 max-w-sm">
                Completely wipes the in-memory cache. All subsequent requests will hit external APIs directly. Use with caution to avoid rate limits.
              </p>
            </div>
          </div>
          <button 
            onClick={handleClear}
            disabled={clearing}
            className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-semibold hover:bg-danger/90 transition-colors disabled:opacity-50"
          >
            {clearing ? "Clearing..." : "Clear Cache"}
          </button>
        </div>
      </div>
    </div>
  );
}
