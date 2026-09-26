import { getStoreProducts } from "../../lib/store-backend";

export async function GET() {
  try {
    return Response.json({ products: await getStoreProducts() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Product catalog is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
