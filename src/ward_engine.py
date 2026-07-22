import json
import logging
import geopandas as gpd
from typing import Dict, Any, List
from .ward_mapper import WardMapper
from .ward_statistics import WardStatistics
from .ward_risk import WardRisk
from .ward_ranker import WardRanker

class WardEngine:
    @staticmethod
    def initialize_city_wards(city_name: str, lat: float, lon: float, stations: list) -> List[Dict[str, Any]]:
        """
        Master orchestration function to generate the complete spatial boundary 
        and statistical profile for all wards in a city.
        """
        # 1. Generate geometries (Voronoi fallback)
        gdf = WardMapper.get_ward_boundaries(city_name, lat, lon, stations)
        
        # 2. Calculate Area & Population
        gdf = WardStatistics.calculate_stats(gdf)
        
        # 3. Calculate Risk (Schools/Hospitals intersections)
        gdf = WardRisk.calculate_risk(gdf, lat, lon)
        
        wards_json = []
        for _, row in gdf.iterrows():
            # Convert Polygon to standard GeoJSON coordinates
            geom_json = None
            if row["geometry"] and not row["geometry"].is_empty:
                geom_json = json.loads(gpd.GeoSeries([row["geometry"]]).to_json())["features"][0]["geometry"]
                
            aqi = int(row["base_aqi"])
            risk_idx = int(row["risk_index"])
            
            wards_json.append({
                "id": row["ward_id"],
                "name": row["ward_name"],
                "is_estimated": bool(row["is_estimated"]),
                "aqi": aqi,
                "lon": float(row["lon"]),
                "lat": float(row["lat"]),
                "population": int(row["population"]),
                "area_sqkm": round(float(row["area_sqkm"]), 2),
                "schools_count": int(row["schools_count"]),
                "hospitals_count": int(row["hospitals_count"]),
                "risk_index": risk_idx,
                "geometry": geom_json
            })
            
        return wards_json
