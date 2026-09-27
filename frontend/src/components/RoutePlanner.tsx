/**
 * Route Planner (Authority dashboard) — pilot: Dima Hasao, Assam.
 *
 * Pick an origin and destination (or click the map), click any road to mark
 * it blocked, and see: the fastest route, the detour and delay caused by the
 * blockage (or that the destination is cut off), and who loses road access
 * from the district HQ. Data and routing: backend/logistics.py.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Route, MapPin, Ban, RotateCcw, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { logisticsApi, ImpactResult, LatLon, NetworkData, Place, RouteResult } from '../services/logistics';

type PickMode = 'none' | 'origin' | 'destination';
interface Endpoint extends LatLon { label: string }

const ROAD_STYLE: Record<string, { color: string; weight: number }> = {
  NH: { color: '#0b3068', weight: 4 }, SH: { color: '#1c4f9e', weight: 3.5 }, MDR: { color: '#2a5fb0', weight: 3 },
};
const BLOCKED = { color: '#c62828', weight: 6, dashArray: '6 6' };

export const RoutePlanner: React.FC = () => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const roadsLayer = useRef<L.GeoJSON | null>(null);
  const overlay = useRef<L.LayerGroup | null>(null);
  const pickRef = useRef<PickMode>('none');

  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [places, setPlaces] = useState<{ facilities: Place[]; villages: Place[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Endpoint | null>(null);
  const [destination, setDestination] = useState<Endpoint | null>(null);
  const [blocked, setBlocked] = useState<number[]>([]);
  const [pick, setPick] = useState<PickMode>('none');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [impact, setImpact] = useState<ImpactResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  pickRef.current = pick;

  // Load network + places; default: HQ -> Maibang CHC (a real bottleneck case)
  useEffect(() => {
    Promise.all([logisticsApi.network(), logisticsApi.places()])
      .then(([net, pl]) => {
        setNetwork(net);
        setPlaces(pl);
        setOrigin({ lat: net.hq.lat, lon: net.hq.lon, label: net.hq.name });
        const mai = pl.facilities.find((f) => f.name.includes('Maibang CHC'));
        if (mai) setDestination({ lat: mai.lat, lon: mai.lon, label: mai.name });
      })
      .catch((e) => setLoadError(e.message));
  }, []);

  // Map + road layer (once network is loaded)
  useEffect(() => {
    if (!network || !mapDiv.current || mapRef.current) return;
    const map = L.map(mapDiv.current, { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors · Roads: PMGSY GeoSadak (MoRD)', maxZoom: 18,
    }).addTo(map);
    const roads = L.geoJSON(network.roads, {
      style: (f) => {
        const s = ROAD_STYLE[f?.properties.category] ?? { color: f?.properties.in_main_network ? '#475569' : '#94a3b8', weight: 2 };
        return { ...s, opacity: 0.9 };
      },
      onEachFeature: (f, layer) => {
        layer.bindTooltip(`${f.properties.road_name || 'Unnamed road'} · ${f.properties.category} · ${(f.properties.length_m / 1000).toFixed(1)} km`, { sticky: true });
        layer.on('click', (e) => {
          if (pickRef.current !== 'none') return; // map click handler sets the point instead
          L.DomEvent.stopPropagation(e);
          const id = f.properties.edge_id;
          setBlocked((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));
        });
      },
    }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      const mode = pickRef.current;
      if (mode === 'none') return;
      const pt = { lat: e.latlng.lat, lon: e.latlng.lng, label: `Map point (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})` };
      if (mode === 'origin') setOrigin(pt); else setDestination(pt);
      setPick('none');
    });
    map.fitBounds(roads.getBounds(), { padding: [10, 10] });
    roadsLayer.current = roads;
    overlay.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    if (import.meta.env.DEV) (window as unknown as { __routeMap?: L.Map }).__routeMap = map; // debugging aid in dev only
    return () => { map.remove(); mapRef.current = null; };
  }, [network]);

  // Restyle blocked roads
  useEffect(() => {
    roadsLayer.current?.eachLayer((layer) => {
      const l = layer as L.Path & { feature?: GeoJSON.Feature<GeoJSON.LineString, { edge_id: number; category: string; in_main_network: boolean }> };
      const p = l.feature?.properties;
      if (!p) return;
      const base = ROAD_STYLE[p.category] ?? { color: p.in_main_network ? '#475569' : '#94a3b8', weight: 2 };
      l.setStyle(blocked.includes(p.edge_id) ? BLOCKED : { ...base, dashArray: undefined });
    });
  }, [blocked]);

  // Route whenever inputs change; impact whenever blockages change
  useEffect(() => {
    if (!origin || !destination) return;
    let stale = false;
    setBusy(true); setError(null);
    logisticsApi.route(origin, destination, blocked)
      .then((r) => { if (!stale) setRoute(r); })
      .catch((e) => { if (!stale) { setError(e.message); setRoute(null); } })
      .finally(() => { if (!stale) setBusy(false); });
    return () => { stale = true; };
  }, [origin, destination, blocked]);

  useEffect(() => {
    if (!blocked.length) { setImpact(null); return; }
    let stale = false;
    logisticsApi.impact(blocked).then((r) => { if (!stale) setImpact(r); }).catch(() => {});
    return () => { stale = true; };
  }, [blocked]);

  // Draw route + endpoints
  useEffect(() => {
    const g = overlay.current;
    if (!g) return;
    g.clearLayers();
    const toLatLngs = (c: [number, number][][]) => c.map((line) => line.map(([x, y]) => [y, x] as [number, number]));
    if (route) {
      // Non-interactive so clicks pass through to the road underneath: the roads
      // on the current route are exactly the ones users most want to block.
      if (route.status !== 'ok') L.polyline(toLatLngs(route.normal.geometry.coordinates), { color: '#64748b', weight: 5, dashArray: '4 8', opacity: 0.9, interactive: false }).addTo(g);
      if (route.current) L.polyline(toLatLngs(route.current.geometry.coordinates), { color: route.status === 'rerouted' ? '#e07b13' : '#138808', weight: 6, opacity: 0.9, interactive: false }).addTo(g);
    }
    const pin = (p: Endpoint, color: string, label: string) =>
      L.circleMarker([p.lat, p.lon], { radius: 9, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }).bindTooltip(`${label}: ${p.label}`).addTo(g);
    if (origin) pin(origin, '#0b3068', 'From');
    if (destination) pin(destination, '#c62828', 'To');
  }, [route, origin, destination, network]);

  const choices = useMemo(() => {
    if (!places) return [];
    const med = places.facilities.filter((f) => f.category === 'Medical');
    const other = places.facilities.filter((f) => f.category !== 'Medical');
    return [
      { group: 'Health facilities', items: med },
      { group: 'Largest villages', items: places.villages.slice(0, 60) },
      { group: 'Other facilities', items: other },
    ];
  }, [places]);

  const selectPlace = (value: string, set: (e: Endpoint) => void) => {
    if (!places || !network) return;
    if (value === 'hq') return set({ lat: network.hq.lat, lon: network.hq.lon, label: network.hq.name });
    const [kind, id] = value.split(':');
    const src = kind === 'f' ? places.facilities : places.villages;
    const p = src.find((x) => String(x.id) === id);
    if (p) set({ lat: p.lat, lon: p.lon, label: p.name + (p.population ? ` (pop. ${p.population})` : '') });
  };

  const placeSelect = (label: string, current: Endpoint | null, set: (e: Endpoint) => void, mode: PickMode) => (
    <div>
      <label className="text-xs font-semibold text-slate-300 block mb-1">{label}</label>
      <select
        className="w-full bg-white border border-slate-700 rounded-lg p-2 text-sm text-slate-100"
        value=""
        onChange={(e) => selectPlace(e.target.value, set)}
      >
        <option value="" disabled>{current ? current.label : 'Choose a place…'}</option>
        <option value="hq">{network?.hq.name}</option>
        {choices.map((c) => (
          <optgroup key={c.group} label={c.group}>
            {c.items.map((p) => <option key={`${c.group}${p.id}`} value={`${c.group === 'Largest villages' ? 'v' : 'f'}:${p.id}`}>{p.name}{p.population ? ` — ${p.population}` : ''}</option>)}
          </optgroup>
        ))}
      </select>
      <button
        onClick={() => setPick(pick === mode ? 'none' : mode)}
        className={`mt-1 text-xs flex items-center gap-1 cursor-pointer ${pick === mode ? 'text-orange-600 font-semibold' : 'text-blue-600 hover:underline'}`}
      >
        <MapPin className="w-3 h-3" /> {pick === mode ? 'Click on the map…' : 'or pick on the map'}
      </button>
    </div>
  );

  if (loadError) {
    return <div className="bg-white border border-slate-800 rounded-xl p-6 text-sm text-red-700">Couldn't load the road network: {loadError}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gov-navy flex items-center gap-2"><Route className="w-5 h-5" /> Route Planner — {network?.district ?? 'loading…'}</h2>
          <p className="text-xs text-slate-400">
            Real rural-road network (PMGSY GeoSadak). Click any road to mark it blocked. Travel times use assumed hill-road speeds, not live traffic.
          </p>
        </div>
        {network && (
          <div className="text-xs text-slate-400 text-right">
            {network.report.total_road_km} km of roads · {network.report.connectivity_after.largest_piece_pct}% connected
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-4">
        <div className="space-y-3">
          <div className="bg-white border border-slate-800 rounded-xl p-4 space-y-3">
            {placeSelect('From', origin, setOrigin, 'origin')}
            {placeSelect('To', destination, setDestination, 'destination')}
          </div>

          <div className="bg-white border border-slate-800 rounded-xl p-4">
            {busy && <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Calculating…</p>}
            {error && <p className="text-sm text-red-700">{error}</p>}
            {route && !busy && (
              <>
                {route.status === 'ok' && <p className="font-semibold text-green-700 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Route open</p>}
                {route.status === 'rerouted' && <p className="font-semibold text-orange-700 flex items-center gap-2"><Clock className="w-5 h-5" /> Rerouted: +{route.delay_min} min</p>}
                {route.status === 'unreachable' && <p className="font-semibold text-red-700 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Cut off — no route</p>}
                <dl className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div className="bg-slate-950 rounded-lg p-2"><dt className="text-xs text-slate-400">Normal</dt><dd className="font-semibold text-slate-100">{route.normal.km} km · {Math.round(route.normal.minutes)} min</dd></div>
                  <div className="bg-slate-950 rounded-lg p-2"><dt className="text-xs text-slate-400">Now</dt><dd className="font-semibold text-slate-100">{route.current ? `${route.current.km} km · ${Math.round(route.current.minutes)} min` : '—'}</dd></div>
                </dl>
                {(route.snap_m.origin > 500 || route.snap_m.destination > 500) && (
                  <p className="text-xs text-slate-400 mt-2">
                    Nearest mapped road is {route.snap_m.origin > 500 ? `${(route.snap_m.origin / 1000).toFixed(1)} km from the start` : ''}
                    {route.snap_m.origin > 500 && route.snap_m.destination > 500 ? ' and ' : ''}
                    {route.snap_m.destination > 500 ? `${(route.snap_m.destination / 1000).toFixed(1)} km from the destination` : ''}; that last stretch isn't included.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="bg-white border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2"><Ban className="w-4 h-4 text-red-600" /> Blocked roads ({blocked.length})</h3>
              {blocked.length > 0 && (
                <button onClick={() => setBlocked([])} className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"><RotateCcw className="w-3 h-3" /> Clear</button>
              )}
            </div>
            {!blocked.length && <p className="text-xs text-slate-400">None. Click a road on the map to simulate a landslide or flood blocking it.</p>}
            {impact && (
              <div className="mt-2 rounded-lg bg-red-50 border border-red-800 p-3 text-sm">
                <p className="font-semibold text-red-700">Cut off from {network?.hq.name}:</p>
                <p className="text-slate-200 mt-1">
                  {impact.population_cut_off.toLocaleString('en-IN')} people · {impact.villages_cut_off} villages · {impact.facilities_cut_off.length} facilities
                  {impact.facilities_cut_off.filter((f) => f.category === 'Medical').length > 0 && ` (incl. ${impact.facilities_cut_off.filter((f) => f.category === 'Medical').length} health)`}
                </p>
                {impact.facilities_delayed.length > 0 && <p className="text-xs text-slate-300 mt-1">{impact.facilities_delayed.length} more facilities reachable only by detour</p>}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-800 rounded-xl overflow-hidden">
          <div ref={mapDiv} className={`w-full h-[620px] ${pick !== 'none' ? 'cursor-crosshair' : ''}`} />
          <div className="flex flex-wrap gap-4 px-4 py-2 text-xs text-slate-300 border-t border-slate-800">
            <span className="flex items-center gap-1"><span className="inline-block w-5 h-1 bg-[#138808]" /> Route</span>
            <span className="flex items-center gap-1"><span className="inline-block w-5 h-1 bg-[#e07b13]" /> Detour</span>
            <span className="flex items-center gap-1"><span className="inline-block w-5 h-1 border-t-2 border-dashed border-[#64748b]" /> Normal route</span>
            <span className="flex items-center gap-1"><span className="inline-block w-5 h-1 border-t-2 border-dashed border-[#c62828]" /> Blocked road</span>
          </div>
        </div>
      </div>
    </div>
  );
};
