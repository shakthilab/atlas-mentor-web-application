import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TableColumn, TableSortState } from './data-table.models';
import { TableCellDefDirective } from './table-cell-def.directive';
import { TableRowActionsDirective } from './table-row-actions.directive';
import { TableExportService } from './table-export.service';
import { StatusPillComponent, StatusPillVariant } from '../status-pill/status-pill.component';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, TablerIconsModule, StatusPillComponent, AvatarComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T = any> implements AfterContentInit {
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

  @Output() rowClick = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() sortChange = new EventEmitter<TableSortState>();

  @ContentChildren(TableCellDefDirective) cellDefs!: QueryList<TableCellDefDirective>;
  @ContentChild(TableRowActionsDirective) actionsDef?: TableRowActionsDirective;

  private cellTemplateMap = new Map<string, TemplateRef<any>>();

  constructor(private exportService: TableExportService) {}

  ngAfterContentInit(): void {
    this.rebuildCellTemplateMap();
    this.cellDefs.changes.subscribe(() => this.rebuildCellTemplateMap());
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
    return this.rows.length > 0 && this.rows.every((row) => this.isRowSelected(row));
  }

  get isSomeSelected(): boolean {
    return this.rows.some((row) => this.isRowSelected(row)) && !this.isAllSelected;
  }

  toggleSelectAll(event?: Event): void {
    event?.stopPropagation();
    this.selectionChange.emit(this.isAllSelected ? [] : [...this.rows]);
  }

  // ---- Sort ----
  onSortClick(col: TableColumn<T>): void {
    if (!col.sortable) return;
    const direction: 'asc' | 'desc' =
      this.sortKey === col.key && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key: col.key, direction });
  }

  get hasToolbar(): boolean {
    return !!this.exportFileName;
  }

  exportExcel(): void {
    this.exportService.exportToExcel(this.columns, this.rows, this.exportFileName || 'export');
  }

  exportPdf(): void {
    this.exportService.exportToPdf(this.columns, this.rows, this.exportFileName || 'export');
  }
}
