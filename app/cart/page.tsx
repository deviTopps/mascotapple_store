"use client";

import { useState } from "react";
import ProductOptions from "../product-options";
import { cartLineKey, validSelections } from "../lib/product-options";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import CommerceShell from "../commerce-shell";
import { useCart, money } from "../cart-store";
import { useCatalog } from "../catalog-provider";
import LoadingSkeleton from "../loading-skeleton";

export default function CartPage() {
  const products = useCatalog();
  const { items, count, ready, setQuantity, setSelections } = useCart();
  const [error, setError] = useState("");
  const lines = items.map(item => ({ ...item, product: products.find(p => p.slug === item.slug)! }));
  const needsOptions = lines.some(line => !validSelections(line.slug, line.selections, products));
  const needsQuote = lines.some(line => line.product.priceValue === null);
  const subtotal = lines.reduce((sum, line) => sum + (line.product.priceValue ?? 0) * line.quantity, 0);
  return <CommerceShell><p className="commerce-eyebrow">YOUR SELECTION</p><h1>Your cart <span>({count})</span></h1>
    {!ready ? <LoadingSkeleton view="cart" embedded /> : !lines.length ? <div className="commerce-empty"><ShoppingBag size={36} /><h2>Your cart is empty</h2><p>Find something you love in the collection.</p><Link className="commerce-button" href="/products">Explore products</Link></div> : <div className="commerce-grid"><section aria-label="Cart items" className="cart-lines">{lines.map(({ product, quantity, selections }) => <article className="cart-line" key={cartLineKey({ slug: product.slug, selections })}>
      <Link href={`/products/${product.slug}`} className="cart-image"><Image src={product.image} alt={product.imageAlt} width={112} height={112} /></Link>
      <div className="cart-line-copy"><Link href={`/products/${product.slug}`}><h2>{product.name}</h2></Link><p>{product.priceValue === null ? "Price confirmation required" : `${money(product.priceValue)} each`}</p><ProductOptions slug={product.slug} selections={selections ?? {}} onChange={value => { const ok = setSelections(cartLineKey({ slug: product.slug, selections }), value); setError(ok ? "" : "This configuration would exceed 99 items. Reduce the quantity first."); }} /><div className="quantity-control"><button disabled={quantity === 1} aria-label={`Decrease ${product.name} quantity`} onClick={() => setQuantity(cartLineKey({ slug: product.slug, selections }), quantity - 1)}><Minus size={14} /></button><span aria-label={`Quantity ${quantity}`}>{quantity}</span><button disabled={quantity === 99} aria-label={`Increase ${product.name} quantity`} onClick={() => setQuantity(cartLineKey({ slug: product.slug, selections }), quantity + 1)}><Plus size={14} /></button></div></div>
      <div className="cart-line-end"><strong>{product.priceValue === null ? "On request" : money(product.priceValue * quantity)}</strong><button className="remove-item" onClick={() => setQuantity(cartLineKey({ slug: product.slug, selections }), 0)} aria-label={`Remove ${product.name}`}><Trash2 size={14} /> Remove</button></div>
    </article>)}</section><aside className="commerce-summary"><h2>Order summary</h2><p className="commerce-note">Your selected options are saved with each item.</p>{error && <p className="commerce-error" role="alert">{error}</p>}<div className="summary-row"><span>{needsQuote ? "Priced items subtotal" : "Subtotal"}</span><strong>{money(subtotal)}</strong></div><p className="commerce-note">Review delivery and your total at checkout.</p>{needsOptions ? <div className="commerce-notice" role="status">Choose the options for each item before checking out.</div> : needsQuote ? <div className="commerce-notice">Some items need a confirmed price. Remove them to pay for your priced items, or <Link href="/support">contact us for pricing</Link>.</div> : <Link href="/checkout" className="commerce-button">Proceed to checkout →</Link>}<Link className="commerce-secondary" href="/products">Continue shopping</Link></aside></div>}
  </CommerceShell>;
}
