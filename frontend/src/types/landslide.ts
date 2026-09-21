/**
 * Types and interfaces for BhooSuraksha
 * North Eastern Region - Real-Time Landslide Risk Monitoring & Early Warning System
 */

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL';

export type NerState =
  | 'Arunachal Pradesh'
  | 'Assam'
  | 'Meghalaya'
  | 'Manipur'
  | 'Mizoram'
  | 'Nagaland'
  | 'Tripura'
  | 'Sikkim';

export type GeologicalSusceptibility = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Severe';

export interface EnvironmentalParameters {
  rainfall_1h: number; // mm
  rainfall_24h: number; // mm
  rainfall_7d: number; // mm
  soil_moisture: number; // percentage (0-100%)
  slope: number; // degrees (0-90)
  elevation: number; // meters above sea level
  temperature: number; // degrees Celsius
  ndvi: number; // Normalized Difference Vegetation Index (-0.2 to 1.0)
  geological_susceptibility: GeologicalSusceptibility;
  land_use: string; // e.g., 'Forested Slopes', 'Highway Corridor', 'Jhum Cultivation', 'Urban Settlement'
  road_distance: number; // meters to nearest arterial road or highway
  historical_landslide_frequency: number; // recorded events in past 10 years
  ground_saturation?: number; // percentage
  pore_water_pressure?: number; // kPa
}

export interface GeofenceZone {
  id: string;
  latitude: number;
  longitude: number;
  radiusKm: number; // e.g. 1 to 5 km
  risk_probability: number; // 0.0 - 1.0
  risk_level: RiskLevel;
  created_at: string;
  label: string;
  active: boolean;
}

export interface MonitoredLocation {
  id: string;
  name: string;
  district: string;
  state: NerState;
  latitude: number;
  longitude: number;
  risk_probability: number; // 0.0 to 1.0
  risk_level: RiskLevel;
  confidence: number; // 0.0 to 1.0
  parameters: EnvironmentalParameters;
  population_exposure: number; // estimated people in vulnerability zone
  critical_infrastructure: string[]; // e.g. ['NH-10 Highway', 'Power Transmission Tower']
  last_updated: string;
  has_active_geofence: boolean;
  geofence_radius_km: number;
}

export interface AlertNotification {
  id: string;
  locationId: string;
  locationName: string;
  district: string;
  state: NerState;
  risk_probability: number;
  risk_level: RiskLevel;
  timestamp: string;
  timeAgo?: string;
  primary_factors: string[];
  recommended_actions: string[];
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  severity: 'HIGH' | 'CRITICAL' | 'WARNING';
}

export interface MLPredictionRequest {
  latitude: number;
  longitude: number;
  rainfall_1h: number;
  rainfall_24h: number;
  rainfall_7d: number;
  soil_moisture: number;
  slope: number;
  elevation: number;
  temperature: number;
  ndvi: number;
  geological_susceptibility: GeologicalSusceptibility;
  land_use: string;
  road_distance: number;
  historical_landslide_frequency: number;
}

export interface MLPredictionResponse {
  probability: number; // 0.0 - 1.0
  risk_level: RiskLevel;
  confidence: number; // 0.0 - 1.0
  latitude: number;
  longitude: number;
  timestamp: string;
  factor_weights: {
    factor: string;
    importance: number; // 0 - 100
    impactLevel: 'LOW' | 'MODERATE' | 'HIGH';
    description: string;
  }[];
  explanation: string;
}

export interface ModelPerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  falseAlarmRate: number;
  lastTrained: string;
  testDatasetSize: number;
  modelArchitecture: string;
}

/** Request/response for the second, India-wide model (backend/india_model.py) */
export interface IndiaPredictionRequest {
  latitude: number;
  longitude: number;
  date?: string; // "YYYY-MM-DD", defaults to today on the backend
}

export interface IndiaPredictionResponse {
  probability: number;
  risk_level: RiskLevel;
  confidence: number;
  state: string;
  latitude: number;
  longitude: number;
  month: number;
  factor_weights: {
    factor: string;
    importance: number;
    impactLevel: 'LOW' | 'MODERATE' | 'HIGH';
    description: string;
  }[];
  explanation: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  metrics: Record<string, unknown>;
}


export interface StateRiskSummary {
  state: NerState;
  avgRisk: number;
  highRiskZones: number;
  criticalZones: number;
  alerts: number;
  totalMonitored: number;
  totalZones?: number;
  avgRainfall24h?: number;
  highestRiskLocation?: string;
  dominantVulnerability?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedPrompts?: string[];
  referenceLocationId?: string;
}

export interface DashboardContext {
  locations: MonitoredLocation[];
  alerts: AlertNotification[];
  stateSummaries: StateRiskSummary[];
  selectedLocation?: MonitoredLocation | null;
  activeGeofencesCount: number;
}

export type ActiveNavTab =
  | 'dashboard'
  | 'monitoring'
  | 'risk-map'
  | 'alerts'
  | 'analytics'
  | 'reports'
  | 'settings';

export type PortalRole = 'AUTHORITY' | 'CITIZEN';

export type CitizenNavTab = 
  | 'safe-status' 
  | 'near-me'
  | 'routes' 
  | 'report-hazard' 
  | 'shelters' 
  | 'guidelines';

export type CitizenHazardType =
  | 'GROUND_CRACK'
  | 'ROCKFALL'
  | 'MUDDY_SPRING'
  | 'TILTING_TREES'
  | 'SLOPE_COLLAPSE'
  | 'ROAD_BLOCKED'
  | 'CULVERT_OVERFLOW';

export interface CitizenIncidentReport {
  id: string;
  reporterName: string;
  reporterPhone: string;
  locationName: string;
  district: string;
  state: NerState;
  hazardType: CitizenHazardType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  timestamp: string;
  timeAgo: string;
  status: 'PENDING_REVIEW' | 'VERIFIED_DISPATCHED' | 'RESOLVED';
  photoDescription?: string;
  nearestLandmark?: string;
  latitude?: number;
  longitude?: number;
  upvotes?: number;
}

export interface HighwayCorridor {
  id: string;
  name: string;
  routeSpan: string;
  state: NerState;
  status: 'OPEN' | 'CAUTION' | 'RESTRICTED' | 'BLOCKED';
  riskProbability: number;
  currentRainfall24h: number;
  advisory: string;
  emergencyContact: string;
  alternateRoute?: string;
  lastCleared: string;
}

export interface EmergencyReliefShelter {
  id: string;
  name: string;
  locationName: string;
  district: string;
  state: NerState;
  capacity: number;
  occupancy: number;
  contactNumber: string;
  officerInCharge: string;
  facilities: string[];
  lat: number;
  lng: number;
  elevationMeters: number;
}
