"""
Weather Fetcher — Open-Meteo Weather API (no API key required)
Fetches wind speed/direction, humidity, temperature, precipitation.
"""
import requests
from datetime import datetime
from typing import Dict, Any


class WeatherFetcher:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    @classmethod
    def get_current_weather(cls, lat: float, lon: float) -> Dict[str, Any]:
        """
        Fetch current weather conditions relevant to air quality.
        Returns dict with wind_speed, wind_direction, humidity, temperature,
        precipitation, pressure, is_raining.
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation",
                "wind_speed_10m",
                "wind_direction_10m",
                "surface_pressure",
                "cloud_cover",
                "visibility",
            ],
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "wind_speed_10m",
                "wind_direction_10m",
                "precipitation",
            ],
            "forecast_days": 1,
            "timezone": "Asia/Kolkata",
            "wind_speed_unit": "kmh",
        }

        try:
            resp = requests.get(cls.BASE_URL, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()

            current = data.get("current", {})

            wind_speed = current.get("wind_speed_10m") or 0.0
            wind_dir = current.get("wind_direction_10m") or 0
            humidity = current.get("relative_humidity_2m") or 50
            temperature = current.get("temperature_2m") or 25.0
            precipitation = current.get("precipitation") or 0.0
            pressure = current.get("surface_pressure") or 1013.0
            cloud_cover = current.get("cloud_cover") or 0
            visibility = current.get("visibility") or 10000.0

            # Derived conditions
            is_raining = precipitation > 0.1
            is_calm = wind_speed < 5
            is_humid = humidity > 70
            is_cold = temperature < 15
            inversion_risk = is_calm and is_humid and is_cold

            # Wind direction label
            dirs = ["N","NE","E","SE","S","SW","W","NW"]
            wind_dir_label = dirs[int((wind_dir + 22.5) / 45) % 8]

            return {
                "wind_speed": round(wind_speed, 1),
                "wind_direction": wind_dir,
                "wind_direction_label": wind_dir_label,
                "humidity": int(humidity),
                "temperature": round(temperature, 1),
                "precipitation": round(precipitation, 2),
                "pressure": round(pressure, 1),
                "cloud_cover": int(cloud_cover),
                "visibility": round(visibility / 1000, 1),  # km
                "is_raining": is_raining,
                "is_calm": is_calm,
                "is_humid": is_humid,
                "inversion_risk": inversion_risk,
                "source": "Open-Meteo Weather API",
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            return {
                "wind_speed": 10.0,
                "wind_direction": 270,
                "wind_direction_label": "W",
                "humidity": 50,
                "temperature": 25.0,
                "precipitation": 0.0,
                "pressure": 1013.0,
                "cloud_cover": 20,
                "visibility": 10.0,
                "is_raining": False,
                "is_calm": False,
                "is_humid": False,
                "inversion_risk": False,
                "source": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }
