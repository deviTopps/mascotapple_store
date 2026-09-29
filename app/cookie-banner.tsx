'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { saveCookiePreferences, useCookiePreferences } from './cookie-preferences';
import styles from './cookie-banner.module.css';

export default function CookieBanner() {
  const { ready, consent } = useCookiePreferences();
  const [editing, setEditing] = useState(false);
  const [maps, setMaps] = useState(false);
  const settings = useRef<HTMLButtonElement>(null);
  if (!ready) return null;
  function save(allowMaps: boolean) {
    saveCookiePreferences(allowMaps);
    setEditing(false);
    requestAnimationFrame(() => settings.current?.focus());
  }
  function customize() { setMaps(consent?.maps ?? false); setEditing(true); }
  return <>
    <button ref={settings} className={styles.settings} onClick={customize} aria-expanded={!consent || editing} aria-controls="cookie-preferences">Cookie settings</button>
    {(!consent || editing) && <section id="cookie-preferences" className={styles.banner} role="region" aria-labelledby="cookie-heading">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>YOUR PRIVACY</p>
        <h2 id="cookie-heading">Your cookie choices</h2>
        <p>We use essential cookies and browser storage for your cart, checkout and preferences. With your permission, Google address search can help you find a delivery address. The About Us page loads a Google Maps store map automatically.</p>
        <Link href="/cookies">Read our cookie information</Link>
      </div>
      {editing && <div className={styles.preferences}>
        <div><strong>Essential storage</strong><span>Always active — needed for shopping and saving your choice.</span></div>
        <label><input type="checkbox" checked={maps} onChange={event => setMaps(event.target.checked)} /><span><strong>Google address search</strong><span>Optional. Connects to Google when used at checkout. Turning this off may reload the page to stop Google scripts. This setting does not control the About Us store map.</span></span></label>
      </div>}
      <div className={styles.actions}>
        <button onClick={() => save(false)}>Reject optional</button>
        <button onClick={() => save(true)}>Accept all</button>
        {editing ? <button onClick={() => save(maps)}>Save preferences</button> : <button onClick={customize}>Customize</button>}
      </div>
    </section>}
  </>;
}
