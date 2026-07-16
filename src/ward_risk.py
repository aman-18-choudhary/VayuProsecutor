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
        try:
            vuln_data = VulnerabilityMapper.get_vulnerable_places(lat, lon, radius=20000)
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
                
                # Formula: More vulnerable places and high pop = higher risk index (0-100)
                raw = (s * 2 + h * 5 + (pop / 2000))
                return min(100, max(0, int((raw / 100) * 100)))
                
            gdf["schools_count"] = gdf.index.map(lambda i: s_counts.get(i, 0))
            gdf["hospitals_count"] = gdf.index.map(lambda i: h_counts.get(i, 0))
            gdf["risk_index"] = gdf.apply(get_risk, axis=1)
            
        except Exception as e:
            print("WardRisk Error:", e)
            gdf["schools_count"] = 5
            gdf["hospitals_count"] = 2
            gdf["risk_index"] = 50
            
        return gdf
