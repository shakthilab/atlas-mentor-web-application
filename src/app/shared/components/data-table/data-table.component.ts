import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TableColumn, TableFilterOption } from './data-table.models';
import { TableCellDefDirective } from './table-cell-def.directive';
import { TableRowActionsDirective } from './table-row-actions.directive';
import { TableExportService } from './table-export.service';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatMenuModule],
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
  @Input() filterOptions: TableFilterOption[] = [];
  @Input() exportFileName?: string;

  @Output() rowClick = new EventEmitter<T>();
  @Output() filterChange = new EventEmitter<Record<string, string>>();

  @ContentChildren(TableCellDefDirective) cellDefs!: QueryList<TableCellDefDirective>;
  @ContentChild(TableRowActionsDirective) actionsDef?: TableRowActionsDirective;

  activeFilters: Record<string, string> = {};
  filtersOpen = false;

  private cellTemplateMap = new Map<string, TemplateRef<any>>();

  constructor(
    private exportService: TableExportService,
    private elementRef: ElementRef<HTMLElement>
  ) {}

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

  onRowClick(row: T): void {
    if (this.clickableRows) {
      this.rowClick.emit(row);
    }
  }

  get hasToolbar(): boolean {
    return !!(this.filterOptions?.length || this.exportFileName);
  }

  get activeFilterCount(): number {
    return Object.values(this.activeFilters).filter((v) => !!v).length;
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.filtersOpen && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.filtersOpen = false;
    }
  }

  onFilterValueChange(key: string, value: string): void {
    const next = { ...this.activeFilters };
    if (value) {
      next[key] = value;
    } else {
      delete next[key];
    }
    this.activeFilters = next;
    this.filterChange.emit(this.activeFilters);
  }

  clearFilters(): void {
    this.activeFilters = {};
    this.filterChange.emit(this.activeFilters);
  }

  exportExcel(): void {
    this.exportService.exportToExcel(this.columns, this.rows, this.exportFileName || 'export');
  }

  exportPdf(): void {
    this.exportService.exportToPdf(this.columns, this.rows, this.exportFileName || 'export');
  }
}
