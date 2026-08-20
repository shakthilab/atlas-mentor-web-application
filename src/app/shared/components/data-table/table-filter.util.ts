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

// ---- Header-level column filters ----

import { TableColumn, TableColumnFilterState, TableFilterType } from './data-table.models';

/** Raw, comparable value for a column's filter, following the documented fallback chain. */
export function getFilterRawValue<T>(col: TableColumn<T>, row: T): any {
  if (col.filter?.getValue) return col.filter.getValue(row);
  if (col.filter?.type === 'boolean' && col.boolFn) return col.boolFn(row);
  if (col.exportValueFn) return col.exportValueFn(row);
  if (col.valueFn) return col.valueFn(row);
  return (row as any)?.[col.key];
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toNumber(raw: any): number {
  if (typeof raw === 'number') return raw;
  return parseFloat(String(raw ?? '').replace(/[^0-9.-]/g, ''));
}

function toDate(raw: any): Date | null {
  const d = raw instanceof Date ? raw : new Date(String(raw ?? ''));
  return isNaN(d.getTime()) ? null : d;
}

/** True when a column's active filter value matches the given row. Always true for 'actions' columns or an inactive filter value. */
export function matchesColumnFilter<T>(col: TableColumn<T>, row: T, filterValue: any): boolean {
  if (col.type === 'actions' || !col.filter) return true;
  if (!isFilterActive(col.filter.type, filterValue)) return true;

  const raw = getFilterRawValue(col, row);

  switch (col.filter.type) {
    case 'text':
      return String(raw ?? '').toLowerCase().includes(String(filterValue).toLowerCase());
    case 'select':
      return String(raw ?? '') === String(filterValue);
    case 'multi-select':
      return (filterValue as string[]).map(String).includes(String(raw ?? ''));
    case 'boolean':
      return Boolean(raw) === Boolean(filterValue);
    case 'number-range': {
      const n = toNumber(raw);
      if (Number.isNaN(n)) return false;
      const { min, max } = filterValue as { min?: number; max?: number };
      return !(min != null && n < min) && !(max != null && n > max);
    }
    case 'date-range': {
      const d = toDate(raw);
      if (!d) return false;
      const { start, end } = filterValue as { start?: Date | string | null; end?: Date | string | null };
      if (start && d < new Date(start)) return false;
      if (end && d > endOfDay(new Date(end))) return false;
      return true;
    }
    default:
      return true;
  }
}

/** Builds a single predicate that ANDs every column's active filter together. */
export function buildColumnFilterPredicate<T>(
  columns: TableColumn<T>[],
  filters: TableColumnFilterState
): (row: T) => boolean {
  const active = columns.filter((c) => c.filter && isFilterActive(c.filter.type, filters[c.key]));
  return (row: T) => active.every((c) => matchesColumnFilter(c, row, filters[c.key]));
}

export function applyColumnFilters<T>(
  rows: T[],
  columns: TableColumn<T>[],
  filters: TableColumnFilterState
): T[] {
  if (!rows.length) return rows;
  const predicate = buildColumnFilterPredicate(columns, filters);
  return rows.filter(predicate);
}

/** Whether a given filter value counts as "active" for its type (used for badges/clear-all/counts). */
export function isFilterActive(type: TableFilterType | undefined, value: any): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (type === 'number-range') return value?.min != null || value?.max != null;
  if (type === 'date-range') return !!value?.start || !!value?.end;
  return true; // boolean `false` correctly counts as an active filter here
}
