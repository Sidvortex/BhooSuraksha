/**
 * ML Prediction Workbench & Model Performance Evaluation Modal
 * Allows testing scenarios, running ML predictions, evaluating custom parameter vectors,
 * and reviewing model performance metrics.
 */

import React, { useState, useEffect } from 'react';
import { 
  MonitoredLocation, 
  MLPredictionRequest, 
  MLPredictionResponse, 
  IndiaPredictionResponse,
  GeologicalSusceptibility,
  ModelInfo
} from '../types/landslide';
import { runLandslidePrediction, runIndiaPrediction, runRegionPrediction, getAvailableModels } from '../services/predictionService';
import { DEMO_MODEL_PERFORMANCE } from '../data/mockData';
import { 
  X, 
  Cpu, 
  Sliders, 
  Activity, 
  ShieldAlert, 
  BarChart, 
  FileCode, 
  Play, 
  AlertTriangle,
  Globe2
} from 'lucide-react';

interface PredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: MonitoredLocation[];
  onApplyPredictionResult: (
    updatedLocation: Partial<MonitoredLocation> & { id: string },
    result: MLPredictionResponse
  ) => void;
}

export const PredictionModal: React.FC<PredictionModalProps> = ({
  isOpen,
  onClose,
  locations,
  onApplyPredictionResult
}) => {
  if (!isOpen) return null;

  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');
  const [activeModel, setActiveModel] = useState<'ner' | 'india' | 'region'>('ner');
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'metrics' | 'api_guide'>('simulator');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    getAvailableModels().then(setAvailableModels);
  }, []);
  
  // Custom or Station Environmental Parameters state
  const targetLocation = locations.find(l => l.id === selectedLocationId) || locations[0];
  const [rainfall24h, setRainfall24h] = useState<number>(targetLocation?.parameters.rainfall_24h || 140);
  const [rainfall1h, setRainfall1h] = useState<number>(targetLocation?.parameters.rainfall_1h || 25);
  const [soilMoisture, setSoilMoisture] = useState<number>(targetLocation?.parameters.soil_moisture || 82);
  const [slopeAngle, setSlopeAngle] = useState<number>(targetLocation?.parameters.slope || 42);
  const [geoSusceptibility, setGeoSusceptibility] = useState<GeologicalSusceptibility>(
    targetLocation?.parameters.geological_susceptibility || 'High'
  );
  const [roadDist, setRoadDist] = useState<number>(targetLocation?.parameters.road_distance || 20);

  const [isRunning, setIsRunning] = useState(false);
  const [predictionResult, setPredictionResult] = useState<MLPredictionResponse | null>(null);

  // India-wide model state (separate from the NER simulator above — it takes
  // a raw latitude/longitude/date rather than a monitored station)
  const [indiaLat, setIndiaLat] = useState<number>(targetLocation?.latitude || 30.1);
  const [indiaLon, setIndiaLon] = useState<number>(targetLocation?.longitude || 79.2);
  const [indiaDate, setIndiaDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isRunningIndia, setIsRunningIndia] = useState(false);
  const [indiaResult, setIndiaResult] = useState<IndiaPredictionResponse | null>(null);
  const [indiaError, setIndiaError] = useState<string | null>(null);

  const handleExecuteIndiaPrediction = async () => {
    setIsRunningIndia(true);
    setIndiaError(null);
    try {
      const runner = activeModel === 'region' ? runRegionPrediction : runIndiaPrediction;
      const result = await runner({ latitude: indiaLat, longitude: indiaLon, date: indiaDate });
      setIndiaResult(result);
    } catch (err) {
      setIndiaError(err instanceof Error ? err.message : 'Model request failed');
    } finally {
      setIsRunningIndia(false);
    }
  };

  // Sync sliders when dropdown changes
  const handleLocationChange = (id: string) => {
    setSelectedLocationId(id);
    const loc = locations.find(l => l.id === id);
    if (loc) {
      setRainfall24h(loc.parameters.rainfall_24h);
      setRainfall1h(loc.parameters.rainfall_1h);
      setSoilMoisture(loc.parameters.soil_moisture);
      setSlopeAngle(loc.parameters.slope);
      setGeoSusceptibility(loc.parameters.geological_susceptibility);
      setRoadDist(loc.parameters.road_distance);
      setPredictionResult(null);
    }
  };

  const handleExecutePrediction = async () => {
    setIsRunning(true);
    const request: MLPredictionRequest = {
      latitude: targetLocation.latitude,
      longitude: targetLocation.longitude,
      rainfall_1h: rainfall1h,
      rainfall_24h: rainfall24h,
      rainfall_7d: targetLocation.parameters.rainfall_7d || rainfall24h * 2.5,
      soil_moisture: soilMoisture,
      slope: slopeAngle,
      elevation: targetLocation.parameters.elevation,
      temperature: targetLocation.parameters.temperature,
      ndvi: targetLocation.parameters.ndvi,
      geological_susceptibility: geoSusceptibility,
      land_use: targetLocation.parameters.land_use,
      road_distance: roadDist,
      historical_landslide_frequency: targetLocation.parameters.historical_landslide_frequency
    };

    const result = await runLandslidePrediction(request);
    setPredictionResult(result);
    setIsRunning(false);

    // Update location and trigger automated geofence if >= 70%
    const willGeofence = result.probability >= 0.70;
    onApplyPredictionResult(
      {
        id: targetLocation.id,
        risk_probability: result.probability,
        risk_level: result.risk_level,
        confidence: result.confidence,
        has_active_geofence: willGeofence,
        geofence_radius_km: result.probability >= 0.85 ? 4.5 : willGeofence ? 3.5 : 1.5,
        parameters: {
          ...targetLocation.parameters,
          rainfall_1h: rainfall1h,
          rainfall_24h: rainfall24h,
          soil_moisture: soilMoisture,
          slope: slopeAngle,
          geological_susceptibility: geoSusceptibility,
          road_distance: roadDist
        }
      },
      result
    );
  };

  // Presets for quick demonstration
  const applyExtremeMonsoonPreset = () => {
    setRainfall24h(220);
    setRainfall1h(45);
    setSoilMoisture(94);
    setSlopeAngle(46);
    setGeoSusceptibility('Severe');
    setRoadDist(10);
  };

  const applyModeratePreset = () => {
    setRainfall24h(45);
    setRainfall1h(6);
    setSoilMoisture(52);
    setSlopeAngle(25);
    setGeoSusceptibility('Moderate');
    setRoadDist(80);
  };

  return (
    <div class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div 
        id="ml-prediction-modal"
        class="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div class="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-blue-700/20 border border-blue-600 text-blue-400">
              <Cpu class="w-6 h-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-bold text-white">
                  Machine Learning Prediction & Parameter Simulator
                </h3>
                <span class="px-2 py-0.5 rounded text-xs font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  DEMO / PROTOTYPE
                </span>
              </div>
              <p class="text-xs text-slate-400">
                Modular AI/ML interface • Auto-triggers circular geofences on probability &ge; 70%
              </p>
            </div>
          </div>
          <button
            id="btn-close-prediction-modal"
            onClick={onClose}
            class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div class="flex border-b border-slate-800 bg-slate-950/50 px-5 text-xs font-semibold gap-4">
          <button
            onClick={() => setActiveSubTab('simulator')}
            class={`py-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'simulator'
                ? 'border-blue-600 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders class="w-4 h-4" />
            <span>Interactive Parameter Simulator</span>
          </button>
          <button
            onClick={() => setActiveSubTab('metrics')}
            class={`py-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'metrics'
                ? 'border-blue-600 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart class="w-4 h-4" />
            <span>Model Performance (Validation Cohort)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('api_guide')}
            class={`py-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'api_guide'
                ? 'border-blue-600 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode class="w-4 h-4" />
            <span>Production API Architecture Guide</span>
          </button>
        </div>

        {/* Content Area */}
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSubTab === 'simulator' && (
            <div class="space-y-5">
              {/* Model Selector */}
              <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <label class="text-xs font-semibold text-slate-300 block mb-1">
                  Prediction Model
                </label>
                <select
                  id="predict-model-select"
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value as 'ner' | 'india' | 'region')}
                  class="w-full sm:w-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 outline-none font-medium cursor-pointer"
                >
                  <option value="ner">NER Station Model (rainfall + slope)</option>
                  <option value="india">India-Wide Model (season + region, real NASA GLC data)</option>
                  <option value="region">Regional Model (India + Nepal + Bhutan + Myanmar + Bangladesh + Tibet)</option>
                </select>
                <span class="text-xs text-slate-400 block mt-1">
                  {activeModel === 'ner'
                    ? 'Trained on rainfall/slope time series for the 17 monitored NER points.'
                    : activeModel === 'india'
                      ? 'Trained on 1,265 real recorded landslide events across India (NASA Global Landslide Catalog, 2007-2016).'
                      : 'Trained on 1,886 real recorded events across India and its hilly/Himalayan-border neighbors (same catalog, wider region).'}
                </span>
              </div>

              {activeModel === 'ner' && (
              <>
              {/* Target Location Selector */}
              <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <label class="text-xs font-semibold text-slate-300 block mb-1">
                  Select Target Monitoring Location
                </label>
                <select
                  id="predict-target-location"
                  value={selectedLocationId}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  class="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 outline-none font-medium cursor-pointer"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.state} – {loc.name} ({loc.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Preset Buttons */}
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Test Scenario Presets
                </span>
                <div class="flex gap-2 text-xs">
                  <button
                    onClick={applyExtremeMonsoonPreset}
                    class="px-2.5 py-1 rounded bg-red-950/80 border border-red-700 text-red-300 hover:bg-red-900 transition font-mono cursor-pointer"
                  >
                    Simulate Extreme Cloudburst (Critical &ge;85%)
                  </button>
                  <button
                    onClick={applyModeratePreset}
                    class="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 hover:bg-emerald-900 transition font-mono cursor-pointer"
                  >
                    Simulate Fair Weather (Low/Mod &lt;50%)
                  </button>
                </div>
              </div>

              {/* Sliders Grid */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {/* Rainfall 24h */}
                <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div class="flex justify-between mb-1.5">
                    <span class="text-slate-300 font-sans font-semibold">Cumulative 24-Hour Rainfall</span>
                    <span class="text-cyan-400 font-bold">{rainfall24h} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    value={rainfall24h}
                    onChange={(e) => setRainfall24h(parseInt(e.target.value))}
                    class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div class="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0 mm</span>
                    <span>120 mm (High)</span>
                    <span>300 mm (Extreme)</span>
                  </div>
                </div>

                {/* Soil Moisture */}
                <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div class="flex justify-between mb-1.5">
                    <span class="text-slate-300 font-sans font-semibold">Soil Moisture Saturation</span>
                    <span class="text-emerald-400 font-bold">{soilMoisture}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={soilMoisture}
                    onChange={(e) => setSoilMoisture(parseInt(e.target.value))}
                    class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div class="flex justify-between text-xs text-slate-400 mt-1">
                    <span>10% (Dry)</span>
                    <span>75% (Field Cap)</span>
                    <span>100% (Liquefaction)</span>
                  </div>
                </div>

                {/* Slope Angle */}
                <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div class="flex justify-between mb-1.5">
                    <span class="text-slate-300 font-sans font-semibold">Slope Inclination Angle</span>
                    <span class="text-amber-400 font-bold">{slopeAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="65"
                    step="1"
                    value={slopeAngle}
                    onChange={(e) => setSlopeAngle(parseInt(e.target.value))}
                    class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div class="flex justify-between text-xs text-slate-400 mt-1">
                    <span>5° (Gentle)</span>
                    <span>35° (Threshold)</span>
                    <span>65° (Escarpment)</span>
                  </div>
                </div>

                {/* Road Cut Proximity */}
                <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div class="flex justify-between mb-1.5">
                    <span class="text-slate-300 font-sans font-semibold">Highway Toe-Cut Distance</span>
                    <span class="text-blue-400 font-bold">{roadDist} meters</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={roadDist}
                    onChange={(e) => setRoadDist(parseInt(e.target.value))}
                    class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div class="flex justify-between text-xs text-slate-400 mt-1">
                    <span>5m (Direct Undercut)</span>
                    <span>50m</span>
                    <span>200m (Distal)</span>
                  </div>
                </div>
              </div>

              {/* Geological Susceptibility Dropdown */}
              <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <span class="text-xs font-semibold text-slate-200 block">Bedrock Lithology Vulnerability</span>
                  <span class="text-xs text-slate-400">Weathered shale, schist, phyllite, sandstone</span>
                </div>
                <select
                  value={geoSusceptibility}
                  onChange={(e) => setGeoSusceptibility(e.target.value as GeologicalSusceptibility)}
                  class="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 outline-none font-medium cursor-pointer"
                >
                  <option value="Low">Low (Massive Granite)</option>
                  <option value="Moderate">Moderate (Hard Sandstone)</option>
                  <option value="High">High (Weathered Siltstone)</option>
                  <option value="Severe">Severe (Friable Disupur Shale)</option>
                </select>
              </div>

              {/* Action Trigger Button */}
              <button
                id="btn-execute-model-inference"
                onClick={handleExecutePrediction}
                disabled={isRunning}
                class="w-full py-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Cpu class="w-4 h-4 animate-spin" />
                    <span>Executing ML Prediction Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play class="w-4 h-4 fill-current" />
                    <span>Execute Prediction & Update GIS Risk Perimeters</span>
                  </>
                )}
              </button>

              {/* Real-Time Prediction Output Display */}
              {predictionResult && (
                <div class="p-4 rounded-xl bg-slate-950 border border-slate-700 shadow-xl animate-fadeIn space-y-3">
                  <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <span class="text-xs uppercase font-bold text-slate-400">Model Output Result</span>
                      <div class="flex items-baseline gap-2">
                        <span class="text-2xl font-bold font-mono text-white">
                          {Math.round(predictionResult.probability * 100)}%
                        </span>
                        <span class={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          predictionResult.probability >= 0.85 
                            ? 'bg-red-950 text-red-300 border border-red-700' 
                            : predictionResult.probability >= 0.70 
                              ? 'bg-orange-950 text-orange-300 border border-orange-700' 
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        }`}>
                          {predictionResult.risk_level.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div class="text-right">
                      <span class="text-xs text-slate-400 block">Confidence: <strong class="text-white">{Math.round(predictionResult.confidence * 100)}%</strong></span>
                      <span class="text-xs text-slate-400 font-mono">{predictionResult.timestamp}</span>
                    </div>
                  </div>

                  <p class="text-xs text-slate-300 leading-relaxed">
                    {predictionResult.explanation}
                  </p>

                  {predictionResult.probability >= 0.70 && (
                    <div class="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                      <ShieldAlert class="w-4 h-4 text-red-400 animate-pulse" />
                      <span>
                        <strong>Geofence Triggered:</strong> A circular risk zone has been projected onto the GIS map and an early warning alert was dispatched.
                      </span>
                    </div>
                  )}
                </div>
              )}
              </>
              )}

              {(activeModel === 'india' || activeModel === 'region') && (
                <div class="space-y-5">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs font-mono">
                    <div>
                      <label class="text-slate-300 font-sans font-semibold block mb-1">Latitude</label>
                      <input
                        type="number"
                        step="0.01"
                        value={indiaLat}
                        onChange={(e) => setIndiaLat(parseFloat(e.target.value))}
                        class="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none"
                      />
                    </div>
                    <div>
                      <label class="text-slate-300 font-sans font-semibold block mb-1">Longitude</label>
                      <input
                        type="number"
                        step="0.01"
                        value={indiaLon}
                        onChange={(e) => setIndiaLon(parseFloat(e.target.value))}
                        class="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none"
                      />
                    </div>
                    <div>
                      <label class="text-slate-300 font-sans font-semibold block mb-1">Date</label>
                      <input
                        type="date"
                        value={indiaDate}
                        onChange={(e) => setIndiaDate(e.target.value)}
                        class="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-execute-india-prediction"
                    onClick={handleExecuteIndiaPrediction}
                    disabled={isRunningIndia}
                    class="w-full py-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isRunningIndia ? (
                      <>
                        <Cpu class="w-4 h-4 animate-spin" />
                        <span>Querying {activeModel === 'region' ? 'Regional' : 'India-Wide'} Model...</span>
                      </>
                    ) : (
                      <>
                        <Globe2 class="w-4 h-4" />
                        <span>Run {activeModel === 'region' ? 'Regional' : 'India-Wide'} Prediction</span>
                      </>
                    )}
                  </button>

                  {indiaError && (
                    <div class="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300">
                      {indiaError}
                    </div>
                  )}

                  {indiaResult && (
                    <div class="p-4 rounded-xl bg-slate-950 border border-slate-700 space-y-3">
                      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div>
                          <span class="text-xs uppercase font-bold text-slate-400">Model Output Result</span>
                          <div class="flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-white">
                              {Math.round(indiaResult.probability * 100)}%
                            </span>
                            <span class={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                              indiaResult.probability >= 0.85
                                ? 'bg-red-950 text-red-300 border border-red-700'
                                : indiaResult.probability >= 0.70
                                  ? 'bg-orange-950 text-orange-300 border border-orange-700'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            }`}>
                              {indiaResult.risk_level.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div class="text-right">
                          <span class="text-xs text-slate-400 block">Confidence: <strong class="text-white">{Math.round(indiaResult.confidence * 100)}%</strong></span>
                          <span class="text-xs text-slate-400 font-mono">{indiaResult.state}, month {indiaResult.month}</span>
                        </div>
                      </div>

                      <p class="text-xs text-slate-300 leading-relaxed">{indiaResult.explanation}</p>

                      <div class="space-y-1.5">
                        {indiaResult.factor_weights.map((fw) => (
                          <div key={fw.factor} class="flex items-center justify-between text-xs bg-slate-900/60 rounded-lg px-2.5 py-1.5">
                            <span class="text-slate-300">{fw.factor}</span>
                            <span class="text-slate-400">{fw.importance}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'metrics' && (
            <div class="space-y-5">
              <div class="p-4 rounded-xl bg-amber-950/30 border border-amber-800/80 text-xs text-amber-200 flex items-start gap-3">
                <AlertTriangle class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong class="block text-amber-300 mb-0.5">Prototype Disclaimer</strong>
                  {availableModels.length > 0
                    ? 'These are real hold-out metrics computed by the backend from the trained models — not placeholders. Neither model has been independently validated for operational disaster response.'
                    : 'No backend is configured, so these are demo placeholder figures. Set a backend URL in Settings to see real metrics from the trained models.'}
                </div>
              </div>

              {availableModels.length > 0 ? (
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableModels.map((m) => (
                    <div key={m.id} class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                      <div>
                        <span class="text-sm font-bold text-white block">{m.name}</span>
                        <span class="text-xs text-slate-400">{m.description}</span>
                      </div>
                      <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                        {Object.entries(m.metrics)
                          .filter(([k]) => !['modelArchitecture', 'dataSource', 'lastTrained'].includes(k))
                          .map(([k, v]) => (
                            <div key={k} class="bg-slate-900/60 rounded-lg px-2 py-1.5">
                              <span class="text-slate-400 block text-xs uppercase">{k}</span>
                              <span class="text-slate-100 font-bold">
                                {typeof v === 'number' && v <= 1 ? `${(v * 100).toFixed(1)}%` : String(v)}
                              </span>
                            </div>
                          ))}
                      </div>
                      <div class="text-xs text-slate-500 font-mono pt-1 border-t border-slate-800">
                        {String(m.metrics['modelArchitecture'] ?? '')}
                      </div>
                      <div class="text-xs text-slate-500">{m.dataSource}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span class="text-xs uppercase text-slate-400 font-bold block mb-1">Model Accuracy</span>
                      <span class="text-2xl font-bold font-mono text-emerald-400">
                        {(DEMO_MODEL_PERFORMANCE.accuracy * 100).toFixed(1)}%
                      </span>
                      <span class="text-xs text-slate-400 block mt-1">Overall classification</span>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span class="text-xs uppercase text-slate-400 font-bold block mb-1">Precision</span>
                      <span class="text-2xl font-bold font-mono text-cyan-400">
                        {(DEMO_MODEL_PERFORMANCE.precision * 100).toFixed(1)}%
                      </span>
                      <span class="text-xs text-slate-400 block mt-1">True landslide events</span>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span class="text-xs uppercase text-slate-400 font-bold block mb-1">Recall (Sensitivity)</span>
                      <span class="text-2xl font-bold font-mono text-indigo-400">
                        {(DEMO_MODEL_PERFORMANCE.recall * 100).toFixed(1)}%
                      </span>
                      <span class="text-xs text-slate-400 block mt-1">Captures 89.7% of slides</span>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span class="text-xs uppercase text-slate-400 font-bold block mb-1">F1 Score</span>
                      <span class="text-2xl font-bold font-mono text-amber-400">
                        {DEMO_MODEL_PERFORMANCE.f1Score.toFixed(3)}
                      </span>
                      <span class="text-xs text-slate-400 block mt-1">Harmonic precision/recall</span>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span class="text-xs uppercase text-slate-400 font-bold block mb-1">ROC-AUC</span>
                      <span class="text-2xl font-bold font-mono text-purple-400">
                        {DEMO_MODEL_PERFORMANCE.rocAuc.toFixed(3)}
                      </span>
                      <span class="text-xs text-slate-400 block mt-1">Discriminative threshold</span>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span class="text-xs uppercase text-slate-400 font-bold block mb-1">False Alarm Rate</span>
                      <span class="text-2xl font-bold font-mono text-blue-400">
                        {(DEMO_MODEL_PERFORMANCE.falseAlarmRate * 100).toFixed(1)}%
                      </span>
                      <span class="text-xs text-slate-400 block mt-1">Target is &lt;10%</span>
                    </div>
                  </div>

                  <div class="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400 font-mono">
                    <div>Architecture: <strong class="text-slate-200">{DEMO_MODEL_PERFORMANCE.modelArchitecture}</strong></div>
                    <div>Evaluation Cohort Size: <strong class="text-slate-200">{DEMO_MODEL_PERFORMANCE.testDatasetSize} historical slope points</strong></div>
                    <div>Last Checkpoint: <strong class="text-slate-200">{DEMO_MODEL_PERFORMANCE.lastTrained}</strong></div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSubTab === 'api_guide' && (
            <div class="space-y-4 text-xs">
              <p class="text-slate-300 leading-relaxed">
                This isn't a hypothetical integration guide — the backend already exists and is running two real trained models. Here's what actually calls what.
              </p>

              <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                <span class="text-slate-400">// backend/app.py — real endpoints, not a mockup</span><br/>
                <span class="text-indigo-400">POST</span> /api/predict &nbsp;&nbsp;<span class="text-slate-400">→ backend/model.py (RandomForest, rainfall + slope)</span><br/>
                <span class="text-indigo-400">POST</span> /api/predict/india &nbsp;&nbsp;<span class="text-slate-400">→ backend/india_model.py (RandomForest, NASA GLC data)</span><br/>
                <span class="text-indigo-400">GET</span> &nbsp;/api/zones &nbsp;&nbsp;<span class="text-slate-400">→ backend/zones.py (17 real NER points, live-scored)</span><br/>
                <span class="text-indigo-400">GET</span> &nbsp;/api/alerts<br/>
                <span class="text-indigo-400">GET</span> &nbsp;/api/analytics<br/>
                <span class="text-indigo-400">GET</span> &nbsp;/api/models &nbsp;&nbsp;<span class="text-slate-400">→ real metrics for both models, shown above</span>
              </div>

              <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 space-y-1">
                <span class="text-slate-200 font-bold block">What's real vs. what's still a placeholder:</span>
                <div>✓ <strong class="text-emerald-400">Trained models:</strong> both are real scikit-learn RandomForests, trained on real data (see SETUP.md and README_INDIA_MODEL.md)</div>
                <div>✓ <strong class="text-emerald-400">Zones/alerts/analytics:</strong> computed live from real NER rainfall/slope data, not hardcoded</div>
                <div>✗ <strong class="text-amber-400">Live rainfall feed:</strong> still manual entry — no IMD/AWS or satellite rainfall ingestion yet</div>
                <div>✗ <strong class="text-amber-400">Live soil moisture/NDVI:</strong> not connected to Sentinel-1/2 or any satellite source</div>
                <div>✗ <strong class="text-amber-400">Database:</strong> the backend reads flat CSV/pickle files, not PostgreSQL/PostGIS</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div class="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span class="text-xs text-slate-400 font-mono">
            Rule: Probability &ge; 70% automatically constructs circular geofence
          </span>
          <button
            onClick={onClose}
            class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close Workbench
          </button>
        </div>
      </div>
    </div>
  );
};
