import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDeleteDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: false,
  template: `
    <div class="confirm-delete-dialog-card">
      <div class="dialog-icon-circle">
        <i-tabler name="trash" class="icon-24"></i-tabler>
      </div>
      
      <div class="dialog-content">
        <h3 class="dialog-title">{{ data.title || 'Delete Comment?' }}</h3>
        <p class="dialog-message">{{ data.message || 'Are you sure you want to delete this comment? This action cannot be undone.' }}</p>
      </div>

      <div class="dialog-actions">
        <button type="button" class="btn-cancel" mat-dialog-close>
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button type="button" class="btn-delete" (click)="confirm()">
          <i-tabler name="trash" class="icon-16"></i-tabler>
          {{ data.confirmText || 'Delete' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .confirm-delete-dialog-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 380px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .dialog-icon-circle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background-color: #fee2e2;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .dialog-title {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
    }

    .dialog-message {
      font-size: 13.5px;
      color: #64748b;
      line-height: 1.5;
      margin: 0 0 24px 0;
    }

    .dialog-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;

      button {
        flex: 1;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 13.5px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .btn-cancel {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;

        &:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
      }

      .btn-delete {
        background: #dc2626;
        color: #ffffff;
        border: 1px solid #dc2626;

        &:hover {
          background: #b91c1c;
          border-color: #b91c1c;
        }
      }
    }
  `]
})
export class ConfirmDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteDialogData
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }
}
