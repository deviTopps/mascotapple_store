import type { Metadata } from "next";
import "./globals.css";
import { getStoreProducts } from "./lib/store-backend";
import { CatalogProvider } from "./catalog-provider";
import { Suspense } from "react";
import LoadingSkeleton from "./loading-skeleton";
import CookieBanner from "./cookie-banner";
import localFont from 'next/font/local';
import { storeOrigin } from './lib/seo';

const figtree = localFont({ src: './fonts/Figtree.ttf', variable: '--font-figtree', weight: '300 900', display: 'swap' });

export const metadata: Metadata = {
  title: "Mascot Apple Dealz | All your Apple Products at Affordable Prices.",
  description: "Shop Apple devices, gaming products, laptops and accessories from Mascot Apple Dealz GH.",
  metadataBase: new URL(storeOrigin),
  ...(process.env.VERCEL_ENV === 'preview' ? { robots: { index: false, follow: false } } : {}),
};

async function StoreContent({ children }: Readonly<{ children: React.ReactNode }>) {
  // A catalog outage is an expected service failure, not a rendering error.
  const products = await getStoreProducts().catch(() => null);
  return <CatalogProvider products={products}>{children}</CatalogProvider>;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={figtree.variable}>
      <body><Suspense fallback={<LoadingSkeleton />}><StoreContent>{children}</StoreContent></Suspense><CookieBanner /></body>
    </html>
  );
}
