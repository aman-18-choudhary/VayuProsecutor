class WardRanker:
    @staticmethod
    def calculate_ward_score(ward: dict) -> dict:
        """
        Calculates the Ward Intelligence Score (0-100) and categorizes it.
        100 = Excellent, 0 = Critical
        Formula: 35% AQI Severity, 20% Forecast Severity, 15% Population Exposure,
                 10% Schools, 10% Hospitals, 5% Industrial Density, 5% Traffic Density
        """
        aqi = ward.get("aqi", 50)
        forecast_aqi = ward.get("forecast_aqi", aqi)
        population = ward.get("population", 50000)
        schools = ward.get("schools_count", 0)
        hospitals = ward.get("hospitals_count", 0)
        industry = ward.get("industrial_density", 5) # 0-10
        traffic = ward.get("traffic_density", 0.5) # 0.0-1.0
        
        # Sub-scores (100 = Excellent, 0 = Critical)
        s_aqi = max(0, min(100, 100 - (aqi / 3)))
        s_forecast = max(0, min(100, 100 - (forecast_aqi / 3)))
        s_pop = max(0, min(100, 100 - (population / 3000)))
        s_schools = max(0, min(100, 100 - (schools * 10)))
        s_hosp = max(0, min(100, 100 - (hospitals * 15)))
        s_ind = max(0, min(100, 100 - (industry * 10)))
        s_traf = max(0, min(100, 100 - (traffic * 100)))
        
        # Weighted Contributions
        c_aqi = 0.35 * s_aqi
        c_forecast = 0.20 * s_forecast
        c_pop = 0.15 * s_pop
        c_schools = 0.10 * s_schools
        c_hosp = 0.10 * s_hosp
        c_ind = 0.05 * s_ind
        c_traf = 0.05 * s_traf
        
        final_score = int(c_aqi + c_forecast + c_pop + c_schools + c_hosp + c_ind + c_traf)
        final_score = max(0, min(100, final_score))
        
        if final_score >= 80:
            category = "Excellent"
        elif final_score >= 60:
            category = "Good"
        elif final_score >= 40:
            category = "Moderate"
        elif final_score >= 20:
            category = "Poor"
        else:
            category = "Critical"
            
        breakdown = {
            "aqi": int(c_aqi),
            "forecast": int(c_forecast),
            "population": int(c_pop),
            "schools": int(c_schools),
            "hospitals": int(c_hosp),
            "industry": int(c_ind),
            "traffic": int(c_traf)
        }
            
        return {"score": final_score, "category": category, "breakdown": breakdown}

    @staticmethod
    def rank_wards(wards_data: list) -> list:
        """
        Sort wards by worst AQI and Risk.
        Returns Top 10 worst wards.
        """
        def sort_key(w):
            return (w.get("aqi", 0) * 0.7) + (w.get("risk_index", 0) * 0.3)
            
        ranked = sorted(wards_data, key=sort_key, reverse=True)
        
        for i, w in enumerate(ranked):
            w["rank"] = i + 1
            # Trend calculation proxy
            if w.get("forecast_aqi", w.get("aqi", 0)) > w.get("aqi", 0):
                w["trend"] = "Rising"
            else:
                w["trend"] = "Falling"
                
        return ranked[:10]
