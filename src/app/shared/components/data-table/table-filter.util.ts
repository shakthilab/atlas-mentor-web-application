/**
 * Builds a MatTableDataSource-compatible filterPredicate for free-text search
 * (default: substring match across the stringified row), paired with
 * encodeSearch for the value assigned to dataSource.filter.
 */
export function createSearchPredicate<T>(
  searchFn?: (row: T, search: string) => boolean
): (row: T, filter: string) => boolean {
  const doSearch = searchFn || ((row: T, search: string) => JSON.stringify(row).toLowerCase().includes(search));
  return (row: T, filter: string) => !filter || doSearch(row, filter);
}

export function encodeSearch(search: string): string {
  return (search || '').trim().toLowerCase();
}
