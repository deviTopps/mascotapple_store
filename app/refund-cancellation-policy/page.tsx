import type { Metadata } from 'next';
import InformationPage from '../information-page';

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy | Mascot Apple Dealz',
  description: 'How to request a cancellation, report a product issue or ask about a refund from Mascot Apple Dealz GH.',
  alternates: { canonical: '/refund-cancellation-policy' },
};

export default function RefundPolicyPage() {
  return <InformationPage title="Refund and Cancellation Policy" intro="Our store policy is exchange-only after purchase: we do not offer refunds for a change of mind. Contact us if you would like to change your purchase to a different product. This policy is subject to your rights under applicable law." policy>
    <section>
      <h2>1. Cancelling an order</h2>
      <p>Contact us as soon as you want to cancel, particularly before pickup or dispatch. Include your order reference, the item and your contact details. A support request is not an automatic cancellation; we will confirm the order status and next steps. This confirmation process does not remove a cancellation right you have under law.</p>
    </section>
    <section>
      <h2>2. Your consumer rights</h2>
      <p>Where section 49 of Ghana’s Electronic Transactions Act, 2008 (Act 772) applies, consumers may cancel an online purchase of goods within 14 days of receiving them, without giving a reason or paying a penalty; the direct cost of returning goods may apply. Statutory exceptions apply, including certain customised goods and unsealed software. Contact us if you are unsure whether an exception affects your order.</p>
      <p>This policy does not exclude your rights concerning faulty, damaged, incorrect or misdescribed goods. Where a refund or cancellation is required by law, those rights take priority over our exchange-only store policy.</p>
      <p><a href="https://www.brr.gov.gh/acc/registry/docs/ELECTRONIC%20TRANSACTIONS%20ACT%2C%202008%20%28ACT%20772%29.pdf">Read Ghana’s Electronic Transactions Act</a> (sections 47–49).</p>
    </section>
    <section>
      <h2>3. Damaged, faulty or incorrect items</h2>
      <p>Tell us what happened and provide your order reference. Clear photos of the item and packaging can help us assess the issue. Keep the item and any supplied accessories while we arrange the appropriate next step. We will explain whether a return, repair, replacement or refund applies to your case under the relevant terms and law.</p>
    </section>
    <section>
      <h2>4. Exchanges and returns</h2>
      <p>To request a different product, contact us with your order reference and the product you would like instead. We will confirm the item’s condition, replacement availability and any price difference before arranging an exchange. An exchange is not confirmed until the arrangements have been agreed; do not send an item without contacting us for instructions.</p>
      <p>Contact us for the correct return location and instructions before sending a device. Keep proof of return. Where possible, include the original packaging and accessories; missing packaging does not automatically remove a statutory right.</p>
      <p>Back up your personal data, sign out of personal accounts and remove SIM cards before handing over a device. If a fault prevents this, tell us. Do not share your account password. We will explain any applicable return costs when arranging the return.</p>
    </section>
    <section>
      <h2>5. Refunds and payment</h2>
      <p>We do not offer voluntary refunds after purchase; our store policy provides for requests to exchange for another product. If a refund is required by law, it relates to money actually paid. An unpaid pay-on-delivery order or a transaction marked as test mode has no collected online payment to refund. Where a refund is due, we will confirm the amount, payment method and processing steps, and follow any applicable legal deadline.</p>
      <p>If we cannot fulfil an order because the goods are unavailable, section 48 of Act 772 requires notification and repayment within seven days of that notification. Your bank or payment provider may have additional posting time; contact us if an expected refund is missing.</p>
    </section>
  </InformationPage>;
}
