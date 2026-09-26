import { Suspense } from "react";
import type { Metadata } from "next";
import Catalog from "./catalog";
import LoadingSkeleton from "../loading-skeleton";

export const metadata: Metadata = {
  title: "Shop Apple products | Mascot",
  description: "Explore iPhone, Mac, iPad, Apple Watch and AirPods. Filter by category and price in Ghana cedis.",
};

export default function ProductsPage() {
  return <Suspense fallback={<LoadingSkeleton view="shop" />}><Catalog /></Suspense>;
}
