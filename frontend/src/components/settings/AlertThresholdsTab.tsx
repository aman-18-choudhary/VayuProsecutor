import { useState } from "react";
import { SystemSettings } from "../../lib/types";
import { useUpdateSettings } from "../../lib/api";
import { GradientButton } from "../ui";
import toast from "react-hot-toast";

export function AlertThresholdsTab({ settings }: { settings: SystemSettings }) {
  const [formData, setFormData] = useState({
    aqiThreshold: settings.aqiThreshold,
    pm25Threshold: settings.pm25Threshold,
    pm10Threshold: settings.pm10Threshold,
    no2Threshold: settings.no2Threshold,
    so2Threshold: settings.so2Threshold,
    coThreshold: settings.coThreshold,
    o3Threshold: settings.o3Threshold,
    trafficThreshold: settings.trafficThreshold,
    fireDetectionRadius: settings.fireDetectionRadius,
    riskIndexThreshold: settings.riskIndexThreshold,
    wardScoreThreshold: settings.wardScoreThreshold
  });
  
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const handleSave = () => {
    updateSettings(formData, {
      onSuccess: () => toast.success("Thresholds updated successfully"),
      onError: () => toast.error("Failed to update thresholds")
    });
  };

  const ThresholdInput = ({ label, field, unit, max }: { label: string, field: keyof typeof formData, unit: string, max: number }) => (
    <div>
      <label className="text-xs font-semibold text-text-secondary uppercase mb-2 flex justify-between">
        <span>{label}</span>
        <span className="text-primary font-bold">{formData[field]} {unit}</span>
      </label>
      <input 
        type="range" 
        min="0" max={max}
        value={formData[field]}
        onChange={(e) => setFormData(p => ({ ...p, [field]: Number(e.target.value) }))}
        className="w-full accent-danger"
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-display font-bold text-text-primary mb-1">Global Alert Thresholds</h3>
        <p className="text-sm text-text-secondary">Set the limits that trigger automatic system alerts and AI interventions.</p>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-6 bg-bg-primary border border-border p-6 rounded-xl">
        <div className="col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-2 mb-4">Core Air Quality (µg/m³ unless noted)</h4>
        </div>
        <ThresholdInput label="AQI Critical Level" field="aqiThreshold" unit="Index" max={500} />
        <ThresholdInput label="PM2.5 Limit" field="pm25Threshold" unit="µg/m³" max={300} />
        <ThresholdInput label="PM10 Limit" field="pm10Threshold" unit="µg/m³" max={500} />
        <ThresholdInput label="NO₂ Limit" field="no2Threshold" unit="µg/m³" max={200} />
        <ThresholdInput label="SO₂ Limit" field="so2Threshold" unit="µg/m³" max={150} />
        <ThresholdInput label="O₃ Limit" field="o3Threshold" unit="µg/m³" max={150} />
        <ThresholdInput label="CO Limit" field="coThreshold" unit="mg/m³" max={10} />

        <div className="col-span-2 mt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-2 mb-4">Secondary Triggers</h4>
        </div>
        <ThresholdInput label="Traffic Congestion Score" field="trafficThreshold" unit="/ 100" max={100} />
        <ThresholdInput label="Fire Detection Radius" field="fireDetectionRadius" unit="km" max={200} />
        <ThresholdInput label="Vulnerability Risk Index" field="riskIndexThreshold" unit="/ 10" max={10} />
        <ThresholdInput label="Ward Critical Score" field="wardScoreThreshold" unit="/ 100" max={100} />
      </div>

      <div className="pt-4 flex justify-end">
        <GradientButton size="md" onClick={handleSave} disabled={isPending} className="bg-gradient-to-r from-danger to-warning text-white border-0">
          {isPending ? "Applying..." : "Apply Thresholds"}
        </GradientButton>
      </div>
    </div>
  );
}
