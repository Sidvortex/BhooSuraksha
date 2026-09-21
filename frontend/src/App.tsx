/**
 * BhooSuraksha – AI-Based Landslide Risk Monitoring & Early Warning System
 * Dual Panel Application Entry Point (Authority Command Center + Citizen & Traveler Safety Portal)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { 
  MonitoredLocation, 
  AlertNotification, 
  ActiveNavTab, 
  MLPredictionResponse, 
  StateRiskSummary,
  CitizenIncidentReport 
} from './types/landslide';
import { 
  INITIAL_MONITORED_LOCATIONS, 
  INITIAL_ALERTS, 
  DEMO_STATE_RISK_SUMMARY 
} from './data/mockData';
import { INITIAL_CITIZEN_REPORTS } from './data/citizenData';
import { calculateRiskLevel } from './services/predictionService';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';

// UI Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { GovNav } from './components/GovNav';
import { AboutCredits } from './components/AboutCredits';
import { EarlyWarningBanner } from './components/EarlyWarningBanner';
import { KpiCards } from './components/KpiCards';
import { GisMap } from './components/GisMap';
import { ZoneDetailPanel } from './components/ZoneDetailPanel';
import { LiveMonitoringPanel } from './components/LiveMonitoringPanel';
import { AlertPanel } from './components/AlertPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { ReportsPanel } from './components/ReportsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { PredictionModal } from './components/PredictionModal';
import { AiChatbot } from './components/AiChatbot';

// Citizen Portal Component
import { CitizenPortal } from './components/citizen/CitizenPortal';

import { 
  X, 
  Bot, 
  ShieldAlert, 
  Info
} from 'lucide-react';

export default function App() {
  // Routing replaces the old portal-gateway state: URL now decides which
  // portal is showing ("/authority/*" vs everything else), and the
  // Authority portal is gated behind real auth instead of a landing page.
  const location = useLocation();
  const navigate = useNavigate();
  const { tab: routeTab } = useParams<{ tab?: string }>();
  const { isAuthenticated, logout, token } = useAuth();

  const userRole: 'AUTHORITY' | 'CITIZEN' = location.pathname.startsWith('/authority') ? 'AUTHORITY' : 'CITIZEN';
  const activeTab = (routeTab as ActiveNavTab) || 'dashboard';
  const setActiveTab = useCallback((tab: ActiveNavTab) => navigate(`/authority/${tab}`), [navigate]);

  // State Management
  const [locations, setLocations] = useState<MonitoredLocation[]>(INITIAL_MONITORED_LOCATIONS);
  const [alerts, setAlerts] = useState<AlertNotification[]>(INITIAL_ALERTS);
  const [citizenReports, setCitizenReports] = useState<CitizenIncidentReport[]>(INITIAL_CITIZEN_REPORTS);
  const [stateSummaries, setStateSummaries] = useState<StateRiskSummary[]>(DEMO_STATE_RISK_SUMMARY);

  const [selectedLocation, setSelectedLocation] = useState<MonitoredLocation | null>(INITIAL_MONITORED_LOCATIONS[0]);
  
  // Filters
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  
  // System parameters
  const [globalGeofenceRadiusKm, setGlobalGeofenceRadiusKm] = useState<number>(3.5);
  const [highRiskThreshold, setHighRiskThreshold] = useState<number>(0.70);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(0.85);
  
  const [systemOnline, setSystemOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Modals & Drawers
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Critical Alert for Header Banner (highest risk alert currently active)
  const criticalAlert = alerts.find(a => a.severity === 'CRITICAL') || null;

  // Load real zones/alerts/analytics from the backend (if configured in
  // Settings) once on mount. api.ts falls back to the mock arrays above on
  // its own, so this is a no-op when no backend URL is set or reachable.
  useEffect(() => {
    (async () => {
      const [liveLocations, liveAlerts, liveAnalytics] = await Promise.all([
        api.getMonitoredZones(),
        api.getAlerts(),
        api.getAnalytics(),
      ]);
      setLocations(liveLocations);
      setAlerts(liveAlerts);
      setStateSummaries(liveAnalytics.stateSummaries);
      setSelectedLocation(liveLocations[0] ?? null);
    })();
  }, []);

  // Real-time Simulation Engine (updates minor fluctuations every 8 seconds in demo mode)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setLocations(prevLocations => {
        return prevLocations.map(loc => {
          // Selectively simulate minor fluctuations for rainfall and moisture
          const deltaRain = (Math.random() - 0.48) * 1.8;
          const deltaMoisture = (Math.random() - 0.49) * 0.8;
          
          const newRain24h = Math.max(10, Math.min(260, Math.round(loc.parameters.rainfall_24h + deltaRain)));
          const newMoisture = Math.max(20, Math.min(98, Math.round(loc.parameters.soil_moisture + deltaMoisture)));

          // Recalculate risk level
          const riskLevel = calculateRiskLevel(loc.risk_probability);

          return {
            ...loc,
            parameters: {
              ...loc.parameters,
              rainfall_24h: newRain24h,
              soil_moisture: newMoisture
            },
            risk_level: riskLevel
          };
        });
      });

      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 8000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Handle Location Selection
  const handleSelectLocation = useCallback((location: MonitoredLocation) => {
    setSelectedLocation(location);
  }, []);

  const handleSelectLocationById = useCallback((locationId: string) => {
    const found = locations.find(l => l.id === locationId);
    if (found) {
      setSelectedLocation(found);
      navigate('/authority/dashboard');
    }
  }, [locations, navigate]);

  // Handle Prediction Applied from Workbench
  const handleApplyPredictionResult = (
    updatedFields: Partial<MonitoredLocation> & { id: string },
    result: MLPredictionResponse
  ) => {
    setLocations(prev => {
      return prev.map(loc => {
        if (loc.id === updatedFields.id) {
          const updatedLoc = { ...loc, ...updatedFields } as MonitoredLocation;
          setSelectedLocation(updatedLoc);
          return updatedLoc;
        }
        return loc;
      });
    });

    // RULE: If probability >= 70%, trigger automated alert
    if (result.probability >= 0.70) {
      const loc = locations.find(l => l.id === updatedFields.id);
      if (loc) {
        const isCrit = result.probability >= 0.85;
        const newAlert: AlertNotification = {
          id: `alert-${Date.now()}`,
          locationId: loc.id,
          locationName: loc.name,
          state: loc.state,
          district: loc.district,
          severity: isCrit ? 'CRITICAL' : 'HIGH',
          risk_probability: result.probability,
          risk_level: result.risk_level,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeAgo: 'Just now',
          primary_factors: result.factor_weights.map(f => `${f.factor}: ${f.impactLevel}`),
          recommended_actions: [
            isCrit 
              ? 'Immediate field inspection and precautionary evacuation assessment.'
              : 'Intensify slope surveillance and notify District Disaster Management Authority (DDMA).'
          ],
          status: 'ACTIVE'
        };

        setAlerts(prev => [newAlert, ...prev]);
      }
    }

    setLastUpdated('Just now');
  };

  // Citizen Incident Reports Handlers
  const handleSubmitCitizenReport = (newReport: CitizenIncidentReport) => {
    setCitizenReports(prev => [newReport, ...prev]);
    
    // Also notify authority channel
    const noticeAlert: AlertNotification = {
      id: `cit-alert-${Date.now()}`,
      locationId: locations[0]?.id || 'loc-1',
      locationName: `Citizen Report: ${newReport.locationName}`,
      state: newReport.state,
      district: newReport.district,
      severity: newReport.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      risk_probability: newReport.severity === 'CRITICAL' ? 0.88 : 0.74,
      risk_level: newReport.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeAgo: 'Just now',
      primary_factors: [`Crowdsourced Observation: ${newReport.hazardType}`, 'Citizen Field Verification Pending'],
      recommended_actions: ['Dispatch local Quick Reaction Team to verify ground crack and assess slope stability.'],
      status: 'ACTIVE'
    };
    setAlerts(prev => [noticeAlert, ...prev]);
    setLastUpdated('Just now');
  };

  const handleUpvoteCitizenReport = (reportId: string) => {
    setCitizenReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return { ...r, upvotes: (r.upvotes || 1) + 1 };
      }
      return r;
    }));
  };

  const handleVerifyCitizenReport = (reportId: string) => {
    setCitizenReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return { ...r, status: 'VERIFIED_DISPATCHED' };
      }
      return r;
    }));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a));
  };

  // KPI Calculations
  const totalMonitored = locations.length;
  const highRiskCount = locations.filter(l => l.risk_probability >= 0.70 && l.risk_probability < 0.85).length;
  const criticalCount = locations.filter(l => l.risk_probability >= 0.85).length;
  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const averageRisk = locations.reduce((acc, l) => acc + l.risk_probability, 0) / (totalMonitored || 1);

  // Authority routes are gated behind real login instead of a landing
  // page — this is the actual auth check, not a UI-only separation.
  if (userRole === 'AUTHORITY' && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div id="ner-landslideguard-root" class="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Navigation & Status Bar — Authority header only; Citizen/public pages use GovNav */}
      {userRole === 'AUTHORITY' ? (
        <Navbar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          systemOnline={systemOnline}
          lastUpdated={lastUpdated}
          isSimulating={isSimulating}
          onToggleSimulation={() => setIsSimulating(!isSimulating)}
          onOpenPredictionModal={() => setIsPredictionModalOpen(true)}
          onExitToGateway={() => { logout(); navigate('/'); }}
          activeAlertsCount={activeAlertsCount}
          criticalZonesCount={criticalCount}
          highRiskZonesCount={highRiskCount}
          totalMonitoredCount={totalMonitored}
          citizenReportsCount={citizenReports.length}
        />
      ) : (
        <GovNav />
      )}

      {/* Early Warning Banner for Critical Risk alerts */}
      <EarlyWarningBanner
        criticalAlert={criticalAlert}
        onSelectAlertLocation={handleSelectLocationById}
      />

      {/* Main Content Area: sidebar (Authority only) + content */}
      <div class="flex flex-1 min-h-0">
        {userRole === 'AUTHORITY' && (
          <Sidebar
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            activeAlertsCount={activeAlertsCount}
            criticalZonesCount={criticalCount}
            highRiskZonesCount={highRiskCount}
            totalMonitoredCount={totalMonitored}
            citizenReportsCount={citizenReports.length}
          />
        )}
        <main class="flex-1 min-w-0 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-5">
        {/* MANDATORY PROTOTYPE ADVISORY BANNER */}
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2 text-slate-300">
            <Info class="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Operational Notice:</strong> Functional Disaster Management Prototype for the North Eastern Region of India. Predictions reflect automated algorithmic outputs and are <strong>not scientifically certified disaster orders</strong>.
            </span>
          </div>
          <div class="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Automated Geofence Threshold: <strong class="text-rose-400">&ge;70%</strong></span>
            <span>•</span>
            <span>Critical Evacuation Threshold: <strong class="text-red-400">&ge;85%</strong></span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BRANCH 1: CITIZEN & TRAVELER SAFETY PORTAL VIEW              */}
        {/* ============================================================ */}
        {userRole === 'CITIZEN' ? (
          <CitizenPortal
            locations={locations}
            citizenReports={citizenReports}
            onSubmitCitizenReport={handleSubmitCitizenReport}
            onUpvoteCitizenReport={handleUpvoteCitizenReport}
            selectedLocation={selectedLocation}
          />
        ) : (
          /* ============================================================ */
          /* BRANCH 2: AUTHORITY COMMAND CENTER VIEW                      */
          /* ============================================================ */
          <>
            {/* 1. DASHBOARD VIEW (Primary Default View) */}
            {activeTab === 'dashboard' && (
              <div class="space-y-5">
                {/* Vital KPI Metric Cards */}
                <KpiCards
                  totalMonitored={totalMonitored}
                  highRiskCount={highRiskCount}
                  criticalCount={criticalCount}
                  activeAlertsCount={activeAlertsCount}
                  averageRisk={averageRisk}
                  lastModelUpdate="Active (Real-Time)"
                  onFilterRisk={(risk) => {
                    setSelectedRiskFilter(risk);
                  }}
                />

                {/* Main Interactive Command Section: GIS Map (65%) + Zone Detail Panel (35%) */}
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[580px]">
                  {/* GIS Map Canvas */}
                  <div class="lg:col-span-8 flex flex-col min-h-[540px]">
                    <GisMap
                      locations={locations}
                      selectedLocation={selectedLocation}
                      onSelectLocation={handleSelectLocation}
                      selectedStateFilter={selectedStateFilter}
                      onSelectStateFilter={setSelectedStateFilter}
                      selectedRiskFilter={selectedRiskFilter}
                      onSelectRiskFilter={setSelectedRiskFilter}
                      globalGeofenceRadiusKm={globalGeofenceRadiusKm}
                      onChangeGeofenceRadiusKm={setGlobalGeofenceRadiusKm}
                    />
                  </div>

                  {/* Selected Location Details Panel */}
                  <div class="lg:col-span-4 flex flex-col min-h-[540px]">
                    <ZoneDetailPanel
                      location={selectedLocation}
                      onClose={() => setSelectedLocation(null)}
                      onRunImmediatePrediction={() => setIsPredictionModalOpen(true)}
                      onOpenAssistantForLocation={(loc) => {
                        setIsAiDrawerOpen(true);
                      }}
                    />
                  </div>
                </div>

                {/* Quick Live Monitoring Snapshot strip */}
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <ShieldAlert class="w-4 h-4 text-rose-400" />
                      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-200">
                        High Vulnerability Threat Corridors ({locations.filter(l => l.risk_probability >= 0.70).length} Geofenced Zones)
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('monitoring')}
                      class="text-xs font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                    >
                      View All Telemetry Stations →
                    </button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {locations
                      .filter(l => l.risk_probability >= 0.65)
                      .slice(0, 4)
                      .map(loc => {
                        const isCrit = loc.risk_probability >= 0.85;
                        return (
                          <div
                            key={loc.id}
                            onClick={() => handleSelectLocation(loc)}
                            class={`p-3 rounded-lg border transition cursor-pointer ${
                              isCrit
                                ? 'bg-red-950/40 border-red-800/80 hover:border-red-500'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                            }`}
                          >
                            <div class="flex items-center justify-between text-xs mb-1">
                              <span class="font-mono text-cyan-400 font-semibold">{loc.state}</span>
                              <span class={`font-mono font-bold ${isCrit ? 'text-red-400' : 'text-orange-400'}`}>
                                {Math.round(loc.risk_probability * 100)}% Risk
                              </span>
                            </div>
                            <h4 class="font-bold text-sm text-white truncate">{loc.name}</h4>
                            <div class="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
                              <span>Rain: {loc.parameters.rainfall_24h}mm</span>
                              <span>Slope: {loc.parameters.slope}°</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* 2. LIVE MONITORING TAB */}
            {activeTab === 'monitoring' && (
              <LiveMonitoringPanel
                locations={locations}
                selectedLocation={selectedLocation || locations[0]}
                onSelectLocation={handleSelectLocation}
                isSimulating={isSimulating}
                onToggleSimulation={() => setIsSimulating(!isSimulating)}
                onRunPredictionForSelected={() => setIsPredictionModalOpen(true)}
              />
            )}

            {/* 3. DEDICATED RISK MAP TAB (Expanded Map View) */}
            {activeTab === 'risk-map' && (
              <div class="space-y-4">
                <div class="h-[720px] w-full">
                  <GisMap
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onSelectLocation={handleSelectLocation}
                    selectedStateFilter={selectedStateFilter}
                    onSelectStateFilter={setSelectedStateFilter}
                    selectedRiskFilter={selectedRiskFilter}
                    onSelectRiskFilter={setSelectedRiskFilter}
                    globalGeofenceRadiusKm={globalGeofenceRadiusKm}
                    onChangeGeofenceRadiusKm={setGlobalGeofenceRadiusKm}
                  />
                </div>
                {selectedLocation && (
                  <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span class="text-xs text-slate-400 font-mono">SELECTED GIS TARGET</span>
                      <h3 class="text-base font-bold text-white">
                        {selectedLocation.name} ({selectedLocation.district}, {selectedLocation.state})
                      </h3>
                      <p class="text-xs text-slate-400">
                        Predicted Probability: <strong class="text-rose-400">{Math.round(selectedLocation.risk_probability * 100)}%</strong> • Geofence Radius: {selectedLocation.geofence_radius_km} km
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
                    >
                      Open Full Geological Analysis
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. ALERTS & CITIZEN REPORTS TAB */}
            {activeTab === 'alerts' && (
              <AlertPanel
                alerts={alerts}
                citizenReports={citizenReports}
                onSelectAlertLocation={handleSelectLocationById}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onVerifyCitizenReport={handleVerifyCitizenReport}
                onNotifyAuthorities={token ? (locationId) => api.notifyAuthorities(locationId, token) : undefined}
              />
            )}

            {/* 5. ANALYTICS & REGIONAL TRENDS TAB */}
            {activeTab === 'analytics' && (
              <AnalyticsPanel
                locations={locations}
                stateSummaries={stateSummaries}
                onSelectLocationById={handleSelectLocationById}
              />
            )}

            {/* 6. REPORTS & EXPORTS TAB */}
            {activeTab === 'reports' && (
              <ReportsPanel
                locations={locations}
                alerts={alerts}
                stateSummaries={stateSummaries}
              />
            )}

            {/* 7. SETTINGS TAB */}
            {activeTab === 'settings' && (
              <SettingsPanel
                geofenceRadiusKm={globalGeofenceRadiusKm}
                onChangeGeofenceRadiusKm={setGlobalGeofenceRadiusKm}
                highRiskThreshold={highRiskThreshold}
                criticalThreshold={criticalThreshold}
                onUpdateThresholds={(h, c) => {
                  setHighRiskThreshold(h);
                  setCriticalThreshold(c);
                }}
              />
            )}
          </>
        )}
      </main>
      </div>

      {/* Floating AI Assistant Trigger Button (Bottom Right) */}
      <button
        id="btn-toggle-ai-drawer"
        onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        class="fixed bottom-5 right-5 z-[2000] p-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl border border-white/20 transition-transform transform hover:scale-110 flex items-center gap-2 cursor-pointer group"
        title="Open NER Landslide AI Assistant"
      >
        <Bot class="w-6 h-6" />
        <span class="text-xs font-bold pr-1 hidden sm:inline">AI Assistant</span>
      </button>

      {/* AI Assistant Popout Drawer */}
      {isAiDrawerOpen && (
        <div class="fixed bottom-20 right-5 z-[2000] w-full max-w-md shadow-2xl animate-fadeIn">
          <div class="relative">
            <button
              onClick={() => setIsAiDrawerOpen(false)}
              class="absolute top-4 right-4 z-10 p-1 rounded-lg text-slate-400 hover:text-white bg-slate-900/80 border border-slate-700 transition cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
            <AiChatbot
              locations={locations}
              onSelectLocationById={handleSelectLocationById}
            />
          </div>
        </div>
      )}

      {/* Interactive ML Prediction Workbench Modal */}
      <PredictionModal
        isOpen={isPredictionModalOpen}
        onClose={() => setIsPredictionModalOpen(false)}
        locations={locations}
        onApplyPredictionResult={handleApplyPredictionResult}
      />

      {/* Footer */}
      <footer class="mt-auto border-t border-slate-800 bg-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            BhooSuraksha — North Eastern Region Landslide Risk Monitoring & Early Warning System
          </span>
          <span>
            {userRole === 'CITIZEN' ? 'Citizen Safety & Public Alert Portal' : 'Authority & Emergency Operations Command'}
          </span>
        </div>
      </footer>

      <AboutCredits />
    </div>
  );
}
