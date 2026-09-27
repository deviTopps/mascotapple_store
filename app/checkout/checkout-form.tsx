"use client";

import { useState, useRef, type FormEvent } from "react";
import Link from "next/link";
import DeliveryAddress from "./delivery-address";
import SuccessIcon from "./success-icon";
import LoadingSkeleton from "../loading-skeleton";
import { displayOrderReference } from "../lib/order-reference";
import { LockKeyhole } from "lucide-react";
import { useCart, money, removePurchased, type CartItem } from "../cart-store";
import { cartLineKey, validSelections, selectionLabel } from "../lib/product-options";
import { useCatalog } from "../catalog-provider";

export default function CheckoutForm({ configured }: { configured: boolean }) {
  const products = useCatalog();
  const { items, ready } = useCart();
  const [requestedDelivery, setDelivery] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [receipt, setReceipt] = useState<{ reference: string; amount: number; delivery: string } | null>(null);
  const attempt = useRef<{ payload: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState("");
  const lines = items.map(item => ({ ...item, product: products.find(p => p.slug === item.slug)! }));
  const subtotal = lines.reduce((sum, line) => sum + (line.product.priceValue ?? 0) * line.quantity, 0);
  const delivery = subtotal > 75 ? requestedDelivery : 'pickup';
  const needsQuote = lines.some(line => line.product.priceValue === null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const payload = { items, ...fields, paymentMethod, expectedAmount: Math.round(subtotal * 100) };
    const serialized = JSON.stringify(payload);
    if (!attempt.current || attempt.current.payload !== serialized) attempt.current = { payload: serialized, id: crypto.randomUUID() };
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, requestId: attempt.current.id }), signal: AbortSignal.timeout(30000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Checkout could not start. Please try again.");
      if (result.paymentMethod === "cod") {
        setReceipt({ reference: result.reference, amount: result.amount, delivery: result.delivery });
        removePurchased(result.reference, result.items as CartItem[]);
        setBusy(false);
      } else window.location.assign(result.url);
    } catch (err) { setError(err instanceof DOMException && err.name === 'TimeoutError' ? 'Confirmation is taking longer than expected. Retry with this page open so your order is not duplicated.' : err instanceof SyntaxError ? 'The store is temporarily unavailable. Please retry with this page open.' : err instanceof Error ? err.message : "Unable to connect. Please try again."); setBusy(false); inFlight.current = false; }
  }
  if (receipt) return <section className="commerce-empty checkout-success" aria-live="polite"><SuccessIcon /><h2>Order placed successfully</h2><p>Thank you! Your order has been saved.</p><p>Reference: <strong>{displayOrderReference(receipt.reference)}</strong></p><p>Amount due {receipt.delivery === "pickup" ? "at pickup" : "on delivery"}: <strong>{money(receipt.amount / 100)}</strong></p><p className="commerce-note">No online payment was taken. Please pay when you receive your order.</p><Link className="commerce-button" href="/products">Continue shopping</Link></section>;
  if (!ready) return <LoadingSkeleton view="checkout" embedded />;
  if (!items.length) return <div className="commerce-empty"><h2>Your cart is empty</h2><Link className="commerce-button" href="/products">Browse products</Link></div>;
  if (lines.some(line => !validSelections(line.slug, line.selections, products))) return <div className="commerce-notice">Please <Link href="/cart">choose options for each item in your cart</Link> before checking out.</div>;
  if (needsQuote) return <div className="commerce-notice">Your cart contains items that need a confirmed price. <Link href="/cart">Review your cart</Link> before paying.</div>;
  return <form className="commerce-grid" onSubmit={submit}><section className="checkout-fields"><h2>Contact details</h2><label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label><div className="field-row"><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} /></label></div><h2>Delivery</h2><label>How would you like your order?<select name="delivery" value={delivery} onChange={event => setDelivery(event.target.value)}><option value="pickup">Store pickup · Free</option>{subtotal > 75 && <option value="delivery">Delivery · Free</option>}</select></label>{delivery === "delivery" && <DeliveryAddress />}<fieldset className="payment-methods"><legend>Payment method</legend><label><input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} /><span><strong>{delivery === "pickup" ? "Pay at pickup" : "Pay on delivery"}</strong><small>Place your order now and pay when you receive it.</small></span></label><label><input type="radio" name="paymentMethod" value="paystack" checked={paymentMethod === "paystack"} onChange={() => setPaymentMethod("paystack")} /><span><strong>Pay online with Paystack</strong><small>Test mode · No real online charge.</small></span></label></fieldset><details className="checkout-notes"><summary>Add order notes <span>(optional)</span></summary><label><span className="checkout-sr-only">Order notes</span><textarea name="notes" maxLength={500} rows={2} placeholder="Delivery instructions or anything else we should know" /></label></details></section><aside className="commerce-summary"><h2>Your order</h2>{paymentMethod === "paystack" && <p className="commerce-notice">Test checkout · No real money will be collected.</p>}{lines.map(({ product, quantity, selections }) => <div className="summary-row" key={cartLineKey({ slug: product.slug, selections })}><span>{product.name} <small>× {quantity}</small><small className="order-variant">{selectionLabel(selections)}</small></span><strong>{money(product.priceValue! * quantity)}</strong></div>)}<div className="summary-row"><span>{delivery === "pickup" ? "Store pickup" : "Delivery"}</span><span>Free</span></div><div className="summary-row summary-total"><span>Total</span><strong>{money(subtotal)}</strong></div>{paymentMethod === "paystack" && !configured && <p className="commerce-notice">Online payment is not available yet. Choose pay on delivery, or <Link href="/support">contact us</Link>.</p>}{error && <p className="commerce-error" role="alert">{error}</p>}<button className="commerce-button" disabled={busy || (paymentMethod === "paystack" && !configured)} type="submit">{busy ? paymentMethod === "cod" ? "Placing your order…" : "Opening Paystack…" : paymentMethod === "cod" ? "Place order" : `Pay ${money(subtotal)}`}</button>{paymentMethod === "paystack" ? <p className="secure-note"><LockKeyhole size={14} /> Secure checkout with Paystack</p> : <p className="secure-note">Payment due when you receive your order.</p>}<Link className="commerce-secondary" href="/cart">Edit cart</Link></aside></form>;
}
