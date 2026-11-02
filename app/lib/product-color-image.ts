import type { Product } from './products';
import catalogPhotos from './product-color-photos.json';

export function matchingColorImageIndex(product: Product, images: string[], color: string): number | null {
  const normalized = color.trim().toLowerCase();
  if (!normalized) return null;
  const position = Object.entries(product.colorImagePositions ?? {}).find(([name]) => name.trim().toLowerCase() === normalized)?.[1];
  if (Number.isInteger(position) && position! >= 1 && images[position! - 1]) return position! - 1;
  const photos: Record<string, string> = catalogPhotos[product.slug as keyof typeof catalogPhotos] ?? {};
  const filename = Object.entries(photos).find(([name]) => name.toLowerCase() === normalized)?.[1];
  if (!filename) return null;
  const index = images.findIndex(src => src.split('?')[0].split('/').pop() === filename);
  return index >= 0 ? index : null;
}
export function colorImageIndex(product: Product, images: string[], color: string): number {
  return matchingColorImageIndex(product, images, color) ?? 0;
}
