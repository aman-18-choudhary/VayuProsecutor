"""
Source Attribution — Pure logic layer.
Correlates AQI levels with weather conditions to explain WHY AQI is high.
No external API needed.
"""
from datetime import datetime
from typing import Dict, Any, List


class SourceAttributor:

    @classmethod
    def analyze(cls, aqi_data: Dict[str, Any], weather: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze AQI + weather data and return a list of contributing factors
        with contribution level (High/Medium/Low), icon, and detail text.
        """
        factors: List[Dict[str, Any]] = []
        aqi = aqi_data.get("aqi", 0) or 0
        pm25 = aqi_data.get("pm2_5", 0) or 0
        no2 = aqi_data.get("no2", 0) or 0
        so2 = aqi_data.get("so2", 0) or 0

        wind_speed = weather.get("wind_speed", 10) or 10
        humidity = weather.get("humidity", 50) or 50
        temperature = weather.get("temperature", 25) or 25
        is_raining = weather.get("is_raining", False)
        inversion_risk = weather.get("inversion_risk", False)

        hour = datetime.now().hour
        month = datetime.now().month

        # --- Factor 1: Traffic (rush hour proxy) ---
        is_rush_hour = (7 <= hour <= 10) or (17 <= hour <= 20)
        if no2 > 30 or is_rush_hour:
            contribution = "High" if (no2 > 60 or (is_rush_hour and aqi > 100)) else "Medium"
            factors.append({
                "factor": "Vehicular Traffic",
                "icon": "🚗",
                "contribution": contribution,
                "detail": f"NO₂: {no2:.0f} µg/m³ | {'Rush hour active' if is_rush_hour else 'Background traffic'}",
                "weight": 3 if contribution == "High" else 2,
            })

        # --- Factor 2: Low wind / poor dispersion ---
        if wind_speed < 10:
            contribution = "High" if wind_speed < 5 else "Medium"
            factors.append({
                "factor": "Low Wind Dispersion",
                "icon": "💨",
                "contribution": contribution,
                "detail": f"Wind: {wind_speed} km/h | Pollutants accumulating",
                "weight": 3 if contribution == "High" else 2,
            })

        # --- Factor 3: Temperature Inversion ---
        if inversion_risk:
            factors.append({
                "factor": "Temperature Inversion",
                "icon": "🌡️",
                "contribution": "High",
                "detail": f"Temp: {temperature}°C, Humidity: {humidity}% — Inversion layer trapping pollutants",
                "weight": 3,
            })

        # --- Factor 4: Industrial emissions ---
        if so2 > 20:
            contribution = "High" if so2 > 50 else "Medium"
            factors.append({
                "factor": "Industrial Emissions",
                "icon": "🏭",
                "contribution": contribution,
                "detail": f"SO₂: {so2:.0f} µg/m³ — Industrial/power plant marker elevated",
                "weight": 3 if contribution == "High" else 2,
            })

        # --- Factor 5: Winter effect ---
        is_winter = month in [11, 12, 1, 2]
        if is_winter and aqi > 100:
            factors.append({
                "factor": "Winter Effect",
                "icon": "❄️",
                "contribution": "Medium",
                "detail": "Winter months: stubble burning + cold air traps pollutants",
                "weight": 2,
            })

        # --- Factor 6: Rain (good) ---
        if is_raining:
            factors.append({
                "factor": "Rain Washout (Positive)",
                "icon": "🌧️",
                "contribution": "Low",
                "detail": "Rain is washing out particulates — AQI improving",
                "weight": 1,
            })

        # --- Factor 7: High PM2.5 (general particulate) ---
        if pm25 > 35 and not any(f["factor"] == "Winter Effect" for f in factors):
            contribution = "High" if pm25 > 100 else "Medium"
            factors.append({
                "factor": "Particulate Matter",
                "icon": "🌫️",
                "contribution": contribution,
                "detail": f"PM2.5: {pm25:.0f} µg/m³ — {'Severe' if pm25 > 150 else 'Elevated'} particulate load",
                "weight": 3 if contribution == "High" else 2,
            })

        # Sort by weight descending
        factors.sort(key=lambda x: x["weight"], reverse=True)

        # Generate summary
        primary = factors[0]["factor"] if factors else "Unknown"
        summary = f"Primary driver: {primary}. {len(factors)} contributing factor(s) identified."

        return {
            "factors": factors,
            "primary_source": primary,
            "factor_count": len(factors),
            "summary": summary,
            "aqi_category": cls._aqi_category(aqi),
        }

    @staticmethod
    def _aqi_category(aqi: int) -> str:
        if aqi <= 50: return "Good"
        elif aqi <= 100: return "Moderate"
        elif aqi <= 150: return "Unhealthy for Sensitive Groups"
        elif aqi <= 200: return "Unhealthy"
        elif aqi <= 300: return "Very Unhealthy"
        else: return "Hazardous"
