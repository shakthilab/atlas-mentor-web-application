import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'app-notification-toast',
  template: `
    <div class="toast-container" [ngClass]="data.type">
      <div class="toast-content">
        <i-tabler [name]="data.type === 'success' ? 'circle-check' : 'alert-circle'" class="toast-icon"></i-tabler>
        <div class="toast-text">
          <div class="toast-title">{{ data.title || (data.type === 'success' ? 'Success' : 'Error') }}</div>
          <div class="toast-message">{{ data.message }}</div>
        </div>
      </div>
      <button class="toast-close" (click)="snackBarRef.dismiss()">
        <i-tabler name="x" class="close-icon"></i-tabler>
      </button>
    </div>
  `,
  styles: [`
    .toast-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 320px;
      max-width: 480px;
      
      &.success {
        background-color: #e6fffa;
        border-left: 4px solid #13deb9;
        color: #0d7c66;
        .toast-icon { color: #13deb9; }
      }
      
      &.error {
        background-color: #fdf2f2;
        border-left: 4px solid #fa896b;
        color: #b91c1c;
        .toast-icon { color: #fa896b; }
      }
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toast-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-text {
      display: flex;
      flex-direction: column;
    }

    .toast-title {
      font-weight: 600;
      font-size: 14px;
      line-height: 1.4;
    }

    .toast-message {
      font-size: 13px;
      line-height: 1.4;
      opacity: 0.9;
    }

    .toast-close {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
      transition: opacity 0.2s;
      display: flex;
      align-items: center;
      
      &:hover {
        opacity: 1;
      }
      
      .close-icon {
        width: 16px;
        height: 16px;
      }
    }

    :host-context(.dark-theme) {
      .toast-container {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        &.success {
          background-color: #112d26;
          color: #80f1d4;
        }
        &.error {
          background-color: #3b1912;
          color: #ffb4a2;
        }
      }
    }
  `]
})
export class NotificationToastComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: { type: 'success' | 'error'; title?: string; message: string },
    public snackBarRef: MatSnackBarRef<NotificationToastComponent>
  ) {}
}
