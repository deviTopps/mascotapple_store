"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cartLineKey, validSelections, type Selections } from "./lib/product-options";
import { useCatalog } from "./catalog-provider";
import { createBrowserStore } from './lib/browser-store';

export type CartItem = { slug: string; quantity: number; selections?: Selections };
const cartStore = createBrowserStore('mascot-cart-v1', 'mascot-cart', '[]');
const { snapshot, subscribe } = cartStore;
function parse(raw: string): CartItem[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    return data.filter((item): item is CartItem => {
      if (!item || typeof item.slug !== "string" || seen.has(cartLineKey(item)) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return false;
      if (item.selections !== undefined && (!item.selections || typeof item.selections !== "object" || Array.isArray(item.selections) || Object.values(item.selections).some(value => typeof value !== "string"))) return false;
      seen.add(cartLineKey(item));
      return true;
    });
  } catch { return []; }
}
function save(items: CartItem[]) {
  cartStore.save(JSON.stringify(items));
}
// Remove only the purchased quantities, once per verified reference.
const completed = new Set<string>();
export function removePurchased(reference: string, purchased: CartItem[]) {
  const marker = `mascot-paid-${reference}`;
  if (completed.has(reference)) return;
  try { if (localStorage.getItem(marker)) return; } catch { /* Use the session marker below. */ }
  completed.add(reference);
  try { localStorage.setItem(marker, "1"); } catch { /* In-memory marker remains available. */ }
  const current = parse(snapshot());
  save(current.flatMap(item => {
    const quantity = item.quantity - (purchased.find(line => cartLineKey(line) === cartLineKey(item))?.quantity ?? 0);
    return quantity > 0 ? [{ ...item, quantity }] : [];
  }));
}
export function useCart() {
  const products = useCatalog();
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const items = parse(raw).filter(item => products.some(product => product.slug === item.slug));
  return {
    ready, items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    add(slug: string, selections: Selections) {
      if (!products.some(p => p.slug === slug) || !validSelections(slug, selections, products)) return false;
      const current = parse(snapshot());
      const incoming = { slug, selections, quantity: 1 };
      const id = cartLineKey(incoming);
      const existing = current.find(item => cartLineKey(item) === id);
      if (!existing && current.length >= 100) return false;
      if (existing && existing.quantity >= 99) return false;
      save(existing ? current.map(item => cartLineKey(item) === id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, incoming]);
      return true;
    },
    setQuantity(id: string, quantity: number) {
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) return;
      save(parse(snapshot()).flatMap(item => cartLineKey(item) !== id ? [item] : quantity ? [{ ...item, quantity }] : []));
    },
    setSelections(id: string, selections: Selections) {
      const current = parse(snapshot());
      const original = current.find(item => cartLineKey(item) === id);
      if (!original) return false;
      const updated = { ...original, selections };
      const nextId = cartLineKey(updated);
      const existing = current.find(item => cartLineKey(item) !== id && cartLineKey(item) === nextId);
      if (existing && existing.quantity + original.quantity > 99) return false;
      save(existing ? current.filter(item => cartLineKey(item) !== id).map(item => cartLineKey(item) === nextId ? { ...item, quantity: item.quantity + original.quantity } : item) : current.map(item => cartLineKey(item) === id ? updated : item));
      return true;
    },
    clear() { save([]); },
  };
}
export function CartLink() {
  const { count } = useCart();
  return <Link className="cart-link" href="/cart" aria-label={`Cart with ${count} items`}><ShoppingBag size={18} aria-hidden="true" /><span>Cart</span><span className="cart-count">{count}</span></Link>;
}
export function BuyButton({ slug, className }: { slug: string; className?: string }) {
  return <Link className={className} href={`/products/${slug}#product-options`}>Buy Now</Link>;
}
export function money(value: number) { return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(value); }
