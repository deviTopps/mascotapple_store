'use client';

import { useSyncExternalStore } from 'react';
import { CONSENT_KEY, readConsent } from './lib/cookie-consent';
import { createBrowserStore } from './lib/browser-store';

const store = createBrowserStore(CONSENT_KEY, 'mascot-cookie-preferences-changed', '');
const { snapshot } = store;
function subscribe(notify: () => void) {
  const changed = () => {
    // Reload to unload an already-running third-party script after withdrawal.
    if (!readConsent(snapshot())?.maps && ('google' in window || document.querySelector('script[data-mascot-maps]'))) window.location.reload();
    else notify();
  };
  return store.subscribe(changed);
}
export function useCookiePreferences() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => 'pending');
  return { ready: raw !== 'pending', consent: readConsent(raw) };
}
export function saveCookiePreferences(maps: boolean) {
  store.save(JSON.stringify({ version: 1, maps, savedAt: Date.now() }));
}
