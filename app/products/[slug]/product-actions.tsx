"use client";

import { useVariant } from "./variant-context";
import { useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import ProductOptions from "../../product-options";
import { configuredPrice, getProductOptions, validSelections, selectionLabel } from "../../lib/product-options";
import { useCatalog } from "../../catalog-provider";
import { useCart } from "../../cart-store";

export default function ProductActions({ productName, slug }: { productName: string; slug: string }) {
  const products = useCatalog();
  const [added, setAdded] = useState(false);
  const { selections, setSelections, quantity, setQuantity } = useVariant();
  const [error, setError] = useState("");
  const { add, ready } = useCart();
  const hasOptions = getProductOptions(slug, products).length > 0;
  const product = products.find(product => product.slug === slug);
  const price = product ? configuredPrice(product, selections) : null;
  if (product?.priceValue === null && !product.variantPrices?.length) return <div className="product-page-actions" id="product-options">
    <p>Contact us to confirm pricing and availability for {productName}.</p>
    <Link className="primary-button" href="/support">Ask about this product</Link>
  </div>;
  return <div className="product-page-actions" id="product-options">
    <h2 className="variant-heading">{hasOptions ? 'Make it yours' : 'Ready to order?'}</h2>
    {hasOptions && <p className="variant-note">Choose your preferred configuration.</p>}
    <ProductOptions slug={slug} selections={selections} onChange={value => { setSelections(value); setAdded(false); setError(""); }} />
    <div className="product-quantity"><label htmlFor="product-quantity">Quantity</label><div className="product-quantity-controls">
      <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => { setQuantity(quantity - 1); setAdded(false); setError(""); }}>−</button>
      <input id="product-quantity" type="number" min={1} max={99} step={1} value={quantity} onChange={event => { const next = Number(event.target.value); if (Number.isInteger(next) && next >= 1 && next <= 99) { setQuantity(next); setAdded(false); setError(""); } }} />
      <button type="button" aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => { setQuantity(quantity + 1); setAdded(false); setError(""); }}>+</button>
    </div></div>
    <button className="primary-button" disabled={!ready || price === null || !validSelections(slug, selections, products)} onClick={() => { if (add(slug, selections, quantity)) { setAdded(true); setError(""); } else setError("Your cart has reached its limit. Review your cart before adding more."); }}>
      {added ? "Add another" : "Add to cart"}{added ? <Check size={16} /> : <ShoppingBag size={16} />}
    </button>
    {error && <p role="alert">{error}</p>}
    {added && <Link className="checkout-link" href="/cart">View cart & checkout →</Link>}
    <p aria-live="polite" role="status">{added ? `${quantity} × ${productName}${hasOptions ? ` (${selectionLabel(selections)})` : ''} added to your cart.` : hasOptions && !validSelections(slug, selections, products) ? "Choose your options to add this product to your cart." : 'Add this product to your cart to continue.'}</p>
  </div>;
}
