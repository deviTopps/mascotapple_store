'use client';

import type { Product } from '../../lib/products';
import { configuredPrice } from '../../lib/product-options';
import { useCatalog } from '../../catalog-provider';
import { money } from '../../cart-store';
import { useVariant } from './variant-context';

export default function ProductPrice({ product }: { product: Product }) {
  const catalog = useCatalog();
  const current = catalog.find(item => item.slug === product.slug) ?? product;
  const { selections, quantity } = useVariant();
  const price = configuredPrice(current, selections);
  return <p className="product-detail-price" aria-live="polite" aria-atomic="true">{price === null ? 'Contact for price' : money(Math.round(price * 100) * quantity / 100)}{price !== null && quantity > 1 && <span className="product-price-breakdown">{quantity} × {money(price)} each</span>}</p>;
}
