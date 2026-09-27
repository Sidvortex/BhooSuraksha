/**
 * Early Warning Alert Feed & Timeline Panel
 * Provides real-time notifications and historic log of critical landslide risk triggers
 * Includes dedicated view for Crowdsourced Citizen & Field Observer Reports
 */

import React, { useState } from 'react';
import { AlertNotification, CitizenIncidentReport } from '../types/landslide';
import { 
  Bell, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  ChevronRight, 
  MapPin, 
  Filter, 
  Send,
  Users,
  CheckCheck,
  Megaphone,
  Loader2
} from 'lucide-react';

interface AlertPanelProps {
  alerts: AlertNotification[];
  citizenReports?: CitizenIncidentReport[];
  onSelectAlertLocation: (locationId: string) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
  onVerifyCitizenReport?: (reportId: string) => void;
  onNotifyAuthorities?: (locationId: string) => Promise<{ note: string; subscriber_count: number }>;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  citizenReports = [],
  onSelectAlertLocation,
  onAcknowledgeAlert,
  onVerifyCitizenReport,
  onNotifyAuthorities
}) => {
  const [activeView, setActiveView] = useState<'ALERTS' | 'CITIZEN_REPORTS'>('ALERTS');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'VERY_HIGH'>('ALL');
  const [notifyState, setNotifyState] = useState<Record<string, { status: 'loading' | 'done' | 'error'; message?: string }>>({});

  const handleNotify = async (locationId: string) => {
    if (!onNotifyAuthorities) return;
    setNotifyState((prev) => ({ ...prev, [locationId]: { status: 'loading' } }));
    try {
      const result = await onNotifyAuthorities(locationId);
      setNotifyState((prev) => ({ ...prev, [locationId]: { status: 'done', message: result.note } }));
    } catch (err) {
      setNotifyState((prev) => ({
        ...prev,
        [locationId]: { status: 'error', message: err instanceof Error ? err.message : 'Failed to notify' },
      }));
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'ALL') return true;
    if (severityFilter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (severityFilter === 'VERY_HIGH') return a.risk_probability >= 0.70 && a.risk_probability < 0.85;
    if (severityFilter === 'HIGH') return a.severity === 'HIGH';
    return true;
  });

  return (
    <div id="alerts-panel-container" class="space-y-6">
      {/* View Switcher: Sensor Alerts vs Citizen Reports */}
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <button
            onClick={() => setActiveView('ALERTS')}
            class={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'ALERTS'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-slate-50 border border-slate-800'
            }`}
          >
            <Bell class="w-4 h-4" />
            <span>Automated Early Warning Alerts ({alerts.length})</span>
          </button>

          <button
            onClick={() => setActiveView('CITIZEN_REPORTS')}
            class={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'CITIZEN_REPORTS'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-slate-50 border border-slate-800'
            }`}
          >
            <Users class="w-4 h-4" />
            <span>Citizen Hazard Submissions ({citizenReports.length})</span>
          </button>
        </div>

        <span class="text-xs text-slate-400 font-mono hidden sm:inline">
          Official Authority Alert Command Desk
        </span>
      </div>

      {activeView === 'ALERTS' ? (
        <>
          {/* Header & Filter Controls */}
          <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl backdrop-blur shadow-xl">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400">
                <Bell class="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <h2 class="text-lg font-bold text-slate-50">Emergency Warning System & Alert Log</h2>
                <p class="text-xs text-slate-400">
                  Automated notifications generated whenever ML landslide probability crosses the 70% (High) or 85% (Critical) threshold
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                id="filter-alerts-all"
                onClick={() => setSeverityFilter('ALL')}
                class={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  severityFilter === 'ALL'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-50'
                }`}
              >
                All ({alerts.length})
              </button>
              <button
                id="filter-alerts-critical"
                onClick={() => setSeverityFilter('CRITICAL')}
                class={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  severityFilter === 'CRITICAL'
                    ? 'bg-red-700 text-white shadow'
                    : 'text-red-400 hover:text-red-300'
                }`}
              >
                Critical ({alerts.filter(a => a.severity === 'CRITICAL').length})
              </button>
              <button
                id="filter-alerts-vhigh"
                onClick={() => setSeverityFilter('VERY_HIGH')}
                class={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  severityFilter === 'VERY_HIGH'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-orange-400 hover:text-orange-300'
                }`}
              >
                Very High ({alerts.filter(a => a.risk_probability >= 0.70 && a.risk_probability < 0.85).length})
              </button>
              <button
                id="filter-alerts-high"
                onClick={() => setSeverityFilter('HIGH')}
                class={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  severityFilter === 'HIGH'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                High
              </button>
            </div>
          </div>

          {/* Alert Cards Timeline Grid */}
          <div class="space-y-3.5">
            {filteredAlerts.length === 0 ? (
              <div class="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                <CheckCircle class="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p class="text-sm font-semibold text-slate-300">No Alerts Matching Selected Filter</p>
                <p class="text-xs text-slate-400 mt-1">All monitoring locations in this category are operating within nominal limits.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isCrit = alert.severity === 'CRITICAL';
                return (
                  <div
                    key={alert.id}
                    id={`alert-card-${alert.id}`}
                    class={`p-4 rounded-xl border transition shadow-lg ${
                      isCrit
                        ? 'bg-red-950/30 border-red-800/80 hover:border-red-500'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                      <div class="flex items-center gap-2.5">
                        <div class={`p-1.5 rounded-lg ${isCrit ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-600 text-white'}`}>
                          {isCrit ? <AlertOctagon class="w-4 h-4" /> : <AlertTriangle class="w-4 h-4" />}
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="font-extrabold text-sm text-slate-50">{alert.locationName}</span>
                            <span class="text-xs text-slate-400 font-mono">({alert.district}, {alert.state})</span>
                          </div>
                          <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <Clock class="w-3 h-3" />
                            <span>{alert.timestamp} ({alert.timeAgo || 'Recent'})</span>
                            <span>•</span>
                            <span class="font-mono text-rose-400 font-bold">
                              Triggered: {Math.round(alert.risk_probability * 100)}% Probability
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <span class={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                          isCrit
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-orange-950 text-orange-300 border border-orange-800'
                        }`}>
                          {alert.severity} RISK
                        </span>
                      </div>
                    </div>

                    {/* Contributing Factors & Action Required */}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 py-3">
                      {/* Contributing Factors */}
                      <div class="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Primary Attribution Factors:
                        </span>
                        <ul class="space-y-1 text-slate-300 text-xs">
                          {alert.primary_factors.map((factor, idx) => (
                            <li key={idx} class="flex items-center gap-1.5">
                              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended Action */}
                      <div class="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                        <div>
                          <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                            Emergency Response Action Protocol:
                          </span>
                          <ul class="space-y-1 text-slate-300 text-xs">
                            {alert.recommended_actions.map((act, idx) => (
                              <li key={idx} class="flex items-start gap-1.5">
                                <span class="text-amber-400 font-bold">→</span>
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div class="mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                          *Configured recommendation for disaster management authorities.
                        </div>
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div class="flex flex-col gap-2 pt-1">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-mono text-slate-400">
                          Status: <strong class="text-emerald-400">{alert.status}</strong>
                        </span>
                        <div class="flex items-center gap-2">
                          {onAcknowledgeAlert && alert.status === 'ACTIVE' && (
                            <button
                              onClick={() => onAcknowledgeAlert(alert.id)}
                              class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                            >
                              Acknowledge
                            </button>
                          )}
                          {onNotifyAuthorities && (
                            <button
                              id={`btn-notify-authorities-${alert.id}`}
                              onClick={() => handleNotify(alert.locationId)}
                              disabled={notifyState[alert.locationId]?.status === 'loading'}
                              class="px-2.5 py-1 rounded bg-blue-800 hover:bg-blue-700 disabled:opacity-50 text-slate-50 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                            >
                              {notifyState[alert.locationId]?.status === 'loading' ? (
                                <Loader2 class="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Megaphone class="w-3.5 h-3.5" />
                              )}
                              <span>Notify Authorities</span>
                            </button>
                          )}
                          <button
                            id={`btn-view-map-${alert.id}`}
                            onClick={() => onSelectAlertLocation(alert.locationId)}
                            class="px-3 py-1 bg-rose-600/80 hover:bg-rose-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition shadow cursor-pointer"
                          >
                            <MapPin class="w-3.5 h-3.5" />
                            <span>Locate on GIS Map</span>
                          </button>
                        </div>
                      </div>
                      {notifyState[alert.locationId] && (
                        <div class={`text-xs rounded-lg px-2.5 py-1.5 ${
                          notifyState[alert.locationId].status === 'error'
                            ? 'bg-red-950/40 text-red-300'
                            : 'bg-blue-950/40 text-blue-200'
                        }`}>
                          {notifyState[alert.locationId].message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* CITIZEN REPORTS VIEW FOR AUTHORITIES */
        <div class="space-y-4">
          <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-slate-50 flex items-center gap-2">
                <Users class="w-5 h-5 text-amber-400" />
                <span>Crowdsourced Ground Observations from Public & Observers</span>
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Direct incident reports submitted by citizens living in slope sectors or traveling along mountain highways.
              </p>
            </div>
            <div class="text-xs font-mono text-amber-400 px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-800">
              {citizenReports.filter(r => r.status === 'PENDING_REVIEW').length} Pending Action
            </div>
          </div>

          <div class="space-y-3">
            {citizenReports.length === 0 ? (
              <div class="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                <p class="text-sm">No citizen incident reports logged yet.</p>
              </div>
            ) : (
              citizenReports.map((rep) => (
                <div
                  key={rep.id}
                  class="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition"
                >
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div>
                      <div class="flex items-center gap-2 text-xs font-mono">
                        <span class="text-cyan-400 font-bold">{rep.state}</span>
                        <span class="text-slate-600">•</span>
                        <span class="text-slate-300">{rep.district}</span>
                        <span class="text-slate-600">•</span>
                        <span class="text-amber-400 font-bold">{rep.hazardType.replace(/_/g, ' ')}</span>
                      </div>
                      <h4 class="text-base font-bold text-slate-50 mt-0.5">{rep.locationName}</h4>
                    </div>

                    <div class="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                        rep.status === 'VERIFIED_DISPATCHED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
                      }`}>
                        {rep.status === 'VERIFIED_DISPATCHED' ? 'Dispatched' : 'Pending Review'}
                      </span>
                    </div>
                  </div>

                  <p class="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                    {rep.description}
                  </p>

                  <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <div class="flex items-center gap-4">
                      <span>Reporter: <strong class="text-slate-50">{rep.reporterName}</strong> ({rep.reporterPhone})</span>
                      <span>Time: {rep.timestamp}</span>
                      <span>Landmark: {rep.nearestLandmark || 'N/A'}</span>
                    </div>

                    <div class="flex items-center gap-2">
                      {onVerifyCitizenReport && rep.status === 'PENDING_REVIEW' && (
                        <button
                          onClick={() => onVerifyCitizenReport(rep.id)}
                          class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <CheckCheck class="w-3.5 h-3.5" />
                          <span>Verify & Dispatch Team</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
