"""
Industrial Mapper — OpenStreetMap Overpass API (no key needed)
Finds factories, industrial zones, construction sites near a location.
"""
import requests
import time
from typing import Dict, Any, List


class IndustrialMapper:
    OVERPASS_URL = "https://overpass-api.de/api/interpreter"

    QUERIES = {
        "industrial": 'node["landuse"="industrial"]',
        "factories": 'node["man_made"="works"]',
        "power_plants": 'node["power"="plant"]',
        "construction": 'node["landuse"="construction"]',
        "quarries": 'node["landuse"="quarry"]',
    }

    @classmethod
    def get_industrial_sources(
        cls, lat: float, lon: float, radius_m: int = 5000
    ) -> Dict[str, Any]:
        """
        Find industrial pollution sources within radius_m meters.
        Returns sources by type, density score, and summary.
        """
        sources: Dict[str, List[Dict]] = {k: [] for k in cls.QUERIES}

        for source_type, osm_filter in cls.QUERIES.items():
            try:
                query = f"""
                [out:json][timeout:20];
                (
                  {osm_filter}(around:{radius_m},{lat},{lon});
                  way["landuse"~"industrial|construction|quarry"]
                      (around:{radius_m},{lat},{lon});
                );
                out center 30;
                """
                resp = requests.post(
                    cls.OVERPASS_URL,
                    data={"data": query},
                    timeout=25,
                )
                resp.raise_for_status()
                elements = resp.json().get("elements", [])

                for el in elements:
                    if el.get("type") == "node":
                        s_lat, s_lon = el.get("lat"), el.get("lon")
                    elif el.get("type") == "way":
                        center = el.get("center", {})
                        s_lat, s_lon = center.get("lat"), center.get("lon")
                    else:
                        continue

                    if s_lat and s_lon:
                        tags = el.get("tags", {})
                        sources[source_type].append({
                            "name": tags.get("name", f"Industrial {source_type.title()}"),
                            "lat": s_lat,
                            "lon": s_lon,
                            "osm_id": el.get("id"),
                            "operator": tags.get("operator", "Unknown"),
                        })

                time.sleep(0.3)

            except Exception:
                continue

        total_factories = len(sources["factories"]) + len(sources["industrial"])
        total_construction = len(sources["construction"])
        total_power = len(sources["power_plants"])
        total_all = sum(len(v) for v in sources.values())

        # Industrial density score (0-10)
        density = min(10, total_all * 0.5)

        summary = (
            f"Found {total_factories} industrial sources, "
            f"{total_construction} construction sites, "
            f"{total_power} power plants within {radius_m // 1000} km."
        )

        return {
            "sources": sources,
            "industrial_density": round(density, 1),
            "total_sources": total_all,
            "factory_count": total_factories,
            "construction_count": total_construction,
            "power_plant_count": total_power,
            "summary": summary,
            "radius_m": radius_m,
        }
