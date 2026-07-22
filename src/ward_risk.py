import geopandas as gpd
from shapely.geometry import Point
from .vulnerability import VulnerabilityMapper

class WardRisk:
    @staticmethod
    def calculate_risk(gdf: gpd.GeoDataFrame, lat, lon) -> gpd.GeoDataFrame:
        """
        Fetch vulnerable locations (schools, hospitals) using VulnerabilityMapper.
        Perform Point-in-Polygon to count them per ward, and calculate a Risk Index.
        """
        import time
        start_time = time.time()
        print("[Timing] WardRisk.calculate_risk start")
        
        try:
            vuln_data = VulnerabilityMapper.get_vulnerable_places(lat, lon, radius_m=5000)
            schools = vuln_data.get("places", {}).get("schools", [])
            hospitals = vuln_data.get("places", {}).get("hospitals", [])
            
            def make_gdf(places):
                if not places: return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")
                return gpd.GeoDataFrame(geometry=[Point(p["lon"], p["lat"]) for p in places], crs="EPSG:4326")
                
            schools_gdf = make_gdf(schools)
            hosp_gdf = make_gdf(hospitals)
            
            s_counts, h_counts = {}, {}
            
            if not schools_gdf.empty:
                s_join = gpd.sjoin(schools_gdf, gdf, how="inner", predicate="within")
                s_counts = s_join.groupby("index_right").size().to_dict()
                
            if not hosp_gdf.empty:
                h_join = gpd.sjoin(hosp_gdf, gdf, how="inner", predicate="within")
                h_counts = h_join.groupby("index_right").size().to_dict()
                
            def get_risk(row):
                s = s_counts.get(row.name, 0)
                h = h_counts.get(row.name, 0)
                pop = row.get("population", 50000)
                aqi = row.get("base_aqi", 50)
                
                # Formula: More vulnerable places and high pop = higher risk index (0-100)
                raw_risk = (s * 2 + h * 5 + (pop / 2000))
                risk_idx = min(100, max(0, int((raw_risk / 100) * 100)))

                # Detailed Sub-risks based on demography approximations & AQI multiplier
                # If AQI is high, all risks scale up. Baseline modifier is AQI/100
                aqi_mod = max(0.5, aqi / 100.0)
                
                return {
                    "schools_count": s,
                    "hospitals_count": h,
                    "risk_index": risk_idx,
                    "children_risk": min(100, int((s * 10 + 10) * aqi_mod)),
                    "school_risk": min(100, int((s * 15 + 5) * aqi_mod)),
                    "hospital_risk": min(100, int((h * 20 + 5) * aqi_mod)),
                    "population_risk": min(100, int((pop / 1000) * aqi_mod)),
                    "worker_risk": min(100, int(20 * aqi_mod)),
                    "senior_citizen_risk": min(100, int((h * 10 + 15) * aqi_mod)),
                }
                
            risk_data = gdf.apply(get_risk, axis=1)
            gdf["schools_count"] = risk_data.apply(lambda x: x["schools_count"])
            gdf["hospitals_count"] = risk_data.apply(lambda x: x["hospitals_count"])
            gdf["risk_index"] = risk_data.apply(lambda x: x["risk_index"])
            gdf["children_risk"] = risk_data.apply(lambda x: x["children_risk"])
            gdf["school_risk"] = risk_data.apply(lambda x: x["school_risk"])
            gdf["hospital_risk"] = risk_data.apply(lambda x: x["hospital_risk"])
            gdf["population_risk"] = risk_data.apply(lambda x: x["population_risk"])
            gdf["worker_risk"] = risk_data.apply(lambda x: x["worker_risk"])
            gdf["senior_citizen_risk"] = risk_data.apply(lambda x: x["senior_citizen_risk"])
            
            print(f"[Timing] WardRisk.calculate_risk done in {time.time() - start_time:.2f}s")
            return gdf
        except Exception as e:
            print(f"[Timing] WardRisk.calculate_risk failed in {time.time() - start_time:.2f}s: {e}")
            for col in ["schools_count", "hospitals_count", "risk_index", 
                        "children_risk", "school_risk", "hospital_risk", 
                        "population_risk", "worker_risk", "senior_citizen_risk"]:
                gdf[col] = 50 if "risk" in col else 0
            
        return gdf
