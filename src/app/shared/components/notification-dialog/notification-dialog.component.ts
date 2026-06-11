import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-notification-dialog',
  template: `
    <div class="dialog-container" [ngClass]="data.type">
      <div class="dialog-header-graphic">
        <div class="icon-circle">
          <i-tabler [name]="data.type === 'success' ? 'circle-check' : 'alert-triangle'" class="dialog-icon"></i-tabler>
        </div>
      </div>
      
      <div class="dialog-content text-center">
        <h3 class="dialog-title">{{ data.title || (data.type === 'success' ? 'Success' : 'Error') }}</h3>
        <p class="dialog-message">{{ data.message }}</p>
      </div>

      <div class="dialog-actions">
        <button mat-flat-button [color]="data.type === 'success' ? 'primary' : 'warn'" class="action-btn" (click)="dialogRef.close(true)">
          {{ data.buttonText || 'OK' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 32px 24px 24px;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .dialog-header-graphic {
      margin-bottom: 20px;
      
      .icon-circle {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
    }

    .success {
      .icon-circle {
        background-color: rgba(19, 222, 185, 0.15);
        color: #13deb9;
      }
      .dialog-icon {
        width: 36px;
        height: 36px;
      }
    }

    .error {
      .icon-circle {
        background-color: rgba(250, 137, 107, 0.15);
        color: #fa896b;
      }
      .dialog-icon {
        width: 36px;
        height: 36px;
      }
    }

    .dialog-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #1e293b;
    }

    .dialog-message {
      font-size: 14px;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .dialog-actions {
      width: 100%;
      display: flex;
      justify-content: center;
      
      .action-btn {
        width: 100%;
        padding: 10px;
        font-weight: 600;
        font-size: 14px;
        border-radius: 8px;
        height: 42px;
      }
    }

    :host-context(.dark-theme) {
      .dialog-title {
        color: #f8fafc;
      }
      .dialog-message {
        color: #94a3b8;
      }
      .success .icon-circle {
        background-color: rgba(19, 222, 185, 0.25);
        color: #80f1d4;
      }
      .error .icon-circle {
        background-color: rgba(250, 137, 107, 0.25);
        color: #ffb4a2;
      }
    }
  `]
})
export class NotificationDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { type: 'success' | 'error'; title?: string; message: string; buttonText?: string },
    public dialogRef: MatDialogRef<NotificationDialogComponent>
  ) {}
}
