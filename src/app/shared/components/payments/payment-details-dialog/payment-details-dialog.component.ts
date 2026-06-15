import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Payment } from '../payments.component';

@Component({
  selector: 'app-payment-details-dialog',
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
        <h2 class="mat-headline-6 f-w-600 m-b-0">Payment Details</h2>
        <button mat-icon-button (click)="closeDialog()" class="text-muted">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <div class="profile-header d-flex align-items-center m-b-24">
        <img [src]="payment.studentAvatar" class="rounded-circle m-r-16 object-cover" width="64" height="64" />
        <div>
          <h3 class="mat-subtitle-1 f-w-600 m-b-4 f-s-18">{{ payment.studentName }}</h3>
          <span class="f-s-14 text-muted d-block m-b-8">Status: <span class="status-badge" [ngClass]="payment.studentStatus">{{ payment.studentStatus | titlecase }}</span></span>
          <span class="status-badge" [ngClass]="payment.paymentStatus">
            {{ payment.paymentStatus | titlecase }}
          </span>
        </div>
      </div>

      <mat-divider class="m-b-24"></mat-divider>

      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Paid Amount</span>
          <span class="detail-value text-success f-w-600 f-s-16">
            {{ payment.paid }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Balance Amount</span>
          <span class="detail-value text-warning f-w-600 f-s-16">
            {{ payment.balance }}
          </span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Date</span>
          <span class="detail-value d-flex align-items-center">
            <i-tabler name="calendar" class="icon-16 m-r-8 text-muted"></i-tabler>
            {{ payment.date }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Stage</span>
          <span class="detail-value d-flex align-items-center">
            <span class="status-badge" [ngClass]="payment.approval">{{ payment.approval | titlecase }}</span>
          </span>
        </div>
      </div>
      
      <div class="m-t-24">
        <span class="detail-label d-block m-b-12">Assigned To ({{ payment.source }})</span>
        <div class="assigned-users">
          <div class="user-badge">
            <img [src]="payment.assignedAvatar" class="rounded-circle m-r-8 object-cover" width="20" height="20" />
            {{ payment.assigned }}
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
    .m-b-8 { margin-bottom: 8px; }
    .m-b-4 { margin-bottom: 4px; }
    .m-r-16 { margin-right: 16px; }
    .m-r-8 { margin-right: 8px; }
    .m-r-4 { margin-right: 4px; }
    .m-t-8 { margin-top: 8px; }
    .m-t-24 { margin-top: 24px; }
    .gap-12 { gap: 12px; }
    .object-cover { object-fit: cover; }
    .text-success { color: #13deb9 !important; }
    .text-warning { color: #ffae1f !important; }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      text-transform: capitalize;
      
      &.active, &.paid, &.approved { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
      &.pending { background-color: rgba(255, 174, 31, 0.1); color: #ffae1f; }
      &.inactive, &.overdue, &.rejected { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
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
    
    .assigned-users {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .user-badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px 6px 6px;
      background-color: #f1f5f9;
      border-radius: 20px;
      font-size: 13px;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

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
        &.active, &.paid, &.approved { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
        &.pending { background-color: rgba(255, 174, 31, 0.2); color: #ffe082; }
        &.inactive, &.overdue, &.rejected { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      }
    }
  `]
})
export class PaymentDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PaymentDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public payment: Payment
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
