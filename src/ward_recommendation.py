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
                "cost": "Low",
                "time": "Immediate",
                "priority": "Critical",
                "department": "Traffic Police"
            })
            recs.append({
                "intervention": "Increase Public Transport Frequency",
                "reduction": "5-8%",
                "cost": "Medium",
                "time": "24 Hours",
                "priority": "High",
                "department": "Transport Dept"
            })
        elif primary_source == "Industrial Emissions":
            recs.append({
                "intervention": "Mandatory Industrial Audit",
                "reduction": "18-20%",
                "cost": "High",
                "time": "72 Hours",
                "priority": "Critical",
                "department": "Pollution Control Board"
            })
            recs.append({
                "intervention": "Halt Non-Essential Manufacturing",
                "reduction": "25-30%",
                "cost": "High",
                "time": "Immediate",
                "priority": "Critical",
                "department": "Municipal Corp"
            })
        elif primary_source == "Crop/Stubble Burning":
            recs.append({
                "intervention": "Deploy Anti-Smog Guns",
                "reduction": "8-10%",
                "cost": "Medium",
                "time": "Immediate",
                "priority": "High",
                "department": "Public Works"
            })
        else:
            recs.append({
                "intervention": "Increase Water Sprinkling on Major Roads",
                "reduction": "10-12%",
                "cost": "Medium",
                "time": "Immediate",
                "priority": "High",
                "department": "Municipal Corp"
            })
            
        if risk_index > 70:
            recs.append({
                "intervention": "Close Schools & Issue Public Health Advisory",
                "reduction": "N/A",
                "cost": "High",
                "time": "Immediate",
                "priority": "Critical",
                "department": "Health Ministry"
            })
            
        return recs
