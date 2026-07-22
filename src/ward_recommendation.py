class WardRecommendation:
    @staticmethod
    def generate_recommendations(ward_name: str, aqi: int, risk_index: int, sources: list):
        """
        Generates actionable, enterprise-grade interventions based on the ward's profile.
        Reuses standard causal factors if available.
        """
        primary_source = sources[0]["name"] if sources else "Unknown"
        
        recs = []
        if primary_source == "Vehicular Traffic":
            recs.append({
                "intervention": "Restrict Heavy Vehicles (BS-IV & below)",
                "reduction": "12-15%",
                "aqi_reduction": int(aqi * 0.13),
                "confidence": "94%",
                "cost": "Low",
                "time": "Immediate",
                "priority": "Critical",
                "department": "Traffic Police"
            })
            recs.append({
                "intervention": "Increase Public Transport Frequency",
                "reduction": "5-8%",
                "aqi_reduction": int(aqi * 0.06),
                "confidence": "85%",
                "cost": "Medium",
                "time": "24 Hours",
                "priority": "High",
                "department": "Transport Dept"
            })
        elif primary_source == "Industrial Emissions":
            recs.append({
                "intervention": "Mandatory Industrial Audit",
                "reduction": "18-20%",
                "aqi_reduction": int(aqi * 0.19),
                "confidence": "91%",
                "cost": "High",
                "time": "72 Hours",
                "priority": "Critical",
                "department": "Pollution Control Board"
            })
            recs.append({
                "intervention": "Halt Non-Essential Manufacturing",
                "reduction": "25-30%",
                "aqi_reduction": int(aqi * 0.27),
                "confidence": "96%",
                "cost": "High",
                "time": "Immediate",
                "priority": "Critical",
                "department": "Municipal Corp"
            })
        elif primary_source == "Crop/Stubble Burning":
            recs.append({
                "intervention": "Deploy Anti-Smog Guns",
                "reduction": "8-10%",
                "aqi_reduction": int(aqi * 0.09),
                "confidence": "78%",
                "cost": "Medium",
                "time": "Immediate",
                "priority": "High",
                "department": "Public Works"
            })
        else:
            recs.append({
                "intervention": "Increase Water Sprinkling on Major Roads",
                "reduction": "10-12%",
                "aqi_reduction": int(aqi * 0.11),
                "confidence": "82%",
                "cost": "Medium",
                "time": "Immediate",
                "priority": "High",
                "department": "Municipal Corp"
            })
            
        if risk_index > 70:
            recs.append({
                "intervention": "Close Schools & Issue Public Health Advisory",
                "reduction": "N/A",
                "aqi_reduction": 0,
                "confidence": "99%",
                "cost": "High",
                "time": "Immediate",
                "priority": "Critical",
                "department": "Health Ministry"
            })
            
        return recs
