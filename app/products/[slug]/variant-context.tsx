'use client';
import { createContext, useContext, useState } from 'react';
import type { Selections } from '../../lib/product-options';
const Context = createContext<{ selections: Selections; setSelections: (value: Selections) => void; quantity: number; setQuantity: (value: number) => void } | null>(null);
export function VariantProvider({ children }: { children: React.ReactNode }) {
  const [selections, setSelections] = useState<Selections>({});
  const [quantity, setQuantity] = useState(1);
  return <Context.Provider value={{ selections, setSelections, quantity, setQuantity }}>{children}</Context.Provider>;
}
export function useVariant() { const value = useContext(Context); if (!value) throw new Error('VariantProvider required'); return value; }
