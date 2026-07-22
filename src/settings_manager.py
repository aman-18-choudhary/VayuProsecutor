import json
import os
import time
from typing import Dict, Any
from datetime import datetime

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "settings.json")
USER_PROFILE_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "user.json")
AUDIT_LOG_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "audit_log.json")

def _load_json(path: str, default: Any) -> Any:
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return default

def _save_json(path: str, data: Any):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

class SettingsManager:
    def __init__(self):
        self.default_settings = {
            "defaultCity": "New Delhi",
            "monitoredCities": ["New Delhi", "Mumbai", "Bangalore"],
            "favouriteCities": ["New Delhi", "Mumbai"],
            "aiProvider": "OpenAI GPT-4o",
            "confidenceThreshold": 85,
            "alertThreshold": 150,
            "forecastHorizon": 72,
            "simulationPrecision": 95,
            "emailNotifications": True,
            "browserNotifications": True,
            "smsNotifications": False,
            "criticalAlerts": True,
            "dailySummary": True,
            "weeklyReport": False,
            "emergencyAlerts": True,
            "aqiThreshold": 200,
            "pm25Threshold": 60,
            "pm10Threshold": 100,
            "no2Threshold": 80,
            "so2Threshold": 80,
            "coThreshold": 4,
            "o3Threshold": 100,
            "trafficThreshold": 80,
            "fireDetectionRadius": 50,
            "riskIndexThreshold": 8,
            "wardScoreThreshold": 75,
            "defaultLandingPage": "dashboard",
            "refreshInterval": 5,
            "autoRefresh": True,
            "theme": "system",
            "compactMode": False,
            "animationToggle": True,
            "defaultMapLayer": "aqi"
        }
        
        self.default_user = {
            "name": "Dr. Aman Choudhary",
            "organization": "Delhi Pollution Control Committee",
            "role": "Chief Environmental Officer",
            "email": "aman.c@dpcc.gov.in",
            "lastLogin": datetime.now().isoformat() if 'datetime' in globals() else "",
            "profilePicture": "https://i.pravatar.cc/150?u=aman",
            "userId": "USR-99281A"
        }

    def get_settings(self) -> Dict[str, Any]:
        data = _load_json(SETTINGS_FILE, self.default_settings)
        # merge missing keys
        for k, v in self.default_settings.items():
            if k not in data:
                data[k] = v
        return data

    def update_settings(self, new_settings: Dict[str, Any], user: str = "Admin"):
        old_settings = self.get_settings()
        merged = {**old_settings, **new_settings}
        _save_json(SETTINGS_FILE, merged)
        
        # Add to audit log
        audit = _load_json(AUDIT_LOG_FILE, [])
        for k, v in new_settings.items():
            if k in old_settings and old_settings[k] != v:
                audit.insert(0, {
                    "id": f"aud-{int(time.time()*1000)}-{k}",
                    "setting": k,
                    "changedBy": user,
                    "timestamp": datetime.now().isoformat() if 'datetime' in globals() else "",
                    "oldValue": str(old_settings[k]),
                    "newValue": str(v)
                })
        _save_json(AUDIT_LOG_FILE, audit[:500]) # keep last 500
        return merged

    def get_user_profile(self) -> Dict[str, Any]:
        data = _load_json(USER_PROFILE_FILE, self.default_user)
        for k, v in self.default_user.items():
            if k not in data:
                data[k] = v
        return data

    def update_user_profile(self, new_profile: Dict[str, Any]):
        old = self.get_user_profile()
        merged = {**old, **new_profile}
        _save_json(USER_PROFILE_FILE, merged)
        return merged

    def get_audit_logs(self):
        return _load_json(AUDIT_LOG_FILE, [])

settings_manager = SettingsManager()
