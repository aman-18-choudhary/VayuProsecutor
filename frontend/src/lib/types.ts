export type Severity =
  | "good"
  | "moderate"
  | "usg"
  | "unhealthy"
  | "veryUnhealthy"
  | "hazardous";

export interface City {
  name: string;
  lat: number;
  lon: number;
}

export interface Pollutant {
  value: number;
  unit: string;
  whoLimit: number;
  sparkline: number[];
}

export interface WeatherData {
  windSpeed: number;
  windDir: number;
  windDirLabel: string;
  humidity: number;
  temperature: number;
}

export interface ForecastPoint {
  time: string;
  aqi: number;
  upper: number;
  lower: number;
}

export interface Advisory {
  en: string;
  hi: string;
}

export interface LiveData {
  city: string;
  aqi: number;
  stationAqi: number | null;
  severity: Severity;
  pm25: Pollutant;
  pm10: Pollutant;
  no2: Pollutant;
  co: Pollutant;
  o3: Pollutant;
  so2: Pollutant;
  weather: WeatherData;
  forecast: ForecastPoint[];
  advisory: Advisory;
  updatedAt: string;
}

export interface Culprit {
  name: string;
  pct: number;
  type: "primary" | "secondary";
  icon: string;
  causalEffect: number;
  confidence: string;
}

export interface Counterfactual {
  source: string;
  aqiDrop: number;
  resultLabel: string;
}

export interface DagNode {
  id: string;
  label: string;
  icon: string;
  kind: "source" | "outcome" | "mediator";
}

export interface DagEdge {
  source: string;
  target: string;
  strength: number;
  prob: number;
}

export interface SourceStatus {
  name: string;
  status: "ok" | "down";
}

export interface CausalData {
  city: string;
  culprits: Culprit[];
  counterfactuals: Counterfactual[];
  dag: { nodes: DagNode[]; edges: DagEdge[] };
  brief: string;
  dataSummary: { months: number; rows: number; sources: SourceStatus[] };
}

export interface MapMarker {
  id: string;
  type: "school" | "hospital" | "factory" | "station";
  name: string;
  lat: number;
  lon: number;
  aqi?: number;
}

export interface MapData {
  city: string;
  center: [number, number];
  markers: MapMarker[];
  heat: [number, number, number][];
}
