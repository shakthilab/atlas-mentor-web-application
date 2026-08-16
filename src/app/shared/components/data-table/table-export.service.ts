import { Injectable } from '@angular/core';
import { TableColumn } from './data-table.models';

@Injectable({ providedIn: 'root' })
export class TableExportService {
  async exportToExcel<T>(columns: TableColumn<T>[], rows: T[], filename: string): Promise<void> {
    const cols = this.exportableColumns(columns);
    const writeXlsxFile = (await import('write-excel-file/browser')).default;

    const sheetData = [
      cols.map((c) => ({ value: c.header, fontWeight: 'bold' as const })),
      ...rows.map((row) => cols.map((c) => ({ value: this.getValue(c, row) }))),
    ];

    await writeXlsxFile(sheetData as any).toFile(this.withExtension(filename, 'xlsx'));
  }

  async exportToPdf<T>(columns: TableColumn<T>[], rows: T[], filename: string): Promise<void> {
    const cols = this.exportableColumns(columns);
    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: cols.length > 5 ? 'landscape' : 'portrait' });
    autoTable(doc, {
      head: [cols.map((c) => c.header)],
      body: rows.map((row) => cols.map((c) => String(this.getValue(c, row)))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [97, 93, 255] },
    });

    doc.save(this.withExtension(filename, 'pdf'));
  }

  private exportableColumns<T>(columns: TableColumn<T>[]): TableColumn<T>[] {
    return columns.filter((c) => c.type !== 'actions');
  }

  private getValue<T>(col: TableColumn<T>, row: T): string | number {
    if (col.exportValueFn) return col.exportValueFn(row);
    if (col.valueFn) return col.valueFn(row);
    const raw = (row as any)?.[col.key];
    return raw === undefined || raw === null ? '' : raw;
  }

  private withExtension(filename: string, ext: string): string {
    const clean = (filename || 'export').trim();
    return clean.toLowerCase().endsWith(`.${ext}`) ? clean : `${clean}.${ext}`;
  }
}
