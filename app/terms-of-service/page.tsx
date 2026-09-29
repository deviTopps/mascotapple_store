import type { Metadata } from 'next';
import Link from 'next/link';
import InformationPage from '../information-page';

export const metadata: Metadata = {
  title: 'Terms of Service | Mascot Apple Dealz',
  description: 'Terms for using the Mascot Apple Dealz storefront, placing orders and contacting customer support.',
  alternates: { canonical: '/terms-of-service' },
};

export default function TermsPage() {
  return <InformationPage title="Terms of Service" intro="Please read these terms before placing an order with Mascot Apple Dealz GH." policy>
    <section>
      <h2>1. Using our store</h2>
      <p>Use the website lawfully and provide accurate contact and delivery information. You must be legally able to make a purchase, or have the appropriate permission from a parent or guardian. Do not interfere with the website, attempt unauthorised access or submit fraudulent orders.</p>
    </section>
    <section>
      <h2>2. Products and prices</h2>
      <p>Prices are shown in Ghana cedis (GHS). Check the product description, selected options and order total before submitting. Images illustrate products; screen colours can differ from the physical item. Contact us to confirm any specification, condition or included accessory that is not clear from the listing.</p>
      <p>Availability and prices can change before an order is placed. If an error or availability issue affects your order, we will contact you to discuss the next step. We will not substitute an item or increase an agreed price without your consent.</p>
    </section>
    <section>
      <h2>3. Orders and payment</h2>
      <p>An order reference records your request; it is not proof that payment has been received or that an item has been dispatched. Keep your reference for enquiries. Review the payment option you select: pay-at-pickup or pay-on-delivery orders are payable when received. Any checkout explicitly marked as test mode does not collect a real online payment.</p>
      <p>Never send passwords, card security codes or one-time payment codes to customer support.</p>
    </section>
    <section>
      <h2>4. Pickup and delivery</h2>
      <p>Available fulfilment options and charges are shown at checkout. Provide an accurate address and phone number, and contact us to confirm pickup arrangements or delivery timing. If an order cannot be fulfilled, we will explain the issue and handle any cancellation or refund under the applicable policy and law.</p>
    </section>
    <section>
      <h2>5. Cancellations, refunds and product issues</h2>
      <p>Our store policy is exchange-only after purchase, with no voluntary change-of-mind refunds. Read our <Link href="/refund-cancellation-policy">Refund and Cancellation Policy</Link> for exchange requests and applicable legal rights, which take priority over this policy. Contact us about damaged, faulty or incorrect goods. Any additional warranty depends on the product and the terms provided with it; these terms do not remove your statutory rights.</p>
    </section>
    <section>
      <h2>6. Content and privacy</h2>
      <p>Product names, logos and other third-party content belong to their respective owners. Their appearance does not itself mean that Mascot Apple Dealz is an authorised representative of a manufacturer.</p>
      <p>We use the details you provide to handle your order and support requests. See our <Link href="/cookies">cookie information</Link> and <Link href="/consumer-health-data-privacy">Consumer Health Data Privacy Disclosure</Link> for those specific topics. Third-party services may have their own terms and privacy notices.</p>
    </section>
    <section>
      <h2>7. Questions, rights and updates</h2>
      <p>Contact us first if something goes wrong so we can help resolve it. These terms are subject to applicable Ghanaian law and do not limit consumer rights, remedies or liabilities that cannot lawfully be excluded. You may use any complaint or dispute-resolution channels available under applicable law.</p>
      <p>We may update these terms for future use of the store. Updates do not retrospectively remove rights relating to an existing order. The date above identifies this version.</p>
    </section>
  </InformationPage>;
}
