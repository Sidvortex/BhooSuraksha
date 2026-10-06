/**
 * Single source of truth for the backend URL. Persisted to localStorage
 * so it survives a page refresh (previously it only lived in a runtime
 * window global and was lost on reload). Read this with getBackendUrl()
 * at the point of use, not into a frozen top-level constant — the value
 * can change at runtime (e.g. from Settings, or the Login page).
 */
const STORAGE_KEY = 'ner_landslideguard_backend_url';

/**
 * Where the API lives, in priority order:
 *  1. an address saved in Settings -> Backend URL (override, e.g. for testing)
 *  2. VITE_BACKEND_URL, baked in at build time (set it in Vercel's environment variables)
 *  3. nothing: the site runs on built-in sample data
 * (2) is what makes the deployed site use the real backend for every visitor,
 * not just people who typed the address into Settings.
 */
export function getBackendUrl(): string {
  if (typeof window === 'undefined') return '';
  const w = window as unknown as { ENV_BACKEND_URL?: string };
  if (w.ENV_BACKEND_URL) return w.ENV_BACKEND_URL;
  const stored = localStorage.getItem(STORAGE_KEY) || '';
  const built = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim().replace(/\/+$/, '') || '';
  const url = stored || built;
  w.ENV_BACKEND_URL = url;
  return url;
}

export function setBackendUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim().replace(/\/+$/, ''); // drop trailing slash
  (window as unknown as { ENV_BACKEND_URL?: string }).ENV_BACKEND_URL = undefined; // re-resolve on next read
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
  else localStorage.removeItem(STORAGE_KEY); // empty = go back to the built-in address
}
