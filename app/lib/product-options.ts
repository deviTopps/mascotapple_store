import { products, type Product } from "./products";

export type ProductOption = { id: string; label: string; values: string[] };
export type Selections = Record<string, string>;

// Placeholder catalog contract. Replace with backend option groups per product.
// These options do not imply availability or change the test catalog price.
const optionsByCategory: Record<string, ProductOption[]> = {
  iPhone: [{ id: "storage", label: "Storage", values: ["128 GB", "256 GB", "512 GB"] }, { id: "color", label: "Color", values: ["Black", "Blue", "Silver"] }],
  Mac: [{ id: "storage", label: "Storage", values: ["256 GB", "512 GB", "1 TB"] }, { id: "color", label: "Color", values: ["Silver", "Space Gray", "Midnight"] }],
  iPad: [{ id: "storage", label: "Storage", values: ["128 GB", "256 GB", "512 GB"] }, { id: "color", label: "Color", values: ["Blue", "Purple", "Space Gray"] }],
  Watch: [{ id: "size", label: "Case size", values: ["42 mm", "46 mm"] }, { id: "color", label: "Color", values: ["Silver", "Jet Black", "Rose Gold"] }],
  Audio: [{ id: "color", label: "Color", values: ["White"] }],
};

const colorOverrides: Record<string, string[]> = {
  "iphone-blue": ["Blue"], "iphone-pro-gold": ["Gold"], "iphone-pro-purple": ["Purple"],
  "iphone-17-pro": ["Silver", "Deep Blue", "Cosmic Orange"],
  "macbook-pro-silver": ["Silver"], "macbook-pro-dark": ["Space Black"],
  "macbook-air-dark": ["Midnight"], "imac-green": ["Green"],
};

export function getProductOptions(slug: string, catalog: Product[] = products): ProductOption[] {
  const product = catalog.find(item => item.slug === slug);
  if (product?.options) return product.options;
  return (optionsByCategory[product?.category ?? ""] ?? []).map(option => (
    option.id === "color" && colorOverrides[slug] ? { ...option, values: colorOverrides[slug] } : option
  ));
}

export function validSelections(slug: string, value: unknown, catalog: Product[] = products): value is Selections {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const selections = value as Selections;
  const options = getProductOptions(slug, catalog);
  return Object.keys(selections).length === options.length && options.every(option => option.values.includes(selections[option.id]));
}

export function selectionLabel(selections: Selections = {}) {
  return Object.values(selections).filter(Boolean).join(" · ");
}

export function cartLineKey(item: { slug: string; selections?: Selections }) {
  return JSON.stringify([item.slug, Object.entries(item.selections ?? {}).sort(([a], [b]) => a.localeCompare(b))]);
}
