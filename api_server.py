"""
VayuProsecutor REST API — FastAPI backend serving REAL data to the React frontend.

Reuses the existing src/ modules (Open-Meteo, AQICN, TomTom, NASA FIRMS, Overpass)
and maps their output to the exact JSON shapes the React app expects:

    GET /api/live/{city}
    GET /api/causal/{city}
    GET /api/map/{city}

Run:
    venv/bin/python -m uvicorn api_server:app --port 8000 --reload
"""
import os
import time
import math
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional

from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, wait as futures_wait, FIRST_COMPLETED
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

_THREAD_POOL = ThreadPoolExecutor(max_workers=12)

load_dotenv()

from src.aqi_fetcher import AQIFetcher
from src.weather_fetcher import WeatherFetcher
from src.source_attribution import SourceAttributor
from src.vulnerability import VulnerabilityMapper
from src.forecaster import AQIForecaster
from src.alert_generator import AlertGenerator
from src.traffic_fetcher import TrafficFetcher
from src.industrial_mapper import IndustrialMapper
from src.fire_detector import FireDetector
from src.historical_collector import HistoricalCollector
from src.causal_engine import CausalProsecutor
from src.prosecutor_report import ProsecutorReportGenerator
from src.ward_engine import WardEngine
from src.ward_ranker import WardRanker
from src.ward_forecast import WardForecast
from src.ward_recommendation import WardRecommendation

import json

# ── Load cities ──
_CITIES_PATH = os.path.join(os.path.dirname(__file__), "data", "cities.json")
with open(_CITIES_PATH) as f:
    CITIES: Dict[str, Any] = json.load(f)

# WHO 2021 air-quality guideline limits (24h / relevant averaging), µg/m³
WHO_LIMITS = {"pm25": 15, "pm10": 45, "no2": 25, "co": 4, "o3": 100, "so2": 40}

app = FastAPI(title="VayuProsecutor API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Simple in-memory TTL cache (causal is slow) ──
_CACHE: Dict[str, Any] = {}
_TTL = {"live": 120, "map": 900, "causal": 1800}  # seconds


def _cache_get(kind: str, city: str):
    entry = _CACHE.get(f"{kind}:{city}")
    if entry and (time.time() - entry["t"]) < _TTL[kind]:
        return entry["v"]
    return None


def _cache_set(kind: str, city: str, value):
    _CACHE[f"{kind}:{city}"] = {"t": time.time(), "v": value}


def _resolve_city(city: str):
    """Case-insensitive city lookup."""
    for name, coords in CITIES.items():
        if name.lower() == city.lower():
            return name, coords
    raise HTTPException(status_code=404, detail=f"Unknown city: {city}")


# ── AQI severity helpers (mirror frontend) ──
def _severity(aqi: int) -> str:
    if aqi <= 50:
        return "good"
    if aqi <= 100:
        return "moderate"
    if aqi <= 150:
        return "usg"
    if aqi <= 200:
        return "unhealthy"
    if aqi <= 300:
        return "veryUnhealthy"
    return "hazardous"


def _severity_label(aqi: int) -> str:
    return {
        "good": "Good", "moderate": "Moderate", "usg": "Unhealthy for Sensitive Groups",
        "unhealthy": "Unhealthy", "veryUnhealthy": "Very Unhealthy", "hazardous": "Hazardous",
    }[_severity(aqi)]


def _hourly_pollutants(lat: float, lon: float) -> Dict[str, List[float]]:
    """One direct Open-Meteo call to get REAL hourly series for sparklines."""
    try:
        resp = requests.get(
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            params={
                "latitude": lat, "longitude": lon,
                "hourly": ["pm2_5", "pm10", "nitrogen_dioxide",
                           "carbon_monoxide", "ozone", "sulphur_dioxide"],
                "past_days": 1, "forecast_days": 1, "timezone": "Asia/Kolkata",
            },
            timeout=15,
        )
        resp.raise_for_status()
        h = resp.json().get("hourly", {})
        return {
            "pm25": [v or 0 for v in h.get("pm2_5", [])][-12:],
            "pm10": [v or 0 for v in h.get("pm10", [])][-12:],
            "no2": [v or 0 for v in h.get("nitrogen_dioxide", [])][-12:],
            "co": [v or 0 for v in h.get("carbon_monoxide", [])][-12:],
            "o3": [v or 0 for v in h.get("ozone", [])][-12:],
            "so2": [v or 0 for v in h.get("sulphur_dioxide", [])][-12:],
        }
    except Exception:
        return {}


def _waqi_stations(lat: float, lon: float, span: float = 0.18) -> List[Dict[str, Any]]:
    """Fetch REAL nearby monitoring stations (with live AQI) from WAQI map-bounds."""
    token = os.getenv("AQICN_TOKEN", "")
    if not token:
        return []
    try:
        bbox = f"{lat - span},{lon - span},{lat + span},{lon + span}"
        r = requests.get(
            "https://api.waqi.info/map/bounds/",
            params={"latlng": bbox, "token": token}, timeout=15,
        )
        j = r.json()
        if j.get("status") != "ok":
            return []
        out = []
        for s in j.get("data", [])[:20]:
            try:
                aqi_val = int(s.get("aqi"))
            except (ValueError, TypeError):
                aqi_val = None
            out.append({
                "id": f"waqi-{s.get('uid')}",
                "type": "station",
                "name": s.get("station", {}).get("name", "AQI station"),
                "lat": float(s.get("lat")),
                "lon": float(s.get("lon")),
                "aqi": aqi_val,
            })
        return out
    except Exception:
        return []


def _pollutant(value, unit, who_key, spark) -> Dict[str, Any]:
    return {
        "value": round(value or 0, 1),
        "unit": unit,
        "whoLimit": WHO_LIMITS[who_key],
        "sparkline": [round(x, 1) for x in (spark or [value or 0] * 12)],
    }


# ════════════════════════════════════════════════════════════
# GET /api/live/{city}
# ════════════════════════════════════════════════════════════
@app.get("/api/live/{city}")
def live(city: str):
    name, coords = _resolve_city(city)
    cached = _cache_get("live", name)
    if cached:
        return cached

    lat, lon = coords["lat"], coords["lon"]
    aqi_data = AQIFetcher.get_current_aqi(lat, lon)
    weather = WeatherFetcher.get_current_weather(lat, lon)
    attribution = SourceAttributor.analyze(aqi_data, weather)
    spark = _hourly_pollutants(lat, lon)

    aqi = int(aqi_data.get("aqi", 0) or 0)

    # Forecast
    forecast_df = AQIForecaster.forecast_from_hourly(
        aqi_data.get("hourly_times", []), aqi_data.get("hourly_aqi", [])
    )
    forecast: List[Dict[str, Any]] = []
    if not forecast_df.empty:
        for _, row in forecast_df.head(24).iterrows():
            t = row["time"]
            label = t.strftime("%H:%M") if hasattr(t, "strftime") else str(t)[-8:-3]
            forecast.append({
                "time": label,
                "aqi": round(float(row["predicted_aqi"]), 0),
                "upper": round(float(row["upper_bound"]), 0),
                "lower": round(float(row["lower_bound"]), 0),
            })

    # Advisory (English + Hindi) — LLM if keys present, else templates
    try:
        gen = AlertGenerator()
        factors = attribution.get("factors", [])
        vuln_count = 0
        advisory_en = gen.generate_alert(aqi, _severity_label(aqi), name, factors, vuln_count, "English")
        advisory_hi = gen.generate_alert(aqi, _severity_label(aqi), name, factors, vuln_count, "Hindi")
    except Exception:
        advisory_en = "Air quality advisory unavailable."
        advisory_hi = "वायु गुणवत्ता सलाह उपलब्ध नहीं है।"

    result = {
        "city": name,
        "aqi": aqi,
        "stationAqi": aqi_data.get("station_aqi"),
        "severity": _severity(aqi),
        "pm25": _pollutant(aqi_data.get("pm2_5"), "µg/m³", "pm25", spark.get("pm25")),
        "pm10": _pollutant(aqi_data.get("pm10"), "µg/m³", "pm10", spark.get("pm10")),
        "no2": _pollutant(aqi_data.get("no2"), "µg/m³", "no2", spark.get("no2")),
        "co": _pollutant(aqi_data.get("co"), "µg/m³", "co", spark.get("co")),
        "o3": _pollutant(aqi_data.get("o3"), "µg/m³", "o3", spark.get("o3")),
        "so2": _pollutant(aqi_data.get("so2"), "µg/m³", "so2", spark.get("so2")),
        "weather": {
            "windSpeed": weather.get("wind_speed", 0),
            "windDir": weather.get("wind_direction", 0),
            "windDirLabel": weather.get("wind_direction_label", "N"),
            "humidity": weather.get("humidity", 0),
            "temperature": weather.get("temperature", 0),
        },
        "forecast": forecast,
        "advisory": {"en": advisory_en, "hi": advisory_hi},
        "updatedAt": datetime.now().isoformat(),
    }
    _cache_set("live", name, result)
    return result


# ════════════════════════════════════════════════════════════
# GET /api/map/{city}
# ════════════════════════════════════════════════════════════
@app.get("/api/map/{city}")
def map_data(city: str):
    name, coords = _resolve_city(city)
    cached = _cache_get("map", name)
    if cached:
        return cached

    lat, lon = coords["lat"], coords["lon"]
    markers: List[Dict[str, Any]] = []

    # Vulnerable places (schools, hospitals) via Overpass
    try:
        vuln = VulnerabilityMapper.get_vulnerable_places(lat, lon, 2500)
        for place in vuln.get("places", {}).get("schools", [])[:8]:
            markers.append({"id": f"s{place.get('osm_id')}", "type": "school",
                            "name": place.get("name", "School"),
                            "lat": place["lat"], "lon": place["lon"]})
        for place in vuln.get("places", {}).get("hospitals", [])[:6]:
            markers.append({"id": f"h{place.get('osm_id')}", "type": "hospital",
                            "name": place.get("name", "Hospital"),
                            "lat": place["lat"], "lon": place["lon"]})
    except Exception:
        pass

    # Industrial / factories via Overpass
    try:
        ind = IndustrialMapper.get_industrial_sources(lat, lon, 5000)
        for src in ind.get("sources", [])[:8]:
            if src.get("lat") and src.get("lon"):
                markers.append({"id": f"f{src.get('osm_id')}", "type": "factory",
                                "name": src.get("name", "Industrial site"),
                                "lat": src["lat"], "lon": src["lon"]})
    except Exception:
        pass

    # REAL AQI monitoring stations across the city (WAQI map-bounds)
    aqi_data = AQIFetcher.get_current_aqi(lat, lon)
    stations = _waqi_stations(lat, lon)
    if stations:
        markers.extend(stations)
    else:
        station_aqi = aqi_data.get("station_aqi")
        markers.append({
            "id": "station-center", "type": "station",
            "name": aqi_data.get("station_name") or f"{name} AQI station",
            "lat": lat, "lon": lon,
            "aqi": int(station_aqi) if station_aqi is not None else int(aqi_data.get("aqi", 0) or 0),
        })

    # Heat overlay: radial cluster around center, intensity scaled by real AQI
    aqi = int(aqi_data.get("aqi", 0) or 0)
    base_intensity = min(1.0, max(0.25, aqi / 300))
    heat: List[List[float]] = []
    import random
    rnd = random.Random(hash(name) & 0xFFFFFFFF)
    for _ in range(45):
        dlat = (rnd.random() - 0.5) * 0.08
        dlon = (rnd.random() - 0.5) * 0.08
        dist = math.hypot(dlat, dlon)
        intensity = round(max(0.2, base_intensity * (1 - dist * 6) + rnd.uniform(-0.1, 0.1)), 2)
        heat.append([round(lat + dlat, 5), round(lon + dlon, 5), max(0.15, min(1.0, intensity))])

    result = {"city": name, "center": [lat, lon], "markers": markers, "heat": heat}
    _cache_set("map", name, result)
    return result


# ════════════════════════════════════════════════════════════
# GET /api/causal/{city}
# ════════════════════════════════════════════════════════════
_SOURCE_ICON = {
    "Vehicular Traffic": "🚗",
    "Temperature Inversion": "🌡️",
    "Winter Effect": "❄️",
    "Industrial Emissions": "🏭",
    "Crop/Stubble Burning": "🔥",
}


@app.get("/api/causal/{city}")
def causal(city: str):
    name, coords = _resolve_city(city)
    cached = _cache_get("causal", name)
    if cached:
        return cached

    lat, lon = coords["lat"], coords["lon"]
    tp = coords.get("traffic_points", [{"name": "Main", "lat": lat, "lon": lon}])

    # ── Fire all slow I/O in parallel ──────────────────────────────────────
    # Group 1: quick API calls (AQI, weather, traffic, industrial, fires)
    # Group 2: slow historical fetch (runs alongside group 1)
    # Total wall-clock ≈ max(group1, group2) instead of sum of all.
    f_aqi     = _THREAD_POOL.submit(AQIFetcher.get_current_aqi, lat, lon)
    f_weather = _THREAD_POOL.submit(WeatherFetcher.get_current_weather, lat, lon)
    f_traffic = _THREAD_POOL.submit(
        lambda: TrafficFetcher().get_multi_point_congestion(tp)
    )
    f_industrial = _THREAD_POOL.submit(IndustrialMapper.get_industrial_sources, lat, lon)
    f_fires   = _THREAD_POOL.submit(FireDetector().get_nearby_fires, lat, lon)
    # 6 months: includes at least one full winter + one summer — enough variance
    # for DoWhy to estimate all three drivers. 12 months doubled the fetch time.
    f_hist    = _THREAD_POOL.submit(
        HistoricalCollector.collect_training_data, lat, lon, 6
    )

    aqi_data       = f_aqi.result()
    weather        = f_weather.result()
    traffic_results = f_traffic.result()
    industrial     = f_industrial.result()
    fires          = f_fires.result()
    hist           = f_hist.result()          # may already be done
    # ───────────────────────────────────────────────────────────────────────

    current_aqi = int(aqi_data.get("aqi", 0) or 0)
    avg_congestion = sum(
        t.get("congestion_index", 0) or 0 for t in traffic_results
    ) / max(len(traffic_results), 1)
    rows = len(hist)

    wind = weather.get("wind_speed", 10) or 10
    temp = weather.get("temperature", 25) or 25
    humid = weather.get("humidity", 50) or 50
    conditions = {
        "aqi": current_aqi,
        "traffic_proxy": avg_congestion * (1 / (wind + 0.5)),
        "inversion_risk": 1 if (temp < 20 and humid > 65 and wind < 5) else 0,
        "is_winter": 1 if datetime.now().month in [11, 12, 1, 2] else 0,
    }

    if rows > 0:
        prosecutor = CausalProsecutor(hist)
        report = prosecutor.prosecute(conditions)
        results = report.get("prosecution_results", [])
    else:
        report, results = {"current_aqi": current_aqi}, []

    # culprits
    culprits = []
    for i, r in enumerate(results):
        culprits.append({
            "name": r["source_name"],
            "pct": r["responsibility_pct"],
            "type": "primary" if i == 0 else "secondary",
            "icon": r.get("icon") or _SOURCE_ICON.get(r["source_name"], "⚠️"),
            "causalEffect": r["causal_effect"],
            "confidence": r["confidence"],
        })

    # counterfactuals
    counterfactuals = []
    for r in results:
        cf_aqi = r.get("counterfactual_aqi", current_aqi)
        counterfactuals.append({
            "source": r["source_name"],
            "aqiDrop": round(r.get("aqi_reduction", 0), 0),
            "resultLabel": f"{_severity_label(int(cf_aqi))} air quality (AQI {int(cf_aqi)})",
        })

    # DAG — causal graph the engine actually uses
    dag_nodes = [
        {"id": "traffic", "label": "Traffic", "icon": "🚗", "kind": "source"},
        {"id": "industry", "label": "Industry", "icon": "🏭", "kind": "source"},
        {"id": "weather", "label": "Weather", "icon": "🌬️", "kind": "source"},
        {"id": "fires", "label": "Fires", "icon": "🔥", "kind": "source"},
        {"id": "inversion", "label": "Inversion", "icon": "🌡️", "kind": "mediator"},
        {"id": "aqi", "label": "AQI", "icon": "🔴", "kind": "outcome"},
    ]

    def _eff(nm):
        for r in results:
            if r["source_name"] == nm:
                return min(1.0, abs(r["causal_effect"]) / 10 + 0.3)
        return 0.5

    traffic_strength = _eff("Vehicular Traffic")
    inv_strength = _eff("Temperature Inversion")
    dag_edges = [
        {"source": "traffic", "target": "aqi", "strength": round(traffic_strength, 2), "prob": round(0.5 + traffic_strength / 2, 2)},
        {"source": "industry", "target": "aqi", "strength": 0.45, "prob": 0.6},
        {"source": "fires", "target": "aqi", "strength": 0.4, "prob": 0.55},
        {"source": "weather", "target": "inversion", "strength": 0.7, "prob": 0.75},
        {"source": "inversion", "target": "aqi", "strength": round(inv_strength, 2), "prob": round(0.5 + inv_strength / 2, 2)},
        {"source": "weather", "target": "aqi", "strength": 0.5, "prob": 0.6},
    ]

    # Formal brief
    try:
        brief = ProsecutorReportGenerator().generate_report(
            prosecution_data=report if rows > 0 else {"prosecution_results": results, "current_aqi": current_aqi, "primary_culprit": culprits[0]["name"] if culprits else "Unknown"},
            city=name,
            location=f"{lat:.4f}°N, {lon:.4f}°E",
            industrial_data=industrial,
            fire_data=fires,
        )
    except Exception as e:
        brief = f"Prosecution brief unavailable: {e}"

    # Source statuses
    def _ok(d, key="source"):
        s = str(d.get(key, "")).lower()
        return "ok" if s and "error" not in s and "mock" not in s else "down"

    sources = [
        {"name": "Open-Meteo", "status": _ok(aqi_data)},
        {"name": "AQICN", "status": "ok" if aqi_data.get("station_aqi") is not None else "down"},
        {"name": "TomTom", "status": _ok(traffic_results[0]) if traffic_results else "down"},
        {"name": "NASA FIRMS", "status": _ok(fires)},
        {"name": "OpenStreetMap", "status": "ok" if industrial.get("total_sources", 0) >= 0 else "down"},
    ]

    result = {
        "city": name,
        "culprits": culprits,
        "counterfactuals": counterfactuals,
        "dag": {"nodes": dag_nodes, "edges": dag_edges},
        "brief": brief,
        "dataSummary": {"months": 6, "rows": rows, "sources": sources},
    }
    _cache_set("causal", name, result)
    return result


@app.get("/api/health")
def health():
    return {"status": "ok", "cities": list(CITIES.keys())}

# ════════════════════════════════════════════════════════════
# WARD INTELLIGENCE MODULE
# ════════════════════════════════════════════════════════════

def _get_or_create_wards(city: str):
    name, coords = _resolve_city(city)
    cached = _cache_get("wards", name)
    if cached:
        return cached

    lat, lon = coords["lat"], coords["lon"]
    stations = _waqi_stations(lat, lon)
    wards = WardEngine.initialize_city_wards(name, lat, lon, stations)
    
    _cache_set("wards", name, wards)
    return wards

@app.get("/api/wards/{city}")
def get_all_wards(city: str):
    wards = _get_or_create_wards(city)
    return {"city": city, "wards": wards}

@app.get("/api/ward-ranking/{city}")
def get_ward_ranking(city: str):
    wards = _get_or_create_wards(city)
    ranked = WardRanker.rank_wards(wards)
    return {"city": city, "ranking": ranked}

@app.get("/api/ward/{city}/{ward_id}")
def get_ward_profile(city: str, ward_id: str):
    wards = _get_or_create_wards(city)
    ward = next((w for w in wards if w["id"] == ward_id), None)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
        
    score_data = WardRanker.calculate_ward_score(ward["aqi"], ward["risk_index"], ward["aqi"])
    ward["score"] = score_data["score"]
    ward["category"] = score_data["category"]
    
    return ward

@app.get("/api/ward-forecast/{city}/{ward_id}")
def get_ward_forecast(city: str, ward_id: str):
    wards = _get_or_create_wards(city)
    ward = next((w for w in wards if w["id"] == ward_id), None)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
        
    forecast = WardForecast.get_ward_forecast(ward["lat"], ward["lon"])
    return {"ward_id": ward_id, "forecast": forecast}

@app.get("/api/ward-recommendation/{city}/{ward_id}")
def get_ward_recommendation(city: str, ward_id: str):
    wards = _get_or_create_wards(city)
    ward = next((w for w in wards if w["id"] == ward_id), None)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
        
    # We use some proxy sources for the recommendation since full causal per ward is slow
    # In a real scenario, this would call CausalEngine for the ward's lat/lon
    sources = [{"name": "Vehicular Traffic", "pct": 45}] # Mock for speed
    
    recs = WardRecommendation.generate_recommendations(ward["name"], ward["aqi"], ward["risk_index"], sources)
    return {"ward_id": ward_id, "recommendations": recs}

