import type { Product } from "./products";

export function filterProducts(products: Product[], params: URLSearchParams) {
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const categories = params.getAll("category");
  const tags = params.getAll("tag");
  function priceBound(key: string) {
    const value = params.get(key);
    if (!value?.trim()) return undefined;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : undefined;
  }
  const min = priceBound("min");
  const max = priceBound("max");
  const results = products.filter((product) =>
    (!query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query)) &&
    (!categories.length || categories.includes(product.category)) &&
    (!tags.length || tags.includes(product.tag)) &&
    (min === undefined || (product.priceValue !== null && product.priceValue >= min)) &&
    (max === undefined || (product.priceValue !== null && product.priceValue <= max)));
  function comparePrice(a: Product, b: Product, direction: number) {
    if (a.priceValue === null) return b.priceValue === null ? 0 : 1;
    if (b.priceValue === null) return -1;
    return direction * (a.priceValue - b.priceValue);
  }
  switch (params.get("sort")) {
    case "price-asc": return results.sort((a, b) => comparePrice(a, b, 1));
    case "price-desc": return results.sort((a, b) => comparePrice(a, b, -1));
    case "name": return results.sort((a, b) => a.name.localeCompare(b.name));
    default: return results;
  }
}
