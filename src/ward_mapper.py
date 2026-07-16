import numpy as np
import geopandas as gpd
from shapely.geometry import Polygon, Point, box
from scipy.spatial import Voronoi

class WardMapper:
    @staticmethod
    def generate_voronoi_wards(stations, city_name, lat, lon, radius_deg=0.15):
        """
        Generate Voronoi polygons around AQI monitoring stations, clipped to a bounding box.
        This serves as 'Estimated Operational Zones' when official boundaries are unavailable.
        """
        if not stations:
            # Fallback single square ward
            b = box(lon - radius_deg, lat - radius_deg, lon + radius_deg, lat + radius_deg)
            return gpd.GeoDataFrame({
                "ward_id": ["W-CENTER"],
                "ward_name": [f"{city_name} Central Zone"],
                "is_estimated": [True],
                "base_aqi": [50],
                "lon": [lon],
                "lat": [lat],
                "geometry": [b]
            }, crs="EPSG:4326")

        points = np.array([[s["lon"], s["lat"]] for s in stations])
        d = radius_deg * 2
        dummy_points = np.array([
            [lon - d, lat - d], [lon + d, lat - d], 
            [lon + d, lat + d], [lon - d, lat + d]
        ])
        all_points = np.vstack((points, dummy_points))
        
        vor = Voronoi(all_points)
        polygons = []
        for i in range(len(stations)):
            region_idx = vor.point_region[i]
            region = vor.regions[region_idx]
            if -1 in region or len(region) == 0:
                p = Point(stations[i]["lon"], stations[i]["lat"]).buffer(0.02)
                polygons.append(p)
            else:
                poly = Polygon([vor.vertices[v] for v in region])
                polygons.append(poly)
                
        city_box = box(lon - radius_deg, lat - radius_deg, lon + radius_deg, lat + radius_deg)
        
        wards = []
        for i, (poly, s) in enumerate(zip(polygons, stations)):
            clipped = poly.intersection(city_box)
            wards.append({
                "ward_id": f"W-{s['id']}",
                "ward_name": s["name"],
                "is_estimated": True,
                "base_aqi": s.get("aqi", 0),
                "lon": s["lon"],
                "lat": s["lat"],
                "geometry": clipped
            })
            
        return gpd.GeoDataFrame(wards, crs="EPSG:4326")

    @staticmethod
    def get_ward_boundaries(city_name, lat, lon, stations):
        # Fallback to Voronoi based on AQI stations to guarantee 100% reliability during hackathon.
        return WardMapper.generate_voronoi_wards(stations, city_name, lat, lon)
