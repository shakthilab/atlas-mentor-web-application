import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-lead-details-dialog',
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
        <h2 class="mat-headline-6 f-w-600 m-b-0">Lead Details</h2>
        <button mat-icon-button (click)="closeDialog()" class="text-muted">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <div class="profile-header d-flex align-items-center m-b-24">
        <img [src]="lead.avatar || '/assets/images/profile/user-1.jpg'" class="rounded-circle m-r-16 object-cover avatar-animated" width="64" height="64" />
        <div>
          <h3 class="mat-subtitle-1 f-w-600 m-b-4 f-s-18">{{ lead.name }}</h3>
          <span class="f-s-14 text-muted d-block">{{ lead.role }}</span>
          <span class="status-badge m-t-8" [ngClass]="lead.status || 'pending'">
            {{ lead.status || 'pending' | titlecase }}
          </span>
        </div>
      </div>

      <mat-divider class="m-b-24"></mat-divider>

      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Email Address</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="mail" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ lead.email || 'N/A' }}
          </span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Phone Number</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="phone" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ lead.phone || 'N/A' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Location</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="map-pin" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ lead.country || 'N/A' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">University</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="building" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ lead.university || 'N/A' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Assigned Counsellor</span>
          <span class="detail-value d-flex align-items-center">
            <img *ngIf="lead.assignedAvatar" [src]="lead.assignedAvatar" class="rounded-circle m-r-8 object-cover" width="20" height="20" />
            <i-tabler *ngIf="!lead.assignedAvatar" name="user" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ lead.assignedTo || 'Unassigned' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Added By</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="user-plus" class="icon-16 m-r-8 text-muted"></i-tabler>
            <span>{{ lead.addedBy || 'System' }} <small class="text-muted">({{ lead.addedByRole }})</small></span>
          </span>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center m-t-24">
        <span class="text-muted f-s-12 d-flex align-items-center">
            <i-tabler name="calendar" class="icon-16 m-r-4"></i-tabler>
            Added on {{ lead.leadDate || 'Unknown Date' }}
        </span>
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
    .object-cover { object-fit: cover; }
    .m-b-24 { margin-bottom: 24px; }
    .m-b-4 { margin-bottom: 4px; }
    .m-r-16 { margin-right: 16px; }
    .m-r-8 { margin-right: 8px; }
    .m-t-8 { margin-top: 8px; }
    .m-t-24 { margin-top: 24px; }
    .gap-12 { gap: 12px; }
    
    .avatar-animated {
      transition: transform 0.3s ease;
    }
    
    .profile-header:hover .avatar-animated {
      transform: scale(1.1) rotate(5deg);
      animation: gentle-bounce 1s infinite alternate ease-in-out;
    }
    
    @keyframes gentle-bounce {
      0% { transform: scale(1.1) rotate(3deg) translateY(0); }
      100% { transform: scale(1.1) rotate(7deg) translateY(-3px); }
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
      
      &.active, &.won, &.enrolled {
        background-color: rgba(19, 222, 185, 0.1);
        color: #13deb9;
      }
      
      &.lost {
        background-color: rgba(250, 137, 107, 0.1);
        color: #fa896b;
      }
      &.pending, &.prospective {
        background-color: rgba(255, 174, 31, 0.1);
        color: #ffae1f;
      }
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
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

    :host-context(.dark-theme) {
      .dialog-container {
        background-color: var(--dark-sidebarbg, #1e293b);
        color: #f8fafc;
      }
      .detail-label {
        color: #94a3b8;
      }
      .detail-value {
        color: #f8fafc;
      }
      .status-badge {
        &.active, &.won, &.enrolled {
          background-color: rgba(19, 222, 185, 0.2);
          color: #80f1d4;
        }
        &.lost {
          background-color: rgba(250, 137, 107, 0.2);
          color: #ffab91;
        }
        &.pending, &.prospective {
          background-color: rgba(255, 174, 31, 0.2);
          color: #ffca70;
        }
      }
    }
  `]
})
export class LeadDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LeadDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public lead: any
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
