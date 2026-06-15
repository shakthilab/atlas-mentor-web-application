import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Resource } from '../resources.component';

@Component({
  selector: 'app-resource-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    TablerIconsModule
  ],
  template: `
    <div class="dialog-container p-24">
      <div class="d-flex align-items-center justify-content-between m-b-24">
        <h2 class="mat-headline-6 f-w-600 m-b-0">Resource Details</h2>
        <button mat-icon-button (click)="closeDialog()" class="text-muted">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <div class="profile-header d-flex align-items-center m-b-24">
        <div class="icon-container m-r-16" [ngClass]="getIconClass(resource.type)">
          <i-tabler [name]="getFileIcon(resource.type)" class="icon-32"></i-tabler>
        </div>
        <div>
          <h3 class="mat-subtitle-1 f-w-600 m-b-4 f-s-18">{{ resource.resourceDetail }}</h3>
          <span class="f-s-14 text-muted d-block">{{ resource.type }} &bull; {{ resource.storage }}</span>
          <span class="status-badge m-t-8" [ngClass]="resource.status">
            {{ resource.status | titlecase }}
          </span>
        </div>
      </div>

      <mat-divider class="m-b-24"></mat-divider>

      <div class="details-grid">
        <div class="detail-item col-span-2">
          <span class="detail-label">Description</span>
          <span class="detail-value text-muted f-s-13">
            {{ resource.originalData?.description || 'No description provided.' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Owner Type</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="user" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ resource.ownership }}
          </span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Created Date</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="calendar" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ resource.created }}
          </span>
        </div>

        <div class="detail-item col-span-2">
          <span class="detail-label">External URL</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="link" class="icon-16 m-r-8 text-muted"></i-tabler>
            <a *ngIf="resource.originalData?.externalUrl" [href]="resource.originalData.externalUrl" target="_blank" class="text-primary text-truncate" style="max-width: 300px;">
              {{ resource.originalData.externalUrl }}
            </a>
            <span *ngIf="!resource.originalData?.externalUrl" class="text-muted">N/A</span>
          </span>
        </div>
      </div>
      
      <div class="m-t-24">
        <span class="detail-label d-block m-b-12">Assigned Users</span>
        <div class="assigned-users">
          <div *ngIf="!resource.originalData?.ownerNames?.length" class="text-muted f-s-13">
            No users assigned.
          </div>
          <div *ngFor="let userName of resource.originalData?.ownerNames" class="user-badge">
            <i-tabler name="user-circle" class="icon-16 m-r-4"></i-tabler>
            {{ userName }}
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end m-t-24 gap-12">
        <button mat-stroked-button (click)="closeDialog()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      max-width: 500px;
      background-color: var(--mat-dialog-container-color, #ffffff);
      color: var(--mat-dialog-container-text-color, #1e293b);
    }
    .m-b-24 { margin-bottom: 24px; }
    .m-b-12 { margin-bottom: 12px; }
    .m-b-4 { margin-bottom: 4px; }
    .m-r-16 { margin-right: 16px; }
    .m-r-8 { margin-right: 8px; }
    .m-r-4 { margin-right: 4px; }
    .m-t-8 { margin-top: 8px; }
    .m-t-24 { margin-top: 24px; }
    .gap-12 { gap: 12px; }
    
    .icon-container {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      text-transform: capitalize;
      
      &.available { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
      &.in-use { background-color: rgba(255, 174, 31, 0.1); color: #ffae1f; }
      &.archived { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .col-span-2 {
      grid-column: span 2;
      @media (max-width: 480px) {
        grid-column: span 1;
      }
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
    }
    
    .assigned-users {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .user-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      background-color: #f1f5f9;
      border-radius: 16px;
      font-size: 13px;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    /* Dynamic Icon Colors */
    .icon-bg-image { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
    .icon-bg-video { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    .icon-bg-audio { background-color: rgba(183, 136, 255, 0.1); color: #b788ff; }
    .icon-bg-document { background-color: rgba(93, 135, 255, 0.1); color: #5d87ff; }
    .icon-bg-spreadsheet { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
    .icon-bg-presentation { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    .icon-bg-link { background-color: rgba(93, 135, 255, 0.1); color: #5d87ff; }
    .icon-bg-archive { background-color: rgba(255, 174, 31, 0.1); color: #ffae1f; }
    .icon-bg-default { background-color: rgba(73, 190, 255, 0.1); color: #49beff; }

    :host-context(.dark-theme) {
      .dialog-container {
        background-color: var(--dark-sidebarbg, #1e293b);
        color: #f8fafc;
      }
      .detail-label { color: #94a3b8; }
      .detail-value { color: #f8fafc; }
      .user-badge {
        background-color: rgba(255,255,255,0.05);
        color: #e2e8f0;
        border-color: rgba(255,255,255,0.1);
      }
      .status-badge {
        &.available { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
        &.in-use { background-color: rgba(255, 174, 31, 0.2); color: #ffe082; }
        &.archived { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      }
      .icon-bg-image { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
      .icon-bg-video { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      .icon-bg-audio { background-color: rgba(183, 136, 255, 0.2); color: #d6bfff; }
      .icon-bg-document { background-color: rgba(93, 135, 255, 0.2); color: #a6bfff; }
      .icon-bg-spreadsheet { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
      .icon-bg-presentation { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      .icon-bg-link { background-color: rgba(93, 135, 255, 0.2); color: #a6bfff; }
      .icon-bg-archive { background-color: rgba(255, 174, 31, 0.2); color: #ffe082; }
      .icon-bg-default { background-color: rgba(73, 190, 255, 0.2); color: #8fd8ff; }
    }
  `]
})
export class ResourceDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ResourceDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public resource: Resource
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  getFileIcon(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('IMAGE')) return 'photo';
    if (t.includes('VIDEO')) return 'video';
    if (t.includes('AUDIO')) return 'volume';
    if (t.includes('SPREADSHEET')) return 'file-spreadsheet';
    if (t.includes('PRESENTATION')) return 'presentation';
    if (t.includes('LINK')) return 'link';
    if (t.includes('DOCUMENT') || t.includes('PDF')) return 'file-description';
    if (t.includes('ARCHIVE') || t.includes('ZIP')) return 'folder-zip';
    return 'file';
  }

  getIconClass(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('IMAGE')) return 'icon-bg-image';
    if (t.includes('VIDEO')) return 'icon-bg-video';
    if (t.includes('AUDIO')) return 'icon-bg-audio';
    if (t.includes('SPREADSHEET')) return 'icon-bg-spreadsheet';
    if (t.includes('PRESENTATION')) return 'icon-bg-presentation';
    if (t.includes('LINK')) return 'icon-bg-link';
    if (t.includes('DOCUMENT') || t.includes('PDF')) return 'icon-bg-document';
    if (t.includes('ARCHIVE') || t.includes('ZIP')) return 'icon-bg-archive';
    return 'icon-bg-default';
  }
}
