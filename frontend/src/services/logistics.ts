/**
 * Client for the logistics routing API (backend/logistics.py).
 * Pilot network: Dima Hasao, Assam.
 */
import { getBackendUrl } from '../utils/backendUrl';
import { waitForServer } from '../utils/serverWake';

export interface LatLon { lat: number; lon: number }

export interface Place extends LatLon { id: number; name: string; category?: string; population?: number }

export interface PathSummary {
  minutes: number;
  km: number;
  edge_ids: number[];
  geometry: { type: 'MultiLineString'; coordinates: [number, number][][] };
}

export interface RouteResult {
  status: 'ok' | 'rerouted' | 'unreachable';
  normal: PathSummary;
  current: PathSummary | null;
  delay_min: number | null;
  snap_m: { origin: number; destination: number };
}

export interface ImpactResult {
  facilities_cut_off: Place[];
  facilities_delayed: (Place & { extra_min: number })[];
  villages_cut_off: number;
  population_cut_off: number;
}

export interface NetworkData {
  district: string;
  hq: LatLon & { name: string };
  report: { connectivity_after: { largest_piece_pct: number }; total_road_km: number };
  roads: GeoJSON.FeatureCollection<GeoJSON.LineString, {
    edge_id: number; category: string; road_name: string; length_m: number; travel_min: number; in_main_network: boolean;
  }>;
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const base = getBackendUrl();
  if (!base) throw new Error('No backend URL configured. Set it on the Login page or in Settings.');
  await waitForServer(); // free hosting may be asleep: wait for the wake-up ping
  const res = await fetch(`${base}/api/logistics${path}`, body === undefined ? undefined : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export const logisticsApi = {
  network: () => call<NetworkData>('/network'),
  places: () => call<{ hq: LatLon & { name: string }; facilities: Place[]; villages: Place[] }>('/places'),
  route: (origin: LatLon, destination: LatLon, blocked: number[]) =>
    call<RouteResult>('/route', { origin, destination, blocked_edge_ids: blocked }),
  impact: (blocked: number[]) => call<ImpactResult>('/impact', { blocked_edge_ids: blocked }),
};
