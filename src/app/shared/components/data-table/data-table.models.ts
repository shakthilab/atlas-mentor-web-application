export type TableColumnType =
  | 'text'
  | 'two-line'
  | 'avatar'
  | 'pill'
  | 'star'
  | 'chips'
  | 'date'
  | 'mono-number'
  | 'custom'
  | 'actions';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  type: TableColumnType;
  align?: 'left' | 'center' | 'right';
  maxWidth?: string;
  headerClass?: string;
  valueFn?: (row: T) => string;
  subFn?: (row: T) => string;
  avatarFn?: (row: T) => string;
  classFn?: (row: T) => string;
  boolFn?: (row: T) => boolean;
  chipsFn?: (row: T) => string[];
  maxChips?: number;
  /** Plain value used for Excel/PDF export. Falls back to valueFn, then row[key]. */
  exportValueFn?: (row: T) => string | number;
  /** Shows a clickable sort indicator in the header and emits (sortChange) on click. */
  sortable?: boolean;
  /** Presence enables a header filter control for this column. Never shown for type 'actions'. */
  filter?: TableColumnFilter<T>;
}

export interface TableSortState {
  key: string;
  direction: 'asc' | 'desc';
}

export type TableFilterType =
  | 'text'
  | 'select'
  | 'multi-select'
  | 'boolean'
  | 'number-range'
  | 'date-range';

export interface TableFilterOption {
  value: string;
  label: string;
}

export interface TableColumnFilter<T = any> {
  type: TableFilterType;
  /** Static options for 'select'/'multi-select'. Can be overridden per-render by DataTableComponent's `filterOptions` input (e.g. async-loaded branch lists). */
  options?: TableFilterOption[];
  /**
   * Raw, comparable value used by the filter engine. Defaults to
   * exportValueFn -> valueFn -> row[key]. REQUIRED for 'number-range' and
   * 'date-range' (valueFn there is typically a formatted display string,
   * e.g. "$1,200" or "Aug 20, 2026"). Recommended for 'select' whenever the
   * displayed label differs from the raw enum, and REQUIRED whenever
   * `serverKey` is set — the value returned here must be in the same raw
   * form as the server-side param (e.g. a branch id, not a branch name).
   */
  getValue?: (row: T) => string | number | boolean | Date | null | undefined;
  placeholder?: string;
  trueLabel?: string;
  falseLabel?: string;
  /**
   * Optional hint only. The column is always filtered client-side
   * regardless of this value. A host component that wants a server
   * round-trip for this column reads `filterChange`, checks `serverKey`,
   * and triggers its own refetch — DataTableComponent itself never makes
   * any network call.
   */
  serverKey?: string;
}

export type TableColumnFilterState = Record<string, any>;
// 'text'          -> string | undefined
// 'select'        -> string | undefined
// 'multi-select'  -> string[]
// 'boolean'       -> boolean | null | undefined  (null/undefined = inactive; false is a real, active filter)
// 'number-range'  -> { min?: number; max?: number }
// 'date-range'    -> { start?: Date | string | null; end?: Date | string | null }

export interface TableFilterChangeEvent {
  filters: TableColumnFilterState;
  /** The column key that changed, or null when triggered by "clear all". */
  changedKey: string | null;
  /** Mirrors the changed column's filter.serverKey, if any. */
  serverKey?: string;
  cleared?: boolean;
}
