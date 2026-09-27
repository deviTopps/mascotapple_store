// A stable string snapshot supports React's external-store API. Memory remains
// authoritative after a failed write (private mode, quota), until a real
// cross-tab storage event tells us another tab changed the value.
export function createBrowserStore(key: string, eventName: string, fallback: string) {
  let memory: string | undefined;
  return {
    snapshot() {
      if (memory !== undefined) return memory;
      try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    },
    save(value: string) {
      memory = value;
      try { localStorage.setItem(key, value); } catch { /* Keep this visit usable. */ }
      window.dispatchEvent(new Event(eventName));
    },
    subscribe(notify: () => void) {
      const changed = (event: StorageEvent) => {
        if (event.key === key || event.key === null) { memory = undefined; notify(); }
      };
      window.addEventListener('storage', changed);
      window.addEventListener(eventName, notify);
      return () => { window.removeEventListener('storage', changed); window.removeEventListener(eventName, notify); };
    },
  };
}
