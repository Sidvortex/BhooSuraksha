/**
 * Detailed Information Panel for Selected Landslide Risk Zone
 * Displays comprehensive geospatial telemetry, geotechnical parameters, AI explanation, and emergency protocols
 */

import React from 'react';
import { MonitoredLocation } from '../types/landslide';
import { 
  X, 
  MapPin, 
  Activity, 
  Droplets, 
  Mountain, 
  Compass, 
  Trees, 
  Layers, 
  Users, 
  Route, 
  Clock, 
  AlertOctagon, 
  ShieldAlert, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';

interface ZoneDetailPanelProps {
  location: MonitoredLocation | null;
  onClose: () => void;
  onRunImmediatePrediction: (location: MonitoredLocation) => void;
  onOpenAssistantForLocation: (location: MonitoredLocation) => void;
}

export const ZoneDetailPanel: React.FC<ZoneDetailPanelProps> = ({
  location,
  onClose,
  onRunImmediatePrediction,
  onOpenAssistantForLocation
}) => {
  if (!location) {
    return (
      <div class="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
        <MapPin class="w-10 h-10 mb-3 text-slate-600 opacity-60" />
        <h4 class="text-sm font-semibold text-slate-300 mb-1">No Risk Zone Selected</h4>
        <p class="text-xs text-slate-400 max-w-xs leading-relaxed">
          Click any circular risk marker or active geofence on the GIS map to inspect live environmental telemetry and AI factor attribution.
        </p>
      </div>
    );
  }

  const prob = location.risk_probability;
  const isCritical = prob >= 0.85;
  const isVeryHigh = prob >= 0.70;
  const isHigh = prob >= 0.50;

  const riskBadgeColor = isCritical 
    ? 'bg-red-950 text-red-300 border-red-800' 
    : isVeryHigh 
      ? 'bg-rose-950 text-rose-300 border-rose-800' 
      : isHigh 
        ? 'bg-orange-950 text-orange-300 border-orange-800' 
        : prob >= 0.30 
          ? 'bg-yellow-950 text-yellow-300 border-yellow-800' 
          : 'bg-emerald-950 text-emerald-300 border-emerald-800';

  return (
    <div id="zone-detail-panel" class="h-full flex flex-col bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div class="p-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              {location.state}
            </span>
            <span class="text-slate-600">•</span>
            <span class="text-xs text-slate-400 font-mono">ID: {location.id}</span>
          </div>
          <h3 class="text-base font-bold text-white leading-snug">{location.name}</h3>
          <p class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <MapPin class="w-3.5 h-3.5 text-rose-400" />
            <span>{location.district} District</span>
            <span class="font-mono text-slate-400">({location.latitude.toFixed(3)}°N, {location.longitude.toFixed(3)}°E)</span>
          </p>
        </div>
        <button
          id="btn-close-zone-panel"
          onClick={onClose}
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Close details"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Risk Probability Hero Card */}
        <div class={`p-3.5 rounded-xl border ${riskBadgeColor} bg-opacity-40 relative overflow-hidden shadow-lg`}>
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-0.5">
                Predicted Landslide Probability
              </span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-bold font-mono tracking-tight text-white">
                  {Math.round(prob * 100)}%
                </span>
                <span class="text-xs font-bold px-2 py-0.5 rounded border border-current">
                  {location.risk_level.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-400 block">Model Confidence</span>
              <span class="text-xs font-mono font-bold text-slate-200">
                {Math.round(location.confidence * 100)}%
              </span>
              <span class="text-xs text-slate-400 block mt-1">Updated {location.last_updated}</span>
            </div>
          </div>

          {/* Automated Geofence Tag */}
          {(isVeryHigh || isCritical) && (
            <div class="mt-3 pt-2.5 border-t border-red-800/60 flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5 text-red-300 font-semibold">
                <ShieldAlert class="w-4 h-4 text-red-400 animate-pulse" />
                <span>Automated Geofence Activated:</span>
              </div>
              <span class="px-2 py-0.5 bg-red-900/60 border border-red-700/80 rounded font-mono font-bold text-red-200 text-xs">
                {location.geofence_radius_km.toFixed(1)} km Radius Danger Zone
              </span>
            </div>
          )}
        </div>

        {/* Section 8: AI Explanation of Contributing Factors */}
        <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
              AI Factor Attribution Breakdown
            </span>
            <span class="text-xs text-slate-400 font-mono">Prototype LSZ Weights</span>
          </div>

          <p class="text-xs text-slate-300 mb-3 leading-relaxed">
            {isCritical
              ? 'The model estimates elevated landslide susceptibility because intense hydro-meteorological rainfall is converging simultaneously with severe slope gradient and critical ground saturation.'
              : isVeryHigh
                ? 'Elevated shear stress detected along the slope plane due to significant antecedent 24-hour precipitation reducing basal friction resistance.'
                : 'Current environmental values maintain acceptable factors of safety, though persistent rainfall would elevate pore pressures.'}
          </p>

          <div class="space-y-2 text-xs font-mono">
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300">Heavy 24h Rainfall ({location.parameters.rainfall_24h} mm)</span>
                <span class={location.parameters.rainfall_24h > 120 ? 'text-red-400 font-bold' : 'text-amber-400'}>
                  {location.parameters.rainfall_24h > 120 ? 'HIGH CONTRIBUTION' : 'MODERATE'}
                </span>
              </div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-red-500 rounded-full" 
                  style={{ width: `${Math.min(100, (location.parameters.rainfall_24h / 200) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300">Soil Moisture & Saturation ({location.parameters.soil_moisture}%)</span>
                <span class={location.parameters.soil_moisture > 80 ? 'text-red-400 font-bold' : 'text-yellow-400'}>
                  {location.parameters.soil_moisture > 80 ? 'HIGH CONTRIBUTION' : 'MODERATE'}
                </span>
              </div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-orange-500 rounded-full" 
                  style={{ width: `${location.parameters.soil_moisture}%` }}
                />
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300">Slope Gradient ({location.parameters.slope.toFixed(1)}°)</span>
                <span class={location.parameters.slope > 40 ? 'text-red-400 font-bold' : 'text-yellow-400'}>
                  {location.parameters.slope > 40 ? 'HIGH CONTRIBUTION' : 'MODERATE'}
                </span>
              </div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${Math.min(100, (location.parameters.slope / 60) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300">Lithology ({location.parameters.geological_susceptibility})</span>
                <span class="text-rose-400">
                  {location.parameters.geological_susceptibility === 'Severe' ? 'VERY HIGH' : 'HIGH'}
                </span>
              </div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-rose-600 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-2.5 italic">
            *Feature contributions demonstrated for dashboard interface; real model connects via modular /api/predict.
          </p>
        </div>

        {/* Section 4: Live Environmental Parameters Grid */}
        <div>
          <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity class="w-3.5 h-3.5 text-cyan-400" />
            Environmental & Geospatial Telemetry
          </h4>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span class="text-xs text-slate-400 block mb-0.5">Precipitation (1h / 24h / 7d)</span>
              <div class="font-bold text-cyan-400 font-mono text-sm">
                {location.parameters.rainfall_1h.toFixed(1)} / {location.parameters.rainfall_24h.toFixed(1)} / {location.parameters.rainfall_7d.toFixed(1)} <span class="text-xs text-slate-400 font-normal">mm</span>
              </div>
              <span class="text-xs text-rose-400">↑ Heavy monsoon accumulation</span>
            </div>

            <div class="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span class="text-xs text-slate-400 block mb-0.5">Soil Moisture & Saturation</span>
              <div class="font-bold text-emerald-400 font-mono text-sm">
                {location.parameters.soil_moisture}% <span class="text-xs text-slate-400 font-normal">({location.parameters.ground_saturation || 85}% sat)</span>
              </div>
              <span class="text-xs text-amber-400">Pore Pressure: {location.parameters.pore_water_pressure || 32} kPa</span>
            </div>

            <div class="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span class="text-xs text-slate-400 block mb-0.5">Slope & Elevation</span>
              <div class="font-bold text-amber-400 font-mono text-sm">
                {location.parameters.slope.toFixed(1)}° <span class="text-xs text-slate-400 font-normal">at {location.parameters.elevation.toFixed(0)}m ASL</span>
              </div>
              <span class="text-xs text-slate-400">Steep mountain incline</span>
            </div>

            <div class="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span class="text-xs text-slate-400 block mb-0.5">NDVI & Temperature</span>
              <div class="font-bold text-indigo-400 font-mono text-sm">
                {location.parameters.ndvi.toFixed(2)} <span class="text-xs text-slate-400 font-normal">({location.parameters.temperature}°C)</span>
              </div>
              <span class="text-xs text-slate-400">Vegetation cover index</span>
            </div>

            <div class="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 col-span-2">
              <span class="text-xs text-slate-400 block mb-0.5">Lithology & Land Use Classification</span>
              <div class="font-semibold text-slate-200 text-xs">
                {location.parameters.land_use}
              </div>
              <div class="flex items-center justify-between text-xs text-slate-400 mt-1 font-mono">
                <span>Susceptibility: <strong class="text-rose-400">{location.parameters.geological_susceptibility}</strong></span>
                <span>Highway Toe Distance: <strong class="text-cyan-400">{location.parameters.road_distance}m</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 11: Emergency Response Recommendations */}
        <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <ShieldAlert class="w-3.5 h-3.5 text-amber-400" />
            Recommended Preventive Action
          </h4>
          <p class="text-xs text-slate-300 leading-relaxed">
            {isCritical
              ? 'IMMEDIATE ACTION: Deploy technical field inspection immediately. Advise district administration on precautionary evacuation of downstream settlements and halt heavy freight transit.'
              : isVeryHigh
                ? 'HIGH ALERT: Intensify CCTV and drone slope surveillance. Pre-position emergency debris-clearing equipment and notify District Disaster Management Authority (DDMA).'
                : 'ROUTINE MONITORING: Maintain automated rainfall sensor polling and check drainage conduits for sediment siltation.'}
          </p>
          <div class="mt-2 text-xs text-slate-400 border-t border-slate-800/80 pt-1.5">
            Population at risk: ~{location.population_exposure.toLocaleString()} persons • Historical events: {location.parameters.historical_landslide_frequency} in 10 yrs
          </div>
        </div>

        {/* Action Buttons */}
        <div class="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            id="btn-re-evaluate-zone"
            onClick={() => onRunImmediatePrediction(location)}
            class="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-lg cursor-pointer"
          >
            <TrendingUp class="w-3.5 h-3.5" />
            Re-Evaluate with ML Engine
          </button>
          <button
            id="btn-ask-ai-about-zone"
            onClick={() => onOpenAssistantForLocation(location)}
            class="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
            Ask AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
};
