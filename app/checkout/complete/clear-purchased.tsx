"use client";
import { useEffect } from "react";
import { removePurchased, type CartItem } from "../../cart-store";
export default function ClearPurchased({ reference, items }: { reference: string; items: CartItem[] }) {
  useEffect(() => { removePurchased(reference, items); }, [reference, items]);
  return null;
}
