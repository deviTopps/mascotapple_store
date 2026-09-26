import type { Metadata } from "next";
import "./globals.css";
import { getStoreProducts } from "./lib/store-backend";
import { CatalogProvider } from "./catalog-provider";
import StoreUnavailable from "./store-unavailable";
import { Suspense } from "react";
import LoadingSkeleton from "./loading-skeleton";

export const metadata: Metadata = {
  title: "Morrow | Thoughtfully chosen technology",
  description: "The latest Apple devices, thoughtfully chosen for how you live, create, and connect.",
};

async function StoreContent({ children }: Readonly<{ children: React.ReactNode }>) {
  // A catalog outage is an expected service failure, not a rendering error.
  const products = await getStoreProducts().catch(() => null);
  return products ? <CatalogProvider products={products}>{children}</CatalogProvider> : <StoreUnavailable />;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet" />
      </head>
      <body><Suspense fallback={<LoadingSkeleton />}><StoreContent>{children}</StoreContent></Suspense></body>
    </html>
  );
}
