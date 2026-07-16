"""
AQI Fetcher — Open-Meteo Air Quality API (no API key required)
Fetches PM2.5, PM10, NO2, SO2, O3, CO and computes AQI.
"""
import requests
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List
import math


class AQIFetcher:
    BASE_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
    AQICN_URL = "https://api.waqi.info/feed/geo:{lat};{lon}/"

    @classmethod
    def get_station_aqi(cls, lat: float, lon: float) -> Dict[str, Any]:
        """
        Fetch the nearest official monitoring-station AQI from AQICN/WAQI.
        Returns {'aqi', 'station', 'dominant', 'source'} or {} on failure.
        Uses AQICN_TOKEN from the environment.
        """
        token = os.getenv("AQICN_TOKEN", "")
        if not token:
            return {}
        try:
            url = cls.AQICN_URL.format(lat=lat, lon=lon)
            resp = requests.get(url, params={"token": token}, timeout=15)
            resp.raise_for_status()
            j = resp.json()
            if j.get("status") != "ok":
                return {}
            d = j.get("data", {})
            return {
                "aqi": d.get("aqi"),
                "station": d.get("city", {}).get("name", "Unknown station"),
                "dominant": d.get("dominentpol", "pm25"),
                "source": "AQICN/WAQI station",
            }
        except Exception:
            return {}

    # US EPA AQI breakpoints for PM2.5
    PM25_BREAKPOINTS = [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ]

    @classmethod
    def pm25_to_aqi(cls, pm25: float) -> int:
        """Convert PM2.5 concentration to US AQI."""
        if pm25 is None or math.isnan(pm25):
            return 0
        pm25 = max(0, pm25)
        for c_low, c_high, i_low, i_high in cls.PM25_BREAKPOINTS:
            if c_low <= pm25 <= c_high:
                aqi = ((i_high - i_low) / (c_high - c_low)) * (pm25 - c_low) + i_low
                return int(round(aqi))
        return 500 if pm25 > 500 else 0

    @classmethod
    def get_current_aqi(cls, lat: float, lon: float) -> Dict[str, Any]:
        """
        Fetch current AQI and hourly forecast for the next 48 hours.
        Returns dict with aqi, pm2_5, pm10, no2, so2, o3, co, hourly arrays.
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": ["pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide",
                        "sulphur_dioxide", "ozone", "european_aqi"],
            "hourly": ["pm2_5", "pm10", "nitrogen_dioxide", "sulphur_dioxide",
                       "ozone", "carbon_monoxide", "european_aqi"],
            "forecast_days": 2,
            "timezone": "Asia/Kolkata",
        }

        try:
            resp = requests.get(cls.BASE_URL, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()

            current = data.get("current", {})
            hourly = data.get("hourly", {})

            pm25 = current.get("pm2_5") or 0.0
            pm10 = current.get("pm10") or 0.0
            no2 = current.get("nitrogen_dioxide") or 0.0
            so2 = current.get("sulphur_dioxide") or 0.0
            o3 = current.get("ozone") or 0.0
            co = current.get("carbon_monoxide") or 0.0
            eu_aqi = current.get("european_aqi") or 0

            # Prefer computed US AQI from PM2.5
            us_aqi = cls.pm25_to_aqi(pm25)
            # Blend: use US AQI if we have PM2.5, else fall back to EU AQI scaled
            aqi = us_aqi if us_aqi > 0 else int(eu_aqi * 2)

            hourly_times = hourly.get("time", [])
            hourly_pm25 = hourly.get("pm2_5", [])
            hourly_aqi = [
                cls.pm25_to_aqi(v) if v is not None else 0
                for v in hourly_pm25
            ]

            # Cross-check with the nearest official AQICN station
            station = cls.get_station_aqi(lat, lon)

            return {
                "aqi": aqi,
                "pm2_5": round(pm25, 1),
                "pm10": round(pm10, 1),
                "no2": round(no2, 1),
                "so2": round(so2, 1),
                "o3": round(o3, 1),
                "co": round(co, 1),
                "eu_aqi": eu_aqi,
                "station_aqi": station.get("aqi"),
                "station_name": station.get("station"),
                "hourly_times": hourly_times,
                "hourly_aqi": hourly_aqi,
                "hourly_pm25": hourly_pm25,
                "source": "Open-Meteo AQ API",
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            # Fallback: try the AQICN/WAQI official station reading
            station = cls.get_station_aqi(lat, lon)
            if station.get("aqi") is not None:
                try:
                    st_aqi = int(station["aqi"])
                except (ValueError, TypeError):
                    st_aqi = 0
                return {
                    "aqi": st_aqi,
                    "pm2_5": 0.0, "pm10": 0.0, "no2": 0.0,
                    "so2": 0.0, "o3": 0.0, "co": 0.0, "eu_aqi": 0,
                    "station_aqi": station.get("aqi"),
                    "station_name": station.get("station"),
                    "hourly_times": [], "hourly_aqi": [], "hourly_pm25": [],
                    "source": station.get("source", "AQICN/WAQI station"),
                    "timestamp": datetime.now().isoformat(),
                }
            # Last resort: zeroed mock data so the app still runs
            return {
                "aqi": 0,
                "pm2_5": 0.0,
                "pm10": 0.0,
                "no2": 0.0,
                "so2": 0.0,
                "o3": 0.0,
                "co": 0.0,
                "eu_aqi": 0,
                "station_aqi": None,
                "station_name": None,
                "hourly_times": [],
                "hourly_aqi": [],
                "hourly_pm25": [],
                "source": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }
