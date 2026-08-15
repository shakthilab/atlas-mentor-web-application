import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';

export interface SendBackDialogData {
  title?: string;
  description?: string;
  placeholder?: string;
}

@Component({
  selector: 'app-send-back-reason-dialog',
  standalone: false,
  template: `
    <div class="send-back-dialog-container">
      <div class="dialog-header">
        <h2 class="dialog-title">{{ data.title || 'Send Back Reason Required' }}</h2>
        <button class="close-btn" mat-dialog-close type="button" aria-label="Close dialog">
          <i-tabler name="x" class="icon-18"></i-tabler>
        </button>
      </div>

      <div class="dialog-body">
        <p class="description-text">{{ data.description || 'Please provide feedback for sending back.' }}</p>
        
        <div class="reason-input-wrapper">
          <label class="input-label">Feedback / Reason <span class="required-star">*</span></label>
          <textarea 
            class="custom-reason-textarea"
            [(ngModel)]="comment" 
            rows="4" 
            [placeholder]="data.placeholder || 'Enter feedback comment...'"
            required
            cdkFocusInitial
          ></textarea>
        </div>
      </div>

      <div class="dialog-footer">
        <button mat-button class="btn-cancel" mat-dialog-close type="button">Cancel</button>
        <button 
          mat-flat-button 
          color="warn" 
          class="btn-submit" 
          [disabled]="!comment || comment.trim() === ''" 
          (click)="submit()"
          type="button"
        >
          Send Back
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .send-back-dialog-container {
      padding: 16px 20px;
      min-width: 400px;
      max-width: 480px;
      box-sizing: border-box;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .dialog-title {
        margin: 0;
        font-size: 17px;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.3;
      }
      .close-btn {
        background: transparent;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
        &:hover { background-color: #f1f5f9; color: #0f172a; }
      }
    }
    .dialog-body {
      margin-bottom: 4px;
    }
    .description-text {
      font-size: 13.5px;
      color: #475569;
      margin: 0 0 12px 0;
      line-height: 1.45;
    }
    .reason-input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .input-label {
      font-size: 12.5px;
      font-weight: 600;
      color: #475569;
    }
    .required-star {
      color: #ef4444;
    }
    .custom-reason-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      font-family: inherit;
      font-size: 13.5px;
      color: #0f172a;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      outline: none;
      resize: vertical;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
      }

      &::placeholder {
        color: #94a3b8;
      }
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      margin-top: 18px;
    }
    .btn-cancel {
      color: #64748b;
      font-weight: 600;
    }
    .btn-submit {
      font-weight: 600;
      border-radius: 6px;
      padding: 6px 18px;
    }
  `]
})
export class SendBackReasonDialogComponent {
  comment: string = '';

  constructor(
    public dialogRef: MatDialogRef<SendBackReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SendBackDialogData
  ) {}

  submit(): void {
    if (this.comment && this.comment.trim()) {
      this.dialogRef.close(this.comment.trim());
    }
  }
}
