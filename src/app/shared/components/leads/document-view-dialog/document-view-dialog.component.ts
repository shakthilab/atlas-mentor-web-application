import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TablerIconsModule } from 'angular-tabler-icons';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-document-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, TablerIconsModule],
  template: `
    <div class="document-view-container">
      <div class="d-flex justify-content-between align-items-center p-x-24 p-y-16 border-bottom">
        <h5 class="mat-subtitle-1 f-w-700 m-b-0 text-dark">{{ data.title }}</h5>
        <button mat-icon-button (click)="dialogRef.close()" class="text-muted" type="button" style="border: none; background: transparent; cursor: pointer;">
          <i-tabler name="x" class="icon-18"></i-tabler>
        </button>
      </div>
      <div class="dialog-body p-24 d-flex justify-content-center align-items-center overflow-auto" style="max-height: 75vh; min-height: 300px; background: #f8fafc; overflow: auto;">
        <img *ngIf="isImage" [src]="safeUrl" style="max-width: 100%; max-height: 65vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" />
        <iframe *ngIf="isPdf" [src]="safeUrl" width="100%" height="600px" style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"></iframe>
        <div *ngIf="!isImage && !isPdf" class="text-center p-24">
          <i-tabler name="file-unknown" class="icon-48 text-muted m-b-16" style="width: 48px; height: 48px;"></i-tabler>
          <p class="text-muted">Preview not available for this file type.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .document-view-container {
      display: flex;
      flex-direction: column;
      max-width: 100%;
    }
  `]
})
export class DocumentViewDialogComponent implements OnInit {
  isImage = false;
  isPdf = false;
  safeUrl!: SafeResourceUrl;

  constructor(
    public dialogRef: MatDialogRef<DocumentViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; url: string; fileType: string },
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const type = this.data.fileType ? this.data.fileType.toLowerCase() : '';
    this.isImage = type.startsWith('image/');
    this.isPdf = type === 'application/pdf';
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.url);
  }
}
