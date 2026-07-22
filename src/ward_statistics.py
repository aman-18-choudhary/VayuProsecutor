import geopandas as gpd

class WardStatistics:
    @staticmethod
    def calculate_stats(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """
        Estimate area (km^2) and population.
        """
        import time
        start_time = time.time()
        print("[Timing] WardStatistics.calculate_stats start")
        
        # Reproject to Web Mercator to get meters, then convert to sq km
        # In Indian lat/lon, standard Web Mercator EPSG:3857 works reasonably for approximation
        gdf_proj = gdf.to_crs("EPSG:3857")
        gdf["area_sqkm"] = gdf_proj.geometry.area / 1e6
        
        # Rough population estimation (e.g., 15,000 people per sq km in Indian urban wards)
        def est_pop(row):
            base_density = 15000
            # Pseudo-random density variance based on hash of the ward name
            factor = 0.5 + (abs(hash(row["ward_name"])) % 100) / 100.0
            pop = int(row["area_sqkm"] * base_density * factor)
            return max(5000, pop) # Minimum 5000 pop per ward
            
        gdf["population"] = gdf.apply(est_pop, axis=1)
        
        print(f"[Timing] WardStatistics.calculate_stats done in {time.time() - start_time:.2f}s")
        return gdf
