import { useState } from "react";
import { SystemSettings } from "../../lib/types";
import { useUpdateSettings } from "../../lib/api";
import { GradientButton } from "../ui";
import toast from "react-hot-toast";

const AVAILABLE_CITIES = [
  "New Delhi", "Mumbai", "Bangalore", "Kolkata", "Chennai", 
  "Hyderabad", "Ahmedabad", "Pune", "Jaipur", "Lucknow"
];

export function CityConfigTab({ settings }: { settings: SystemSettings }) {
  const [formData, setFormData] = useState({
    defaultCity: settings.defaultCity,
    monitoredCities: [...settings.monitoredCities],
    favouriteCities: [...settings.favouriteCities]
  });
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const handleSave = () => {
    updateSettings(formData, {
      onSuccess: () => {
        toast.success("City configuration saved");
        if (formData.defaultCity !== settings.defaultCity) {
            // Need to reload window or dispatch event to change dashboard city if required
            toast("Dashboard city will update on next refresh.", { icon: "🔄" });
        }
      },
      onError: () => toast.error("Failed to save configuration")
    });
  };

  const toggleCity = (list: "monitoredCities" | "favouriteCities", city: string) => {
    setFormData(p => {
      const current = p[list];
      if (current.includes(city)) {
        return { ...p, [list]: current.filter(c => c !== city) };
      } else {
        return { ...p, [list]: [...current, city] };
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-display font-bold text-text-primary mb-1">City Configuration</h3>
        <p className="text-sm text-text-secondary mb-4">Manage primary and monitored locations for the Command Center.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">Default Command Center City</label>
          <select 
            value={formData.defaultCity}
            onChange={(e) => setFormData(p => ({ ...p, defaultCity: e.target.value }))}
            className="w-full max-w-sm rounded-lg border border-border bg-bg-primary py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            {AVAILABLE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block mt-6">Monitored Cities</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CITIES.map(c => (
              <button
                key={c}
                onClick={() => toggleCity("monitoredCities", c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  formData.monitoredCities.includes(c)
                    ? "bg-primary text-white border-primary"
                    : "bg-bg-primary text-text-secondary border-border hover:border-text-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block mt-6">Favourite Cities (Sidebar)</label>
          <div className="flex flex-wrap gap-2">
            {formData.monitoredCities.map(c => (
              <button
                key={c}
                onClick={() => toggleCity("favouriteCities", c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  formData.favouriteCities.includes(c)
                    ? "bg-secondary text-white border-secondary"
                    : "bg-bg-primary text-text-secondary border-border hover:border-text-muted"
                }`}
              >
                ★ {c}
              </button>
            ))}
          </div>
          {formData.monitoredCities.length === 0 && (
            <p className="text-xs text-text-muted italic">Select monitored cities first.</p>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-border flex justify-end">
        <GradientButton size="md" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Configuration"}
        </GradientButton>
      </div>
    </div>
  );
}
