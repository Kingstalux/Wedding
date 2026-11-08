/**
 * One page of a list. The page is kept in range, so when a filter or a
 * removal shortens the list you land on its last page, never an empty one.
 * `page` is 1-based; `from`/`to` are the 1-based positions shown (0–0 when empty).
 */
export function paginate<T>(all: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(all.length / size))
  const current = Math.min(Math.max(1, page), pageCount)
  const start = (current - 1) * size
  const items = all.slice(start, start + size)
  return {
    items,
    page: current,
    pageCount,
    from: items.length ? start + 1 : 0,
    to: start + items.length,
    total: all.length,
  }
}
