/**
 * Interactive GIS Risk Map for North Eastern Region (NER)
 * Powered by Leaflet with CartoDB Dark Matter GIS tiles & vector geofences
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MonitoredLocation, NerState, RiskLevel } from '../types/landslide';
import { TerrainMap3D, TerrainMarker, TERRAIN_3D_HINT } from './TerrainMap3D';
import { 
  ShieldAlert, 
  Layers, 
  Compass, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Sliders, 
  MapPin, 
  AlertTriangle,
  Box,
  Map as MapIcon
} from 'lucide-react';

interface GisMapProps {
  locations: MonitoredLocation[];
  selectedLocation: MonitoredLocation | null;
  onSelectLocation: (location: MonitoredLocation) => void;
  selectedStateFilter: string;
  onSelectStateFilter: (state: string) => void;
  selectedRiskFilter: string;
  onSelectRiskFilter: (risk: string) => void;
  globalGeofenceRadiusKm: number;
  onChangeGeofenceRadiusKm: (radius: number) => void;
}

const NER_STATES: NerState[] = [
  'Arunachal Pradesh',
  'Assam',
  'Meghalaya',
  'Manipur',
  'Mizoram',
  'Nagaland',
  'Tripura',
  'Sikkim'
];

export const GisMap: React.FC<GisMapProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  selectedStateFilter,
  onSelectStateFilter,
  selectedRiskFilter,
  onSelectRiskFilter,
  globalGeofenceRadiusKm,
  onChangeGeofenceRadiusKm
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);

  const [showGeofences, setShowGeofences] = useState(true);
  const [mapTileStyle, setMapTileStyle] = useState<'dark' | 'topo'>('dark');
  const [showRadiusControl, setShowRadiusControl] = useState(false);
  const [is3D, setIs3D] = useState(false);

  // Helper color mappings for risk levels
  const getRiskColor = (prob: number) => {
    if (prob >= 0.85) return '#b91c1c'; // Dark Red (CRITICAL)
    if (prob >= 0.70) return '#ef4444'; // Red (VERY HIGH)
    if (prob >= 0.50) return '#f97316'; // Orange (HIGH)
    if (prob >= 0.30) return '#eab308'; // Yellow (MODERATE)
    return '#22c55e'; // Green (LOW)
  };

  const getRiskLabel = (prob: number) => {
    if (prob >= 0.85) return 'CRITICAL';
    if (prob >= 0.70) return 'VERY HIGH';
    if (prob >= 0.50) return 'HIGH';
    if (prob >= 0.30) return 'MODERATE';
    return 'LOW';
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center of North Eastern Region India (roughly 26.2°N, 92.9°E)
    const map = L.map(mapContainerRef.current, {
      center: [26.2, 92.9],
      zoom: 7,
      minZoom: 6,
      maxZoom: 14,
      zoomControl: false
    });

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Default: OpenStreetMap tiles, CSS-inverted for a dark look. Plain
    // OSM tiles are free with no API key required — unlike CARTO's basemaps,
    // which now require a key even for basic raster tiles (previously used
    // here and the reason the map used to show an "API KEY REQUIRED" watermark).
    const darkTiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: 'abc'
      }
    );
    darkTiles.addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const geofenceGroup = L.layerGroup().addTo(map);

    markersLayerRef.current = markersGroup;
    geofenceLayerRef.current = geofenceGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer if toggled
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (mapTileStyle === 'dark') {
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          subdomains: 'abc'
        }
      ).addTo(map);
    } else {
      // OpenTopoMap: free, no API key, and shows real terrain/elevation
      // contours — genuinely useful context for a landslide risk map.
      L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)',
          maxZoom: 17,
          subdomains: 'abc'
        }
      ).addTo(map);
    }
  }, [mapTileStyle]);

  // Filter locations
  const filteredLocations = locations.filter(loc => {
    if (selectedStateFilter !== 'ALL' && loc.state !== selectedStateFilter) return false;
    if (selectedRiskFilter !== 'ALL' && loc.risk_level !== selectedRiskFilter) return false;
    return true;
  });

  // Render Markers and Geofences whenever locations, filter, or radius change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const geofenceGroup = geofenceLayerRef.current;
    if (!map || !markersGroup || !geofenceGroup) return;

    markersGroup.clearLayers();
    geofenceGroup.clearLayers();

    filteredLocations.forEach(loc => {
      const isSelected = selectedLocation?.id === loc.id;
      const riskColor = getRiskColor(loc.risk_probability);
      const riskText = getRiskLabel(loc.risk_probability);
      const isCritical = loc.risk_probability >= 0.85;
      const isVeryHigh = loc.risk_probability >= 0.70;

      // 1. AUTOMATIC GEOFENCING RULE:
      // When probability >= 70%, automatically create translucent geofenced danger zone
      if (showGeofences && (isVeryHigh || isCritical || loc.has_active_geofence)) {
        const radiusMeters = (loc.geofence_radius_km || globalGeofenceRadiusKm) * 1000;
        
        // Circular geofence
        const circle = L.circle([loc.latitude, loc.longitude], {
          radius: radiusMeters,
          color: isCritical ? '#dc2626' : '#ea580c',
          weight: isCritical ? 2.5 : 1.5,
          opacity: isCritical ? 0.95 : 0.8,
          fillColor: isCritical ? '#ef4444' : '#f97316',
          fillOpacity: isCritical ? 0.26 : 0.16,
          dashArray: isCritical ? '6, 6' : undefined,
          interactive: true
        });

        circle.bindTooltip(
          `<div class="text-xs font-mono">
            <div class="font-bold uppercase tracking-wider ${isCritical ? 'text-red-400' : 'text-orange-400'}">
              ${isCritical ? '⚠️ CRITICAL LANDSLIDE GEOFENCE' : '⚠️ HIGH RISK GEOFENCE'}
            </div>
            <div class="text-slate-200 mt-1">${loc.name}</div>
            <div class="text-slate-400">Radius: ${(loc.geofence_radius_km || globalGeofenceRadiusKm).toFixed(1)} km | Prob: ${Math.round(loc.risk_probability * 100)}%</div>
          </div>`,
          { sticky: true, className: 'leaflet-dark-tooltip' }
        );

        circle.on('click', () => {
          onSelectLocation(loc);
        });

        geofenceGroup.addLayer(circle);
      }

      // 2. Custom Marker Icon with pulse ring for high/critical risks
      const size = isSelected ? 42 : isCritical ? 36 : isVeryHigh ? 32 : 26;
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125" style="width:${size}px; height:${size}px;">
          ${(isCritical || isVeryHigh) ? `
            <div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${riskColor}; animation-duration: ${isCritical ? '1.4s' : '2.2s'};"></div>
          ` : ''}
          <div class="relative flex items-center justify-center rounded-full font-bold text-slate-50 shadow-lg transition-all"
               style="width:${size - 6}px; height:${size - 6}px; background-color: ${riskColor}; border: ${isSelected ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.85)'}; box-shadow: 0 0 16px ${riskColor};">
            <span style="font-size: ${isSelected ? '12px' : '10px'}; font-family: 'JetBrains Mono', monospace;">
              ${Math.round(loc.risk_probability * 100)}%
            </span>
          </div>
          ${isSelected ? `
            <div class="absolute -top-7 px-2 py-0.5 bg-slate-900/90 text-amber-400 text-xs font-bold rounded border border-amber-500/50 whitespace-nowrap shadow-md">
              SELECTED
            </div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-landslide-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon });

      // Interactive  Popup
      marker.bindPopup(`
        <div class="text-slate-100 font-sans p-1">
          <div class="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">${loc.state}</span>
            <span class="px-2 py-0.5 text-xs font-bold rounded" style="background-color: ${riskColor}; color: white;">
              ${riskText} (${Math.round(loc.risk_probability * 100)}%)
            </span>
          </div>
          <h4 class="font-bold text-sm text-slate-50">${loc.name}</h4>
          <p class="text-xs text-slate-400 mb-2">${loc.district} District • ${loc.latitude.toFixed(2)}°N, ${loc.longitude.toFixed(2)}°E</p>
          
          <div class="grid grid-cols-2 gap-2 text-xs my-2 bg-slate-900/80 p-2 rounded border border-slate-800">
            <div>
              <span class="text-slate-400 block text-xs">24h Rainfall:</span>
              <span class="font-bold text-cyan-400">${loc.parameters.rainfall_24h} mm</span>
            </div>
            <div>
              <span class="text-slate-400 block text-xs">Soil Moisture:</span>
              <span class="font-bold text-emerald-400">${loc.parameters.soil_moisture}%</span>
            </div>
            <div>
              <span class="text-slate-400 block text-xs">Slope:</span>
              <span class="font-bold text-amber-400">${loc.parameters.slope}°</span>
            </div>
            <div>
              <span class="text-slate-400 block text-xs">Geology:</span>
              <span class="font-bold text-rose-300">${loc.parameters.geological_susceptibility}</span>
            </div>
          </div>

          ${isVeryHigh ? `
            <div class="p-1.5 rounded bg-red-950/80 border border-red-800/80 text-xs text-red-300 mb-2 flex items-center gap-1.5">
              <span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span><strong>Active Geofence:</strong> ${(loc.geofence_radius_km || globalGeofenceRadiusKm).toFixed(1)} km Danger Perimeter</span>
            </div>
          ` : ''}

          <button id="marker-btn-${loc.id}" class="w-full mt-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition cursor-pointer">
            Inspect Full Geological Telemetry →
          </button>
        </div>
      `);

      marker.on('click', () => {
        onSelectLocation(loc);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`marker-btn-${loc.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectLocation(loc);
          };
        }
      });

      markersGroup.addLayer(marker);
    });
  }, [filteredLocations, selectedLocation, showGeofences, globalGeofenceRadiusKm, onSelectLocation]);

  // Leaflet needs an explicit resize nudge after its container goes from
  // display:none back to visible (when toggling out of 3D mode), or it
  // renders with stale/partial tiles.
  useEffect(() => {
    if (!is3D) {
      const t = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
      return () => clearTimeout(t);
    }
  }, [is3D]);

  // Marker list shared with the 3D terrain view
  const terrainMarkers: TerrainMarker[] = filteredLocations.map((loc) => ({
    lon: loc.longitude,
    lat: loc.latitude,
    color: getRiskColor(loc.risk_probability),
    weight: loc.risk_probability,
    popupHtml: `<strong>${loc.name}</strong><br/>${loc.district}, ${loc.state}<br/>Risk: ${loc.risk_level.replace('_', ' ')} (${Math.round(loc.risk_probability * 100)}%)`,
  }));


  // Pan to selected location if it changes
  useEffect(() => {
    if (!selectedLocation || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [selectedLocation.latitude, selectedLocation.longitude],
      10,
      { duration: 1.2 }
    );
  }, [selectedLocation]);

  const resetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([26.2, 92.9], 7, { duration: 1.0 });
  };

  return (
    <div id="gis-map-container" class="relative w-full h-full min-h-[520px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col">
      {/* Map Header Controls Bar */}
      <div class="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 max-w-[calc(100%-80px)]">
        {/* State Filter Pill */}
        <div class="bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg p-1 flex items-center shadow-lg">
          <MapPin class="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
          <select 
            id="map-state-filter"
            aria-label="Filter by state"
            value={selectedStateFilter}
            onChange={(e) => onSelectStateFilter(e.target.value)}
            class="bg-transparent text-xs font-medium text-slate-200 outline-none pr-2 cursor-pointer"
          >
            <option value="ALL" class="bg-slate-900 text-slate-200">All 8 NER States</option>
            {NER_STATES.map(s => (
              <option key={s} value={s} class="bg-slate-900 text-slate-200">{s}</option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter Pill */}
        <div class="bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg p-1 flex items-center shadow-lg">
          <AlertTriangle class="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-1" />
          <select 
            id="map-risk-filter"
            aria-label="Filter by risk level"
            value={selectedRiskFilter}
            onChange={(e) => onSelectRiskFilter(e.target.value)}
            class="bg-transparent text-xs font-medium text-slate-200 outline-none pr-2 cursor-pointer"
          >
            <option value="ALL" class="bg-slate-900 text-slate-200">All Risk Levels</option>
            <option value="CRITICAL" class="bg-slate-900 text-red-400">Critical (85-100%)</option>
            <option value="VERY_HIGH" class="bg-slate-900 text-red-500">Very High (70-85%)</option>
            <option value="HIGH" class="bg-slate-900 text-orange-400">High (50-70%)</option>
            <option value="MODERATE" class="bg-slate-900 text-yellow-400">Moderate (30-50%)</option>
            <option value="LOW" class="bg-slate-900 text-green-400">Low (0-30%)</option>
          </select>
        </div>

        {/* Geofence Toggle Button */}
        <button
          id="btn-toggle-geofence"
          onClick={() => setShowGeofences(!showGeofences)}
          class={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur transition shadow-lg cursor-pointer ${
            showGeofences
              ? 'bg-red-950/80 border-red-700/80 text-red-200'
              : 'bg-slate-900/90 border-slate-700 text-slate-400'
          }`}
          title="Toggle automated >=70% geofence circular danger perimeters"
        >
          {showGeofences ? <Eye class="w-3.5 h-3.5 text-red-400" /> : <EyeOff class="w-3.5 h-3.5" />}
          <span>Geofences ({filteredLocations.filter(l => l.risk_probability >= 0.7).length})</span>
        </button>

        {/* Geofence Radius Slider Button */}
        <button
          id="btn-geofence-radius-slider"
          onClick={() => setShowRadiusControl(!showRadiusControl)}
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-slate-50 backdrop-blur shadow-lg transition cursor-pointer"
          title="Adjust administrative geofence radius"
        >
          <Sliders class="w-3.5 h-3.5 text-cyan-400" />
          <span>Radius: {globalGeofenceRadiusKm.toFixed(1)} km</span>
        </button>

        {/* Reset View Button */}
        <button
          id="btn-reset-map-view"
          onClick={resetView}
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-slate-50 backdrop-blur shadow-lg transition cursor-pointer"
          title="Reset to Full NER View"
        >
          <Compass class="w-3.5 h-3.5 text-indigo-400" />
          <span class="hidden sm:inline">Recenter NER</span>
        </button>
      </div>

      {/* Popout Radius Control Panel */}
      {showRadiusControl && (
        <div class="absolute top-14 left-3 z-[1001] bg-slate-900/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl backdrop-blur w-72">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldAlert class="w-4 h-4 text-red-400" />
              Administrative Geofence Radius
            </span>
            <span class="text-xs font-mono font-bold text-cyan-400">{globalGeofenceRadiusKm} km</span>
          </div>
          <p class="text-xs text-slate-400 mb-2.5 leading-relaxed">
            Sets the default threat containment radius around locations exceeding the 70% model probability threshold.
          </p>
          <input
            id="geofence-radius-range"
            type="range"
            min="1.0"
            max="5.0"
            step="0.5"
            value={globalGeofenceRadiusKm}
            onChange={(e) => onChangeGeofenceRadiusKm(parseFloat(e.target.value))}
            class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <div class="flex justify-between text-xs text-slate-400 mt-1 font-mono">
            <span>1.0 km (Local)</span>
            <span>3.0 km (Default)</span>
            <span>5.0 km (Corridor)</span>
          </div>
        </div>
      )}

      {/* Layer Toggle (Top Right beneath Leaflet zoom) */}
      <div class="absolute top-28 right-3 z-[1000] flex flex-col gap-1.5">
        <button
          id="btn-toggle-tile-style"
          onClick={() => setMapTileStyle(mapTileStyle === 'dark' ? 'topo' : 'dark')}
          class="p-2 bg-slate-900/90 border border-slate-700 rounded-lg text-slate-300 hover:text-slate-50 shadow-lg backdrop-blur transition cursor-pointer"
          title="Toggle Carto Dark / OpenStreetMap satellite view"
        >
          <Layers class="w-4 h-4 text-emerald-400" />
        </button>
        <button
          id="btn-toggle-3d-terrain"
          onClick={() => setIs3D(!is3D)}
          class={`p-2 rounded-lg border shadow-lg backdrop-blur transition cursor-pointer ${
            is3D ? 'bg-blue-700 border-blue-600 text-white' : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-slate-50'
          }`}
          title={is3D ? 'Switch to 2D map' : 'Switch to 3D terrain'}
        >
          {is3D ? <MapIcon class="w-4 h-4" /> : <Box class="w-4 h-4 text-blue-400" />}
        </button>
      </div>

      {/* Map Canvas Container: both mounted permanently, toggled via
          display:none so neither Leaflet's nor MapLibre's instance gets
          torn down and re-created on every switch. */}
      {is3D && (
        <div class="w-full h-full min-h-[500px] flex-1 z-0">
          <TerrainMap3D
            centerLon={92.9}
            centerLat={26.2}
            zoom={7}
            markers={terrainMarkers}
          />
        </div>
      )}
      <div
        ref={mapContainerRef}
        style={{ display: is3D ? 'none' : 'block' }}
        class="w-full h-full min-h-[500px] flex-1 z-0"
      />

      {/* Map Legend (Bottom Left) */}
      <div class="absolute bottom-3 left-3 z-[1000] bg-slate-950/90 border border-slate-800/90 rounded-xl p-2.5 backdrop-blur shadow-2xl text-xs max-w-xs">
        <div class="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-800">
          <span class="font-bold text-slate-300 uppercase tracking-wider text-xs">Predicted Risk Probability</span>
          <span class="text-xs text-slate-400">ML Model Output</span>
        </div>
        {is3D && <p class="text-xs text-slate-400 mb-1.5">{TERRAIN_3D_HINT}</p>}
        <div class="grid grid-cols-5 gap-1.5 text-center font-mono text-xs">
          <div>
            <div class="h-2 rounded bg-green-500 mb-1"></div>
            <span class="text-slate-300 block">&lt;30%</span>
            <span class="text-green-400 text-xs">Low</span>
          </div>
          <div>
            <div class="h-2 rounded bg-yellow-500 mb-1"></div>
            <span class="text-slate-300 block">30-50%</span>
            <span class="text-yellow-400 text-xs">Mod</span>
          </div>
          <div>
            <div class="h-2 rounded bg-orange-500 mb-1"></div>
            <span class="text-slate-300 block">50-70%</span>
            <span class="text-orange-400 text-xs">High</span>
          </div>
          <div>
            <div class="h-2 rounded bg-red-500 mb-1"></div>
            <span class="text-slate-300 block">70-85%</span>
            <span class="text-red-400 text-xs">V.High</span>
          </div>
          <div>
            <div class="h-2 rounded bg-red-900 border border-red-500 mb-1 animate-pulse"></div>
            <span class="text-slate-300 block">&ge;85%</span>
            <span class="text-red-300 font-bold text-xs">Critical</span>
          </div>
        </div>
        <div class="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full border border-red-400 bg-red-500/30"></span>
            Auto Geofence (&ge;70%)
          </span>
          <span class="text-slate-400 font-mono">{filteredLocations.length} monitored</span>
        </div>
      </div>

      {/* Geospatial Coordinate Display (Bottom Right) */}
      <div class="absolute bottom-3 right-3 z-[1000] bg-slate-950/80 border border-slate-800/80 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-400 backdrop-blur hidden sm:block">
        <span>NER Bounding Box: 21.9°N - 29.5°N | 88.0°E - 97.4°E</span>
      </div>
    </div>
  );
};
