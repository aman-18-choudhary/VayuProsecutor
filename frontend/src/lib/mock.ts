import {
  Advisory,
  CausalData,
  City,
  Counterfactual,
  Culprit,
  DagEdge,
  DagNode,
  ForecastPoint,
  LiveData,
  MapData,
  MapMarker,
  Pollutant,
  Severity,
  SourceStatus,
  WeatherData,
} from "./types";
import { CITIES } from "./cities";
import { getSeverity, severityLabel } from "./aqi";

// ---------------------------------------------------------------------------
// Deterministic pseudo-random helpers (seeded by city name so data is stable
// per city across renders, but varied between cities).
// ---------------------------------------------------------------------------

function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cityCoords(city: string): City {
  return CITIES.find((c) => c.name === city) ?? CITIES[0];
}

const WIND_LABELS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

// Base AQI per city so Delhi stays high and others vary 80-260.
const BASE_AQI: Record<string, number> = {
  Delhi: 199,
  Mumbai: 142,
  Bangalore: 88,
  Chennai: 104,
  Kolkata: 176,
  Hyderabad: 121,
  Pune: 133,
  Ahmedabad: 158,
  Jaipur: 187,
  Lucknow: 224,
};

// ---------------------------------------------------------------------------
// mockLive
// ---------------------------------------------------------------------------

function buildPollutant(
  rng: () => number,
  base: number,
  unit: string,
  whoLimit: number
): Pollutant {
  const value = Math.round((base + (rng() - 0.5) * base * 0.3) * 10) / 10;
  const sparkline: number[] = [];
  for (let i = 0; i < 12; i++) {
    sparkline.push(Math.round((base + (rng() - 0.5) * base * 0.5) * 10) / 10);
  }
  return { value, unit, whoLimit, sparkline };
}

function buildAdvisory(sev: Severity, city: string): Advisory {
  const label = severityLabel(sev);
  const enMap: Record<Severity, string> = {
    good: `Air quality in ${city} is Good. It's a great day to be active outdoors.`,
    moderate: `Air quality in ${city} is Moderate. Unusually sensitive individuals should consider limiting prolonged outdoor exertion.`,
    usg: `Air quality in ${city} is Unhealthy for Sensitive Groups. Children, the elderly, and those with respiratory conditions should reduce prolonged outdoor activity.`,
    unhealthy: `Air quality in ${city} is Unhealthy. Everyone may begin to experience health effects; sensitive groups should avoid outdoor exertion and wear an N95 mask.`,
    veryUnhealthy: `Air quality in ${city} is Very Unhealthy. Avoid all outdoor physical activity, keep windows closed, and run an air purifier indoors.`,
    hazardous: `Air quality in ${city} is Hazardous. Health emergency conditions. Remain indoors, seal windows, and use an N95 mask if you must go outside.`,
  };
  const hiMap: Record<Severity, string> = {
    good: `${city} में वायु गुणवत्ता अच्छी है। बाहर सक्रिय रहने के लिए यह एक बढ़िया दिन है।`,
    moderate: `${city} में वायु गुणवत्ता मध्यम है। संवेदनशील व्यक्ति लंबे समय तक बाहरी परिश्रम सीमित करें।`,
    usg: `${city} में वायु गुणवत्ता संवेदनशील समूहों के लिए अस्वस्थ है। बच्चे, बुजुर्ग और श्वसन रोगी बाहरी गतिविधि कम करें।`,
    unhealthy: `${city} में वायु गुणवत्ता अस्वस्थ है। सभी को स्वास्थ्य प्रभाव हो सकते हैं; संवेदनशील समूह बाहर न निकलें और N95 मास्क पहनें।`,
    veryUnhealthy: `${city} में वायु गुणवत्ता बहुत अस्वस्थ है। सभी बाहरी शारीरिक गतिविधि से बचें, खिड़कियाँ बंद रखें और घर में एयर प्यूरीफायर चलाएँ।`,
    hazardous: `${city} में वायु गुणवत्ता खतरनाक है। स्वास्थ्य आपातकाल। घर के अंदर रहें, खिड़कियाँ सील करें और बाहर जाने पर N95 मास्क पहनें।`,
  };
  void label;
  return { en: enMap[sev], hi: hiMap[sev] };
}

export function mockLive(city: string): LiveData {
  const rng = mulberry32(seedFromString(city + "live"));
  const aqi = BASE_AQI[city] ?? Math.round(80 + rng() * 180);
  const severity = getSeverity(aqi);

  const pm25 = buildPollutant(rng, aqi * 0.55, "µg/m³", 15);
  const pm10 = buildPollutant(rng, aqi * 0.9, "µg/m³", 45);
  const no2 = buildPollutant(rng, 30 + rng() * 40, "µg/m³", 25);
  const co = buildPollutant(rng, 1 + rng() * 3, "mg/m³", 4);
  const o3 = buildPollutant(rng, 40 + rng() * 80, "µg/m³", 100);
  const so2 = buildPollutant(rng, 10 + rng() * 40, "µg/m³", 40);

  const windDir = Math.round(rng() * 360);
  const weather: WeatherData = {
    windSpeed: Math.round((2 + rng() * 18) * 10) / 10,
    windDir,
    windDirLabel: WIND_LABELS[Math.floor((windDir / 360) * 8) % 8],
    humidity: Math.round(30 + rng() * 60),
    temperature: Math.round((18 + rng() * 22) * 10) / 10,
  };

  const forecast: ForecastPoint[] = [];
  for (let h = 0; h < 24; h++) {
    const wave = Math.sin((h / 24) * Math.PI * 2) * (aqi * 0.15);
    const noise = (rng() - 0.5) * (aqi * 0.1);
    const val = Math.max(5, Math.round(aqi + wave + noise));
    const band = Math.round(aqi * 0.12 + rng() * 10);
    forecast.push({
      time: `${String(h).padStart(2, "0")}:00`,
      aqi: val,
      upper: val + band,
      lower: Math.max(0, val - band),
    });
  }

  const stationAqi = Math.max(0, aqi - Math.round(20 + rng() * 20));

  return {
    city,
    aqi,
    stationAqi,
    severity,
    pm25,
    pm10,
    no2,
    co,
    o3,
    so2,
    weather,
    forecast,
    advisory: buildAdvisory(severity, city),
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// mockCausal
// ---------------------------------------------------------------------------

export function mockCausal(city: string): CausalData {
  const rng = mulberry32(seedFromString(city + "causal"));
  const aqi = BASE_AQI[city] ?? Math.round(80 + rng() * 180);

  const culprits: Culprit[] = [
    {
      name: "Traffic Emissions",
      pct: 62,
      type: "primary",
      icon: "🚗",
      causalEffect: Math.round(aqi * 0.62),
      confidence: "Strong",
    },
    {
      name: "Temperature Inversion",
      pct: 28,
      type: "secondary",
      icon: "🌡️",
      causalEffect: Math.round(aqi * 0.28),
      confidence: "Moderate",
    },
    {
      name: "Crop Burning",
      pct: 10,
      type: "secondary",
      icon: "🔥",
      causalEffect: Math.round(aqi * 0.1),
      confidence: "Moderate",
    },
  ];

  const trafficDrop = Math.round(aqi * 0.47);
  const inversionDrop = Math.round(aqi * 0.2);
  const burningDrop = Math.round(aqi * 0.08);

  const counterfactuals: Counterfactual[] = [
    {
      source: "Traffic Emissions",
      aqiDrop: trafficDrop,
      resultLabel: "Good Air Quality restored",
    },
    {
      source: "Temperature Inversion",
      aqiDrop: inversionDrop,
      resultLabel: "Moderate Air Quality restored",
    },
    {
      source: "Crop Burning",
      aqiDrop: burningDrop,
      resultLabel: "Marginal improvement",
    },
  ];

  const nodes: DagNode[] = [
    { id: "traffic", label: "Traffic Emissions", icon: "🚗", kind: "source" },
    { id: "industry", label: "Industrial Output", icon: "🏭", kind: "source" },
    { id: "weather", label: "Weather", icon: "🌦️", kind: "source" },
    { id: "fires", label: "Crop Burning", icon: "🔥", kind: "source" },
    {
      id: "inversion",
      label: "Temperature Inversion",
      icon: "🌡️",
      kind: "mediator",
    },
    { id: "aqi", label: "AQI", icon: "🌫️", kind: "outcome" },
  ];

  const edges: DagEdge[] = [
    { source: "traffic", target: "aqi", strength: 0.62, prob: 0.91 },
    { source: "industry", target: "aqi", strength: 0.24, prob: 0.74 },
    { source: "weather", target: "inversion", strength: 0.55, prob: 0.82 },
    { source: "inversion", target: "aqi", strength: 0.28, prob: 0.79 },
    { source: "fires", target: "aqi", strength: 0.1, prob: 0.63 },
  ];

  const brief = [
    `IN THE MATTER OF ATMOSPHERIC POLLUTION — CITY OF ${city.toUpperCase()}`,
    ``,
    `FINDINGS`,
    `This brief presents the results of a causal inference investigation into the elevated Air Quality Index (AQI ≈ ${aqi}) observed in ${city}. Employing the DoWhy causal framework over 6 months of multi-source observational data, the analysis identifies Traffic Emissions as the primary causal agent, accounting for an estimated 62% of measured particulate load. Temperature Inversion and Crop Burning are found to act as contributing and mediating factors respectively.`,
    ``,
    `EVIDENCE`,
    `A structural causal model (SCM) was constructed and the average treatment effect estimated via backdoor adjustment and do-calculus. The identified estimand for do(Traffic = 0) yields a statistically robust reduction in expected AQI. Confounding by meteorological conditions was controlled through explicit adjustment on the Weather → Temperature Inversion pathway. Refutation tests (placebo treatment, random common cause, and data-subset validation) did not overturn the estimated effects, supporting the strength of the causal claim.`,
    ``,
    `COUNTERFACTUAL ANALYSIS`,
    `Under the counterfactual intervention do(Traffic Emissions = 0), the model predicts an AQI reduction of approximately ${trafficDrop} points for ${city}, sufficient to restore conditions to the "Good" band. Interventions on Temperature Inversion and Crop Burning yield secondary reductions of ~${inversionDrop} and ~${burningDrop} points respectively. These estimates derive directly from the estimated interventional distribution P(AQI | do(X)).`,
    ``,
    `RECOMMENDED ACTION`,
    `On the weight of the causal evidence, this brief recommends prioritised mitigation of vehicular traffic emissions in ${city} — including odd-even rationing, low-emission zones, and public-transit incentives — as the single most effective lever for reducing ambient AQI. Meteorological factors, while material, are non-actionable; policy should therefore concentrate on the highest-effect, controllable source.`,
  ].join("\n");

  const sources: SourceStatus[] = [
    { name: "Open-Meteo", status: "ok" },
    { name: "AQICN", status: "ok" },
    { name: "TomTom", status: "ok" },
    { name: "NASA FIRMS", status: "ok" },
    { name: "OpenStreetMap", status: "ok" },
  ];

  return {
    city,
    culprits,
    counterfactuals,
    dag: { nodes, edges },
    brief,
    dataSummary: {
      months: 6,
      rows: 4300 + Math.round(rng() * 200),
      sources,
    },
  };
}

// ---------------------------------------------------------------------------
// mockMap
// ---------------------------------------------------------------------------

const MARKER_TYPES: MapMarker["type"][] = [
  "school",
  "hospital",
  "factory",
  "station",
];

const MARKER_NAME_PREFIX: Record<MapMarker["type"], string[]> = {
  school: ["Public School", "Vidyalaya", "Convent School", "Academy"],
  hospital: ["General Hospital", "Care Clinic", "Medical Centre", "Nursing Home"],
  factory: ["Industries", "Manufacturing Unit", "Steel Works", "Textile Mill"],
  station: ["Monitoring Station", "AQ Sensor", "CPCB Station", "Air Post"],
};

export function mockMap(city: string): MapData {
  const rng = mulberry32(seedFromString(city + "map"));
  const coords = cityCoords(city);
  const center: [number, number] = [coords.lat, coords.lon];

  const markerCount = 10 + Math.floor(rng() * 5); // 10-14
  const markers: MapMarker[] = [];
  for (let i = 0; i < markerCount; i++) {
    const type = MARKER_TYPES[Math.floor(rng() * MARKER_TYPES.length)];
    const names = MARKER_NAME_PREFIX[type];
    const name = `${city} ${names[Math.floor(rng() * names.length)]} ${i + 1}`;
    const lat = coords.lat + (rng() - 0.5) * 0.1;
    const lon = coords.lon + (rng() - 0.5) * 0.1;
    const marker: MapMarker = {
      id: `${city}-${type}-${i}`,
      type,
      name,
      lat: Math.round(lat * 1e5) / 1e5,
      lon: Math.round(lon * 1e5) / 1e5,
    };
    if (type === "station") {
      marker.aqi = Math.round(80 + rng() * 180);
    }
    markers.push(marker);
  }

  const heat: [number, number, number][] = [];
  for (let i = 0; i < 40; i++) {
    const lat = coords.lat + (rng() - 0.5) * 0.12;
    const lon = coords.lon + (rng() - 0.5) * 0.12;
    const intensity = Math.round((0.3 + rng() * 0.7) * 100) / 100;
    heat.push([
      Math.round(lat * 1e5) / 1e5,
      Math.round(lon * 1e5) / 1e5,
      intensity,
    ]);
  }

  return { city, center, markers, heat };
}
