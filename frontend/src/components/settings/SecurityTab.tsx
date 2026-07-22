import { Key, Clock, ShieldCheck, History } from "lucide-react";
import { GradientButton } from "../ui";
import toast from "react-hot-toast";

export function SecurityTab() {
  const handleRegenerate = () => {
    toast.success("API Key regenerated");
  };

  const handleLogout = () => {
    toast.success("All other sessions terminated");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-display font-bold text-text-primary mb-1">Security & Access</h3>
        <p className="text-sm text-text-secondary">Manage API keys, sessions, and permissions.</p>
      </div>

      <div className="bg-bg-primary border border-border rounded-xl p-5 max-w-2xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
          <Key size={14} /> API Keys
        </h4>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Primary Read/Write Key</span>
          <span className="text-xs text-text-muted">Expires in 90 days</span>
        </div>
        <div className="flex gap-2">
          <input 
            type="password" 
            value="YOUR_STRIPE_KEY" 
            readOnly 
            className="w-full bg-bg-muted border border-border rounded-lg px-3 py-2 text-sm text-text-secondary font-mono focus:outline-none"
          />
          <button className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-xs font-medium hover:bg-bg-muted transition-colors">
            Copy
          </button>
        </div>
        <div className="mt-4">
          <GradientButton size="sm" onClick={handleRegenerate}>Regenerate Key</GradientButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <div className="bg-bg-primary border border-border rounded-xl p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
            <Clock size={14} /> Session Management
          </h4>
          <p className="text-sm font-semibold mb-1">Active Sessions: 2</p>
          <p className="text-xs text-text-secondary mb-4">Last login: 5 mins ago (Mac OS, Chrome)</p>
          <button onClick={handleLogout} className="text-xs font-semibold text-danger hover:underline">
            Terminate all other sessions
          </button>
        </div>
        <div className="bg-bg-primary border border-border rounded-xl p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
            <ShieldCheck size={14} /> Role & Permissions
          </h4>
          <p className="text-sm font-semibold mb-1">Role: Administrator</p>
          <p className="text-xs text-text-secondary">You have full access to view, edit, and configure the platform.</p>
        </div>
      </div>
    </div>
  );
}
