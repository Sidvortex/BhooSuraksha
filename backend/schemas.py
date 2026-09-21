"""
Pydantic models mirroring src/types/landslide.ts on the frontend, so responses
serialize into exactly the shapes the React app already expects.
"""
from typing import List, Literal, Optional

from pydantic import BaseModel

RiskLevel = Literal["LOW", "MODERATE", "HIGH", "VERY_HIGH", "CRITICAL"]
GeologicalSusceptibility = Literal["Low", "Moderate", "High", "Very High", "Severe"]


class LoginRequest(BaseModel):
    username: str
    password: str


class UserInfo(BaseModel):
    id: int
    username: str
    role: str


class LoginResponse(BaseModel):
    token: str
    user: UserInfo


class NotifyAuthoritiesRequest(BaseModel):
    location_id: str
    message: Optional[str] = None


class NotifyAuthoritiesResponse(BaseModel):
    status: str
    zone_name: str
    risk_level: RiskLevel
    subscriber_count: int
    note: str


class MLPredictionRequest(BaseModel):
    latitude: float
    longitude: float
    rainfall_1h: float = 0
    rainfall_24h: float
    rainfall_7d: float
    soil_moisture: float = 0
    slope: float
    elevation: float = 0
    temperature: float = 0
    ndvi: float = 0
    geological_susceptibility: GeologicalSusceptibility = "Moderate"
    land_use: str = "Unclassified"
    road_distance: float = 0
    historical_landslide_frequency: float = 0


class FactorWeight(BaseModel):
    factor: str
    importance: int
    impactLevel: Literal["LOW", "MODERATE", "HIGH"]
    description: str


class MLPredictionResponse(BaseModel):
    probability: float
    risk_level: RiskLevel
    confidence: float
    latitude: float
    longitude: float
    timestamp: str
    factor_weights: List[FactorWeight]
    explanation: str


class EnvironmentalParameters(BaseModel):
    rainfall_1h: float
    rainfall_24h: float
    rainfall_7d: float
    soil_moisture: float
    slope: float
    elevation: float
    temperature: float
    ndvi: float
    geological_susceptibility: GeologicalSusceptibility
    land_use: str
    road_distance: float
    historical_landslide_frequency: float


class MonitoredLocation(BaseModel):
    id: str
    name: str
    district: str
    state: str
    latitude: float
    longitude: float
    risk_probability: float
    risk_level: RiskLevel
    confidence: float
    parameters: EnvironmentalParameters
    population_exposure: int
    critical_infrastructure: List[str]
    last_updated: str
    has_active_geofence: bool
    geofence_radius_km: float


class AlertNotification(BaseModel):
    id: str
    locationId: str
    locationName: str
    district: str
    state: str
    risk_probability: float
    risk_level: RiskLevel
    timestamp: str
    primary_factors: List[str]
    recommended_actions: List[str]
    status: Literal["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]
    severity: Literal["HIGH", "CRITICAL", "WARNING"]


class ModelPerformanceMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1Score: float
    rocAuc: float
    falseAlarmRate: float
    lastTrained: str
    testDatasetSize: int
    modelArchitecture: str


class IndiaPredictionRequest(BaseModel):
    latitude: float
    longitude: float
    date: Optional[str] = None  # "YYYY-MM-DD"; defaults to today


class IndiaFactorWeight(BaseModel):
    factor: str
    importance: int
    impactLevel: Literal["LOW", "MODERATE", "HIGH"]
    description: str


class IndiaPredictionResponse(BaseModel):
    probability: float
    risk_level: RiskLevel
    confidence: float
    state: str
    latitude: float
    longitude: float
    month: int
    factor_weights: List[IndiaFactorWeight]
    explanation: str


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    dataSource: str
    metrics: dict


class ModelListResponse(BaseModel):
    models: List[ModelInfo]


class StateRiskSummary(BaseModel):
    state: str
    avgRisk: float
    highRiskZones: int
    criticalZones: int
    alerts: int
    totalMonitored: int


class AnalyticsResponse(BaseModel):
    stateSummaries: List[StateRiskSummary]
    modelPerformance: ModelPerformanceMetrics
