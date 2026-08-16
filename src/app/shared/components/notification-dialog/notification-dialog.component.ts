import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-notification-dialog',
  template: `
    <div class="dialog-container" [ngClass]="data.type">
      <div class="dialog-header-graphic">
        <div class="icon-circle">
          <i-tabler [name]="data.icon || (data.type === 'success' ? 'mail' : 'alert-circle')" class="dialog-icon"></i-tabler>
        </div>
      </div>
      
      <div class="dialog-content text-center">
        <h3 class="dialog-title">{{ data.title || (data.type === 'success' ? 'Success' : 'Error') }}</h3>
        <p class="dialog-message">{{ data.message }}</p>
      </div>

      <div class="dialog-actions" [style.flex-direction]="data.showResend ? 'column' : 'row'" [style.gap]="data.showResend ? '8px' : '0'">
        <button mat-flat-button class="action-btn" (click)="dialogRef.close(true)">
          {{ data.buttonText || 'OK' }}
        </button>
        <button *ngIf="data.showResend" mat-button class="action-btn resend-btn" (click)="dialogRef.close('resend')">
          Resend Verification Link
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes bob-and-pulse {
      0% { transform: scale(1) translateY(0); }
      50% { transform: scale(1.08) translateY(-4px); }
      100% { transform: scale(1) translateY(0); }
    }

    .dialog-container {
      padding: 36px 32px 28px;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: #ffffff;
    }

    .dialog-header-graphic {
      margin-bottom: 24px;
      
      .icon-circle {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--brand-primary);
        background-color: #ffffff;
      }
    }

    .success {
      .icon-circle {
        border-color: var(--brand-primary);
        color: var(--brand-primary);
      }
      .dialog-icon {
        width: 28px;
        height: 28px;
        animation: bob-and-pulse 3s ease-in-out infinite;
      }
    }

    .error {
      .icon-circle {
        border-color: var(--brand-primary);
        color: var(--brand-primary);
      }
      .dialog-icon {
        width: 28px;
        height: 28px;
        animation: bob-and-pulse 3s ease-in-out infinite;
      }
    }

    .dialog-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
      color: var(--brand-primary);
      font-family: 'Outfit', 'Inter', sans-serif;
      letter-spacing: -0.3px;
    }

    .dialog-message {
      font-size: 14px;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 28px;
      font-family: 'Inter', sans-serif;
    }

    .dialog-actions {
      width: 100%;
      display: flex;
      justify-content: center;
      
      .action-btn {
        width: 100%;
        padding: 12px 0;
        font-weight: 700;
        font-size: 13px;
        border-radius: 4px !important;
        height: 46px;
        background-color: var(--brand-primary) !important;
        color: #ffffff !important;
        border: none !important;
        box-shadow: none !important;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        font-family: 'Inter', sans-serif;
        transition: background-color 0.2s ease;
        
        &:hover {
          background-color: var(--brand-primary-dark) !important;
        }
      }

      .resend-btn {
        background-color: transparent !important;
        color: var(--brand-primary) !important;
        border: 1px solid #cbd5e1 !important;
        margin-top: 8px;
        
        &:hover {
          background-color: #f1f5f9 !important;
        }
      }
    }

    :host-context(.dark-theme) {
      .dialog-container {
        background-color: #1e293b;
      }
      .dialog-title {
        color: #ffffff;
      }
      .dialog-message {
        color: #94a3b8;
      }
      .success .icon-circle {
        border-color: #ffffff;
        color: #ffffff;
        background-color: transparent;
      }
      .error .icon-circle {
        border-color: #ffffff;
        color: #ffffff;
        background-color: transparent;
      }
      .dialog-actions .action-btn {
        background-color: #ffffff !important;
        color: var(--brand-primary) !important;
        &:hover {
          background-color: #e2e8f0 !important;
        }
      }
      .dialog-actions .resend-btn {
        color: #ffffff !important;
        border-color: #475569 !important;
        &:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
      }
    }
  `]
})
export class NotificationDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { 
      type: 'success' | 'error'; 
      title?: string; 
      message: string; 
      buttonText?: string;
      showResend?: boolean;
      icon?: string;
    },
    public dialogRef: MatDialogRef<NotificationDialogComponent>
  ) {}
}
