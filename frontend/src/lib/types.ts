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
  medium?: number;
}

// REPORTS
export interface Report {
  id: string;
  title: string;
  city: string;
  type: string;
  generated_at: string;
  status: string;
  size: string;
  author: string;
  executive_summary: string;
  current_situation: {
    aqi: number;
    severity?: string;
    temperature?: number;
    wind_speed?: number;
  };
  source_attribution: any[];
  ward_intelligence: any[];
  active_alerts_summary: {
    total: number;
    critical: number;
  };
  insights: string[];
  confidence_score: number;
}


export interface MapData {
  city: string;
  center: [number, number];
  markers: MapMarker[];
  heat: [number, number, number][];
}

/* ── Phase 2: Intervention Recommendation Engine ───────── */
export interface Recommendation {
  id: string;
  source_name: string;
  source_icon: string;
  source_responsibility_pct: number;
  action: string;
  description: string;
  expected_aqi_drop: number;
  projected_aqi: number;
  confidence_pct: number;
  priority_score: number;
  priority: "Critical" | "High" | "Medium" | "Low";
  cost: "Low" | "Medium" | "High";
  cost_inr_lakhs: number;
  implementation_days: number;
  implementation_time_label: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  department: string;
  health_impact: string;
  legal_reference: string;
  municipal_order: string;
  explanation: string;
  confidence?: string;
  icon?: string;
  impact?: string;
}

export interface RecommendationsData {
  city: string;
  current_aqi: number;
  recommendations: Recommendation[];
  methodology: string;
  generated_at: string;
  message?: string;
}

export interface RecommendationSummary {
  city: string;
  current_aqi: number;
  total_recommendations: number;
  max_aqi_drop: number;
  projected_best_aqi: number;
  critical_count: number;
  high_count: number;
  top_action: string | null;
  top_department: string;
  top_priority: string;
  total_cost_estimate_lakhs: number;
  easy_wins: string[];
}

/* ── Phase 3: Policy Simulator ───────── */

export interface PolicyLevers {
  traffic_reduction_pct: number;
  construction_reduction_pct: number;
  industrial_reduction_pct: number;
  open_burning_reduction_pct: number;
  public_transport_increase_pct: number;
  vehicle_restriction_enabled: boolean;
  construction_ban_enabled: boolean;
  odd_even_enabled: boolean;
  anti_smog_guns_enabled: boolean;
  work_from_home_enabled: boolean;
  tree_plantation_level: "none" | "low" | "medium" | "high";
}

export interface SimulatedSourceResult {
  source_name: string;
  icon: string;
  original_pct: number;
  simulated_pct: number;
  original_aqi_contribution: number;
  simulated_aqi_contribution: number;
  aqi_drop_from_levers: number;
  max_possible_drop: number;
}

export interface HealthImpactEstimate {
  hospitalisation_reduction_pct: number;
  mortality_risk_reduction_pct: number;
  pm25_equivalent_drop: number;
  pm10_equivalent_drop: number;
  label: string;
}

export interface ActiveLever {
  name: string;
  label: string;
  value: string | number | boolean;
  intensity_pct: number;
}

export interface LeverImpact {
  lever_name: string;
  lever_label: string;
  aqi_drop: number;
  intensity_pct: number;
}

export interface PolicySimulationResult {
  city: string;
  baseline_aqi: number;
  simulated_aqi: number;
  aqi_improvement: number;
  improvement_pct: number;
  baseline_label: string;
  simulated_label: string;
  baseline_severity: Severity;
  simulated_severity: Severity;
  source_results: SimulatedSourceResult[];
  health_impact: HealthImpactEstimate;
  pm25_reduction: number;
  pm10_reduction: number;
  cost_breakdown: Record<string, number>;
  total_cost_lakhs: number;
  active_levers: ActiveLever[];
  lever_impacts: LeverImpact[];
  most_effective_lever: LeverImpact | null;
  least_effective_lever: LeverImpact | null;
  confidence: number;
  confidence_pct: number;
  plantation_bonus_aqi: number;
  methodology: string;
}

/* ── Phase 6: Smart City Command Center ───────── */

export interface Alert {
  id: string;
  severity: string;
  category: string;
  source: string;
  title: string;
  description: string;
  message?: string;
  timestamp: string;
  ward: string;
  lat: number;
  lon: number;
  location: { lat: number; lon: number };
  status: string;
  affected_population: number;
  recommended_actions: string[];
  aqi: number;
  pm25: number;
  pm10: number;
  confidence_score: number;
}

export interface AlertStats {
  active_critical: number;
  active_high: number;
  resolved_today: number;
  avg_resolution_time_mins: number;
  total_active: number;
  critical_count: number;
  high_count: number;
  avg_aqi: number;
  highest_aqi_ward: string;
}

export interface AlertTimelineData {
  time: string;
  critical: number;
  high: number;
  medium: number;
}

export interface SystemAdvisory {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  issued_at: string;
  impact: string;
  description: string;
}

export interface DashboardData {
  city: string;
  live: {
    aqi: number;
    severity: Severity;
    main_source: string;
    critical_wards: number;
  };
  health_summary: {
    population_at_risk: number;
    hospitals_affected: number;
    schools_affected: number;
    risk_category: "High" | "Moderate" | "Low";
  };
  culprits?: any[];
  action_queue: Recommendation[];
  simulation_summary: PolicySimulationResult | null;
  validation: {
    status: string;
    data_availability: string;
    confidence: string;
  };
  generated_at: string;
}

export interface SystemSettings {
  defaultCity: string;
  monitoredCities: string[];
  favouriteCities: string[];
  aiProvider: string;
  confidenceThreshold: number;
  alertThreshold: number;
  forecastHorizon: number;
  simulationPrecision: number;
  emailNotifications: boolean;
  browserNotifications: boolean;
  smsNotifications: boolean;
  criticalAlerts: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  emergencyAlerts: boolean;
  aqiThreshold: number;
  pm25Threshold: number;
  pm10Threshold: number;
  no2Threshold: number;
  so2Threshold: number;
  coThreshold: number;
  o3Threshold: number;
  trafficThreshold: number;
  fireDetectionRadius: number;
  riskIndexThreshold: number;
  wardScoreThreshold: number;
  defaultLandingPage: string;
  refreshInterval: number;
  autoRefresh: boolean;
  theme: string;
  compactMode: boolean;
  animationToggle: boolean;
  defaultMapLayer: string;
}

export interface UserProfile {
  name: string;
  organization: string;
  role: string;
  email: string;
  lastLogin: string;
  profilePicture: string;
  userId: string;
}

export interface SystemHealth {
  cpu_usage: string;
  memory_usage: string;
  cache_entries: number;
  model_status: string;
  last_sync: string;
}

export interface SystemStatus {
  backend: string;
  frontend: string;
  database: string;
  api_health: string;
}

export interface AuditLogEntry {
  id: string;
  setting: string;
  changedBy: string;
  timestamp: string;
  oldValue: string;
  newValue: string;
}
