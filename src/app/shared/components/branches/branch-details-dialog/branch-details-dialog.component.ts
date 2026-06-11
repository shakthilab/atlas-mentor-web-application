import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Branch } from '../branches.component';

@Component({
  selector: 'app-branch-details-dialog',
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
        <h2 class="mat-headline-6 f-w-600 m-b-0">Branch Details</h2>
        <button mat-icon-button (click)="closeDialog()" class="text-muted">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <!-- Branch header -->
      <div class="profile-header d-flex align-items-center m-b-24">
        <div class="branch-icon-wrap m-r-16 d-flex align-items-center justify-content-center">
          <i-tabler name="building" class="icon-32 text-primary"></i-tabler>
        </div>
        <div>
          <h3 class="mat-subtitle-1 f-w-600 m-b-4 f-s-18">{{ branch.name }}</h3>
          <span class="status-badge" [ngClass]="branch.status?.toLowerCase()">
            {{ branch.status | titlecase }}
          </span>
        </div>
      </div>

      <mat-divider class="m-b-24"></mat-divider>

      <div class="details-grid">
        <!-- Location -->
        <div class="detail-item detail-item-full">
          <span class="detail-label">Location</span>
          <span class="detail-value d-flex align-items-start">
            <i-tabler name="map-pin" class="icon-16 m-r-8 text-muted" style="margin-top:2px;flex-shrink:0"></i-tabler>
            {{ branch.location || 'N/A' }}
          </span>
        </div>

        <!-- Manager -->
        <div class="detail-item">
          <span class="detail-label">Manager</span>
          <div class="d-flex align-items-center m-t-4">
            <img [src]="getManagerAvatar(branch.manager?.id)" class="rounded-circle m-r-8 object-cover" width="32" height="32" />
            <div>
              <span class="detail-value d-block">{{ branch.manager?.name || 'N/A' }}</span>
              <span class="f-s-12 text-muted">{{ branch.manager?.email }}</span>
            </div>
          </div>
        </div>

        <!-- Created At -->
        <div class="detail-item">
          <span class="detail-label">Created On</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="calendar" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ branch.createdAt | date:'mediumDate' }}
          </span>
        </div>

        <!-- Staff count -->
        <div class="detail-item">
          <span class="detail-label">Total Staff</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="users" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ branch.userCounts?.totalStaffs ?? 0 }}
          </span>
        </div>

        <!-- Students count -->
        <div class="detail-item">
          <span class="detail-label">Total Students</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="school" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ branch.userCounts?.totalStudents ?? 0 }}
          </span>
        </div>
      </div>

      <div class="d-flex justify-content-end m-t-24">
        <button mat-stroked-button (click)="closeDialog()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      max-width: 520px;
      background-color: var(--mat-dialog-container-color, #ffffff);
      color: var(--mat-dialog-container-text-color, #1e293b);
    }

    .branch-icon-wrap {
      width: 64px; height: 64px; border-radius: 16px;
      background: linear-gradient(135deg, rgba(97,93,255,0.12), rgba(139,92,246,0.12));
      flex-shrink: 0;
    }

    .object-cover { object-fit: cover; }
    .m-b-24 { margin-bottom: 24px; }
    .m-b-4  { margin-bottom: 4px; }
    .m-r-16 { margin-right: 16px; }
    .m-r-8  { margin-right: 8px; }
    .m-t-4  { margin-top: 4px; }
    .m-t-24 { margin-top: 24px; }
    .gap-12 { gap: 12px; }

    .status-badge {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; text-transform: capitalize;
      &.active   { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
      &.inactive { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      @media (max-width: 480px) { grid-template-columns: 1fr; }
    }

    .detail-item { display: flex; flex-direction: column; }
    .detail-item-full { grid-column: 1 / -1; }

    .detail-label {
      font-size: 12px; color: #64748b; margin-bottom: 4px;
      font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;
    }

    .detail-value { font-size: 14px; font-weight: 500; color: #1e293b; }

    :host-context(.dark-theme) {
      .dialog-container { background-color: var(--dark-sidebarbg, #1e293b); color: #f8fafc; }
      .detail-label { color: #94a3b8; }
      .detail-value { color: #f8fafc; }
      .status-badge {
        &.active   { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
        &.inactive { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      }
    }
  `]
})
export class BranchDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BranchDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public branch: Branch
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  getManagerAvatar(managerId?: number): string {
    if (!managerId) return '/assets/images/profile/user-1.jpg';
    return `/assets/images/profile/user-${(managerId % 4) + 1}.jpg`;
  }
}
