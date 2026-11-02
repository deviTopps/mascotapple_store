import type { Product } from './products';

// Verified existing iPhone 17 Pro gallery assets. Match the actual filename,
// rather than assuming that every product's gallery has the same ordering.
const knownPhotos: Record<string, string[]> = {
  '41PVsRxmokL._AC_.jpg': ['silver'],
  '61082220-7775-4e3b-a95c-ee565b3b9903.webp': ['cosmic orange', 'orange'],
  '51onh-WXsLL._AC_SL1380_-2.jpg': ['deep blue', 'blue'],
};
export function colorImageIndex(product: Product, images: string[], color: string): number {
  const normalized = color.trim().toLowerCase();
  if (!normalized) return 0;
  const position = Object.entries(product.colorImagePositions ?? {}).find(([name]) => name.trim().toLowerCase() === normalized)?.[1];
  if (Number.isInteger(position) && position! >= 1 && images[position! - 1]) return position! - 1;
  const known = images.findIndex(src => {
    const filename = src.split('?')[0].split('/').pop() ?? '';
    return knownPhotos[filename]?.includes(normalized);
  });
  return known >= 0 ? known : 0;
}
