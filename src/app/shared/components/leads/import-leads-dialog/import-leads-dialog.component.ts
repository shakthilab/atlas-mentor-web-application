import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TablerIconsModule } from 'angular-tabler-icons';
import { LeadService } from '../../../../core/services/lead.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-import-leads-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TablerIconsModule
  ],
  template: `
    <div class="import-dialog-container">
      <!-- Header Section -->
      <div class="dialog-header">
        <div class="header-left">
          <div class="header-icon-circle">
            <i-tabler name="cloud-upload" class="icon-22"></i-tabler>
          </div>
          <div class="header-text">
            <h3 class="dialog-title">Import leads</h3>
            <p class="dialog-subtitle">Bring in contacts from a shared sheet or a spreadsheet file.</p>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn" [disabled]="isImportingLink || isImportingFile">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <!-- Main Body Section -->
      <div class="dialog-body">
        
        <!-- Two Column Split -->
        <div class="split-container" *ngIf="!showResult">
          
          <!-- Left Side: Import via Link -->
          <div class="split-side" [class.disabled-side]="!!selectedFile || isImportingFile">
            <div class="side-content">
              <div class="option-header">
                <span class="step-num">01</span>
                <span class="step-dash"></span>
                <i-tabler name="link" class="icon-16 step-icon"></i-tabler>
                <span class="step-title">Import via link</span>
              </div>
              
              <p class="option-desc">Paste a Google Sheet share URL. We'll keep the column mapping you set.</p>
              
              <label class="input-label">SHEET URL</label>
              <input type="text" [(ngModel)]="linkUrl" placeholder="https://docs.google.com/spreadsheets/d/..." [disabled]="!!selectedFile || isImportingFile || isImportingLink" class="sheet-url-input" />

              <!-- Warning Box -->
              <div class="warning-box">
                <i-tabler name="alert-triangle" class="icon-16 warning-icon"></i-tabler>
                <span>Anyone with the sheet link can view it. Make sure the URL is visible to anyone before importing.</span>
              </div>
            </div>
            
            <button class="outlined-action-btn" (click)="importViaLink()" [disabled]="!linkUrl || !!selectedFile || isImportingFile || isImportingLink">
              <span *ngIf="!isImportingLink">Import from link <i-tabler name="arrow-right" class="icon-16 btn-arrow"></i-tabler></span>
              <span *ngIf="isImportingLink" class="loading-state"><i-tabler name="loader" class="icon-18 spinning"></i-tabler> Importing...</span>
            </button>
          </div>

          <!-- Vertical Divider -->
          <div class="col-divider"></div>

          <!-- Right Side: Import via File -->
          <div class="split-side" [class.disabled-side]="!!linkUrl || isImportingLink">
            <div class="side-content">
              <div class="option-header">
                <span class="step-num">02</span>
                <span class="step-dash"></span>
                <i-tabler name="file-text" class="icon-16 step-icon"></i-tabler>
                <span class="step-title">Import via file</span>
              </div>
              
              <p class="option-desc">Upload a spreadsheet from your device. Accepts .csv, .xlsx and .xls.</p>

              <!-- Drop Zone -->
              <div class="drop-zone" 
                   [class.dragover]="isDragOver"
                   [class.has-file]="!!selectedFile"
                   (dragover)="onDragOver($event)"
                   (dragleave)="onDragLeave($event)"
                   (drop)="onDrop($event)"
                   (click)="(!!linkUrl || isImportingLink) ? null : fileInput.click()">
                <input type="file" #fileInput (change)="onFileSelected($event)" accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" style="display: none;" />
                
                <ng-container *ngIf="!selectedFile">
                  <div class="dropzone-circle-icon">
                    <i-tabler name="cloud-upload" class="icon-18"></i-tabler>
                  </div>
                  <span class="dropzone-main-text">Drop your spreadsheet here</span>
                  <span class="dropzone-sub-text">or click to browse files</span>
                </ng-container>
                
                <ng-container *ngIf="selectedFile">
                  <i-tabler name="file-spreadsheet" class="icon-32 file-selected-icon"></i-tabler>
                  <span class="dropzone-main-text file-name-text">{{ selectedFile.name }}</span>
                  <span class="dropzone-sub-text">{{ formatFileSize(selectedFile.size) }}</span>
                  <button mat-icon-button class="remove-file-btn" (click)="clearSelectedFile($event)">
                    <i-tabler name="trash" class="icon-16"></i-tabler>
                  </button>
                </ng-container>
              </div>

              <!-- Client Validation Error -->
              <div *ngIf="fileError" class="file-error-msg">
                <i-tabler name="alert-circle" class="icon-16"></i-tabler>
                <span>{{ fileError }}</span>
              </div>
            </div>

            <button class="outlined-action-btn" (click)="importViaFile()" [disabled]="!selectedFile || !!linkUrl || isImportingLink || isImportingFile">
              <span *ngIf="!isImportingFile">Upload & import <i-tabler name="arrow-right" class="icon-16 btn-arrow"></i-tabler></span>
              <span *ngIf="isImportingFile" class="loading-state"><i-tabler name="loader" class="icon-18 spinning"></i-tabler> Importing...</span>
            </button>
          </div>

        </div>

        <!-- Result Screen -->
        <div class="result-container" *ngIf="showResult">
          <div class="result-summary-card">
            <h6 class="result-title">Import Process Completed</h6>
            <div class="result-stats">
              <div class="stat-item">
                <span class="stat-badge stat-success"><i-tabler name="check" class="icon-16"></i-tabler></span>
                <div>
                  <span class="stat-label">SUCCESSFULLY CREATED</span>
                  <strong class="stat-value">{{ importResult.successCount }}</strong>
                </div>
              </div>
              <div class="stat-item">
                <span class="stat-badge stat-danger"><i-tabler name="x" class="icon-16"></i-tabler></span>
                <div>
                  <span class="stat-label">FAILED ROWS</span>
                  <strong class="stat-value">{{ importResult.failedCount }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="failures-section" *ngIf="importResult.failures && importResult.failures.length > 0">
            <span class="failures-label">FAILURE REASONS:</span>
            <div class="failures-list">
              <div class="failure-row" *ngFor="let fail of importResult.failures">
                <i-tabler name="alert-triangle" class="icon-16 warning-icon"></i-tabler>
                <span>{{ fail }}</span>
              </div>
            </div>
          </div>

          <div class="result-actions">
            <button class="outlined-action-btn" (click)="resetImport()">Import More Data</button>
          </div>
        </div>

      </div>

      <!-- Footer Section -->
      <div class="dialog-footer" *ngIf="!showResult">
        <span class="footer-note">Duplicate emails are merged into existing leads.</span>
        <button class="template-download-btn" (click)="downloadTemplate()">
          <i-tabler name="download" class="icon-18"></i-tabler>
          <span>Download template</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* ===== CONTAINER ===== */
    .import-dialog-container {
      width: 760px;
      max-width: 100%;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ===== HEADER ===== */
    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px 28px 20px;
      border-bottom: 1px solid #f1f5f9;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon-circle {
      width: 48px;
      height: 48px;
      min-width: 48px;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2D2E32;
    }

    .dialog-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 2px;
      line-height: 1.3;
    }

    .dialog-subtitle {
      font-size: 13.5px;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }

    .close-btn {
      color: #94a3b8;
      margin-top: -4px;
    }

    /* ===== BODY ===== */
    .dialog-body {
      padding: 28px;
    }

    .split-container {
      display: flex;
      gap: 0;
      
      @media (max-width: 768px) {
        flex-direction: column;
        gap: 28px;
      }
    }

    .col-divider {
      width: 1px;
      background: #f1f5f9;
      margin: 0 28px;
      
      @media (max-width: 768px) {
        display: none;
      }
    }

    .split-side {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: opacity 0.2s ease;
    }

    .disabled-side {
      opacity: 0.35;
      pointer-events: none;
    }

    .side-content {
      margin-bottom: 20px;
    }

    /* ===== OPTION HEADER (01 --- icon Title) ===== */
    .option-header {
      display: flex;
      align-items: center;
      margin-bottom: 14px;
    }

    .step-num {
      font-size: 13px;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.5px;
    }

    .step-dash {
      width: 28px;
      height: 0;
      border-top: 1.5px dashed #cbd5e1;
      margin: 0 12px;
    }

    .step-icon {
      color: #2D2E32;
      margin-right: 8px;
    }

    .step-title {
      font-size: 15px;
      font-weight: 700;
      color: #2D2E32;
    }

    .option-desc {
      font-size: 13px;
      color: #64748b;
      line-height: 1.55;
      margin: 0 0 22px;
    }

    /* ===== SHEET URL INPUT ===== */
    .input-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
    }

    .sheet-url-input {
      width: 100%;
      height: 46px;
      border: 1.5px solid #2D2E32;
      border-radius: 24px;
      padding: 0 20px;
      font-size: 13px;
      background: #f8fafc;
      color: #1e293b;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
      margin-bottom: 14px;
      
      &::placeholder {
        color: #94a3b8;
      }
      
      &:focus {
        border-color: #2D2E32;
        background: #f8fafc;
        box-shadow: 0 0 0 3px rgba(45, 46, 50, 0.1);
      }
      
      &:disabled {
        background: #f1f5f9;
        border-color: #e2e8f0;
        color: #94a3b8;
        cursor: not-allowed;
      }
    }

    /* ===== WARNING BOX ===== */
    .warning-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.5;
      color: #b45309;
      font-weight: 500;
    }

    .warning-icon {
      color: #f59e0b;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* ===== DROPZONE ===== */
    .drop-zone {
      border: 1.5px dashed #cbd5e1;
      border-radius: 12px;
      padding: 32px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: #f8fafc;
      transition: all 0.2s ease;
      position: relative;
      min-height: 145px;

      &:hover, &.dragover {
        border-color: #2D2E32;
        background: #f8fafc;
        
        .dropzone-circle-icon {
          background: #f1f5f9;
          color: #2D2E32;
        }
      }

      &.has-file {
        border-style: solid;
        border-color: #13deb9;
        background: rgba(19, 222, 185, 0.03);
      }
    }
    
    .dropzone-circle-icon {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      margin-bottom: 14px;
      color: #2D2E32;
      transition: all 0.2s;
    }

    .dropzone-main-text {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .file-name-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
      text-align: center;
      padding: 0 12px;
    }

    .dropzone-sub-text {
      font-size: 12px;
      color: #94a3b8;
    }

    .file-selected-icon {
      color: #13deb9;
      margin-bottom: 8px;
    }

    .remove-file-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      color: #94a3b8;
      width: 28px;
      height: 28px;
      
      &:hover {
        color: #ef4444;
      }
    }

    .file-error-msg {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #ef4444;
      font-size: 12px;
      margin-top: 12px;
    }

    /* ===== OUTLINED ACTION BUTTON (matches screenshot) ===== */
    .outlined-action-btn {
      width: 100%;
      height: 46px;
      border: 1.5px solid #e2e8f0;
      border-radius: 24px;
      background: #ffffff;
      color: #64748b;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.2s ease;
      font-family: inherit;
      
      &:hover:not(:disabled) {
        border-color: #2D2E32;
        color: #2D2E32;
        background: #f8fafc;
      }
      
      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }

    .btn-arrow {
      margin-left: 4px;
      margin-top: 1px;
    }

    .loading-state {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ===== FOOTER ===== */
    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 28px;
      border-top: 1px solid #f1f5f9;
    }

    .footer-note {
      font-size: 12.5px;
      color: #94a3b8;
    }

    .template-download-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      color: #2D2E32;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 8px;
      font-family: inherit;
      transition: background 0.15s;
      
      &:hover {
        background: #f1f5f9;
      }
    }

    /* ===== RESULTS ===== */
    .result-summary-card {
      padding: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .result-title {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 16px;
    }

    .result-stats {
      display: flex;
      gap: 32px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stat-badge {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .stat-success {
      background: rgba(19, 222, 185, 0.12);
      color: #13deb9;
    }

    .stat-danger {
      background: rgba(250, 137, 107, 0.12);
      color: #fa896b;
    }

    .stat-label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 20px;
      color: #1e293b;
    }

    .failures-section {
      margin-bottom: 16px;
    }

    .failures-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .failures-list {
      max-height: 180px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
    }

    .failure-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      margin-bottom: 6px;
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 6px;
      font-size: 12px;
      color: #475569;
    }

    .result-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      
      .outlined-action-btn {
        width: auto;
        padding: 0 28px;
      }
    }

    /* ===== ANIMATION ===== */
    .spinning {
      animation: spin 1.5s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* ===== DARK THEME ===== */
    :host-context(.dark-theme) {
      .import-dialog-container {
        background: var(--dark-sidebarbg, #1e293b);
      }
      .dialog-title, .step-title, .dropzone-main-text, .stat-value, .result-title {
        color: #f1f5f9 !important;
      }
      .dialog-subtitle, .option-desc, .footer-note, .dropzone-sub-text {
        color: #94a3b8 !important;
      }
      .sheet-url-input {
        background: var(--dark-bodybg, #0c0c0e);
        border-color: var(--dark-formborderColor, #334155);
        color: #f1f5f9;
        
        &:focus {
          border-color: #cbd5e1;
          background: var(--dark-bodybg, #0c0c0e);
        }
      }
      .drop-zone {
        background: var(--dark-bodybg, #0c0c0e);
        border-color: var(--dark-formborderColor, #334155);
        
        .dropzone-circle-icon {
          background: var(--dark-sidebarbg, #1e293b);
        }

        &.has-file {
          border-color: #13deb9;
        }
      }
      .outlined-action-btn {
        background: transparent;
        border-color: var(--dark-formborderColor, #334155);
        color: #94a3b8;
        
        &:hover:not(:disabled) {
          border-color: #cbd5e1;
          color: #f1f5f9;
          background: rgba(255, 255, 255, 0.05);
        }
      }
      .col-divider {
        background: var(--dark-formborderColor, #334155);
      }
      .dialog-header, .dialog-footer {
        border-color: var(--dark-formborderColor, #334155);
      }
      .result-summary-card {
        background: var(--dark-bodybg, #0c0c0e);
        border-color: var(--dark-formborderColor, #334155);
      }
      .failures-list {
        background: var(--dark-bodybg, #0c0c0e);
        border-color: var(--dark-formborderColor, #334155);
      }
      .failure-row {
        background: var(--dark-sidebarbg, #1e293b);
        border-color: var(--dark-formborderColor, #334155);
        color: #cbd5e1;
      }
    }
  `]
})
export class ImportLeadsDialogComponent implements OnInit {
  @Output() importSuccess = new EventEmitter<void>();
  hasImportedSuccessfully = false;

  linkUrl = '';
  selectedFile: File | null = null;
  fileError = '';
  isDragOver = false;

  isImportingLink = false;
  isImportingFile = false;

  showResult = false;
  importResult: {
    successCount: number;
    failedCount: number;
    failures: string[];
  } = {
    successCount: 0,
    failedCount: 0,
    failures: []
  };

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private dialogRef: MatDialogRef<ImportLeadsDialogComponent>,
    private leadService: LeadService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {}

  close(): void {
    this.dialogRef.close(this.hasImportedSuccessfully);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.linkUrl || this.isImportingLink) return;
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    if (this.linkUrl || this.isImportingLink) return;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  validateAndSetFile(file: File): void {
    this.fileError = '';
    const name = file.name.toLowerCase();
    const ext = name.slice(name.lastIndexOf('.'));
    if (ext !== '.csv' && ext !== '.xlsx' && ext !== '.xls') {
      this.fileError = 'Invalid file type. Only .csv, .xlsx, and .xls are supported.';
      this.selectedFile = null;
      if (this.fileInput) { this.fileInput.nativeElement.value = ''; }
      return;
    }
    this.selectedFile = file;
  }

  clearSelectedFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileError = '';
    if (this.fileInput) { this.fileInput.nativeElement.value = ''; }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  importViaLink(): void {
    if (!this.linkUrl || this.selectedFile || this.isImportingFile || this.isImportingLink) return;
    this.isImportingLink = true;
    this.leadService.importLeadsViaLink(this.linkUrl).subscribe({
      next: (res) => {
        this.isImportingLink = false;
        this.parseAndShowResults(res);
        this.notificationService.showSuccessToast('Link imported successfully');
      },
      error: (err) => {
        this.isImportingLink = false;
        const errMsg = err?.error?.message || err?.message || 'Server returned an error';
        this.notificationService.showErrorToast(`Import failed: ${errMsg}`);
      }
    });
  }

  importViaFile(): void {
    if (!this.selectedFile || this.linkUrl || this.isImportingLink || this.isImportingFile) return;
    this.isImportingFile = true;
    this.leadService.importLeadsViaFile(this.selectedFile).subscribe({
      next: (res) => {
        this.isImportingFile = false;
        this.parseAndShowResults(res);
        this.notificationService.showSuccessToast('File imported successfully');
      },
      error: (err) => {
        this.isImportingFile = false;
        const errMsg = err?.error?.message || err?.message || 'Server returned an error';
        this.notificationService.showErrorToast(`Import failed: ${errMsg}`);
      }
    });
  }

  parseAndShowResults(res: any): void {
    const data = res?.data || res || {};
    const successCount = data.succeeded !== undefined ? data.succeeded : (data.successCount !== undefined ? data.successCount : (data.createdCount || 0));
    const failedCount = data.failed !== undefined ? data.failed : (data.failedCount !== undefined ? data.failedCount : (data.failureCount || 0));
    
    let normalizedFailures: string[] = [];
    if (Array.isArray(data.results)) {
      normalizedFailures = data.results
        .filter((r: any) => r.status !== 'SUCCESS')
        .map((r: any) => {
          const rowPrefix = r.row !== undefined ? `Row ${r.row}` : '';
          const reason = r.message || r.reason || 'Import failed';
          return rowPrefix ? `${rowPrefix}: ${reason}` : reason;
        });
    } else {
      const errorsList = data.errors || data.failures || [];
      normalizedFailures = errorsList.map((f: any) => {
        if (typeof f === 'string') return f;
        if (f && typeof f === 'object') {
          const rowPrefix = f.row !== undefined ? `Row ${f.row}` : '';
          const reason = f.reason || f.error || f.message || 'Unknown error';
          return rowPrefix ? `${rowPrefix}: ${reason}` : reason;
        }
        return 'Unknown error';
      });
    }

    this.importResult = { successCount, failedCount, failures: normalizedFailures };
    if (successCount > 0) {
      this.hasImportedSuccessfully = true;
      this.importSuccess.emit();
    }
    this.showResult = true;
  }

  resetImport(): void {
    this.linkUrl = '';
    this.selectedFile = null;
    this.fileError = '';
    this.showResult = false;
    this.importResult = { successCount: 0, failedCount: 0, failures: [] };
    if (this.fileInput) { this.fileInput.nativeElement.value = ''; }
  }

  downloadTemplate(): void {
    this.leadService.downloadImportTemplate().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads_import_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.notificationService.showSuccessToast('Template downloaded successfully');
      },
      error: () => {
        this.notificationService.showErrorToast('Failed to download template');
      }
    });
  }
}
