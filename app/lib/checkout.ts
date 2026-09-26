import { validSelections, cartLineKey } from "./product-options";
import { products, type Product } from "./products";

export function validateOrder(body: unknown, catalog: Product[] = products) {
  if (!body || typeof body !== "object") throw new Error("Invalid order.");
  const input = body as Record<string, unknown>;
  function field(key: string, min: number, max: number) {
    const value = input[key];
    if (typeof value !== "string" || value.trim().length < min || value.length > max) throw new Error(`Please check your ${key}.`);
    return value.trim();
  }
  const paymentMethod = input.paymentMethod ?? "paystack";
  if (paymentMethod !== "paystack" && paymentMethod !== "cod") throw new Error("Choose a valid payment method.");
  const name = field("name", 2, 100);
  const email = field("email", 3, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
  const phone = field("phone", 7, 30);
  if (!/^[+\d\s().-]+$/.test(phone)) throw new Error("Please enter a valid phone number.");
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 100) throw new Error("Please review your cart.");
  const seen = new Set<string>();
  const items = input.items.map(item => {
    if (!item || typeof item.slug !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error("Invalid cart quantity or product.");
    const product = catalog.find(p => p.slug === item.slug);
    if (!product || product.priceValue === null) throw new Error("A product needs a confirmed price before checkout.");
    if (!validSelections(product.slug, item.selections, catalog)) throw new Error("Choose valid product options before checkout.");
    const id = cartLineKey(item);
    if (seen.has(id)) throw new Error("Duplicate product configuration.");
    seen.add(id);
    return { slug: product.slug, selections: item.selections, name: product.name, quantity: item.quantity as number, unitAmount: Math.round(product.priceValue * 100) };
  });
  const amount = items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
  const delivery = field("delivery", 1, 20);
  if (delivery !== "pickup" && delivery !== "delivery") throw new Error("Choose a delivery method.");
  if (delivery === "delivery" && amount <= 7500) throw new Error("Please choose store pickup for this order.");
  const address = delivery === "delivery" ? field("address", 8, 500) : "";
  const city = delivery === "delivery" ? field("city", 2, 100) : "";
  let location: { placeId: string; latitude: number; longitude: number } | null = null;
  if (delivery === "delivery" && input.location !== undefined && input.location !== "") {
    try {
      if (typeof input.location !== "string" || input.location.length > 1000) throw new Error();
      const value = JSON.parse(input.location);
      if (!value || typeof value.placeId !== "string" || !value.placeId.trim() || value.placeId.length > 300 || typeof value.latitude !== "number" || !Number.isFinite(value.latitude) || Math.abs(value.latitude) > 90 || typeof value.longitude !== "number" || !Number.isFinite(value.longitude) || Math.abs(value.longitude) > 180) throw new Error();
      location = { placeId: value.placeId, latitude: value.latitude, longitude: value.longitude };
    } catch { throw new Error("Please select your delivery location again or enter the address manually."); }
  }
  const notes = input.notes === undefined ? "" : field("notes", 0, 500);
  return { paymentMethod, name, email, phone, delivery, address, city, location, notes, items, amount, currency: "GHS" };
}
