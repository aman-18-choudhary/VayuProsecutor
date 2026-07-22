import { useState } from "react";
import { SystemSettings } from "../../lib/types";
import { useUpdateSettings } from "../../lib/api";
import { GradientButton } from "../ui";
import toast from "react-hot-toast";
import { BrainCircuit, Cpu, TrendingUp } from "lucide-react";

export function AIConfigTab({ settings }: { settings: SystemSettings }) {
  const [formData, setFormData] = useState({
    aiProvider: settings.aiProvider,
    confidenceThreshold: settings.confidenceThreshold,
    forecastHorizon: settings.forecastHorizon,
    simulationPrecision: settings.simulationPrecision
  });
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const handleSave = () => {
    updateSettings(formData, {
      onSuccess: () => toast.success("AI configuration saved"),
      onError: () => toast.error("Failed to save AI configuration")
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-display font-bold text-text-primary mb-1">AI Engine Configuration</h3>
        <p className="text-sm text-text-secondary">Manage LLMs, Causal inference engines, and forecasting thresholds.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-border bg-bg-primary shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit size={16} className="text-primary" />
            <h4 className="text-xs font-bold uppercase text-text-secondary">Causal Engine</h4>
          </div>
          <p className="text-sm font-semibold">Microsoft DoWhy</p>
          <p className="text-[10px] text-success mt-1">Status: Operational</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-bg-primary shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={16} className="text-secondary" />
            <h4 className="text-xs font-bold uppercase text-text-secondary">NLP Provider</h4>
          </div>
          <p className="text-sm font-semibold">{formData.aiProvider}</p>
          <p className="text-[10px] text-success mt-1">Status: Connected</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-bg-primary shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-amber-500" />
            <h4 className="text-xs font-bold uppercase text-text-secondary">Forecaster</h4>
          </div>
          <p className="text-sm font-semibold">Prophet API</p>
          <p className="text-[10px] text-success mt-1">Status: Trained</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-2 flex justify-between">
            <span>LLM Provider</span>
          </label>
          <select 
            value={formData.aiProvider}
            onChange={(e) => setFormData(p => ({ ...p, aiProvider: e.target.value }))}
            className="w-full max-w-sm rounded-lg border border-border bg-bg-primary py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="OpenAI GPT-4o">OpenAI GPT-4o</option>
            <option value="Anthropic Claude 3.5 Sonnet">Anthropic Claude 3.5 Sonnet</option>
            <option value="Google Gemini 1.5 Pro">Google Gemini 1.5 Pro</option>
            <option value="Local Llama 3 70B">Local Llama 3 70B</option>
          </select>
        </div>

        <div className="max-w-md">
          <label className="text-xs font-semibold text-text-secondary uppercase mb-2 flex justify-between">
            <span>Action Confidence Threshold</span>
            <span className="text-primary">{formData.confidenceThreshold}%</span>
          </label>
          <input 
            type="range" 
            min="50" max="99" 
            value={formData.confidenceThreshold}
            onChange={(e) => setFormData(p => ({ ...p, confidenceThreshold: Number(e.target.value) }))}
            className="w-full accent-primary"
          />
          <p className="text-[10px] text-text-muted mt-1">AI Interventions below this confidence will be discarded.</p>
        </div>

        <div className="max-w-md">
          <label className="text-xs font-semibold text-text-secondary uppercase mb-2 flex justify-between">
            <span>Forecast Horizon (Hours)</span>
            <span className="text-primary">{formData.forecastHorizon}h</span>
          </label>
          <input 
            type="range" 
            min="12" max="168" step="12"
            value={formData.forecastHorizon}
            onChange={(e) => setFormData(p => ({ ...p, forecastHorizon: Number(e.target.value) }))}
            className="w-full accent-primary"
          />
          <p className="text-[10px] text-text-muted mt-1">How far into the future the predictive models should calculate.</p>
        </div>

        <div className="max-w-md">
          <label className="text-xs font-semibold text-text-secondary uppercase mb-2 flex justify-between">
            <span>Simulation Precision</span>
            <span className="text-primary">{formData.simulationPrecision}%</span>
          </label>
          <input 
            type="range" 
            min="70" max="100" 
            value={formData.simulationPrecision}
            onChange={(e) => setFormData(p => ({ ...p, simulationPrecision: Number(e.target.value) }))}
            className="w-full accent-primary"
          />
          <p className="text-[10px] text-text-muted mt-1">Higher precision uses more compute time for policy causal inference.</p>
        </div>
      </div>

      <div className="pt-6 border-t border-border flex justify-end">
        <GradientButton size="md" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save AI Configuration"}
        </GradientButton>
      </div>
    </div>
  );
}
