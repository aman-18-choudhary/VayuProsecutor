"""
AQI Forecaster — Predicts next 24-hour AQI using hourly data from Open-Meteo.
Uses simple statistical extrapolation when Prophet is unavailable.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List


class AQIForecaster:

    @classmethod
    def forecast_from_hourly(
        cls, hourly_times: List[str], hourly_aqi: List[float]
    ) -> pd.DataFrame:
        """
        Given hourly time strings and AQI values, return a DataFrame
        with columns: time, predicted_aqi, upper_bound, lower_bound.
        Uses last 24h of data to forecast next 24h.
        """
        if not hourly_times or not hourly_aqi or len(hourly_aqi) < 4:
            return pd.DataFrame()

        try:
            # Parse available data
            times = pd.to_datetime(hourly_times, errors="coerce")
            aqi_values = [v if v is not None else 0 for v in hourly_aqi]

            df = pd.DataFrame({"time": times, "aqi": aqi_values}).dropna()
            if df.empty:
                return pd.DataFrame()

            # Use the next 24h from Open-Meteo (already in the hourly array)
            now = datetime.now()
            future = df[df["time"] >= now].head(24)

            if len(future) < 2:
                # Fallback: use rolling mean extrapolation
                recent = df.tail(12)
                mean_aqi = recent["aqi"].mean()
                std_aqi = recent["aqi"].std() if len(recent) > 1 else mean_aqi * 0.1
                forecast_times = [now + timedelta(hours=i) for i in range(1, 25)]
                predicted = [max(0, mean_aqi + np.random.normal(0, std_aqi * 0.3))
                             for _ in range(24)]
                future = pd.DataFrame({
                    "time": forecast_times,
                    "predicted_aqi": predicted,
                    "upper_bound": [p + std_aqi for p in predicted],
                    "lower_bound": [max(0, p - std_aqi) for p in predicted],
                })
                return future

            # Add uncertainty bands
            rolling_std = df["aqi"].rolling(6, min_periods=1).std().mean()
            uncertainty = max(10, rolling_std or 10)

            future = future.copy()
            future.rename(columns={"aqi": "predicted_aqi"}, inplace=True)
            future["upper_bound"] = future["predicted_aqi"] + uncertainty
            future["lower_bound"] = (future["predicted_aqi"] - uncertainty).clip(lower=0)

            return future[["time", "predicted_aqi", "upper_bound", "lower_bound"]]

        except Exception:
            return pd.DataFrame()

    @classmethod
    def try_prophet_forecast(
        cls, historical_df: pd.DataFrame, periods: int = 24
    ) -> pd.DataFrame:
        """
        Attempt a Prophet-based forecast. Falls back gracefully if Prophet fails.
        historical_df must have columns 'ds' (datetime) and 'y' (AQI).
        """
        try:
            from prophet import Prophet
            import warnings
            warnings.filterwarnings("ignore")

            if len(historical_df) < 48:
                return pd.DataFrame()

            m = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=True,
                changepoint_prior_scale=0.3,
                interval_width=0.8,
            )
            m.fit(historical_df)

            future = m.make_future_dataframe(periods=periods, freq="H")
            forecast = m.predict(future)

            result = forecast.tail(periods)[["ds", "yhat", "yhat_upper", "yhat_lower"]]
            result.columns = ["time", "predicted_aqi", "upper_bound", "lower_bound"]
            result["predicted_aqi"] = result["predicted_aqi"].clip(lower=0)
            result["lower_bound"] = result["lower_bound"].clip(lower=0)

            return result

        except Exception:
            return pd.DataFrame()
