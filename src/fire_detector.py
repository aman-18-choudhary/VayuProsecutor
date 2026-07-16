"""
Fire Detector — NASA FIRMS API
Detects active fires and stubble burning events from satellite data.
Requires NASA_FIRMS_KEY.
"""
import os
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List
import math


class FireDetector:
    FIRMS_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
    AREA_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/VIIRS_SNPP_NRT/{bbox}/1"

    def __init__(self):
        self.api_key = os.getenv("NASA_FIRMS_KEY", "")

    def get_nearby_fires(
        self, lat: float, lon: float, radius_km: float = 100
    ) -> Dict[str, Any]:
        """
        Detect active fires within radius_km of the given coordinates.
        Uses NASA FIRMS VIIRS satellite data (last 24 hours).
        """
        if not self.api_key:
            return self._mock_fires(lat, lon)

        try:
            # Build bounding box
            lat_deg = radius_km / 111.0
            lon_deg = radius_km / (111.0 * math.cos(math.radians(lat)))
            bbox = f"{lon - lon_deg},{lat - lat_deg},{lon + lon_deg},{lat + lat_deg}"

            url = self.AREA_URL.format(key=self.api_key, bbox=bbox)
            resp = requests.get(url, timeout=20)
            resp.raise_for_status()

            fires: List[Dict] = []
            lines = resp.text.strip().split("\n")

            if len(lines) > 1:
                headers = [h.strip() for h in lines[0].split(",")]
                for line in lines[1:]:
                    if not line.strip():
                        continue
                    vals = line.split(",")
                    if len(vals) >= len(headers):
                        row = {headers[i]: vals[i].strip() for i in range(len(headers))}
                        try:
                            fires.append({
                                "lat": float(row.get("latitude", 0)),
                                "lon": float(row.get("longitude", 0)),
                                "brightness": float(row.get("bright_ti4", 0) or row.get("brightness", 0)),
                                "confidence": row.get("confidence", "n"),
                                "acq_date": row.get("acq_date", ""),
                                "acq_time": row.get("acq_time", ""),
                                "frp": float(row.get("frp", 0)),  # Fire Radiative Power
                            })
                        except (ValueError, KeyError):
                            continue

            high_confidence = [f for f in fires if f.get("confidence") in ["h", "high", "n"]]
            total_frp = sum(f.get("frp", 0) for f in high_confidence)

            # Estimate AQI contribution from fires
            fire_aqi_contribution = min(200, int(total_frp * 2)) if total_frp > 0 else 0

            summary = (
                f"Detected {len(fires)} fires within {int(radius_km)} km "
                f"({len(high_confidence)} high-confidence). "
                f"Total FRP: {total_frp:.0f} MW."
                if fires else
                f"No active fires detected within {int(radius_km)} km."
            )

            return {
                "fires": high_confidence[:20],  # Top 20 fires
                "fire_count": len(fires),
                "high_confidence_count": len(high_confidence),
                "total_frp_mw": round(total_frp, 1),
                "aqi_contribution_estimate": fire_aqi_contribution,
                "summary": summary,
                "source": "NASA FIRMS VIIRS",
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            return self._mock_fires(lat, lon, error=str(e))

    def _mock_fires(self, lat: float, lon: float, error: str = "") -> Dict[str, Any]:
        """Mock response when API key unavailable."""
        from datetime import datetime
        month = datetime.now().month
        # Stubble burning season: Oct-Nov in north India
        is_stubble_season = month in [10, 11] and lat > 25

        return {
            "fires": [],
            "fire_count": 0,
            "high_confidence_count": 0,
            "total_frp_mw": 0.0,
            "aqi_contribution_estimate": 50 if is_stubble_season else 0,
            "summary": (
                "Stubble burning season active. Configure NASA_FIRMS_KEY for satellite data."
                if is_stubble_season
                else f"No fire data available. {'Add NASA_FIRMS_KEY to .env' if not error else error}"
            ),
            "source": "mock",
            "error": error,
            "timestamp": datetime.now().isoformat(),
        }
