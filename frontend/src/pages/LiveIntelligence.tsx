import { useLiveData, useMapData } from "../lib/api";
import { getSeverity } from "../lib/aqi";
import { AQICard, PollutantStatCard } from "../components/AQICard";
import { PollutantBars } from "../components/PollutantBars";
import { PollutionMap } from "../components/PollutionMap";
import { ForecastChart } from "../components/ForecastChart";
import { WeatherPanel } from "../components/WeatherPanel";
import { HealthAdvisory } from "../components/HealthAdvisory";

export function LiveIntelligence({ city }: { city: string }) {
  const { data: live, isLoading } = useLiveData(city);
  const { data: map, isLoading: mapLoading } = useMapData(city);

  const severity = getSeverity(live?.aqi ?? 0);

  return (
    <div className="space-y-6">
      {/* ROW 1: AQI + pollutant stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <AQICard
          aqi={live?.aqi ?? 0}
          severity={severity}
          stationAqi={live?.stationAqi ?? null}
          loading={isLoading}
        />
        <PollutantStatCard
          label="PM2.5"
          pollutant={live?.pm25}
          color="#00D4FF"
          loading={isLoading}
        />
        <PollutantStatCard
          label="PM10"
          pollutant={live?.pm10}
          color="#F39C12"
          loading={isLoading}
        />
        <PollutantStatCard
          label="NO₂"
          pollutant={live?.no2}
          color="#3b82f6"
          loading={isLoading}
        />
        <PollutantStatCard
          label="CO"
          pollutant={live?.co}
          color="#C0392B"
          loading={isLoading}
        />
      </div>

      {/* ROW 2: map + side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <PollutionMap data={map} loading={mapLoading} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <PollutantBars data={live} loading={isLoading} />
          <WeatherPanel weather={live?.weather} loading={isLoading} />
          <ForecastChart forecast={live?.forecast} loading={isLoading} />
        </div>
      </div>

      {/* ROW 3: health advisory */}
      <HealthAdvisory
        advisory={live?.advisory}
        severity={severity}
        aqi={live?.aqi ?? 0}
        loading={isLoading}
      />
    </div>
  );
}
