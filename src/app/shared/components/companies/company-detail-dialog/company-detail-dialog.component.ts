import { Component, Inject, EventEmitter, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Company } from '../companies.component';

@Component({
  selector: 'app-company-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    TablerIconsModule,
  ],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="dialog-header d-flex align-items-center justify-content-between p-24 p-b-16">
        <h2 class="mat-headline-6 f-w-600 m-b-0">Company Details</h2>
        <button mat-icon-button (click)="close()" class="text-muted close-btn">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <mat-divider></mat-divider>

      <!-- Company profile banner -->
      <div class="profile-banner p-24 p-b-20">
        <div class="d-flex align-items-center">
          <div class="company-avatar-lg d-flex align-items-center justify-content-center m-r-20">
            <i-tabler name="building-store" class="icon-36 text-primary"></i-tabler>
          </div>
          <div class="flex-grow-1">
            <h3 class="mat-subtitle-1 f-w-700 m-b-4 f-s-18">{{ company.companyName }}</h3>
            <div class="d-flex align-items-center gap-8 flex-wrap">
              <span class="status-badge" [ngClass]="company.status?.toUpperCase()">
                {{ company.status | titlecase }}
              </span>
              <span *ngIf="company.industry" class="industry-chip f-s-12">
                <i-tabler name="briefcase" class="icon-13 m-r-4"></i-tabler>{{ company.industry }}
              </span>
              <span *ngIf="company.branchName" class="branch-chip f-s-12">
                <i-tabler name="building" class="icon-13 m-r-4"></i-tabler>{{ company.branchName }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Details grid -->
      <div class="details-section p-24 p-t-20">
        <div class="details-grid">

          <!-- Contact Person -->
          <div class="detail-item" *ngIf="company.contactPerson">
            <span class="detail-label">Contact Person</span>
            <span class="detail-value d-flex align-items-center">
              <i-tabler name="user" class="icon-15 m-r-8 text-muted"></i-tabler>
              {{ company.contactPerson }}
            </span>
          </div>

          <!-- Email -->
          <div class="detail-item" *ngIf="company.email">
            <span class="detail-label">Email</span>
            <span class="detail-value d-flex align-items-center">
              <i-tabler name="mail" class="icon-15 m-r-8 text-muted"></i-tabler>
              {{ company.email }}
            </span>
          </div>

          <!-- Phone -->
          <div class="detail-item" *ngIf="company.phone">
            <span class="detail-label">Phone</span>
            <span class="detail-value d-flex align-items-center">
              <i-tabler name="phone" class="icon-15 m-r-8 text-muted"></i-tabler>
              {{ company.phone }}
            </span>
          </div>

          <!-- Website -->
          <div class="detail-item" *ngIf="company.website">
            <span class="detail-label">Website</span>
            <a [href]="'https://' + company.website" target="_blank" class="detail-value text-primary d-flex align-items-center">
              <i-tabler name="world" class="icon-15 m-r-8"></i-tabler>
              {{ company.website }}
            </a>
          </div>

          <!-- Staff Count -->
          <div class="detail-item">
            <span class="detail-label">Total Staff</span>
            <span class="detail-value d-flex align-items-center">
              <i-tabler name="users" class="icon-15 m-r-8 text-muted"></i-tabler>
              {{ company.totalStaffs ?? 0 }}
            </span>
          </div>

          <!-- Students Count -->
          <div class="detail-item">
            <span class="detail-label">Total Students</span>
            <span class="detail-value d-flex align-items-center">
              <i-tabler name="school" class="icon-15 m-r-8 text-muted"></i-tabler>
              {{ company.totalStudents ?? 0 }}
            </span>
          </div>

          <!-- Address -->
          <div class="detail-item detail-item-full" *ngIf="company.location">
            <span class="detail-label">Address</span>
            <span class="detail-value d-flex align-items-start">
              <i-tabler name="map-pin" class="icon-15 m-r-8 text-muted" style="margin-top:2px;flex-shrink:0"></i-tabler>
              {{ company.location }}
            </span>
          </div>

          <!-- Assigned Manager -->
          <div class="detail-item detail-item-full" *ngIf="company.assignedTo">
            <span class="detail-label">Assigned Manager</span>
            <div class="d-flex align-items-center m-t-6">
              <img [src]="getAvatar(company.assignedTo?.id)" class="rounded-circle m-r-10 object-cover" width="36" height="36" />
              <div>
                <span class="detail-value d-block">{{ company.assignedTo?.firstName }} {{ company.assignedTo?.lastName }}</span>
                <span class="f-s-12 text-muted">{{ company.assignedTo?.email }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Footer actions -->
      <div class="dialog-footer d-flex align-items-center justify-content-between p-x-24 p-y-16">
        <!-- Activate / Deactivate -->
        <div>
          <button *ngIf="company.status?.toUpperCase() === 'ACTIVE'"
            mat-stroked-button color="warn"
            class="d-flex align-items-center"
            (click)="toggleStatus()">
            <i-tabler name="ban" class="icon-16 m-r-6"></i-tabler>
            Deactivate
          </button>
          <button *ngIf="company.status?.toUpperCase() !== 'ACTIVE'"
            mat-stroked-button color="primary"
            class="d-flex align-items-center"
            (click)="toggleStatus()">
            <i-tabler name="check" class="icon-16 m-r-6"></i-tabler>
            Activate
          </button>
        </div>
        <button mat-flat-button (click)="close()" class="close-action-btn">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container { width: 100%; max-width: 560px; }

    .dialog-header { border-bottom: 0; }
    .close-btn { opacity: 0.7; &:hover { opacity: 1; } }

    .profile-banner { background: linear-gradient(135deg, rgba(97,93,255,0.04), rgba(139,92,246,0.04)); }

    .company-avatar-lg {
      width: 72px; height: 72px; border-radius: 18px; flex-shrink: 0;
      background: linear-gradient(135deg, rgba(97,93,255,0.15), rgba(139,92,246,0.15));
    }

    .gap-8 { gap: 8px; }
    .flex-grow-1 { flex-grow: 1; }
    .flex-wrap { flex-wrap: wrap; }

    .status-badge {
      display: inline-flex; align-items: center; padding: 3px 10px;
      font-size: 11px; font-weight: 700; border-radius: 6px; text-transform: capitalize;
      &.ACTIVE   { background: rgba(19,222,185,0.12); color: #13deb9; }
      &.INACTIVE { background: rgba(250,137,107,0.12); color: #fa896b; }
    }

    .industry-chip, .branch-chip {
      display: inline-flex; align-items: center;
      background: rgba(97,93,255,0.08); color: #615dff;
      border-radius: 4px; padding: 3px 8px; font-weight: 600;
    }

    .details-section { }
    .details-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
      @media (max-width: 480px) { grid-template-columns: 1fr; }
    }
    .detail-item { display: flex; flex-direction: column; }
    .detail-item-full { grid-column: 1 / -1; }

    .detail-label {
      font-size: 11px; color: #64748b; margin-bottom: 5px;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px;
    }
    .detail-value { font-size: 14px; font-weight: 500; color: #1e293b; line-height: 1.5; }

    .dialog-footer { background: rgba(248,250,252,0.8); border-top: 0; }
    .close-action-btn { background: #f1f5f9 !important; color: #475569 !important; }

    .object-cover { object-fit: cover; }
    .text-primary { color: #615dff; text-decoration: none; &:hover { text-decoration: underline; } }
    .text-muted { color: #64748b; }
    .m-r-4 { margin-right: 4px; } .m-r-6 { margin-right: 6px; } .m-r-8 { margin-right: 8px; }
    .m-r-10 { margin-right: 10px; } .m-r-20 { margin-right: 20px; }
    .m-t-6 { margin-top: 6px; } .m-b-0 { margin-bottom: 0; } .m-b-4 { margin-bottom: 4px; }
    .p-24 { padding: 24px; } .p-b-16 { padding-bottom: 16px; } .p-b-20 { padding-bottom: 20px; }
    .p-t-20 { padding-top: 20px; } .p-x-24 { padding-left: 24px; padding-right: 24px; }
    .p-y-16 { padding-top: 16px; padding-bottom: 16px; }
    .f-s-12 { font-size: 12px; } .f-s-18 { font-size: 18px; }
    .f-w-600 { font-weight: 600; } .f-w-700 { font-weight: 700; }
    .icon-13 { width: 13px; height: 13px; }
    .icon-15 { width: 15px; height: 15px; }
    .icon-16 { width: 16px; height: 16px; }
    .icon-20 { width: 20px; height: 20px; }
    .icon-36 { width: 36px; height: 36px; }

    :host-context(.dark-theme) {
      .profile-banner { background: rgba(97,93,255,0.06); }
      .dialog-footer { background: rgba(0,0,0,0.12); }
      .detail-label { color: #94a3b8; }
      .detail-value { color: #f8fafc; }
      .close-action-btn { background: var(--dark-hoverbgcolor) !important; color: #f8fafc !important; }
      .status-badge {
        &.ACTIVE   { background: rgba(19,222,185,0.2); color: #80f1d4; }
        &.INACTIVE { background: rgba(250,137,107,0.2); color: #ffab91; }
      }
    }
  `]
})
export class CompanyDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CompanyDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { company: Company; onToggleStatus: (c: Company) => void }
  ) {}

  get company(): Company { return this.data.company; }

  close(): void { this.dialogRef.close(); }

  toggleStatus(): void {
    this.data.onToggleStatus(this.company);
    this.dialogRef.close('statusChanged');
  }

  getAvatar(id?: number): string {
    if (!id) return '/assets/images/profile/user-1.jpg';
    return `/assets/images/profile/user-${(id % 4) + 1}.jpg`;
  }
}
