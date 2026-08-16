export type TableColumnType =
  | 'text'
  | 'two-line'
  | 'avatar'
  | 'pill'
  | 'star'
  | 'chips'
  | 'date'
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
}
