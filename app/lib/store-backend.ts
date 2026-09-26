import { cache } from "react";
import { products, type Product } from "./products";

export const getStoreProducts = cache(async (): Promise<Product[]> => {
  if (!process.env.DJANGO_API_URL) return products;
  const response = await fetch(`${process.env.DJANGO_API_URL}/api/catalog/`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("Store catalog unavailable. Start the Django backend.");
  const data = await response.json();
  if (!Array.isArray(data?.products)) throw new Error("Store catalog response is invalid.");
  return data.products;
});

export async function recordBackendOrder(path: string, body: unknown) {
  if (!process.env.DJANGO_API_URL) throw new Error("Order storage is not configured.");
  if (!process.env.DJANGO_API_TOKEN) throw new Error("Store API is not configured.");
  const response = await fetch(`${process.env.DJANGO_API_URL}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DJANGO_API_TOKEN}` },
    body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("The order could not be saved. Please refresh your cart and try again.");
}
