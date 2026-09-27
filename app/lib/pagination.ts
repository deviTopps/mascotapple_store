export const PAGE_SIZE = 24;

export function paginate<T>(items: T[], requested: string | null, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const value = Number(requested);
  const page = Number.isSafeInteger(value) && value > 0 ? Math.min(value, pages) : 1;
  const start = (page - 1) * size;
  return { items: items.slice(start, start + size), page, pages, start, end: Math.min(start + size, items.length) };
}
