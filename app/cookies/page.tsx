import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Cookie information | Mascot Apple Dealz' };

export default function CookieInformation() {
  return <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 100px', lineHeight: 1.7 }}>
    <Link href="/">← Back to the store</Link>
    <h1>Cookies and browser storage</h1>
    <p>We use cookies and local storage to support shopping. You can accept or reject optional services and change your choice using the Cookie settings button on every page.</p>
    <h2>Essential storage</h2>
    <p>Your cart and purchase markers are saved in this browser’s local storage. They remain until removed by the store or you clear your browser data. A checkout payment-session cookie may be set for up to 24 hours to verify your payment session. Administrator cookies support secure sign-in and protection against forged requests.</p>
    <p>Your cookie choice is stored locally for 180 days. We ask again when that choice expires. If browser storage is blocked, we remember your choice only for the current visit.</p>
    <h2>Optional Google address search</h2>
    <p>When enabled and available, checkout loads Google’s address-search service. Google receives connection information such as your IP address and the searches you enter, and may use its own storage. The selected delivery address is included with your order. You can always enter an address manually.</p>
    <p>Read <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google’s privacy information</a> for its handling of this data.</p>
    <h2>Changing your choice</h2>
    <p>Select Cookie settings, adjust the optional service and save. Rejecting optional services does not prevent shopping. If Google has already loaded, withdrawing permission reloads the page to stop it; unsaved checkout fields may be lost. This cannot undo data already sent to Google. You can remove previously stored site data through your browser settings.</p>
    <h2>Other connections</h2>
    <p>The store serves its typefaces directly, without contacting Google Fonts from your browser. If you choose online payment when available, you are redirected to Paystack, which provides its own privacy and cookie information. This store does not currently include advertising or analytics trackers.</p>
    <p>Questions? <Link href="/support">Contact the store.</Link></p>
  </main>;
}
