"""
Historical Collector — Open-Meteo Historical API (no key needed)
Pulls historical AQI + weather data for causal model training.
AQ and weather API calls are fired in parallel via ThreadPoolExecutor.
"""
import requests
import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from typing import Optional


class HistoricalCollector:
    AQ_HIST_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
    WEATHER_HIST_URL = "https://archive-api.open-meteo.com/v1/archive"

    @classmethod
    def collect_training_data(
        cls,
        lat: float,
        lon: float,
        months_back: int = 6,
    ) -> pd.DataFrame:
        """
        Collect historical AQI + weather data for training the causal model.
        Returns a DataFrame with columns: timestamp, aqi, pm2_5, pm10,
        no2, wind_speed, humidity, temperature, traffic_proxy,
        inversion_risk, is_winter, hour, day_of_week.
        """
        end_date = datetime.now() - timedelta(days=1)
        start_date = end_date - timedelta(days=30 * months_back)

        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")

        # Fire both API calls in parallel — cuts wall-clock time roughly in half.
        with ThreadPoolExecutor(max_workers=2) as pool:
            aq_fut = pool.submit(cls._fetch_air_quality, lat, lon, start_str, end_str)
            wx_fut = pool.submit(cls._fetch_weather, lat, lon, start_str, end_str)
            aq_df = aq_fut.result()
            weather_df = wx_fut.result()

        if aq_df.empty:
            return pd.DataFrame()

        # Merge on timestamp
        if not weather_df.empty:
            df = pd.merge(aq_df, weather_df, on="timestamp", how="inner")
        else:
            df = aq_df.copy()
            df["wind_speed"] = 10.0
            df["humidity"] = 50.0
            df["temperature"] = 25.0
            df["precipitation"] = 0.0

        # Feature engineering
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df["hour"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.dayofweek
        df["month"] = df["timestamp"].dt.month
        df["is_rush_hour"] = df["hour"].apply(lambda h: 1 if (7 <= h <= 10 or 17 <= h <= 20) else 0)
        df["is_winter"] = df["month"].apply(lambda m: 1 if m in [11, 12, 1, 2] else 0)

        # Traffic proxy: high during rush hours, scaled by congestion-like pattern
        df["traffic_proxy"] = (
            df["is_rush_hour"] * 0.6
            + np.sin(df["hour"] / 24 * 2 * np.pi) * 0.2
            + np.random.uniform(0, 0.2, len(df))
        )

        # Inversion risk: low wind + high humidity + low temp
        wind = df.get("wind_speed", pd.Series([10] * len(df)))
        humidity = df.get("humidity", pd.Series([50] * len(df)))
        temp = df.get("temperature", pd.Series([25] * len(df)))
        df["inversion_risk"] = (
            (wind < 5).astype(int) * (humidity > 65).astype(int) * (temp < 20).astype(int)
        )

        # AQI from PM2.5 if not already computed
        if "aqi" not in df.columns and "pm2_5" in df.columns:
            df["aqi"] = df["pm2_5"].apply(cls._pm25_to_aqi)

        df = df.dropna(subset=["aqi"])
        df = df[df["aqi"] > 0]

        return df.reset_index(drop=True)

    @classmethod
    def _fetch_air_quality(cls, lat, lon, start, end) -> pd.DataFrame:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": ["pm2_5", "pm10", "nitrogen_dioxide", "european_aqi"],
            "start_date": start,
            "end_date": end,
            "timezone": "Asia/Kolkata",
        }
        try:
            resp = requests.get(cls.AQ_HIST_URL, params=params, timeout=60)
            resp.raise_for_status()
            data = resp.json().get("hourly", {})

            times = data.get("time", [])
            pm25_list = data.get("pm2_5", [None] * len(times))
            pm10_list = data.get("pm10", [None] * len(times))
            no2_list = data.get("nitrogen_dioxide", [None] * len(times))
            eu_aqi_list = data.get("european_aqi", [None] * len(times))

            rows = []
            for i, t in enumerate(times):
                pm25 = pm25_list[i] or 0.0
                aqi = cls._pm25_to_aqi(pm25)
                rows.append({
                    "timestamp": t,
                    "pm2_5": pm25,
                    "pm10": pm10_list[i] or 0.0,
                    "no2": no2_list[i] or 0.0,
                    "eu_aqi": eu_aqi_list[i] or 0,
                    "aqi": aqi,
                })
            return pd.DataFrame(rows)

        except Exception:
            return pd.DataFrame()

    @classmethod
    def _fetch_weather(cls, lat, lon, start, end) -> pd.DataFrame:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": ["temperature_2m", "relative_humidity_2m",
                       "wind_speed_10m", "precipitation"],
            "start_date": start,
            "end_date": end,
            "timezone": "Asia/Kolkata",
            "wind_speed_unit": "kmh",
        }
        try:
            resp = requests.get(cls.WEATHER_HIST_URL, params=params, timeout=60)
            resp.raise_for_status()
            data = resp.json().get("hourly", {})

            times = data.get("time", [])
            rows = []
            for i, t in enumerate(times):
                rows.append({
                    "timestamp": t,
                    "temperature": data.get("temperature_2m", [25] * len(times))[i] or 25.0,
                    "humidity": data.get("relative_humidity_2m", [50] * len(times))[i] or 50.0,
                    "wind_speed": data.get("wind_speed_10m", [10] * len(times))[i] or 10.0,
                    "precipitation": data.get("precipitation", [0] * len(times))[i] or 0.0,
                })
            return pd.DataFrame(rows)

        except Exception:
            return pd.DataFrame()

    @staticmethod
    def _pm25_to_aqi(pm25: float) -> int:
        if pm25 is None or pm25 <= 0:
            return 0
        breakpoints = [
            (0.0, 12.0, 0, 50),
            (12.1, 35.4, 51, 100),
            (35.5, 55.4, 101, 150),
            (55.5, 150.4, 151, 200),
            (150.5, 250.4, 201, 300),
            (250.5, 350.4, 301, 400),
            (350.5, 500.4, 401, 500),
        ]
        for c_low, c_high, i_low, i_high in breakpoints:
            if c_low <= pm25 <= c_high:
                return int(((i_high - i_low) / (c_high - c_low)) * (pm25 - c_low) + i_low)
        return 500
