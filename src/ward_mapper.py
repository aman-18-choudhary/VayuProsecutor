import numpy as np
import geopandas as gpd
from shapely.geometry import Polygon, Point, box

class WardMapper:
    @staticmethod
    def generate_grid_wards(stations, city_name, lat, lon, radius_deg=0.15):
        """
        Generate a 1km x 1km (approx) square grid over the city bounding box.
        Each cell acts as a ward.
        """
        # Roughly 0.01 deg is ~1.1km at equator
        grid_size = 0.012 
        
        min_lat = lat - radius_deg
        max_lat = lat + radius_deg
        min_lon = lon - radius_deg
        max_lon = lon + radius_deg
        
        lat_steps = np.arange(min_lat, max_lat, grid_size)
        lon_steps = np.arange(min_lon, max_lon, grid_size)
        
        wards = []
        count = 1
        
        for i in range(len(lat_steps)-1):
            for j in range(len(lon_steps)-1):
                y0 = lat_steps[i]
                y1 = lat_steps[i+1]
                x0 = lon_steps[j]
                x1 = lon_steps[j+1]
                
                poly = box(x0, y0, x1, y1)
                centroid = poly.centroid
                
                base_aqi = 50
                if stations:
                    # find closest station to infer base AQI for the cell
                    closest_dist = float('inf')
                    for s in stations:
                        d = (s["lat"] - centroid.y)**2 + (s["lon"] - centroid.x)**2
                        if d < closest_dist:
                            closest_dist = d
                            base_aqi = s.get("aqi") or 50

                wards.append({
                    "ward_id": f"W-{count:04d}",
                    "ward_name": f"{city_name} Grid {count:04d}",
                    "is_estimated": True,
                    "base_aqi": base_aqi,
                    "lon": centroid.x,
                    "lat": centroid.y,
                    "geometry": poly
                })
                count += 1
                
        return gpd.GeoDataFrame(wards, crs="EPSG:4326")

    @staticmethod
    def get_ward_boundaries(city_name, lat, lon, stations):
        import time
        start_time = time.time()
        print("[Timing] WardMapper.get_ward_boundaries start")
        result = WardMapper.generate_grid_wards(stations, city_name, lat, lon)
        print(f"[Timing] WardMapper.get_ward_boundaries done in {time.time() - start_time:.2f}s")
        return result
