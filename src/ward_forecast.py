from .aqi_fetcher import AQIFetcher
from .forecaster import AQIForecaster
from typing import Dict, Any, List

class WardForecast:
    @staticmethod
    def get_ward_forecast(lat: float, lon: float) -> List[Dict[str, Any]]:
        """
        Uses Prophet to forecast AQI specifically for this ward centroid.
        """
        try:
            aqi_data = AQIFetcher.get_current_aqi(lat, lon)
            forecast_df = AQIForecaster.forecast_from_hourly(
                aqi_data.get("hourly_times", []), aqi_data.get("hourly_aqi", [])
            )
            forecast = []
            if not forecast_df.empty:
                for _, row in forecast_df.head(72).iterrows():
                    t = row["time"]
                    label = t.strftime("%H:%M") if hasattr(t, "strftime") else str(t)[-8:-3]
                    forecast.append({
                        "time": label,
                        "aqi": round(float(row["predicted_aqi"]), 0),
                        "upper": round(float(row["upper_bound"]), 0),
                        "lower": round(float(row["lower_bound"]), 0),
                    })
            return forecast
        except Exception:
            return []
