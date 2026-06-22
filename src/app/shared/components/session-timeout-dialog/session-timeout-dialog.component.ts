import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, TablerIconsModule],
  template: `
    <div class="session-timeout-container">
      <!-- Animated Icon -->
      <div class="icon-wrapper">
        <div class="icon-ring">
          <i-tabler name="clock-exclamation" class="timeout-icon"></i-tabler>
        </div>
      </div>

      <!-- Content -->
      <div class="dialog-body">
        <h2 class="dialog-title">Session Expired</h2>
        <p class="dialog-message">
          Your session has timed out due to inactivity.<br/>
          Please log in again to continue.
        </p>
      </div>

      <!-- Action -->
      <div class="dialog-actions">
        <button mat-flat-button color="primary" class="login-btn" (click)="onLogin()">
          <span class="btn-content">
            <i-tabler name="login" class="btn-icon"></i-tabler>
            <span>Login Again</span>
          </span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .session-timeout-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 32px 32px;
      text-align: center;
      background-color: var(--mat-dialog-container-color, #ffffff);
    }

    .icon-wrapper {
      margin-bottom: 24px;
    }

    .icon-ring {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(250, 137, 107, 0.15), rgba(250, 137, 107, 0.05));
      border: 2px solid rgba(250, 137, 107, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s ease-in-out infinite;

      .timeout-icon {
        width: 36px;
        height: 36px;
        color: #fa896b;
      }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 137, 107, 0.3); }
      50% { transform: scale(1.04); box-shadow: 0 0 0 8px rgba(250, 137, 107, 0); }
    }

    .dialog-title {
      font-size: 22px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 12px;
    }

    .dialog-message {
      font-size: 14px;
      color: #64748b;
      line-height: 1.7;
      margin: 0 0 28px;
    }

    .dialog-actions {
      width: 100%;
    }

    .login-btn {
      width: 100%;
      height: 44px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 8px;
      display: block;
      padding: 0;
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 100%;
      width: 100%;
    }

    .btn-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;

      ::ng-deep svg {
        display: block;
        width: 20px;
        height: 20px;
      }
    }

    :host-context(.dark-theme) {
      .session-timeout-container {
        background-color: var(--dark-sidebarbg, #1e293b);
      }
      .dialog-title {
        color: #f8fafc;
      }
      .dialog-message {
        color: #94a3b8;
      }
    }
  `]
})
export class SessionTimeoutDialogComponent {
  constructor(private dialogRef: MatDialogRef<SessionTimeoutDialogComponent>) {}

  onLogin(): void {
    this.dialogRef.close();
  }
}
