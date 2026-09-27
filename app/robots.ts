import type { MetadataRoute } from 'next';
import { storeUrl } from './lib/seo';

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === 'preview') return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/cart', '/checkout'] }, sitemap: storeUrl('/sitemap.xml') };
}
