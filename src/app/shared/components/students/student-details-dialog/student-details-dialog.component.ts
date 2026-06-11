import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-student-details-dialog',
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
        <h2 class="mat-headline-6 f-w-600 m-b-0">Student Details</h2>
        <button mat-icon-button (click)="closeDialog()" class="text-muted">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <div class="profile-header d-flex align-items-center m-b-24">
        <img [src]="student.avatar || '/assets/images/profile/user-1.jpg'" class="rounded-circle m-r-16 object-cover avatar-animated" width="64" height="64" />
        <div>
          <h3 class="mat-subtitle-1 f-w-600 m-b-4 f-s-18">{{ student.name }}</h3>
          <span class="f-s-14 text-muted d-block">{{ student.major || 'N/A' }}</span>
          <span class="status-badge m-t-8" [ngClass]="student.status || 'pending'">
            {{ student.status === 'enrolled' ? 'Enrolled' : student.status === 'pending' ? 'Pending' : 'Completed' }}
          </span>
        </div>
      </div>

      <mat-divider class="m-b-24"></mat-divider>

      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Email Address</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="mail" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ student.email || 'N/A' }}
          </span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Phone Number</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="phone" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ student.phone || 'N/A' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Country</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="map-pin" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ student.country || 'N/A' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">University</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="building" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ student.university || 'N/A' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Course / Major</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="book" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ student.major || 'N/A' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Counsellor</span>
          <span class="detail-value d-flex align-items-center">
            <img *ngIf="student.counsellorAvatar" [src]="student.counsellorAvatar" class="rounded-circle m-r-8 object-cover" width="20" height="20" />
            <i-tabler *ngIf="!student.counsellorAvatar" name="user" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ student.counsellor || 'Unassigned' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Added By</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="user-plus" class="icon-16 m-r-8 text-muted"></i-tabler>
            <span>{{ student.addedBy || 'System' }} <small class="text-muted">({{ student.addedByRole || 'N/A' }})</small></span>
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Joined Date</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="calendar" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ student.joinedDate || 'Unknown Date' }}
          </span>
        </div>
      </div>

      <div class="d-flex justify-content-end align-items-center m-t-24">
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
      
      &.enrolled {
        background-color: rgba(97, 93, 255, 0.1);
        color: #615dff;
      }
      &.pending {
        background-color: rgba(255, 174, 31, 0.1);
        color: #ffae1f;
      }
      &.completed {
        background-color: rgba(19, 222, 185, 0.1);
        color: #13deb9;
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
        &.enrolled {
          background-color: rgba(97, 93, 255, 0.2);
          color: #a5a2ff;
        }
        &.pending {
          background-color: rgba(255, 174, 31, 0.2);
          color: #ffca70;
        }
        &.completed {
          background-color: rgba(19, 222, 185, 0.2);
          color: #80f1d4;
        }
      }
    }
  `]
})
export class StudentDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<StudentDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public student: any
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
