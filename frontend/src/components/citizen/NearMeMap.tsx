/**
 * "Near Me" — a civilian-facing map scoped to a 40km radius of the
 * user's own location (not the full 8-state authority map). Shows:
 *  - monitored risk zones within that radius
 *  - real nearby police stations, hospitals, and military establishments,
 *    fetched live from OpenStreetMap's free Overpass API (no key needed,
 *    and no fabricated local directory — this only shows facilities that
 *    are actually mapped in OSM near the user, with a clear caveat about
 *    coverage gaps)
 *  - real national/state emergency helplines that always apply regardless
 *    of exact location
 */
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MonitoredLocation } from '../../types/landslide';
import { distanceKm } from '../../utils/geoDistance';
import { EMERGENCY_HELPLINES } from '../../data/citizenData';
import { LocateFixed, ShieldAlert, Hospital, Landmark, PhoneCall, AlertCircle, Navigation, Box, Map as MapIcon } from 'lucide-react';
import { TerrainMap3D, TerrainMarker, TERRAIN_3D_HINT } from '../TerrainMap3D';

const RADIUS_KM = 100;

type FacilityKind = 'hospital' | 'police' | 'military';

interface Facility {
  id: number;
  name: string;
  kind: FacilityKind;
  lat: number;
  lon: number;
  distanceKm: number;
}

const KIND_META: Record<FacilityKind, { label: string; icon: React.ReactNode; color: string }> = {
  hospital: { label: 'Hospital', icon: <Hospital class="w-3.5 h-3.5" />, color: 'text-red-400' },
  police: { label: 'Police Station', icon: <ShieldAlert class="w-3.5 h-3.5" />, color: 'text-blue-400' },
  military: { label: 'Military Establishment', icon: <Landmark class="w-3.5 h-3.5" />, color: 'text-emerald-400' },
};

interface NearMeMapProps {
  locations: MonitoredLocation[];
}

export const NearMeMap: React.FC<NearMeMapProps> = ({ locations }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(false);

  const requestLocation = () => {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError('Your browser does not support geolocation.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => setLocError(err.message || 'Could not get your location. Check your browser/location permissions.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Fetch real nearby facilities from OpenStreetMap's free Overpass API
  useEffect(() => {
    if (!userPos) return;
    setIsLoadingFacilities(true);
    setFacilitiesError(null);
    const radiusMeters = RADIUS_KM * 1000;
    const query = `[out:json][timeout:25];(
      node["amenity"="hospital"](around:${radiusMeters},${userPos.lat},${userPos.lon});
      node["amenity"="police"](around:${radiusMeters},${userPos.lat},${userPos.lon});
      node["landuse"="military"](around:${radiusMeters},${userPos.lat},${userPos.lon});
      way["landuse"="military"](around:${radiusMeters},${userPos.lat},${userPos.lon});
    );out center 40;`;

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Overpass API returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const results: Facility[] = (data.elements || [])
          .map((el: { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }) => {
            const lat = el.lat ?? el.center?.lat;
            const lon = el.lon ?? el.center?.lon;
            if (lat === undefined || lon === undefined) return null;
            const tags = el.tags || {};
            const kind: FacilityKind = tags.amenity === 'hospital' ? 'hospital' : tags.amenity === 'police' ? 'police' : 'military';
            return {
              id: el.id,
              name: tags.name || `Unnamed ${KIND_META[kind].label}`,
              kind,
              lat,
              lon,
              distanceKm: distanceKm(userPos.lat, userPos.lon, lat, lon),
            };
          })
          .filter((f: Facility | null): f is Facility => f !== null)
          .sort((a: Facility, b: Facility) => a.distanceKm - b.distanceKm)
          .slice(0, 25);
        setFacilities(results);
      })
      .catch(() => setFacilitiesError('Could not reach OpenStreetMap to look up nearby facilities. You can still use the national helplines below.'))
      .finally(() => setIsLoadingFacilities(false));
  }, [userPos]);

  // Initialize / update map
  useEffect(() => {
    if (!mapContainerRef.current || !userPos) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, { zoomControl: false });
      L.control.zoom({ position: 'topright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
        subdomains: 'abc',
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layer = layerRef.current!;
    layer.clearLayers();

    // Fit view to the 40km radius
    const bounds = L.latLng(userPos.lat, userPos.lon).toBounds(RADIUS_KM * 2 * 1000);
    map.fitBounds(bounds);

    // User location marker + 40km radius circle
    L.marker([userPos.lat, userPos.lon], {
      icon: L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#5b93bc;border:2px solid white;box-shadow:0 0 0 4px rgba(91,147,188,0.35)"></div>`,
        iconSize: [14, 14],
      }),
    }).bindPopup('Your location').addTo(layer);

    L.circle([userPos.lat, userPos.lon], {
      radius: RADIUS_KM * 1000,
      color: '#5b93bc',
      weight: 1.5,
      fillOpacity: 0.05,
    }).addTo(layer);

    // Monitored risk zones within radius
    locations
      .filter((loc) => distanceKm(userPos.lat, userPos.lon, loc.latitude, loc.longitude) <= RADIUS_KM)
      .forEach((loc) => {
        const color =
          loc.risk_level === 'CRITICAL' ? '#a14c45' :
          loc.risk_level === 'VERY_HIGH' ? '#e36a5b' :
          loc.risk_level === 'HIGH' ? '#d29a69' :
          loc.risk_level === 'MODERATE' ? '#d1b078' : '#65aa88';
        L.circleMarker([loc.latitude, loc.longitude], {
          radius: 7,
          color,
          fillColor: color,
          fillOpacity: 0.8,
          weight: 1.5,
        })
          .bindPopup(`<strong>${loc.name}</strong><br/>${loc.district}, ${loc.state}<br/>Risk: ${loc.risk_level.replace('_', ' ')}`)
          .addTo(layer);
      });

    // Real nearby facilities
    facilities.forEach((f) => {
      const color = f.kind === 'hospital' ? '#e36a5b' : f.kind === 'police' ? '#5b93bc' : '#65aa88';
      L.circleMarker([f.lat, f.lon], {
        radius: 5,
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 1,
      })
        .bindPopup(`<strong>${f.name}</strong><br/>${KIND_META[f.kind].label} • ${f.distanceKm.toFixed(1)} km away`)
        .addTo(layer);
    });
  }, [userPos, locations, facilities]);

  useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Leaflet needs an explicit resize nudge after its container goes from
  // display:none back to visible, or it renders with stale/partial tiles.
  useEffect(() => {
    if (!is3D) {
      const t = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
      return () => clearTimeout(t);
    }
  }, [is3D]);

  // Shared marker list for both the 2D (Leaflet) and 3D (MapLibre) views
  const terrainMarkers: TerrainMarker[] = userPos
    ? [
        {
          lon: userPos.lon,
          lat: userPos.lat,
          color: '#5b93bc',
          popupHtml: '<strong>Your location</strong>',
        },
        ...locations
          .filter((loc) => distanceKm(userPos.lat, userPos.lon, loc.latitude, loc.longitude) <= RADIUS_KM)
          .map((loc) => ({
            lon: loc.longitude,
            lat: loc.latitude,
            color:
              loc.risk_level === 'CRITICAL' ? '#a14c45' :
              loc.risk_level === 'VERY_HIGH' ? '#e36a5b' :
              loc.risk_level === 'HIGH' ? '#d29a69' :
              loc.risk_level === 'MODERATE' ? '#d1b078' : '#65aa88',
            weight: loc.risk_probability,
            popupHtml: `<strong>${loc.name}</strong><br/>${loc.district}, ${loc.state}<br/>Risk: ${loc.risk_level.replace('_', ' ')}`,
          })),
        ...facilities.map((f) => ({
          lon: f.lon,
          lat: f.lat,
          color: f.kind === 'hospital' ? '#e36a5b' : f.kind === 'police' ? '#5b93bc' : '#65aa88',
          popupHtml: `<strong>${f.name}</strong><br/>${KIND_META[f.kind].label} &bull; ${f.distanceKm.toFixed(1)} km away`,
        })),
      ]
    : [];

  return (
    <div class="space-y-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h2 class="text-sm font-medium text-slate-50 flex items-center gap-2 mb-1">
          <LocateFixed class="w-4 h-4 text-blue-400" />
          What's Near Me ({RADIUS_KM} km)
        </h2>
        <p class="text-xs text-slate-400">
          Shows monitored risk zones and real nearby hospitals, police stations, and military
          establishments within {RADIUS_KM} km of your current location. Facility data comes
          from OpenStreetMap and depends on what's mapped there — always call the national
          helplines below if something nearby isn't listed.
        </p>
      </div>

      {locError && (
        <div class="bg-amber-950/40 border border-amber-800 rounded-xl p-4 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            {locError}
            <button onClick={requestLocation} class="block mt-2 underline hover:no-underline cursor-pointer">
              Try again
            </button>
          </div>
        </div>
      )}

      {userPos && (
        <>
          <div class="flex items-center justify-end">
            <div class="inline-flex rounded-lg border border-slate-800 overflow-hidden text-xs">
              <button
                id="btn-nearme-view-2d"
                onClick={() => setIs3D(false)}
                class={`px-3 py-1.5 flex items-center gap-1.5 transition cursor-pointer ${!is3D ? 'bg-blue-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-50'}`}
              >
                <MapIcon class="w-3.5 h-3.5" /> 2D Map
              </button>
              <button
                id="btn-nearme-view-3d"
                onClick={() => setIs3D(true)}
                class={`px-3 py-1.5 flex items-center gap-1.5 transition cursor-pointer ${is3D ? 'bg-blue-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-50'}`}
              >
                <Box class="w-3.5 h-3.5" /> 3D Terrain
              </button>
            </div>
          </div>

          {is3D ? (
            <div class="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-800">
              <TerrainMap3D
                centerLon={userPos.lon}
                centerLat={userPos.lat}
                zoom={9}
                markers={terrainMarkers}
                radiusKm={RADIUS_KM}
              />
            </div>
          ) : null}
          {is3D && <p class="text-xs text-slate-400 -mt-2">{TERRAIN_3D_HINT}</p>}
          <div
            ref={mapContainerRef}
            style={{ display: is3D ? 'none' : 'block' }}
            class="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-800"
          />

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 class="text-sm font-medium text-slate-50 mb-2">Nearby facilities</h3>
            {isLoadingFacilities && <p class="text-xs text-slate-400">Looking up nearby facilities...</p>}
            {facilitiesError && <p class="text-xs text-amber-300">{facilitiesError}</p>}
            {!isLoadingFacilities && !facilitiesError && facilities.length === 0 && (
              <p class="text-xs text-slate-400">No mapped hospitals, police stations, or military establishments found within {RADIUS_KM} km on OpenStreetMap.</p>
            )}
            <div class="space-y-1.5">
              {facilities.map((f) => (
                <div key={f.id} class="flex items-center justify-between text-xs bg-slate-950/60 rounded-lg px-3 py-2">
                  <div class="flex items-center gap-2">
                    <span class={KIND_META[f.kind].color}>{KIND_META[f.kind].icon}</span>
                    <span class="text-slate-200">{f.name}</span>
                    <span class="text-slate-500">• {KIND_META[f.kind].label}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-slate-400">{f.distanceKm.toFixed(1)} km</span>
                    <a
                      href={`https://www.openstreetmap.org/directions?to=${f.lat}%2C${f.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Navigation class="w-3 h-3" /> Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 class="text-sm font-medium text-slate-50 flex items-center gap-2 mb-2">
          <PhoneCall class="w-4 h-4 text-red-400" />
          National & State Emergency Helplines
        </h3>
        <p class="text-xs text-slate-400 mb-2">These work everywhere, regardless of your exact location.</p>
        <div class="grid sm:grid-cols-2 gap-2">
          {EMERGENCY_HELPLINES.map((hl) => (
            <a
              key={hl.service}
              href={`tel:${hl.number}`}
              class="flex items-center justify-between bg-slate-950/60 rounded-lg px-3 py-2 text-xs hover:bg-slate-950 transition"
            >
              <div>
                <span class="text-slate-200 block">{hl.service}</span>
                <span class="text-slate-500">{hl.description}</span>
              </div>
              <span class="text-slate-50 font-mono font-medium">{hl.number}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
