'use client';

import { useSyncExternalStore } from 'react';
import { CONSENT_KEY, readConsent } from './lib/cookie-consent';

const changeEvent = 'mascot-cookie-preferences-changed';
let memory = '';
function snapshot() {
  try { return localStorage.getItem(CONSENT_KEY) ?? memory; } catch { return memory; }
}
function subscribe(notify: () => void) {
  const changed = () => {
    // Reload to unload an already-running third-party script after withdrawal.
    if (!readConsent(snapshot())?.maps && ('google' in window || document.querySelector('script[data-mascot-maps]'))) window.location.reload();
    else notify();
  };
  const storage = (event: StorageEvent) => {
    if (event.key === CONSENT_KEY || event.key === null) { memory = ''; changed(); }
  };
  window.addEventListener(changeEvent, changed);
  window.addEventListener('storage', storage);
  return () => { window.removeEventListener(changeEvent, changed); window.removeEventListener('storage', storage); };
}
export function useCookiePreferences() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => 'pending');
  return { ready: raw !== 'pending', consent: readConsent(raw) };
}
export function saveCookiePreferences(maps: boolean) {
  memory = JSON.stringify({ version: 1, maps, savedAt: Date.now() });
  try { localStorage.setItem(CONSENT_KEY, memory); } catch { /* Keep the choice for this visit when storage is blocked. */ }
  window.dispatchEvent(new Event(changeEvent));
}
