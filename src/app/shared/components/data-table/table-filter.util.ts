export interface CompositeFilterValue {
  search: string;
  filters: Record<string, string>;
}

export function encodeCompositeFilter(search: string, filters: Record<string, string>): string {
  return JSON.stringify({ search: (search || '').trim().toLowerCase(), filters: filters || {} });
}

/**
 * Builds a MatTableDataSource-compatible filterPredicate that combines free-text
 * search (default: substring match across the stringified row) with exact-match
 * column filters, both encoded together into dataSource.filter via encodeCompositeFilter.
 */
export function createCompositePredicate<T>(
  filterFieldFn: (row: T, key: string) => string,
  searchFn?: (row: T, search: string) => boolean
): (row: T, filter: string) => boolean {
  const doSearch = searchFn || ((row: T, search: string) => JSON.stringify(row).toLowerCase().includes(search));

  return (row: T, filter: string) => {
    let parsed: CompositeFilterValue;
    try {
      parsed = JSON.parse(filter);
    } catch {
      parsed = { search: filter, filters: {} };
    }

    if (parsed.search && !doSearch(row, parsed.search)) return false;

    for (const key of Object.keys(parsed.filters || {})) {
      const value = parsed.filters[key];
      if (value && filterFieldFn(row, key) !== value) return false;
    }

    return true;
  };
}
