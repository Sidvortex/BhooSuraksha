/**
 * Real-Time Environmental Parameters & Live Sensor Monitoring Panel
 * Provides continuous telemetry tracking of hydro-meteorological and geotechnical sensors
 */

import React from 'react';
import { MonitoredLocation } from '../types/landslide';
import { 
  Activity, 
  Droplets, 
  Gauge, 
  Mountain, 
  Compass, 
  Thermometer, 
  Trees, 
  Layers, 
  History, 
  Radio, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';

interface LiveMonitoringPanelProps {
  locations: MonitoredLocation[];
  selectedLocation: MonitoredLocation;
  onSelectLocation: (location: MonitoredLocation) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onRunPredictionForSelected: () => void;
}

export const LiveMonitoringPanel: React.FC<LiveMonitoringPanelProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  isSimulating,
  onToggleSimulation,
  onRunPredictionForSelected
}) => {
  const p = selectedLocation.parameters;
  const prob = selectedLocation.risk_probability;

  return (
    <div id="live-monitoring-panel" class="space-y-6">
      {/* Top Station Selector and Status Banner */}
      <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <Radio class="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                Telemetry Station Active
              </span>
              <span class="px-2 py-0.2 rounded-full text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                POLLING 10s
              </span>
            </div>
            <h2 class="text-lg font-bold text-slate-50">{selectedLocation.name}</h2>
            <p class="text-xs text-slate-400">
              {selectedLocation.district} District, {selectedLocation.state} • Elev. {p.elevation}m ASL • Lat {selectedLocation.latitude.toFixed(3)}°, Lng {selectedLocation.longitude.toFixed(3)}°
            </p>
          </div>
        </div>

        {/* Dropdown station picker & Actions */}
        <div class="flex items-center gap-3">
          <div class="flex flex-col">
            <label class="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">
              Select Monitoring Station
            </label>
            <select
              id="select-monitoring-station"
              aria-label="Select monitoring station"
              value={selectedLocation.id}
              onChange={(e) => {
                const found = locations.find(l => l.id === e.target.value);
                if (found) onSelectLocation(found);
              }}
              class="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-medium outline-none cursor-pointer hover:border-slate-500 transition"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.state} – {loc.name} ({Math.round(loc.risk_probability * 100)}%)
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-evaluate-current-station"
            onClick={onRunPredictionForSelected}
            class="px-4 py-2 mt-4 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp class="w-4 h-4" />
            <span>Recalculate Risk</span>
          </button>
        </div>
      </div>

      {/* Primary Key Vital Gauges */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gauge 1: Rainfall */}
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets class="w-4 h-4 text-cyan-400" />
              Precipitation (24h)
            </span>
            <span class={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
              p.rainfall_24h > 120 ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'
            }`}>
              {p.rainfall_24h > 120 ? '↑ HIGH' : 'NORMAL'}
            </span>
          </div>
          <div class="my-2">
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold font-mono text-cyan-400">
                {p.rainfall_24h}
              </span>
              <span class="text-xs text-slate-400 font-mono">mm / 24h</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Peak 1h: <strong class="text-cyan-300">{p.rainfall_1h} mm</strong></span>
              <span>7d Acc: <strong class="text-slate-300">{p.rainfall_7d} mm</strong></span>
            </div>
          </div>
          <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              class="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (p.rainfall_24h / 250) * 100)}%` }}
            />
          </div>
        </div>

        {/* Gauge 2: Soil Moisture */}
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity class="w-4 h-4 text-emerald-400" />
              Soil Moisture
            </span>
            <span class={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
              p.soil_moisture > 80 ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'
            }`}>
              {p.soil_moisture > 80 ? '↑ HIGH' : 'MODERATE'}
            </span>
          </div>
          <div class="my-2">
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold font-mono text-emerald-400">
                {p.soil_moisture}%
              </span>
              <span class="text-xs text-slate-400 font-mono">volumetric</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Ground Sat: <strong class="text-emerald-300">{p.ground_saturation || 88}%</strong></span>
              <span>Pore Pres: <strong class="text-slate-300">{p.pore_water_pressure || 34} kPa</strong></span>
            </div>
          </div>
          <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              class="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${p.soil_moisture}%` }}
            />
          </div>
        </div>

        {/* Gauge 3: Slope Stability */}
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mountain class="w-4 h-4 text-amber-400" />
              Slope Stability Angle
            </span>
            <span class={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
              p.slope > 35 ? 'bg-orange-950 text-orange-300 border border-orange-800' : 'bg-slate-800 text-slate-300'
            }`}>
              {p.slope > 35 ? '↑ CRITICAL' : 'STABLE'}
            </span>
          </div>
          <div class="my-2">
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold font-mono text-amber-400">
                {p.slope}°
              </span>
              <span class="text-xs text-slate-400 font-mono">inclination</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Elevation: <strong class="text-slate-300">{p.elevation}m</strong></span>
              <span>Threshold: <strong class="text-amber-400">&gt;35°</strong></span>
            </div>
          </div>
          <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              class="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (p.slope / 60) * 100)}%` }}
            />
          </div>
        </div>

        {/* Gauge 4: Landslide Probability Output */}
        <div class={`border rounded-xl p-4 shadow-lg flex flex-col justify-between ${
          prob >= 0.85 
            ? 'bg-red-950/40 border-red-700/80 ring-1 ring-red-500' 
            : prob >= 0.70 
              ? 'bg-orange-950/40 border-orange-700/80' 
              : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert class="w-4 h-4 text-red-400" />
              Landslide Probability
            </span>
            <span class={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
              prob >= 0.85 
                ? 'bg-red-900 text-slate-50 animate-pulse' 
                : prob >= 0.70 
                  ? 'bg-orange-900 text-slate-50' 
                  : 'bg-slate-800 text-slate-300'
            }`}>
              {selectedLocation.risk_level.replace('_', ' ')}
            </span>
          </div>
          <div class="my-2">
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold font-mono text-slate-50">
                {Math.round(prob * 100)}%
              </span>
              <span class="text-xs text-slate-400 font-mono">ML Output</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Confidence: <strong class="text-slate-200">{Math.round(selectedLocation.confidence * 100)}%</strong></span>
              <span>Geofence: <strong class="text-red-400">{selectedLocation.geofence_radius_km} km</strong></span>
            </div>
          </div>
          <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              class="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.round(prob * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Secondary Environmental Telemetry Parameters */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Geological Risk & Lithology */}
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers class="w-4 h-4 text-rose-400" />
              Geological Susceptibility
            </span>
            <span class="text-xs font-mono font-bold text-rose-300">
              {p.geological_susceptibility}
            </span>
          </div>
          <p class="text-xs text-slate-300 mb-3">
            Formation: <strong class="text-slate-50">{p.land_use}</strong>
          </p>
          <div class="text-xs text-slate-400 space-y-1.5 font-mono">
            <div class="flex justify-between">
              <span>Highway Toe Proximity:</span>
              <span class="text-cyan-400 font-bold">{p.road_distance} meters</span>
            </div>
            <div class="flex justify-between">
              <span>Excavation Disturbance:</span>
              <span class="text-amber-400">{p.road_distance < 30 ? 'Severe Toe Cut' : 'Moderate'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Vegetation Cover (NDVI) & Temperature */}
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trees class="w-4 h-4 text-emerald-400" />
              Vegetation Index & Weather
            </span>
            <span class="text-xs font-mono font-bold text-emerald-400">
              NDVI {p.ndvi.toFixed(2)}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs mb-2">
            <div class="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span class="text-xs text-slate-400 block">Ambient Temp</span>
              <span class="font-bold text-slate-200 font-mono">{p.temperature}°C</span>
            </div>
            <div class="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span class="text-xs text-slate-400 block">Root Anchorage</span>
              <span class="font-bold text-emerald-300">{p.ndvi > 0.6 ? 'Dense' : 'Sparse/Disturbed'}</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Sparse canopy (<span class="font-mono">&lt;0.4</span>) amplifies surface runoff velocity and gullies down hillslopes.
          </p>
        </div>

        {/* Card 3: Historical Landslide Frequency */}
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History class="w-4 h-4 text-indigo-400" />
              Historical Landslide Frequency
            </span>
            <span class="text-xs font-mono font-bold text-indigo-300">
              {p.historical_landslide_frequency} events (10 yrs)
            </span>
          </div>
          <p class="text-xs text-slate-300 mb-2">
            Estimated Population in Threat Cone: <strong class="text-slate-50">{selectedLocation.population_exposure.toLocaleString()} persons</strong>
          </p>
          <div class="p-2 rounded bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
            <span class="text-slate-400 block text-xs">Lifeline Infrastructure:</span>
            <span class="text-slate-200 font-semibold">{selectedLocation.critical_infrastructure?.join(', ') || 'Corridor roads'}</span>
          </div>
        </div>
      </div>

      {/* Live Polling Visualizer & Scientific Disclaimer */}
      <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2.5">
          <span class="relative flex h-3 w-3">
            <span class=" absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span class="text-slate-300 font-mono">
            Simulated Sensor Stream: <strong class="text-emerald-400">{isSimulating ? 'Streaming Telemetry' : 'Static Snapshot'}</strong>
          </span>
        </div>
        <p class="text-xs text-slate-400 max-w-xl text-left sm:text-right">
          *Operational Notice: Prototype early warning telemetry. All parameter values are simulated representations for regional disaster management demonstration.
        </p>
      </div>
    </div>
  );
};
