class WardRanker:
    @staticmethod
    def calculate_ward_score(aqi: int, risk_index: int, forecast_aqi: int) -> dict:
        """
        Calculates the Ward Intelligence Score (0-100) and categorizes it.
        100 = Excellent, 0 = Critical
        """
        # Lower AQI is better, higher risk is worse
        aqi_score = max(0, 100 - (aqi / 3))
        forecast_score = max(0, 100 - (forecast_aqi / 3))
        risk_score = 100 - risk_index
        
        final_score = int(0.5 * aqi_score + 0.3 * risk_score + 0.2 * forecast_score)
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
            
        return {"score": final_score, "category": category}

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
