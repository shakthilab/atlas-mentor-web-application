import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-referral-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, TablerIconsModule],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="dialog-header d-flex align-items-center justify-content-between p-24 p-b-16">
        <h2 class="mat-headline-6 f-w-600 m-b-0">Referral Details</h2>
        <button mat-icon-button (click)="close()" class="text-muted close-btn">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <mat-divider></mat-divider>

      <!-- Profile banner -->
      <div class="profile-banner p-24 p-b-20">
        <div class="d-flex align-items-center">
          <div class="avatar-lg d-flex align-items-center justify-content-center m-r-20">
            <img [src]="getAvatar(referral.id)" class="rounded-circle object-cover" width="64" height="64" />
          </div>
          <div class="flex-grow-1">
            <h3 class="mat-subtitle-1 f-w-700 m-b-4 f-s-18">{{ referral.referralName }}</h3>
            <div class="d-flex align-items-center gap-8 flex-wrap">
              <span class="status-badge" [ngClass]="(referral.status || '').toUpperCase()">
                {{ referral.status | titlecase }}
              </span>
              <span *ngIf="referral.referralType" class="industry-chip f-s-12">
                <i-tabler name="badge" class="icon-13 m-r-4"></i-tabler>{{ formatType(referral.referralType) }}
              </span>
              <span *ngIf="referral.branchName" class="branch-chip f-s-12">
                <i-tabler name="building" class="icon-13 m-r-4"></i-tabler>{{ referral.branchName }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Details grid -->
      <div class="details-section p-24 p-t-20">
        <div class="details-grid">

          <!-- Email -->
          <div class="detail-item" *ngIf="referral.email">
            <span class="detail-label">Email</span>
            <span class="detail-value d-flex align-items-center">
              <i-tabler name="mail" class="icon-15 m-r-8 text-muted"></i-tabler>
              {{ referral.email }}
            </span>
          </div>

          <!-- Phone -->
          <div class="detail-item" *ngIf="referral.phone">
            <span class="detail-label">Phone</span>
            <span class="detail-value d-flex align-items-center">
              <i-tabler name="phone" class="icon-15 m-r-8 text-muted"></i-tabler>
              {{ referral.phone }}
            </span>
          </div>

          <!-- Leads Count -->
          <div class="detail-item">
            <span class="detail-label">Total Leads</span>
            <span class="detail-value d-flex align-items-center">
              <i-tabler name="users" class="icon-15 m-r-8 text-muted"></i-tabler>
              {{ referral.userCounts?.totalLeads ?? 0 }}
            </span>
          </div>

          <!-- Students Count -->
          <div class="detail-item">
            <span class="detail-label">Total Students</span>
            <span class="detail-value d-flex align-items-center">
              <i-tabler name="school" class="icon-15 m-r-8 text-muted"></i-tabler>
              {{ referral.userCounts?.totalStudents ?? 0 }}
            </span>
          </div>

          <!-- Assigned Managers -->
          <div class="detail-item detail-item-full" *ngIf="referral.assignedToUsers && referral.assignedToUsers.length > 0">
            <span class="detail-label m-b-8 d-block">Assigned Managers</span>
            <div class="assignees-list">
              <div *ngFor="let user of referral.assignedToUsers" class="d-flex align-items-center m-b-12">
                <img [src]="getAvatar(user.id)" class="rounded-circle m-r-10 object-cover" width="36" height="36" />
                <div>
                  <span class="detail-value d-block">{{ user.firstName }} {{ user.lastName }}</span>
                  <span class="f-s-12 text-muted">{{ user.email }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Footer actions -->
      <div class="dialog-footer d-flex align-items-center justify-content-between p-x-24 p-y-16">
        <div>
          <button *ngIf="(referral.status || '').toUpperCase() === 'ACTIVE'"
            mat-stroked-button color="warn"
            class="d-flex align-items-center"
            (click)="onToggle()">
            <i-tabler name="ban" class="icon-16 m-r-6"></i-tabler> Deactivate
          </button>
          <button *ngIf="(referral.status || '').toUpperCase() !== 'ACTIVE'"
            mat-stroked-button color="primary"
            class="d-flex align-items-center"
            (click)="onToggle()">
            <i-tabler name="check" class="icon-16 m-r-6"></i-tabler> Activate
          </button>
        </div>
        <div class="d-flex gap-12">
          <button mat-stroked-button (click)="close()">Close</button>
          <button mat-flat-button color="primary" (click)="onEdit()">
            <i-tabler name="edit" class="icon-16 m-r-6"></i-tabler> Edit
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container { width: 100%; min-width: 500px; max-width: 600px; @media (max-width: 600px) { min-width: unset; } }
    .close-btn { margin-right: -8px; }
    
    .profile-banner {
      background: linear-gradient(to right, rgba(97,93,255,0.03), rgba(97,93,255,0.08));
    }
    
    .avatar-lg {
      width: 64px; height: 64px;
      background: #ffffff;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border: 2px solid #ffffff;
      flex-shrink: 0;
    }
    
    .status-badge {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 4px 10px; font-size: 11px; font-weight: 700; border-radius: 6px; letter-spacing: 0.5px;
      &.ACTIVE { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
      &.INACTIVE { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    }
    
    .industry-chip, .branch-chip {
      display: inline-flex; align-items: center;
      background: #ffffff; padding: 3px 10px; border-radius: 20px;
      color: #64748b; font-weight: 500; border: 1px solid #e2e8f0;
    }
    
    .details-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px 24px;
      @media (max-width: 480px) { grid-template-columns: 1fr; }
    }
    
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .detail-item-full { grid-column: 1 / -1; }
    
    .detail-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 14px; font-weight: 500; color: #1e293b; }
    
    .gap-8 { gap: 8px; } .gap-12 { gap: 12px; }
    .m-b-0 { margin-bottom: 0; } .m-b-4 { margin-bottom: 4px; } .m-b-8 { margin-bottom: 8px; } .m-b-12 { margin-bottom: 12px; }
    .m-r-4 { margin-right: 4px; } .m-r-6 { margin-right: 6px; } .m-r-8 { margin-right: 8px; } .m-r-10 { margin-right: 10px; } .m-r-20 { margin-right: 20px; }
    .p-24 { padding: 24px; } .p-b-16 { padding-bottom: 16px; } .p-b-20 { padding-bottom: 20px; } .p-t-20 { padding-top: 20px; }
    .p-x-24 { padding-left: 24px; padding-right: 24px; } .p-y-16 { padding-top: 16px; padding-bottom: 16px; }
    .text-primary { color: #615dff !important; } .object-cover { object-fit: cover; }
    
    :host-context(.dark-theme) {
      .profile-banner { background: linear-gradient(to right, rgba(165,162,255,0.05), rgba(165,162,255,0.1)); }
      .avatar-lg { background: var(--dark-sidebarbg); border-color: var(--dark-sidebarbg); }
      .detail-value { color: #f8fafc; }
      .industry-chip, .branch-chip { background: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); color: #94a3b8; }
      .status-badge.ACTIVE { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
      .status-badge.INACTIVE { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
    }
  `]
})
export class ReferralDetailDialogComponent {
  referral: any;

  constructor(
    private dialogRef: MatDialogRef<ReferralDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.referral = data.referral;
  }

  formatType(type: string): string {
    return (type || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  getAvatar(id?: number): string {
    const avatarId = id || Math.floor(Math.random() * 4) + 1;
    const avatarIndex = (avatarId % 4) + 1;
    return `/assets/images/profile/user-${avatarIndex}.jpg`;
  }

  close(): void { this.dialogRef.close(); }
  onEdit(): void { this.dialogRef.close('edit'); }
  onToggle(): void { this.dialogRef.close('toggle'); }
}
