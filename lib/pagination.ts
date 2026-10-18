export const MAX_PAGE_SIZE = 20;

/** Never returns more than MAX_PAGE_SIZE items — there is no "give me everything" endpoint. */
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const size = Math.min(Math.max(1, Math.floor(pageSize) || 10), MAX_PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { items: items.slice((p - 1) * size, p * size), page: p, pages, pageSize: size, total: items.length };
}
