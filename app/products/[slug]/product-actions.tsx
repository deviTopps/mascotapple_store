"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import ProductOptions from "../../product-options";
import { getProductOptions, validSelections, selectionLabel, type Selections } from "../../lib/product-options";
import { useCatalog } from "../../catalog-provider";
import { useCart } from "../../cart-store";

export default function ProductActions({ productName, slug }: { productName: string; slug: string }) {
  const products = useCatalog();
  const [added, setAdded] = useState(false);
  const [selections, setSelections] = useState<Selections>({});
  const [error, setError] = useState("");
  const { add, ready } = useCart();
  const hasOptions = getProductOptions(slug, products).length > 0;
  if (products.find(product => product.slug === slug)?.priceValue === null) return <div className="product-page-actions" id="product-options">
    <p>Contact us to confirm pricing and availability for {productName}.</p>
    <Link className="primary-button" href="/support">Ask about this product</Link>
  </div>;
  return <div className="product-page-actions" id="product-options">
    <h2 className="variant-heading">{hasOptions ? 'Make it yours' : 'Ready to order?'}</h2>
    {hasOptions && <p className="variant-note">Choose your preferred configuration.</p>}
    <ProductOptions slug={slug} selections={selections} onChange={value => { setSelections(value); setAdded(false); setError(""); }} />
    <button className="primary-button" disabled={!ready || !validSelections(slug, selections, products)} onClick={() => { if (add(slug, selections)) { setAdded(true); setError(""); } else setError("Your cart has reached its limit. Review your cart before adding more."); }}>
      {added ? "Add another" : "Add to cart"}{added ? <Check size={16} /> : <ShoppingBag size={16} />}
    </button>
    {error && <p role="alert">{error}</p>}
    {added && <Link className="checkout-link" href="/cart">View cart & checkout →</Link>}
    <p aria-live="polite" role="status">{added ? `${productName}${hasOptions ? ` (${selectionLabel(selections)})` : ''} added to your cart.` : hasOptions ? "Choose your options to add this product to your cart." : 'Add this product to your cart to continue.'}</p>
  </div>;
}
