import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Employee } from '../../../../core/services/employee.service';

@Component({
  selector: 'app-employee-details-dialog',
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
        <h2 class="mat-headline-6 f-w-600 m-b-0">Employee Details</h2>
        <button mat-icon-button (click)="closeDialog()" class="text-muted">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <div class="profile-header d-flex align-items-center m-b-24">
        <img [src]="getAvatar(employee)" class="rounded-circle m-r-16 object-cover avatar-animated" width="64" height="64" />
        <div>
          <h3 class="mat-subtitle-1 f-w-600 m-b-4 f-s-18">{{ employee.firstName }} {{ employee.lastName }}</h3>
          <span class="f-s-14 text-muted d-block">{{ employee.role?.name || employee.role || 'Role ' + employee.roleId }}</span>
          <span class="status-badge m-t-8" [ngClass]="(employee.status || 'ACTIVE').toLowerCase()">
            {{ employee.status || 'ACTIVE' | titlecase }}
          </span>
        </div>
      </div>

      <mat-divider class="m-b-24"></mat-divider>

      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Email Address</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="mail" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ employee.email || 'N/A' }}
          </span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Phone Number</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="phone" class="icon-16 m-r-8 text-muted"></i-tabler>
            +{{ employee.mobileCountryCodeId || '91' }} {{ employee.phone || 'N/A' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Branch</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="map-pin" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ employee.branch?.name || employee.branch || 'Branch ' + employee.branchId }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Manager</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="user" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ employee.manager?.name || employee.manager?.firstName || 'N/A' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Task Counts</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="list-check" class="icon-16 m-r-8 text-muted"></i-tabler>
            <span class="task-stats">
              <span class="stat-box pending" title="Pending">
                <span class="stat-label">Pending</span>
                <span class="stat-count">{{ employee.taskCount?.pending || 0 }}</span>
              </span>
              <span class="stat-box in-progress" title="In Progress">
                <span class="stat-label">In Progress</span>
                <span class="stat-count">{{ employee.taskCount?.inProgress || 0 }}</span>
              </span>
              <span class="stat-box completed" title="Completed">
                <span class="stat-label">Completed</span>
                <span class="stat-count">{{ employee.taskCount?.completed || 0 }}</span>
              </span>
            </span>
          </span>
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
      
      &.active {
        background-color: rgba(19, 222, 185, 0.1);
        color: #13deb9;
      }
      
      &.inactive {
        background-color: rgba(250, 137, 107, 0.1);
        color: #fa896b;
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

    .task-stats {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      
      .stat-box {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        
        .stat-label {
          margin-right: 6px;
          opacity: 0.9;
        }
        
        .stat-count {
          background: rgba(255, 255, 255, 0.3);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }
      }
      
      .pending { 
        background-color: rgba(250, 137, 107, 0.15); 
        color: #fa896b; 
        .stat-count { background-color: rgba(250, 137, 107, 0.2); }
      }
      .in-progress { 
        background-color: rgba(255, 174, 31, 0.15); 
        color: #ffae1f;
        .stat-count { background-color: rgba(255, 174, 31, 0.2); }
      }
      .completed { 
        background-color: rgba(19, 222, 185, 0.15); 
        color: #13deb9;
        .stat-count { background-color: rgba(19, 222, 185, 0.2); }
      }
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
        &.active {
          background-color: rgba(19, 222, 185, 0.2);
          color: #80f1d4;
        }
        &.inactive {
          background-color: rgba(250, 137, 107, 0.2);
          color: #ffab91;
        }
      }
    }
  `]
})
export class EmployeeDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EmployeeDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public employee: Employee
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  getAvatar(employee: Employee): string {
    if (employee.avatar) return employee.avatar;
    // Cycle through the 4 local 3D avatars based on employee ID
    const id = employee.id || Math.floor(Math.random() * 4) + 1;
    const avatarIndex = (id % 4) + 1;
    return `/assets/images/profile/user-${avatarIndex}.jpg`;
  }
}
