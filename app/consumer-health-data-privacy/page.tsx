import type { Metadata } from 'next';
import Link from 'next/link';
import CommerceShell from '../commerce-shell';
import styles from './privacy.module.css';

export const metadata: Metadata = {
  title: 'Consumer Health Data Privacy Disclosure | Mascot Apple Dealz',
  description: 'How Mascot Apple Dealz handles health-related information you may provide while shopping, and how to contact us about your privacy.',
};

export default function ConsumerHealthPrivacy() {
  return <CommerceShell>
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>MASCOT APPLE DEALZ · PRIVACY</p>
        <h1>Consumer Health Data Privacy Disclosure</h1>
        <p className={styles.updated}>Last updated: <time dateTime="2026-09-27">27 September 2026</time></p>
        <p className={styles.intro}>Your health information is personal. This disclosure explains how health-related information may reach Mascot Apple Dealz through our online store and how to contact us about it.</p>
      </header>

      <aside className={styles.summary} aria-label="Our approach">
        <strong>You do not need to share health information to shop with us.</strong>
        <p>Our store sells electronics and accessories. It does not connect to Apple Health, HealthKit, medical records or health readings stored on your devices. Buying an Apple Watch or another device does not give us access to its health data.</p>
      </aside>

      <section>
        <h2>1. What this disclosure covers</h2>
        <p>This disclosure covers our current online storefront and information you provide in connection with an online order or support request. Consumer health data can include information linked to you that reveals your physical or mental health, a disability, treatment or use of health services. The precise legal definition depends on the law that applies.</p>
        <p>This page does not describe the independent data practices of Apple, a device manufacturer, or an app you install on a purchased device.</p>
      </section>

      <section>
        <h2>2. Information we may receive and its sources</h2>
        <p>Our checkout asks for contact information, purchased items and delivery details. It does not ask for diagnoses, medical records, biometric readings or health-app access.</p>
        <ul>
          <li><strong>Information you volunteer:</strong> order notes or messages may contain health details, an accessibility need or a health-related delivery instruction if you choose to include them.</li>
          <li><strong>Delivery information:</strong> an address or an optional selected map location could reveal a connection to a healthcare facility. We use delivery information to fulfil your order, not to infer your health.</li>
          <li><strong>Support correspondence:</strong> health information you send to our published contact channels may be received with your name, email address and order reference.</li>
        </ul>
        <p>Please keep order notes and messages limited to what we need to help you. Do not send medical records, health-app exports, passwords or detailed medical histories.</p>
      </section>

      <section>
        <h2>3. How information is used</h2>
        <p>If health-related information is included in an order or support request, it may be processed along with that request to arrange delivery, understand an accommodation you requested, respond to you or resolve an order issue. Our storefront does not analyse device health readings, create health profiles or use health information for advertising.</p>
        <p>Accepting optional cookies is not permission to collect or share medical information. You can enter an address manually without enabling Google address search.</p>
      </section>

      <section>
        <h2>4. Where information may be processed or shared</h2>
        <p>Health details included in an otherwise ordinary order or message may travel with that information. Depending on the feature you use, recipients can include:</p>
        <ul>
          <li><strong>Store staff:</strong> people handling your order or support request.</li>
          <li><strong>Website and storage providers:</strong> Vercel and Railway process storefront requests and stored order information.</li>
          <li><strong>Communication providers:</strong> Google’s email service processes messages sent to our published Gmail address.</li>
          <li><strong>Address-search providers:</strong> if you enable Google address search, Google receives the searches you enter and connection information. A selected address and location may be saved with your order.</li>
          <li><strong>Payment providers:</strong> when online payment is available and selected, Paystack receives transaction information and order metadata, which can include order notes and delivery information. Avoid placing health details in those fields.</li>
        </ul>
        <p>Our storefront does not sell consumer health data or transmit it to advertising networks. Requests from public authorities, where applicable, are subject to the relevant legal requirements.</p>
      </section>

      <section>
        <h2>5. Your choices and privacy requests</h2>
        <p>You can ask whether we hold health-related information about you, request access or deletion, correct information you supplied, or withdraw consent where processing depends on it. Available rights and any exceptions depend on the law that applies to your request.</p>
        <p>Email us using the subject <strong>“Consumer Health Data Privacy Request”</strong>. Describe the action you want and provide an order reference if relevant. Do not include new medical information or identity documents in your initial message. We may ask for proportionate information to verify that the request concerns you.</p>
        <p>We will review the request, explain any limits on what we can do, and respond within the period required by applicable law. If you disagree with our response, reply with <strong>“Privacy Request Appeal”</strong> and explain why you would like it reviewed. You may also contact the privacy regulator or consumer protection authority responsible for your location.</p>
      </section>

      <section>
        <h2>6. Storage and changes to this disclosure</h2>
        <p>Health details entered in free-text fields may remain within the related order or correspondence; they are not automatically recognised or removed as health data. Contact us if you included information unnecessarily and want it reviewed for removal.</p>
        <p>We will update this disclosure if the storefront’s relevant practices change. The date above identifies the latest revision. Publishing an update does not itself provide any consent required for a new use of your health information.</p>
      </section>

      <section className={styles.contact}>
        <h2>Contact Mascot Apple Dealz</h2>
        <p><a href="mailto:mascotappledealzgh@gmail.com?subject=Consumer%20Health%20Data%20Privacy%20Request">mascotappledealzgh@gmail.com</a><br /><a href="tel:+233240613935">+233 24 061 3935</a></p>
        <p><Link href="/support">Customer support</Link><span aria-hidden="true"> · </span><Link href="/cookies">Cookie information</Link></p>
      </section>
    </article>
  </CommerceShell>;
}
