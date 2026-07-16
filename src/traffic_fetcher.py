"""
Traffic Fetcher — TomTom Traffic Flow API
Gets real-time traffic congestion data. Requires TOMTOM_API_KEY.
"""
import os
import requests
from typing import Dict, Any, List


class TrafficFetcher:
    BASE_URL = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute"

    def __init__(self):
        self.api_key = os.getenv("TOMTOM_API_KEY", "")

    def get_congestion(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Get traffic congestion at a specific lat/lon point.
        Returns congestion_index (0.0-1.0), congestion_level, speed data.
        """
        if not self.api_key:
            return self._mock_congestion()

        try:
            url = f"{self.BASE_URL}/10/json"
            params = {
                "key": self.api_key,
                "point": f"{lat},{lon}",
                "unit": "KMPH",
            }
            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            flow = data.get("flowSegmentData", {})
            current_speed = flow.get("currentSpeed", 50)
            free_flow_speed = flow.get("freeFlowSpeed", 60) or 60
            confidence = flow.get("confidence", 0.5)

            # Congestion index: 0 = free flow, 1 = standstill
            if free_flow_speed > 0:
                congestion_index = max(0.0, min(1.0, 1.0 - (current_speed / free_flow_speed)))
            else:
                congestion_index = 0.5

            if congestion_index < 0.2:
                level = "Free Flow"
            elif congestion_index < 0.4:
                level = "Light"
            elif congestion_index < 0.6:
                level = "Moderate"
            elif congestion_index < 0.8:
                level = "Heavy"
            else:
                level = "Severe"

            return {
                "congestion_index": round(congestion_index, 3),
                "congestion_level": level,
                "current_speed_kmh": current_speed,
                "free_flow_speed_kmh": free_flow_speed,
                "confidence": confidence,
                "source": "TomTom",
            }

        except Exception as e:
            return self._mock_congestion(error=str(e))

    def get_multi_point_congestion(
        self, points: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Get congestion for multiple traffic monitoring points."""
        results = []
        for pt in points:
            result = self.get_congestion(pt["lat"], pt["lon"])
            result["name"] = pt.get("name", "Unknown")
            results.append(result)
        return results

    def _mock_congestion(self, error: str = "") -> Dict[str, Any]:
        """Return mock data when API key unavailable."""
        from datetime import datetime
        hour = datetime.now().hour
        # Simulate rush hour
        if 7 <= hour <= 10 or 17 <= hour <= 20:
            idx = 0.65
            level = "Heavy"
        elif 11 <= hour <= 16:
            idx = 0.35
            level = "Moderate"
        else:
            idx = 0.15
            level = "Light"

        return {
            "congestion_index": idx,
            "congestion_level": level,
            "current_speed_kmh": int(60 * (1 - idx)),
            "free_flow_speed_kmh": 60,
            "confidence": 0.8,
            "source": "mock" if not error else "error",
            "error": error,
        }
