/** Small, failure-tolerant localStorage helpers for per-visitor preferences. */
export function readPref<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export const CONSENT_KEY = 'gk_cookie_consent';
export type Consent = 'all' | 'essential' | '';

export const CONSENT_EVENT = 'gk-consent-change';
