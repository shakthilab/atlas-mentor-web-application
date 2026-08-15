import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-weekly-template-duplicate-dialog',
  template: `
    <div class="custom-dialog-container" style="max-width: 500px;">
      <!-- Header Section -->
      <div class="custom-dialog-header">
        <div>
          <h2 class="dialog-title">Duplicate Weekly Template</h2>
          <p class="dialog-subtitle">Choose a new name, target role, and cycle month for the duplicate template draft.</p>
        </div>
        <button class="btn-close" type="button" mat-dialog-close>
          <i-tabler name="x" class="icon-16"></i-tabler>
        </button>
      </div>

      <form [formGroup]="duplicateForm" (ngSubmit)="onSubmit()">
        <!-- Body Section -->
        <div class="custom-dialog-body" style="padding: 24px 32px;">
          <div *ngIf="errorMessage" class="error-banner m-b-16">
            {{ errorMessage }}
          </div>

          <!-- Template Name Input -->
          <div class="form-group m-b-24">
            <label class="form-label">NEW TEMPLATE NAME</label>
            <input 
              class="form-input" 
              formControlName="newTemplateName" 
              placeholder="e.g. Senior Counsellor Weekly Audit" 
            />
            <span *ngIf="submitted && duplicateForm.get('newTemplateName')?.invalid" class="validation-error">
              New template name is required
            </span>
          </div>

          <!-- Target Role Input -->
          <div class="form-group m-b-24">
            <label class="form-label">NEW TARGET ROLE</label>
            <div class="select-wrapper">
              <select class="form-select" formControlName="newRoleId">
                <option [value]="null" disabled selected>Select target role...</option>
                <option *ngFor="let role of roles" [value]="role.id">
                  {{ role.displayName || role.name }}
                </option>
              </select>
              <i-tabler name="chevron-down" class="select-chevron"></i-tabler>
            </div>
            <span *ngIf="submitted && duplicateForm.get('newRoleId')?.invalid" class="validation-error">
              Target role is required
            </span>
          </div>

          <!-- Cycle Month Selection -->
          <div class="form-group">
            <label class="form-label">TARGET CYCLE MONTH</label>
            <div class="select-wrapper">
              <select class="form-select" formControlName="newCycleMonth">
                <option *ngFor="let month of cycleMonthsList" [value]="month">
                  {{ month }}
                </option>
              </select>
              <i-tabler name="chevron-down" class="select-chevron"></i-tabler>
            </div>
            <span *ngIf="submitted && duplicateForm.get('newCycleMonth')?.invalid" class="validation-error">
              Target cycle month is required
            </span>
          </div>
        </div>

        <!-- Footer Section -->
        <div class="custom-dialog-footer">
          <button class="btn-cancel" type="button" mat-dialog-close [disabled]="isSaving">
            Cancel
          </button>
          <button class="btn-submit" type="submit" [disabled]="isSaving || duplicateForm.invalid">
            {{ isSaving ? 'Duplicating...' : 'Duplicate' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .custom-dialog-container {
      width: 100%;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      font-family: inherit;
    }

    /* Header Styling */
    .custom-dialog-header {
      padding: 24px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;

      .dialog-title {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .dialog-subtitle {
        font-size: 13px;
        color: #64748b;
        margin: 4px 0 0 0;
      }

      .btn-close {
        border: none;
        background: transparent;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        &:hover {
          background: #f1f5f9;
          color: #1e293b;
        }
      }
    }

    /* Forms */
    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .form-input {
      height: 42px;
      padding: 0 16px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      color: #1e293b;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }

    .select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-select {
      width: 100%;
      height: 42px;
      padding: 0 40px 0 16px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      color: #1e293b;
      background-color: #ffffff;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      &:disabled {
        background: #f8fafc;
        cursor: not-allowed;
      }
    }

    .select-chevron {
      position: absolute;
      right: 16px;
      color: #64748b;
      pointer-events: none;
      width: 16px;
      height: 16px;
    }

    .validation-error {
      color: #ef4444;
      font-size: 12px;
      margin-top: 6px;
      font-weight: 500;
    }

    .error-banner {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 8px;
      padding: 12px 16px;
      color: #b91c1c;
      font-size: 13px;
      font-weight: 500;
    }

    /* Footer Styling */
    .custom-dialog-footer {
      padding: 16px 32px 24px;
      background: #fafafa;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #f1f5f9;

      .btn-cancel {
        height: 38px;
        padding: 0 18px;
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .btn-submit {
        height: 38px;
        padding: 0 20px;
        background: #3b82f6;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        color: #ffffff;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        transition: all 0.15s ease;

        &:hover:not(:disabled) {
          background: #2563eb;
        }

        &:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
      }
    }
  `]
})
export class WeeklyTemplateDuplicateDialogComponent implements OnInit {
  duplicateForm!: FormGroup;
  cycleMonthsList: string[] = [];
  roles: any[] = [];
  submitted = false;
  isSaving = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<WeeklyTemplateDuplicateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private taskService: TaskAccountabilityService,
    private masterDataService: MasterDataService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.generateCycleMonths();
    this.loadRoles();

    // Map template month name from data
    const displayMonth = this.data.cycleMonth
      ? this.formatCycleMonthFromApi(this.data.cycleMonth)
      : this.getDefaultCycleMonth();

    this.duplicateForm = this.fb.group({
      newTemplateName: [`${this.data.name} (Copy)` || '', Validators.required],
      newRoleId: [this.data.roleId || null, Validators.required],
      newCycleMonth: [displayMonth, Validators.required]
    });
  }

  loadRoles(): void {
    this.masterDataService.getRoles().subscribe({
      next: (res) => {
        if (res && res.success) {
          this.roles = (res.data || []).filter((r: any) => r.name.toUpperCase() !== 'ADMIN');
        }
      }
    });
  }

  generateCycleMonths(): void {
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYear = new Date().getFullYear();
    const currentMonthIdx = new Date().getMonth();
    const list: string[] = [];
    
    // Add remaining months of current year
    for (let m = currentMonthIdx; m < 12; m++) {
      list.push(`${names[m]} ${currentYear}`);
    }
    
    // Add all months of next year
    for (let m = 0; m < 12; m++) {
      list.push(`${names[m]} ${currentYear + 1}`);
    }
    this.cycleMonthsList = list;
  }

  getDefaultCycleMonth(): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const d = new Date();
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  formatCycleMonthToApi(monthStr: string): string {
    if (!monthStr) return '';
    const parts = monthStr.split(' ');
    const monthName = parts[0];
    const year = parts[1];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIdx = months.indexOf(monthName);
    if (monthIdx === -1) return '';
    const monthVal = String(monthIdx + 1).padStart(2, '0');
    return `${year}-${monthVal}`;
  }

  formatCycleMonthFromApi(monthStr: string): string {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const parts = monthStr.split('-');
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${months[monthNum - 1]} ${year}`;
    }
    return monthStr;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.duplicateForm.invalid) {
      return;
    }

    this.isSaving = true;
    const formValue = this.duplicateForm.getRawValue();

    const payload = {
      newTemplateName: formValue.newTemplateName.trim(),
      newCycleMonth: this.formatCycleMonthToApi(formValue.newCycleMonth),
      newRoleId: Number(formValue.newRoleId),
      roleId: Number(formValue.newRoleId)
    };

    this.taskService.duplicateWeeklyTemplateApi(this.data.id, payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.notificationService.showSuccessToast(
          `Template "${this.data.name}" duplicated successfully!`,
          'Duplicated'
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Failed to duplicate weekly template:', err);
        this.errorMessage = err.error?.message || err.message || 'Failed to duplicate template. Please try again.';
      }
    });
  }
}
