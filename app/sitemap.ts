import type { MetadataRoute } from 'next';
import { getStoreProducts } from './lib/store-backend';
import { storeUrl } from './lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getStoreProducts();
  return [
    ...['/', '/products', '/about', '/refund-cancellation-policy', '/terms-of-service', '/support', '/cookies', '/consumer-health-data-privacy'].map(path => ({ url: storeUrl(path) })),
    ...products.map(product => ({ url: storeUrl(`/products/${encodeURIComponent(product.slug)}`) })),
  ];
}
