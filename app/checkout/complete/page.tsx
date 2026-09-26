import { recordBackendOrder } from "../../lib/store-backend";
import ClearPurchased from "./clear-purchased";
import SuccessIcon from "../success-icon";
import { displayOrderReference } from "../../lib/order-reference";
import type { CartItem } from "../../cart-store";
import Link from "next/link";
import { cookies } from "next/headers";
import CommerceShell from "../../commerce-shell";
import { paystack, readSession } from "../../lib/paystack";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PaymentComplete({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference } = await searchParams;
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const token = (await cookies()).get("mascot-payment")?.value;
  const session = secret && token ? readSession(token, secret) : null;
  let paid = false;
  let test = false;
  let purchased: CartItem[] = [];
  let message = "We couldn’t verify this payment session. If you were charged, keep your Paystack receipt and contact us before trying again.";
  if (secret?.startsWith("sk_test_") && session && session.reference === reference) {
    try {
      const transaction = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`, secret);
      paid = transaction.status === "success" && transaction.reference === session.reference && transaction.currency === "GHS" && transaction.amount === session.amount && transaction.metadata?.source === "mascot-store";
      test = transaction.domain === "test";
      paid = paid && test;
      if (paid) await recordBackendOrder(`/api/orders/${encodeURIComponent(reference)}/paid/`, { amount: transaction.amount, currency: transaction.currency, domain: transaction.domain });
      if (paid && Array.isArray(transaction.metadata?.order?.items)) purchased = transaction.metadata.order.items.map((item: CartItem) => ({ slug: item.slug, quantity: item.quantity, selections: item.selections }));
      if (!paid) message = "Your payment has not been confirmed. You can check again here, or return to checkout if payment was cancelled.";
    } catch { paid = false; message = "We couldn’t finish verifying and recording this payment. Please check again before attempting another payment."; }
  }
  return <CommerceShell><div className={`commerce-empty${paid ? " checkout-success" : ""}`}>{paid && <SuccessIcon />}<p className="commerce-eyebrow">{paid ? "PAYMENT VERIFIED" : "PAYMENT STATUS"}</p><h1>{paid ? test ? "Test payment successful" : "Thank you for your order" : "Payment not confirmed"}</h1><p>{paid ? test ? "No real payment was collected. This was a Paystack test transaction." : "Your payment is confirmed. Keep your reference for any questions about your order." : message}</p>{session && <p>Reference: {displayOrderReference(session.reference)}</p>}{paid ? <><p>Amount: GH₵{(session!.amount / 100).toFixed(2)}</p><Link className="commerce-button" href="/products">Continue shopping</Link><ClearPurchased reference={session!.reference} items={purchased} /></> : <><a className="commerce-button" href={reference ? `/checkout/complete?reference=${encodeURIComponent(reference)}` : "/checkout"}>Check again</a><Link href="/checkout">Return to checkout</Link></>}</div></CommerceShell>;
}
