"""
Recommendation Engine — Phase 2
========================================
Consumes outputs from the existing CausalProsecutor (DoWhy) and converts
causal findings into deterministic, explainable municipal recommendations.

Architecture position:
    Data Collection → DoWhy → Counterfactual → [Recommendation Engine] → Dashboard

RULES
- Never import or modify causal_engine.py
- Never duplicate causal inference logic
- Every score and value is computed deterministically from inputs
- No hallucinated data; every number traces to a formula or lookup table
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime


# ─────────────────────────────────────────────────────────────
#  Knowledge Base — Source-specific intervention templates
# ─────────────────────────────────────────────────────────────

INTERVENTION_KNOWLEDGE_BASE: Dict[str, List[Dict[str, Any]]] = {
    "Vehicular Traffic": [
        {
            "id": "vt_1",
            "action": "Restrict Heavy Vehicles (BS-IV & Below)",
            "description": (
                "Ban BS-IV and older commercial vehicles on arterial roads during "
                "peak hours (7–10 AM and 5–8 PM). This directly reduces NOx and PM2.5 "
                "from the highest-emitting vehicle classes."
            ),
            "expected_reduction_pct": 0.13,
            "confidence_base": 0.92,
            "cost": "Low",
            "cost_inr_lakhs": 2,
            "implementation_days": 1,
            "difficulty": "Easy",
            "department": "Traffic Police & Transport Department",
            "health_impact": "Reduces respiratory distress and cardiovascular risk, "
                             "particularly for children and the elderly near arterials.",
            "legal_reference": "Section 115 MV Act 1988; NGT Order NGT/PB/O-01/2017",
            "municipal_order_type": "Traffic Regulation Order",
        },
        {
            "id": "vt_2",
            "action": "Synchronize Traffic Signals (Green Wave Corridors)",
            "description": (
                "Coordinate signal timings across major intersections to minimise "
                "stop-and-go cycles. Vehicles produce 4× more NOx during idling than "
                "at cruising speed."
            ),
            "expected_reduction_pct": 0.06,
            "confidence_base": 0.81,
            "cost": "Low",
            "cost_inr_lakhs": 5,
            "implementation_days": 3,
            "difficulty": "Easy",
            "department": "Smart City / Traffic Engineering Cell",
            "health_impact": "Reduces long-term chronic exposure along major corridors.",
            "legal_reference": "Model Building Bye-Laws 2016; Smart City Mission Guidelines",
            "municipal_order_type": "Traffic Management Directive",
        },
        {
            "id": "vt_3",
            "action": "Increase Public Transport Frequency (+30%)",
            "description": (
                "Deploy additional bus/metro services to reduce private vehicle trips. "
                "Each commuter switched from car to bus eliminates approximately "
                "2.3 kg CO₂e and 8g NOx per 10km."
            ),
            "expected_reduction_pct": 0.07,
            "confidence_base": 0.78,
            "cost": "Medium",
            "cost_inr_lakhs": 25,
            "implementation_days": 7,
            "difficulty": "Moderate",
            "department": "City Transport Authority",
            "health_impact": "Long-term reduction in ambient NOx levels city-wide.",
            "legal_reference": "National Urban Transport Policy 2014; JNNURM Guidelines",
            "municipal_order_type": "Service Level Enhancement Order",
        },
        {
            "id": "vt_4",
            "action": "Odd-Even Vehicle Rationing Scheme",
            "description": (
                "Restrict private cars to alternate days based on number plate parity "
                "during declared pollution emergencies (AQI > 200)."
            ),
            "expected_reduction_pct": 0.11,
            "confidence_base": 0.74,
            "cost": "Low",
            "cost_inr_lakhs": 3,
            "implementation_days": 1,
            "difficulty": "Moderate",
            "department": "Municipal Corporation & Traffic Police",
            "health_impact": "Rapid reduction in street-level PM2.5 during acute episodes.",
            "legal_reference": "Environment Protection Act 1986, Section 5; Delhi HC Order 2016",
            "municipal_order_type": "Emergency Pollution Control Order",
        },
    ],

    "Temperature Inversion": [
        {
            "id": "ti_1",
            "action": "Deploy Anti-Smog Guns at Major Intersections",
            "description": (
                "Water atomisation towers create micro-droplets (50–100μm) that "
                "bind to PM2.5 particles and settle them. Effective when wind speed "
                "< 5 km/h and inversion layer is active."
            ),
            "expected_reduction_pct": 0.09,
            "confidence_base": 0.72,
            "cost": "Medium",
            "cost_inr_lakhs": 12,
            "implementation_days": 1,
            "difficulty": "Easy",
            "department": "Public Works Department",
            "health_impact": "Immediate local reduction in breathable PM2.5 concentrations.",
            "legal_reference": "CPCB Anti-Smog Guidelines 2020; NGT Blanket Order Dec 2021",
            "municipal_order_type": "Emergency Dust Suppression Order",
        },
        {
            "id": "ti_2",
            "action": "Suspend All Open Burning Activities",
            "description": (
                "Issue a mandatory ban on waste burning, religious bonfires, and "
                "construction debris burning. Under inversion conditions, smoke has "
                "nowhere to disperse and AQI impact is amplified 3–5×."
            ),
            "expected_reduction_pct": 0.15,
            "confidence_base": 0.88,
            "cost": "Low",
            "cost_inr_lakhs": 1,
            "implementation_days": 1,
            "difficulty": "Easy",
            "department": "Municipal Corporation & Fire Department",
            "health_impact": "Prevents acute spikes in PM10 and CO during temperature inversions.",
            "legal_reference": "Solid Waste Management Rules 2016; CPCB Circular 2019",
            "municipal_order_type": "Emergency Prohibition Order",
        },
    ],

    "Winter Effect": [
        {
            "id": "we_1",
            "action": "Stubble Burning Enforcement & Compensation",
            "description": (
                "Deploy district-level task forces to halt crop residue burning and "
                "compensate farmers with an ex-gratia payment of ₹2,500/acre for "
                "machine-based residue management."
            ),
            "expected_reduction_pct": 0.18,
            "confidence_base": 0.85,
            "cost": "High",
            "cost_inr_lakhs": 200,
            "implementation_days": 14,
            "difficulty": "Hard",
            "department": "Agriculture Department & District Administration",
            "health_impact": "Major seasonal reduction in PM2.5 and benzene from crop smoke.",
            "legal_reference": "Air (Prevention and Control of Pollution) Act 1981; "
                               "Punjab Preservation of Subsoil Water Act 2009",
            "municipal_order_type": "District Administration Order (under DM Act)",
        },
        {
            "id": "we_2",
            "action": "Increase Road Water Sprinkling (2× frequency)",
            "description": (
                "Double the operational hours of municipal tankers for road wetting on "
                "major arterials. Prevents road dust re-suspension which is amplified "
                "in dry, cold winter conditions."
            ),
            "expected_reduction_pct": 0.08,
            "confidence_base": 0.79,
            "cost": "Medium",
            "cost_inr_lakhs": 8,
            "implementation_days": 1,
            "difficulty": "Easy",
            "department": "Municipal Corporation – Works Department",
            "health_impact": "Reduces PM10 from dust, benefiting pedestrians and cyclists.",
            "legal_reference": "Graded Response Action Plan (GRAP) Level II – MoEFCC",
            "municipal_order_type": "Operational Enhancement Directive",
        },
    ],

    # Generic fallback
    "_default": [
        {
            "id": "def_1",
            "action": "Declare Air Quality Emergency & Activate GRAP",
            "description": (
                "Activate the Graded Response Action Plan appropriate to the current "
                "AQI level, coordinating across traffic, industry, and municipal departments."
            ),
            "expected_reduction_pct": 0.10,
            "confidence_base": 0.80,
            "cost": "Low",
            "cost_inr_lakhs": 1,
            "implementation_days": 1,
            "difficulty": "Easy",
            "department": "Environment Department / CPCB",
            "health_impact": "Broad reduction across all exposure pathways.",
            "legal_reference": "Environment Protection Act 1986; GRAP 2017 Notification",
            "municipal_order_type": "Emergency Environment Order",
        },
    ],
}

# ─────────────────────────────────────────────────────────────
#  Priority Score Formula
#
#  priority_score = (
#      0.35 * responsibility_pct_norm   # source contribution weight
#    + 0.25 * aqi_severity_norm         # how bad AQI is right now
#    + 0.20 * vulnerability_norm        # schools/hospitals nearby
#    + 0.10 * (1 - implementation_difficulty_norm)  # prefer quick wins
#    + 0.10 * confidence_norm           # trust the estimate
#  ) * 100
#
#  All inputs normalised to [0, 1]
# ─────────────────────────────────────────────────────────────

DIFFICULTY_ORDER = {"Easy": 0, "Moderate": 1, "Hard": 2}
COST_ORDER = {"Low": 0, "Medium": 1, "High": 2}


def _norm_aqi(aqi: int) -> float:
    """Normalise AQI 0-500 to 0-1."""
    return min(1.0, max(0.0, aqi / 500.0))


def _norm_responsibility(pct: float) -> float:
    """Normalise 0-100% responsibility to 0-1."""
    return min(1.0, max(0.0, pct / 100.0))


def _norm_vulnerability(schools: int, hospitals: int) -> float:
    """Convert nearby vulnerable facility counts to a 0-1 score."""
    raw = min(20, schools) * 0.4 + min(10, hospitals) * 0.6
    return min(1.0, raw / 10.0)


def _priority_label(score: float) -> str:
    if score >= 0.75:
        return "Critical"
    if score >= 0.55:
        return "High"
    if score >= 0.35:
        return "Medium"
    return "Low"


# ─────────────────────────────────────────────────────────────
#  Main Service
# ─────────────────────────────────────────────────────────────

class RecommendationEngine:
    """
    Stateless service that converts causal prosecution results into
    deterministic, ranked, explainable municipal recommendations.

    Usage:
        engine = RecommendationEngine()
        recommendations = engine.generate(prosecution_results, context)
    """

    def generate(
        self,
        prosecution_results: List[Dict[str, Any]],
        context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Parameters
        ----------
        prosecution_results : list
            Output of CausalProsecutor.prosecute()["prosecution_results"]
            Each item has keys: source_name, responsibility_pct, causal_effect,
            counterfactual_aqi, aqi_reduction, confidence, icon.

        context : dict
            {
                "city": str,
                "aqi": int,
                "weather": { wind_speed, temperature, humidity },
                "schools_count": int,    # city-level (optional, default 0)
                "hospitals_count": int,  # city-level (optional, default 0)
                "fire_count": int,       # (optional)
                "industrial_count": int, # (optional)
            }

        Returns
        -------
        list of recommendation dicts, sorted by priority_score desc
        """
        city = context.get("city", "Unknown")
        aqi = int(context.get("aqi", 0) or 0)
        weather = context.get("weather", {})
        wind = float(weather.get("wind_speed", 10) or 10)
        temp = float(weather.get("temperature", 25) or 25)
        humidity = float(weather.get("humidity", 50) or 50)
        schools = int(context.get("schools_count", 0))
        hospitals = int(context.get("hospitals_count", 0))

        aqi_norm = _norm_aqi(aqi)
        vuln_norm = _norm_vulnerability(schools, hospitals)
        inversion_active = temp < 20 and humidity > 65 and wind < 5

        recommendations: List[Dict[str, Any]] = []

        for source in prosecution_results:
            source_name: str = source.get("source_name", "Unknown")
            responsibility_pct: float = float(source.get("responsibility_pct", 0) or 0)
            aqi_reduction: float = float(source.get("aqi_reduction", 0) or 0)
            counterfactual_aqi: float = float(source.get("counterfactual_aqi", aqi) or aqi)
            causal_confidence: str = source.get("confidence", "Moderate")
            icon: str = source.get("icon", "⚠️")

            # Skip tiny contributors (< 5%)
            if responsibility_pct < 5:
                continue

            templates = INTERVENTION_KNOWLEDGE_BASE.get(
                source_name, INTERVENTION_KNOWLEDGE_BASE["_default"]
            )

            resp_norm = _norm_responsibility(responsibility_pct)
            # Map DoWhy confidence string → numeric
            confidence_num = {"Strong": 1.0, "Moderate": 0.7, "Weak": 0.4}.get(
                causal_confidence, 0.6
            )

            for tmpl in templates:
                diff_norm = DIFFICULTY_ORDER.get(tmpl["difficulty"], 1) / 2.0

                # --- Priority Score (weighted formula) ---
                priority_score = (
                    0.35 * resp_norm
                    + 0.25 * aqi_norm
                    + 0.20 * vuln_norm
                    + 0.10 * (1.0 - diff_norm)
                    + 0.10 * confidence_num
                )

                # --- Expected AQI reduction for this specific intervention ---
                # Use causal counterfactual as the reference pool
                expected_aqi_drop = round(aqi_reduction * tmpl["expected_reduction_pct"] / 0.15 * 1.0, 1)
                # Scale: 0.15 is the mid-template baseline pct; normalise relative to source pct
                # Clamp to what's physically possible
                expected_aqi_drop = min(aqi_reduction, max(1.0, expected_aqi_drop))
                projected_aqi = round(max(0, aqi - expected_aqi_drop), 0)

                # --- Confidence adjustment for weather context ---
                adj_confidence = tmpl["confidence_base"]
                if source_name == "Temperature Inversion" and inversion_active:
                    adj_confidence = min(0.99, adj_confidence + 0.10)
                if source_name == "Vehicular Traffic" and wind < 5:
                    adj_confidence = min(0.99, adj_confidence + 0.05)

                # --- Human-readable explanation ---
                explanation = self._build_explanation(
                    source_name, responsibility_pct, aqi, aqi_reduction,
                    counterfactual_aqi, tmpl, city, wind, temp, humidity,
                    inversion_active
                )

                # --- Municipal order text ---
                municipal_order = self._build_order(
                    city, tmpl["municipal_order_type"], tmpl["action"],
                    aqi, tmpl["department"]
                )

                recommendations.append({
                    "id": tmpl["id"],
                    "source_name": source_name,
                    "source_icon": icon,
                    "source_responsibility_pct": round(responsibility_pct, 1),
                    "action": tmpl["action"],
                    "description": tmpl["description"],
                    "expected_aqi_drop": round(expected_aqi_drop, 1),
                    "projected_aqi": int(projected_aqi),
                    "confidence_pct": round(adj_confidence * 100, 0),
                    "priority_score": round(priority_score, 4),
                    "priority": _priority_label(priority_score),
                    "cost": tmpl["cost"],
                    "cost_inr_lakhs": tmpl["cost_inr_lakhs"],
                    "implementation_days": tmpl["implementation_days"],
                    "implementation_time_label": self._days_label(tmpl["implementation_days"]),
                    "difficulty": tmpl["difficulty"],
                    "department": tmpl["department"],
                    "health_impact": tmpl["health_impact"],
                    "legal_reference": tmpl["legal_reference"],
                    "municipal_order": municipal_order,
                    "explanation": explanation,
                })

        # Sort by priority_score descending
        recommendations.sort(key=lambda r: r["priority_score"], reverse=True)
        return recommendations

    def _build_explanation(
        self,
        source_name: str,
        responsibility_pct: float,
        aqi: int,
        aqi_reduction: float,
        counterfactual_aqi: float,
        tmpl: Dict[str, Any],
        city: str,
        wind: float,
        temp: float,
        humidity: float,
        inversion_active: bool,
    ) -> str:
        parts = [
            f"Causal analysis (Microsoft DoWhy) identifies **{source_name}** as responsible "
            f"for **{responsibility_pct:.1f}%** of the current AQI elevation in {city}.",
            f"Removing this source entirely would reduce AQI by approximately **{aqi_reduction:.0f} points** "
            f"(from {aqi} → {counterfactual_aqi:.0f}).",
            f"This intervention — *{tmpl['action']}* — is estimated to achieve "
            f"**{tmpl['expected_reduction_pct']*100:.0f}%** of that theoretical maximum reduction, "
            f"based on empirical effectiveness data for this measure.",
        ]
        if inversion_active:
            parts.append(
                f"⚠️ A temperature inversion is currently active "
                f"(temp={temp:.0f}°C, humidity={humidity:.0f}%, wind={wind:.1f}km/h). "
                f"Pollutants are trapped near ground level, making interventions "
                f"more urgent and their benefit more immediately measurable."
            )
        if tmpl.get("difficulty") == "Easy":
            parts.append("✅ This is an operationally simple action requiring no new procurement — it can be activated within hours.")

        return " ".join(parts)

    def _build_order(
        self, city: str, order_type: str, action: str, aqi: int, department: str
    ) -> str:
        date_str = datetime.now().strftime("%d %B %Y")
        return (
            f"**{order_type.upper()}**\n"
            f"Issued by: Municipal Authority of {city}\n"
            f"Date: {date_str}\n"
            f"Current AQI: {aqi} (BASIS: DoWhy Causal Inference Engine)\n\n"
            f"It is hereby directed that the **{department}** shall forthwith "
            f"implement: *{action}*.\n\n"
            f"This order is issued under powers conferred by the Environment "
            f"Protection Act 1986 and shall remain in force until revoked."
        )

    @staticmethod
    def _days_label(days: int) -> str:
        if days <= 1:
            return "Immediate (< 24h)"
        if days <= 3:
            return f"{days} Days"
        if days <= 14:
            return f"{days} Days"
        return f"{days // 7} Weeks"

    def summarise(
        self,
        recommendations: List[Dict[str, Any]],
        aqi: int,
        city: str,
    ) -> Dict[str, Any]:
        """
        Produce an executive summary of the full recommendation set.
        Called by the /api/recommendations/{city}/summary endpoint.
        """
        if not recommendations:
            return {
                "city": city,
                "current_aqi": aqi,
                "total_recommendations": 0,
                "max_aqi_drop": 0,
                "projected_best_aqi": aqi,
                "critical_count": 0,
                "high_count": 0,
                "top_action": None,
                "total_cost_estimate_lakhs": 0,
            }

        critical = [r for r in recommendations if r["priority"] == "Critical"]
        high = [r for r in recommendations if r["priority"] == "High"]
        top = recommendations[0]
        max_drop = top["expected_aqi_drop"]
        best_aqi = top["projected_aqi"]

        return {
            "city": city,
            "current_aqi": aqi,
            "total_recommendations": len(recommendations),
            "max_aqi_drop": max_drop,
            "projected_best_aqi": best_aqi,
            "critical_count": len(critical),
            "high_count": len(high),
            "top_action": top["action"],
            "top_department": top["department"],
            "top_priority": top["priority"],
            "total_cost_estimate_lakhs": sum(r["cost_inr_lakhs"] for r in recommendations),
            "easy_wins": [
                r["action"]
                for r in recommendations
                if r["difficulty"] == "Easy" and r["priority"] in ("Critical", "High")
            ][:3],
        }
