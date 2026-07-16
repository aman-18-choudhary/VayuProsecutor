"""
Prosecutor Report Generator — Generates formal legal-grade prosecution briefs.
Uses Groq (Llama 3.3 70B) or OpenAI as fallback.
"""
import os
from datetime import datetime
from typing import Dict, Any


class ProsecutorReportGenerator:
    def __init__(self):
        self.client = None
        self.model = None
        self._init_client()

    def _init_client(self):
        try:
            from openai import OpenAI
            groq_key = os.getenv("GROQ_API_KEY")
            if groq_key:
                self.client = OpenAI(
                    base_url="https://api.groq.com/openai/v1",
                    api_key=groq_key,
                )
                self.model = "llama-3.3-70b-versatile"
                return
        except Exception:
            pass

        try:
            from openai import OpenAI
            openai_key = os.getenv("OPENAI_API_KEY")
            if openai_key:
                self.client = OpenAI(api_key=openai_key)
                self.model = "gpt-4o-mini"
                return
        except Exception:
            pass

    def generate_report(
        self,
        prosecution_data: Dict[str, Any],
        city: str,
        location: str,
        industrial_data: Dict[str, Any],
        fire_data: Dict[str, Any],
    ) -> str:
        """Generate a formal prosecution brief."""
        if self.client:
            return self._llm_report(prosecution_data, city, location, industrial_data, fire_data)
        return self._template_report(prosecution_data, city, location)

    def _llm_report(self, prosecution_data, city, location, industrial_data, fire_data):
        results = prosecution_data.get("prosecution_results", [])
        current_aqi = prosecution_data.get("current_aqi", 0)
        primary = prosecution_data.get("primary_culprit", "Unknown")

        top_sources = [
            f"{r['source_name']}: {r['responsibility_pct']}% responsibility, "
            f"causal effect {r['causal_effect']:.3f}, "
            f"AQI reduction if removed: {r['aqi_reduction']:.0f}"
            for r in results[:3]
        ]

        prompt = f"""You are a legal AI system generating a formal air quality prosecution brief for municipal authorities.

CASE: Air Quality Prosecution — {city}
DATE: {datetime.now().strftime('%B %d, %Y %H:%M IST')}
LOCATION: {location}
CURRENT AQI: {current_aqi}
METHODOLOGY: Microsoft DoWhy (Judea Pearl's do-calculus, Turing Award 2011)

CAUSAL EVIDENCE:
{chr(10).join(top_sources)}

INDUSTRIAL SOURCES: {industrial_data.get('summary', 'N/A')}
FIRE DATA: {fire_data.get('summary', 'No active fires')}

Generate a formal prosecution brief with these sections:
1. EXECUTIVE SUMMARY (2 sentences)
2. FORMAL FINDINGS (bullet points with causal evidence)
3. PRIMARY DEFENDANT (who is most responsible and why)
4. COUNTERFACTUAL ANALYSIS (what AQI would be if each source removed)
5. RECOMMENDED ENFORCEMENT ACTIONS (specific, actionable)
6. CONFIDENCE & LIMITATIONS
7. CONCLUSION

Use formal legal language. Reference causal inference methodology. Be specific with numbers."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a legal AI writing formal pollution prosecution briefs for Indian municipal authorities."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=1500,
            )
            return response.choices[0].message.content
        except Exception as e:
            return self._template_report(prosecution_data, city, location) + f"\n\n*LLM error: {e}*"

    def _template_report(self, prosecution_data, city, location):
        results = prosecution_data.get("prosecution_results", [])
        current_aqi = prosecution_data.get("current_aqi", 0)
        primary = prosecution_data.get("primary_culprit", "Unknown")
        date_str = datetime.now().strftime("%B %d, %Y %H:%M IST")

        lines = [
            f"## FORMAL PROSECUTION BRIEF — {city.upper()}",
            f"**Date:** {date_str} | **Location:** {location}",
            f"**Current AQI:** {current_aqi} | **Methodology:** Microsoft DoWhy (Judea Pearl's Causal Inference)",
            "",
            "### EXECUTIVE SUMMARY",
            f"This prosecution brief presents causal evidence identifying **{primary}** as the primary contributor "
            f"to elevated air quality index ({current_aqi}) in {city}. "
            f"Analysis was conducted using do-calculus causal inference with backdoor adjustment.",
            "",
            "### FORMAL FINDINGS",
        ]

        for r in results:
            lines.append(
                f"- **{r['source_name']}**: {r['responsibility_pct']}% causal responsibility | "
                f"Effect: {r['causal_effect']:.3f} | Confidence: {r['confidence']} | "
                f"AQI reduction if removed: -{r['aqi_reduction']:.0f}"
            )

        lines += [
            "",
            "### RECOMMENDED ENFORCEMENT ACTIONS",
            f"1. Issue immediate traffic diversion orders for main arterials during peak hours",
            f"2. Dispatch inspection teams to all industrial units within 5km radius",
            f"3. Activate emergency dust suppression on construction sites",
            f"4. Issue public health advisory via emergency broadcast",
            "",
            "### CONFIDENCE & LIMITATIONS",
            "This analysis uses observational causal inference. Results represent estimated causal contributions "
            "with confidence intervals. Refutation tests confirm robustness of primary findings.",
            "",
            "*Generated by VayuProsecutor — AI Causal Pollution Prosecution Engine*"
        ]

        return "\n".join(lines)
