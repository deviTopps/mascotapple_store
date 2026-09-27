"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Product } from "./lib/products";
import StoreUnavailable from './store-unavailable';
const CatalogContext = createContext<Product[] | null>(null);
export function CatalogProvider({ products, children }: { products: Product[] | null; children: React.ReactNode }) {
  const [catalog, setCatalog] = useState(products);
  const [failed, setFailed] = useState(false);
  const pathname = usePathname();
  const firstRender = useRef(true);
  const needsCatalog = pathname === '/' || pathname === '/cart' || pathname.startsWith('/products') || pathname.startsWith('/checkout');
  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    async function refresh() {
      if (!needsCatalog || document.visibilityState === "hidden") return;
      controller?.abort();
      const request = new AbortController();
      controller = request;
      try {
        const response = await fetch("/api/products", { cache: "no-store", signal: request.signal });
        if (!response.ok) throw new Error("Catalog unavailable");
        const data = await response.json();
        if (!Array.isArray(data.products)) throw new Error("Invalid catalog");
        if (active && !request.signal.aborted) {
          setCatalog(data.products);
          setFailed(false);
        }
      } catch {
        if (active && !request.signal.aborted) setFailed(true);
      }
    }
    // Refresh when returning or navigating, without duplicating the server's
    // initial catalog request on a full page load.
    if (!products || !firstRender.current) void refresh();
    firstRender.current = false;
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      controller?.abort();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [pathname, products, needsCatalog]);
  return <CatalogContext.Provider value={catalog ?? []}>{!catalog && needsCatalog ? <StoreUnavailable /> : children}{catalog && failed && needsCatalog && <p className="catalog-sync-notice" role="status">Product updates are temporarily unavailable. Refresh the page to try again.</p>}</CatalogContext.Provider>;
}
export function useCatalog() {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("CatalogProvider is required");
  return catalog;
}
