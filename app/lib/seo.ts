import type { Product } from './products';

export const storeOrigin = process.env.SITE_URL || 'https://mascotapple-store.vercel.app';
export const storeUrl = (path: string) => new URL(path, storeOrigin).toString();
export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export function productStructuredData(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.longDescription || product.description,
    image: storeUrl(product.image),
    url: storeUrl(`/products/${encodeURIComponent(product.slug)}`),
    category: product.category,
    // No invented stock, ratings, reviews or brand claims.
    ...(product.priceValue !== null && product.priceValue > 0 ? {
      offers: {
        '@type': 'Offer', price: product.priceValue.toFixed(2), priceCurrency: 'GHS',
        url: storeUrl(`/products/${encodeURIComponent(product.slug)}`),
        seller: { '@type': 'Organization', name: 'Mascot Apple Dealz GH' },
      },
    } : {}),
  };
}
