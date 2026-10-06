/**
 * Unified API Client Abstraction for BhooSuraksha
 * 
 * Provides clean decoupling between React UI components and backend endpoints.
 * Currently uses high-fidelity client mocks, but can be switched to real REST/FastAPI endpoints
 * simply by setting USE_LIVE_API = true or pointing VITE_BACKEND_URL to a running server.
 */

import { MonitoredLocation, AlertNotification, MLPredictionRequest, MLPredictionResponse, StateRiskSummary, ModelPerformanceMetrics } from '../types/landslide';
import { INITIAL_MONITORED_LOCATIONS, INITIAL_ALERTS, DEMO_STATE_RISK_SUMMARY, DEMO_MODEL_PERFORMANCE } from '../data/mockData';
import { runLandslidePrediction } from './predictionService';

import { getBackendUrl } from '../utils/backendUrl';
import { waitForServer } from '../utils/serverWake';

export const api = {
  /**
   * GET /api/zones
   * Fetches all monitored locations and risk classifications across the 8 NER states
   */
  async getMonitoredZones(): Promise<MonitoredLocation[]> {
    const BACKEND_URL = getBackendUrl();
    if (BACKEND_URL) {
      try {
        await waitForServer(); // free hosting may be asleep: wait for the wake-up ping
        const res = await fetch(`${BACKEND_URL}/api/zones`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API fallback to local data for /api/zones:', err);
      }
    }
    return [...INITIAL_MONITORED_LOCATIONS];
  },

  /**
   * GET /api/alerts
   * Fetches active and historical early warning alerts
   */
  async getAlerts(): Promise<AlertNotification[]> {
    const BACKEND_URL = getBackendUrl();
    if (BACKEND_URL) {
      try {
        await waitForServer(); // free hosting may be asleep: wait for the wake-up ping
        const res = await fetch(`${BACKEND_URL}/api/alerts`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API fallback to local data for /api/alerts:', err);
      }
    }
    return [...INITIAL_ALERTS];
  },

  /**
   * GET /api/analytics
   * Aggregates state-level risks, performance metrics, and temporal trendlines
   */
  async getAnalytics(): Promise<{
    stateSummaries: StateRiskSummary[];
    modelPerformance: ModelPerformanceMetrics;
  }> {
    const BACKEND_URL = getBackendUrl();
    if (BACKEND_URL) {
      try {
        await waitForServer(); // free hosting may be asleep: wait for the wake-up ping
        const res = await fetch(`${BACKEND_URL}/api/analytics`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API fallback to local data for /api/analytics:', err);
      }
    }
    return {
      stateSummaries: [...DEMO_STATE_RISK_SUMMARY],
      modelPerformance: { ...DEMO_MODEL_PERFORMANCE }
    };
  },

  /**
   * POST /api/predict
   * Evaluates geotechnical/environmental parameters and returns landslide probability
   */
  async predictLandslide(params: MLPredictionRequest): Promise<MLPredictionResponse> {
    return await runLandslidePrediction(params);
  },

  /**
   * POST /api/alerts/notify
   * Authority-only: dispatches a real notification attempt for a zone.
   * Requires a valid login token — throws if the backend rejects it.
   */
  async notifyAuthorities(locationId: string, token: string): Promise<{
    status: string;
    zone_name: string;
    risk_level: string;
    subscriber_count: number;
    note: string;
  }> {
    const backendUrl = getBackendUrl();
    if (!backendUrl) {
      throw new Error('No backend URL configured. Set one in Settings or on the Login page.');
    }
    await waitForServer(); // free hosting may be asleep: wait for the wake-up ping
    const res = await fetch(`${backendUrl}/api/alerts/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ location_id: locationId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail || `Request failed (${res.status})`);
    }
    return await res.json();
  }
};
