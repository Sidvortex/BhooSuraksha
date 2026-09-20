/**
 * System Administration & Operational Settings Panel
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Sliders, 
  Server, 
  BellRing, 
  Database, 
  Check, 
  RefreshCw 
} from 'lucide-react';

interface SettingsPanelProps {
  geofenceRadiusKm: number;
  onChangeGeofenceRadiusKm: (r: number) => void;
  highRiskThreshold: number;
  criticalThreshold: number;
  onUpdateThresholds: (high: number, critical: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  geofenceRadiusKm,
  onChangeGeofenceRadiusKm,
  highRiskThreshold,
  criticalThreshold,
  onUpdateThresholds
}) => {
  const [localHigh, setLocalHigh] = useState(highRiskThreshold);
  const [localCrit, setLocalCrit] = useState(criticalThreshold);
  const [backendUrl, setBackendUrl] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdateThresholds(localHigh, localCrit);
    if (typeof window !== 'undefined') {
      (window as unknown as { ENV_BACKEND_URL?: string }).ENV_BACKEND_URL = backendUrl;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div id="settings-panel-container" class="space-y-6 max-w-4xl">
      {/* Header */}
      <div class="bg-slate-900/90 border border-slate-800 p-4 rounded-xl backdrop-blur shadow-xl flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            <Settings class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-white">System Settings & Threshold Configuration</h2>
            <p class="text-xs text-slate-400">
              Configure automated geofencing rules, API hooks, and operational notification parameters
            </p>
          </div>
        </div>

        <button
          id="btn-save-settings"
          onClick={handleSave}
          class="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
        >
          {saved ? <Check class="w-4 h-4" /> : null}
          <span>{saved ? 'Saved Successfully' : 'Apply Configuration'}</span>
        </button>
      </div>

      {/* Settings Sections */}
      <div class="space-y-4">
        {/* Section 1: Geofencing & Probability Rules */}
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Shield class="w-4 h-4 text-red-400" />
            Geofencing & Risk Trigger Parameters
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* Geofence default radius */}
            <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div class="flex justify-between mb-1.5">
                <span class="text-slate-300 font-sans font-semibold">Automated Geofence Threat Radius</span>
                <span class="text-cyan-400 font-bold">{geofenceRadiusKm.toFixed(1)} km</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={geofenceRadiusKm}
                onChange={(e) => onChangeGeofenceRadiusKm(parseFloat(e.target.value))}
                class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span class="text-xs text-slate-400 block mt-1">
                Projected buffer zone perimeter around slopes crossing the trigger threshold.
              </span>
            </div>

            {/* High risk threshold */}
            <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div class="flex justify-between mb-1.5">
                <span class="text-slate-300 font-sans font-semibold">High-Risk Alert Threshold</span>
                <span class="text-orange-400 font-bold">{Math.round(localHigh * 100)}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="80"
                step="5"
                value={localHigh * 100}
                onChange={(e) => setLocalHigh(parseInt(e.target.value) / 100)}
                class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-400"
              />
              <span class="text-xs text-slate-400 block mt-1">
                Mandatory rule: &ge;70% generates high-risk geofence and dispatches alerts.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Modular Backend & API Integration */}
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Server class="w-4 h-4 text-cyan-400" />
            Backend API Endpoint Integration
          </h3>

          <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs space-y-3">
            <div>
              <label class="text-slate-300 block font-semibold mb-1">
                Python FastAPI / Production Server URL (Optional)
              </label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="e.g. http://localhost:8000 or https://api.nerlandslideguard.gov.in"
                class="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 outline-none font-mono"
              />
              <span class="text-xs text-slate-400 block mt-1">
                Leave empty to use built-in high fidelity prototype ML heuristic simulation engine.
              </span>
            </div>

            <div class="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-400 font-mono space-y-1">
              <span class="text-slate-200 font-bold block">Connected Endpoints:</span>
              <div>• POST /api/predict (XGBoost/Scikit-learn model inference)</div>
              <div>• GET /api/zones (Spatial telemetry feed)</div>
              <div>• GET /api/alerts (CAP India alert stream)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
