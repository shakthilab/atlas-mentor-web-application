import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  TableColumn,
  TableColumnFilterState,
  TableFilterChangeEvent,
  TableFilterOption,
  TableSortState,
} from './data-table.models';
import { TableCellDefDirective } from './table-cell-def.directive';
import { TableRowActionsDirective } from './table-row-actions.directive';
import { TableExportService } from './table-export.service';
import { StatusPillComponent, StatusPillVariant } from '../status-pill/status-pill.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { applyColumnFilters, isFilterActive } from './table-filter.util';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    TablerIconsModule,
    StatusPillComponent,
    AvatarComponent,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T = any> implements AfterContentInit, OnDestroy {
  @Input() columns: TableColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() trackByKey = 'id';
  @Input() loading = false;
  @Input() hasError = false;
  @Input() errorMessage = 'Something went wrong loading this data.';
  @Input() emptyMessage = 'No records found.';
  @Input() mobileColumns: string[] = [];
  @Input() clickableRows = false;
  @Input() exportFileName?: string;

  /** Enables a checkbox selection column when true. */
  @Input() selectable = false;
  @Input() selectedRows: T[] = [];

  /** Controlled sort state — the column marked `sortable: true` matching `sortKey` shows the active indicator. */
  @Input() sortKey?: string;
  @Input() sortDirection: 'asc' | 'desc' = 'asc';

  /** Header column filters — see TableColumn.filter / data-table.models.ts. */
  @Input() columnFilters: TableColumnFilterState = {};
  @Output() columnFiltersChange = new EventEmitter<TableColumnFilterState>();
  @Output() filterChange = new EventEmitter<TableFilterChangeEvent>();
  /** Async-loaded option lists (e.g. branches fetched from an API), keyed by column key. Takes precedence over the column's static `filter.options`. */
  @Input() filterOptions?: Record<string, TableFilterOption[]>;
  @Input() noFilterResultsMessage = 'No rows match the current filters.';

  @Output() rowClick = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() sortChange = new EventEmitter<TableSortState>();

  @ContentChildren(TableCellDefDirective) cellDefs!: QueryList<TableCellDefDirective>;
  @ContentChild(TableRowActionsDirective) actionsDef?: TableRowActionsDirective;

  private cellTemplateMap = new Map<string, TemplateRef<any>>();

  /** In-progress values for the two-input number/date range filter panels, keyed by column key, merged into columnFilters on commit. */
  numberDraft: Record<string, { min?: number; max?: number }> = {};
  dateDraft: Record<string, { start?: string | null; end?: string | null }> = {};

  private filterInputSubject = new Subject<{ col: TableColumn<T>; value: any }>();
  private filterInputSub: Subscription;

  constructor(private exportService: TableExportService) {
    this.filterInputSub = this.filterInputSubject.pipe(debounceTime(300)).subscribe(({ col, value }) => {
      this.commitFilter(col, value);
    });
  }

  ngAfterContentInit(): void {
    this.rebuildCellTemplateMap();
    this.cellDefs.changes.subscribe(() => this.rebuildCellTemplateMap());
  }

  ngOnDestroy(): void {
    this.filterInputSub.unsubscribe();
  }

  private rebuildCellTemplateMap(): void {
    this.cellTemplateMap.clear();
    this.cellDefs.forEach((def) => this.cellTemplateMap.set(def.column, def.templateRef));
  }

  cellTemplate(key: string): TemplateRef<any> | undefined {
    return this.cellTemplateMap.get(key);
  }

  get primaryColumn(): TableColumn<T> | undefined {
    return (
      this.columns.find((c) => c.type === 'avatar' || c.type === 'two-line') ||
      this.columns.find((c) => c.type !== 'actions')
    );
  }

  get hasActionsColumn(): boolean {
    return this.columns.some((c) => c.type === 'actions');
  }

  get mobileDetailColumns(): TableColumn<T>[] {
    const primary = this.primaryColumn;
    if (this.mobileColumns.length) {
      return this.columns.filter(
        (c) => this.mobileColumns.includes(c.key) && c !== primary
      );
    }
    return this.columns
      .filter((c) => c.type !== 'actions' && c !== primary)
      .slice(0, 2);
  }

  trackByFn = (_: number, row: T): unknown => {
    return (row as any)?.[this.trackByKey] ?? row;
  };

  isEmptyValue(value?: string): boolean {
    return !value || value === '—' || value.toLowerCase() === 'not set';
  }

  /** Column classFn conventionally returns 'pill--success'/'pill--warning'/etc; maps that to app-status-pill's variant input. */
  pillVariant(cssClass?: string): StatusPillVariant {
    const variant = (cssClass || '').replace('pill--', '');
    const known: StatusPillVariant[] = ['success', 'warning', 'danger', 'info', 'neutral'];
    return (known as string[]).includes(variant) ? (variant as StatusPillVariant) : 'neutral';
  }

  onRowClick(row: T): void {
    if (this.clickableRows) {
      this.rowClick.emit(row);
    }
  }

  // ---- Selection ----
  private rowIdentity(row: T): unknown {
    return this.trackByFn(0, row);
  }

  isRowSelected(row: T): boolean {
    const id = this.rowIdentity(row);
    return this.selectedRows.some((r) => this.rowIdentity(r) === id);
  }

  toggleRow(row: T, event?: Event): void {
    event?.stopPropagation();
    const id = this.rowIdentity(row);
    const next = this.isRowSelected(row)
      ? this.selectedRows.filter((r) => this.rowIdentity(r) !== id)
      : [...this.selectedRows, row];
    this.selectionChange.emit(next);
  }

  get isAllSelected(): boolean {
    return this.filteredRows.length > 0 && this.filteredRows.every((row) => this.isRowSelected(row));
  }

  get isSomeSelected(): boolean {
    return this.filteredRows.some((row) => this.isRowSelected(row)) && !this.isAllSelected;
  }

  toggleSelectAll(event?: Event): void {
    event?.stopPropagation();
    this.selectionChange.emit(this.isAllSelected ? [] : [...this.filteredRows]);
  }

  // ---- Column filters ----
  get filteredRows(): T[] {
    return applyColumnFilters(this.rows, this.columns, this.columnFilters);
  }

  get hasActiveFilters(): boolean {
    return this.columns.some((c) => c.filter && isFilterActive(c.filter.type, this.columnFilters[c.key]));
  }

  get activeFilterCount(): number {
    return this.columns.filter((c) => c.filter && isFilterActive(c.filter.type, this.columnFilters[c.key])).length;
  }

  effectiveOptions(col: TableColumn<T>): TableFilterOption[] {
    return this.filterOptions?.[col.key] ?? col.filter?.options ?? [];
  }

  isColumnFilterActive(col: TableColumn<T>): boolean {
    return !!col.filter && isFilterActive(col.filter.type, this.columnFilters[col.key]);
  }

  selectedOptionValue(col: TableColumn<T>): string | undefined {
    return this.columnFilters[col.key];
  }

  isMultiSelectChecked(col: TableColumn<T>, optionValue: string): boolean {
    const current: string[] = this.columnFilters[col.key] || [];
    return current.map(String).includes(String(optionValue));
  }

  numberDraftValue(col: TableColumn<T>, bound: 'min' | 'max'): number | undefined {
    return this.numberDraft[col.key]?.[bound] ?? this.columnFilters[col.key]?.[bound];
  }

  dateDraftValue(col: TableColumn<T>, bound: 'start' | 'end'): string | null {
    return this.dateDraft[col.key]?.[bound] ?? this.columnFilters[col.key]?.[bound] ?? null;
  }

  /** Applies (and emits) a committed filter value immediately. */
  private commitFilter(col: TableColumn<T>, value: any): void {
    const next = { ...this.columnFilters };
    const inactive =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (col.filter?.type === 'number-range' && value.min == null && value.max == null) ||
      (col.filter?.type === 'date-range' && !value.start && !value.end);

    if (inactive) {
      delete next[col.key];
    } else {
      next[col.key] = value;
    }

    this.columnFilters = next;
    this.columnFiltersChange.emit(next);
    this.filterChange.emit({ filters: next, changedKey: col.key, serverKey: col.filter?.serverKey });
  }

  /** Debounced entry point for per-keystroke inputs (text, number-range). */
  private queueFilter(col: TableColumn<T>, value: any): void {
    this.filterInputSubject.next({ col, value });
  }

  onTextFilterInput(col: TableColumn<T>, event: Event): void {
    this.queueFilter(col, (event.target as HTMLInputElement).value);
  }

  onTextFilterEnter(col: TableColumn<T>, event: Event): void {
    this.commitFilter(col, (event.target as HTMLInputElement).value);
  }

  onNumberFilterInput(col: TableColumn<T>, bound: 'min' | 'max', event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw === '' ? undefined : Number(raw);
    const draft = { ...(this.numberDraft[col.key] || {}), [bound]: value };
    this.numberDraft[col.key] = draft;
    this.queueFilter(col, draft);
  }

  onDateFilterChange(col: TableColumn<T>, bound: 'start' | 'end', event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const draft = { ...(this.dateDraft[col.key] || {}), [bound]: raw || null };
    this.dateDraft[col.key] = draft;
    this.commitFilter(col, draft);
  }

  onSelectFilterChange(col: TableColumn<T>, value: string | null): void {
    this.commitFilter(col, value ?? undefined);
  }

  onMultiSelectFilterToggle(col: TableColumn<T>, optionValue: string, checked: boolean): void {
    const current: string[] = this.columnFilters[col.key] || [];
    const next = checked ? [...current, optionValue] : current.filter((v) => v !== optionValue);
    this.commitFilter(col, next);
  }

  onBooleanFilterChange(col: TableColumn<T>, value: boolean | null): void {
    this.commitFilter(col, value);
  }

  clearColumnFilter(col: TableColumn<T>): void {
    delete this.numberDraft[col.key];
    delete this.dateDraft[col.key];
    this.commitFilter(col, undefined);
  }

  clearAllFilters(): void {
    this.numberDraft = {};
    this.dateDraft = {};
    this.columnFilters = {};
    this.columnFiltersChange.emit({});
    this.filterChange.emit({ filters: {}, changedKey: null, cleared: true });
  }

  // ---- Sort ----
  onSortClick(col: TableColumn<T>): void {
    if (!col.sortable) return;
    const direction: 'asc' | 'desc' =
      this.sortKey === col.key && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key: col.key, direction });
  }

  get hasToolbar(): boolean {
    return !!this.exportFileName || this.columns.some((c) => !!c.filter);
  }

  exportExcel(): void {
    this.exportService.exportToExcel(this.columns, this.filteredRows, this.exportFileName || 'export');
  }

  exportPdf(): void {
    this.exportService.exportToPdf(this.columns, this.filteredRows, this.exportFileName || 'export');
  }
}
