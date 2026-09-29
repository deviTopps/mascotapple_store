import type { ReactNode } from 'react';
import Link from 'next/link';
import CommerceShell from './commerce-shell';
import styles from './consumer-health-data-privacy/privacy.module.css';

export default function InformationPage({ title, intro, policy = false, children }: {
  title: string;
  intro: string;
  policy?: boolean;
  children: ReactNode;
}) {
  return <CommerceShell>
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>MASCOT APPLE DEALZ GH</p>
        <h1>{title}</h1>
        {policy && <p className={styles.updated}>Last updated: <time dateTime="2026-09-29">29 September 2026</time></p>}
        <p className={styles.intro}>{intro}</p>
      </header>
      {children}
      <section className={styles.contact}>
        <h2>Talk to us</h2>
        <p><a href="mailto:mascotappledealzgh@gmail.com">mascotappledealzgh@gmail.com</a><br /><a href="tel:+233240613935">+233 24 061 3935</a></p>
        <p>For order enquiries, include your order reference and a short description of what you need.</p>
        <p><Link href="/support">Customer support</Link><span aria-hidden="true"> · </span><Link href="/products">Browse the shop</Link></p>
      </section>
    </article>
  </CommerceShell>;
}
