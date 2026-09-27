export const CONSENT_KEY = 'mascot-cookie-preferences-v1';
export const CONSENT_LIFETIME = 180 * 24 * 60 * 60 * 1000;
export type CookieConsent = { version: 1; maps: boolean; savedAt: number };

export function readConsent(raw: string | null, now = Date.now()): CookieConsent | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (value?.version !== 1 || typeof value.maps !== 'boolean' || !Number.isSafeInteger(value.savedAt)
      || value.savedAt > now || now - value.savedAt >= CONSENT_LIFETIME) return null;
    return value;
  } catch { return null; }
}
