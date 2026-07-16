"""
Alert Generator — Generates multilingual health advisories using Groq LLM.
Falls back to template-based alerts if LLM unavailable.
"""
import os
from typing import List, Dict, Any

TEMPLATES = {
    "Hindi": {
        "Good": "हवा की गुणवत्ता अच्छी है। बाहरी गतिविधियाँ सुरक्षित हैं।",
        "Moderate": "हवा की गुणवत्ता मध्यम है। संवेदनशील व्यक्ति बाहरी गतिविधियाँ सीमित करें।",
        "Unhealthy for Sensitive Groups": "हवा की गुणवत्ता संवेदनशील समूहों के लिए अस्वस्थ है। बच्चे, बुजुर्ग और अस्थमा रोगी घर के अंदर रहें।",
        "Unhealthy": "हवा की गुणवत्ता खराब है। सभी लोग बाहरी गतिविधियाँ कम करें। मास्क पहनें।",
        "Very Unhealthy": "हवा की गुणवत्ता बहुत खराब है। अत्यावश्यक होने पर ही बाहर जाएं। N95 मास्क पहनें।",
        "Hazardous": "वायु प्रदूषण आपातकाल! घर के अंदर रहें। सभी खिड़कियाँ बंद रखें। बाहर न जाएं।",
    },
    "English": {
        "Good": "Air quality is good. Outdoor activities are safe for everyone.",
        "Moderate": "Air quality is moderate. Sensitive individuals should limit prolonged outdoor exertion.",
        "Unhealthy for Sensitive Groups": "Air quality is unhealthy for sensitive groups. Children, elderly, and those with respiratory conditions should stay indoors.",
        "Unhealthy": "Air quality is unhealthy. Everyone should reduce prolonged outdoor activities. Wear a mask.",
        "Very Unhealthy": "Air quality is very unhealthy. Avoid outdoor activities. Wear N95 mask if you must go outside.",
        "Hazardous": "AIR QUALITY EMERGENCY! Stay indoors. Keep all windows closed. Avoid all outdoor exposure.",
    },
    "Marathi": {
        "Good": "हवेची गुणवत्ता चांगली आहे. बाहेरील क्रियाकलाप सुरक्षित आहेत.",
        "Moderate": "हवेची गुणवत्ता मध्यम आहे. संवेदनशील व्यक्तींनी बाहेरील क्रियाकलाप मर्यादित करावेत.",
        "Unhealthy for Sensitive Groups": "हवेची गुणवत्ता संवेदनशील गटांसाठी अस्वस्थ आहे. मुले, वृद्ध आणि दमा रुग्णांनी घरात राहावे.",
        "Unhealthy": "हवेची गुणवत्ता वाईट आहे. मास्क घाला आणि बाहेरील वेळ कमी करा.",
        "Very Unhealthy": "हवेची गुणवत्ता अत्यंत वाईट आहे. N95 मास्क घाला आणि बाहेर जाणे टाळा.",
        "Hazardous": "वायू प्रदूषण आणीबाणी! घरात राहा. सर्व खिडक्या बंद ठेवा.",
    },
    "Tamil": {
        "Good": "காற்றின் தரம் நல்லது. வெளிப்புற நடவடிக்கைகள் பாதுகாப்பானவை.",
        "Moderate": "காற்றின் தரம் மிதமானது. உணர்திறன் உள்ளவர்கள் வெளிப்புற நடவடிக்கைகளை குறைக்கவும்.",
        "Unhealthy for Sensitive Groups": "காற்றின் தரம் உணர்திறன் குழுக்களுக்கு ஆரோக்கியமற்றது. குழந்தைகள், முதியோர் வீட்டில் இருக்கவும்.",
        "Unhealthy": "காற்றின் தரம் மோசமாக உள்ளது. முகமூடி அணியுங்கள்.",
        "Very Unhealthy": "காற்றின் தரம் மிகவும் மோசமாக உள்ளது. வெளியில் செல்வதை தவிர்க்கவும்.",
        "Hazardous": "வான்மாசு அவசரநிலை! வீட்டிலேயே இருங்கள். எல்லா ஜன்னல்களையும் மூடுங்கள்.",
    },
    "Telugu": {
        "Good": "వాయు నాణ్యత మంచిది. బయటి కార్యకలాపాలు సురక్షితంగా ఉన్నాయి.",
        "Moderate": "వాయు నాణ్యత మితంగా ఉంది. సున్నితమైన వ్యక్తులు బయటి కార్యకలాపాలను పరిమితం చేయండి.",
        "Unhealthy for Sensitive Groups": "వాయు నాణ్యత సున్నితమైన సమూహాలకు అనారోగ్యకరంగా ఉంది.",
        "Unhealthy": "వాయు నాణ్యత చెడుగా ఉంది. మాస్క్ ధరించండి.",
        "Very Unhealthy": "వాయు నాణ్యత చాలా చెడుగా ఉంది. బయటకు వెళ్ళడం మానుకోండి.",
        "Hazardous": "వాయు కాలుష్య అత్యవసర పరిస్థితి! ఇంట్లో ఉండండి.",
    },
    "Kannada": {
        "Good": "ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಉತ್ತಮವಾಗಿದೆ. ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳು ಸುರಕ್ಷಿತ.",
        "Moderate": "ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಮಧ್ಯಮ ಮಟ್ಟದಲ್ಲಿದೆ. ಸೂಕ್ಷ್ಮ ವ್ಯಕ್ತಿಗಳು ಎಚ್ಚರಿಕೆ ವಹಿಸಿ.",
        "Unhealthy for Sensitive Groups": "ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಸೂಕ್ಷ್ಮ ಗುಂಪುಗಳಿಗೆ ಅಸ್ವಾಸ್ಥ್ಯಕರ.",
        "Unhealthy": "ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಕೆಟ್ಟದಾಗಿದೆ. ಮಾಸ್ಕ್ ಧರಿಸಿ.",
        "Very Unhealthy": "ಗಾಳಿಯ ಗುಣಮಟ್ಟ ತೀರಾ ಕೆಟ್ಟದಾಗಿದೆ. ಹೊರಗೆ ಹೋಗಬೇಡಿ.",
        "Hazardous": "ವಾಯು ಮಾಲಿನ್ಯ ತುರ್ತುಸ್ಥಿತಿ! ಮನೆಯಲ್ಲೇ ಇರಿ.",
    },
    "Bengali": {
        "Good": "বায়ু মানের মান ভালো। বাইরের কার্যক্রম নিরাপদ।",
        "Moderate": "বায়ু মানের মান মাঝারি। সংবেদনশীল ব্যক্তিরা সতর্ক থাকুন।",
        "Unhealthy for Sensitive Groups": "বায়ু মান সংবেদনশীল গোষ্ঠীর জন্য অস্বাস্থ্যকর। শিশু ও বয়স্করা ঘরে থাকুন।",
        "Unhealthy": "বায়ু মান খারাপ। মাস্ক পরুন এবং বাইরের সময় কমান।",
        "Very Unhealthy": "বায়ু মান অত্যন্ত খারাপ। বাইরে যাওয়া এড়িয়ে চলুন।",
        "Hazardous": "বায়ু দূষণ জরুরি অবস্থা! ঘরে থাকুন। সব জানালা বন্ধ রাখুন।",
    },
    "Gujarati": {
        "Good": "હવાની ગુણવત્તા સારી છે. બહારની પ્રવૃત્તિઓ સુરક્ષિત છે.",
        "Moderate": "હવાની ગુણવત્તા મધ્યમ છે. સંવેદનશીલ વ્યક્તિઓ સાવધ રહો.",
        "Unhealthy for Sensitive Groups": "હવાની ગુણવત્તા સંવેદનશીલ જૂથો માટે બિનઆરોગ્યપ્રદ છે.",
        "Unhealthy": "હવાની ગુણવત્તા ખરાબ છે. માસ્ક પહેરો.",
        "Very Unhealthy": "હવાની ગુણવત્તા ખૂબ ખરાબ છે. બહાર ન જાઓ.",
        "Hazardous": "વાયુ પ્રદૂષણ કટોકટી! ઘરે રહો. બધી બારીઓ બંધ રાખો.",
    },
}


class AlertGenerator:
    def __init__(self):
        self.client = None
        self.model = None
        self._init_client()

    def _init_client(self):
        """Try Groq first, then OpenAI, then fall back to templates."""
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

    def generate_alert(
        self,
        aqi: int,
        severity: str,
        city: str,
        factors: list,
        vulnerable_count: int,
        language: str = "English",
    ) -> str:
        """Generate a health advisory. Uses LLM if available, else template."""
        if self.client:
            return self._llm_alert(aqi, severity, city, factors, vulnerable_count, language)
        return self._template_alert(severity, language)

    def _llm_alert(self, aqi, severity, city, factors, vulnerable_count, language):
        factor_names = [f.get("factor", "") for f in factors[:3]]
        factor_str = ", ".join(factor_names) if factor_names else "elevated pollution"

        prompt = (
            f"Generate a 3-4 sentence public health advisory in {language} for {city}. "
            f"Current AQI: {aqi} ({severity}). "
            f"Main pollution sources: {factor_str}. "
            f"Vulnerable locations nearby: {vulnerable_count} (schools, hospitals). "
            f"Include: (1) current health risk, (2) who is most at risk, "
            f"(3) recommended action, (4) when conditions may improve. "
            f"Keep it clear and actionable for the general public."
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a public health advisory system for Indian cities."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
                max_tokens=512,
            )
            return response.choices[0].message.content
        except Exception as e:
            return self._template_alert(severity, language) + f"\n(LLM error: {e})"

    def _template_alert(self, severity: str, language: str) -> str:
        lang_templates = TEMPLATES.get(language, TEMPLATES["English"])
        return lang_templates.get(severity, lang_templates.get("Unhealthy", "Air quality advisory unavailable."))
