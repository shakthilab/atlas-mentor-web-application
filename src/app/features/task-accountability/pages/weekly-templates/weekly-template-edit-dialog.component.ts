import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-weekly-template-edit-dialog',
  template: `
    <div class="custom-dialog-container">
      <!-- Header Section -->
      <div class="custom-dialog-header">
        <div>
          <h2 class="dialog-title">{{ isEditMode ? 'Edit Weekly Template' : 'Create Weekly Template' }}</h2>
          <p class="dialog-subtitle">Define a distinct question set for each week of the monthly cycle.</p>
        </div>
        <button class="btn-close" type="button" mat-dialog-close>
          <i-tabler name="x" class="icon-16"></i-tabler>
        </button>
      </div>

      <form [formGroup]="templateForm" (ngSubmit)="onSubmit()">
        <!-- Body Section -->
        <div class="custom-dialog-body">
          
          <!-- Row 1: Template Name Input -->
          <div class="form-group m-b-24">
            <label class="form-label">TEMPLATE NAME</label>
            <input 
              class="form-input" 
              formControlName="name" 
              placeholder="e.g. Senior Branch Lead Weekly Audit" 
            />
            <span *ngIf="submitted && templateForm.get('name')?.invalid" class="validation-error">
              Template name is required
            </span>
          </div>

          <!-- Row 2: Assigned Role & Cycle Month -->
          <div class="row m-b-24">
            <div class="col-sm-6 form-group m-b-16-mobile">
              <label class="form-label">ASSIGNED ROLE</label>
              <div class="select-wrapper">
                <select class="form-select" formControlName="roleId" [disabled]="isEditMode">
                  <option [value]="null" disabled selected>Select a role...</option>
                  <option *ngFor="let role of roles" [value]="role.id">
                    {{ role.displayName || role.name }}
                  </option>
                </select>
                <i-tabler name="chevron-down" class="select-chevron"></i-tabler>
              </div>
              <span *ngIf="submitted && templateForm.get('roleId')?.invalid" class="validation-error">
                Assigned role is required
              </span>
            </div>

            <div class="col-sm-6 form-group">
              <label class="form-label">CYCLE MONTH</label>
              <div class="select-wrapper">
                <select class="form-select" formControlName="cycleMonth">
                  <option *ngFor="let month of cycleMonthsList" [value]="month">
                    {{ month }}
                  </option>
                </select>
                <i-tabler name="chevron-down" class="select-chevron"></i-tabler>
              </div>
              <span *ngIf="submitted && templateForm.get('cycleMonth')?.invalid" class="validation-error">
                Cycle month is required
              </span>
            </div>
          </div>

          <!-- Accountability Weekly Builder Layout -->
          <div class="weekly-builder-grid">
            <!-- Left Panel: Weeks list -->
            <div class="left-weeks-panel">
              <span class="panel-section-label">WEEKS IN CYCLE</span>
              <div class="weeks-list">
                <button 
                  type="button"
                  *ngFor="let weekNum of [1, 2, 3, 4]"
                  class="week-nav-item"
                  [class.active]="activeWeek === weekNum"
                  (click)="selectWeek(weekNum)"
                >
                  <span class="week-dot-badge" [class.scheduled]="getWeekQuestionCount(weekNum) > 0">
                    W{{ weekNum }}
                  </span>
                  <div class="week-text-meta">
                    <span class="week-title">Week {{ weekNum }}</span>
                    <span class="week-subtitle">
                      {{ getWeekSubtitle(weekNum) }}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Right Panel: Questions editor for active week -->
            <div class="right-questions-panel">
              <div class="right-panel-header m-b-24">
                <div>
                  <h3 class="panel-title">Week {{ activeWeek }} question set</h3>
                  <span class="panel-subtitle">Days {{ getWeekDaysRange(activeWeek) }} • due Friday</span>
                </div>
                <div class="d-flex align-items-center gap-12">
                  <!-- Duplicate From Button & Menu -->
                  <button 
                    type="button" 
                    class="btn-duplicate-from"
                    [matMenuTriggerFor]="duplicateMenu"
                    [disabled]="!hasOtherWeeksWithQuestions()"
                  >
                    <i-tabler name="copy" class="icon-15"></i-tabler>
                    Duplicate from
                  </button>
                  <mat-menu #duplicateMenu="matMenu" class="duplicate-menu-panel" xPosition="before">
                    <ng-container *ngFor="let w of [1, 2, 3, 4]">
                      <button 
                        mat-menu-item 
                        *ngIf="w !== activeWeek && getWeekQuestionCount(w) > 0"
                        (click)="duplicateFromWeek(w)"
                      >
                        <span>Week {{ w }}</span>
                      </button>
                    </ng-container>
                  </mat-menu>

                  <!-- Scheduled Status Badge -->
                  <span class="status-badge" [class.scheduled]="getWeekQuestionCount(activeWeek) > 0">
                    <i-tabler name="check" class="icon-12 m-r-4" *ngIf="getWeekQuestionCount(activeWeek) > 0"></i-tabler>
                    {{ getWeekQuestionCount(activeWeek) > 0 ? 'Scheduled' : 'Not scheduled' }}
                  </span>
                </div>
              </div>

              <!-- Question Form Array Fields -->
              <div formArrayName="questions">
                <div *ngFor="let q of questions.controls; let idx = index" [formGroupName]="idx">
                  <div *ngIf="q.get('weekNumber')?.value === activeWeek" class="question-row-item m-b-16">
                    <!-- Number Badge -->
                    <div class="num-badge">{{ getRelativeIndex(q) }}</div>
                    
                    <!-- Performance Input -->
                    <input 
                      class="form-input flex-grow-1" 
                      formControlName="questionText" 
                      [placeholder]="'Week ' + activeWeek + ' performance question...'" 
                    />
                    
                    <!-- Action Plus/Minus -->
                    <button 
                      type="button" 
                      class="action-circle-btn" 
                      [class.plus]="isLastActiveQuestion(q)"
                      [class.minus]="!isLastActiveQuestion(q)"
                      (click)="isLastActiveQuestion(q) ? addQuestion() : removeQuestion(idx)"
                    >
                      <i-tabler 
                        [name]="isLastActiveQuestion(q) ? 'plus' : 'minus'" 
                        class="action-icon"
                      ></i-tabler>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Message Banner -->
          <div *ngIf="errorMessage" class="error-banner m-t-16">
            {{ errorMessage }}
          </div>
        </div>

        <!-- Footer Actions Section -->
        <div class="custom-dialog-actions-row">
          <!-- Summary meta -->
          <div class="summary-meta">
            {{ getWeeksScheduledCount() }} week{{ getWeeksScheduledCount() === 1 ? '' : 's' }} scheduled • {{ getTotalQuestionsCount() }} total question{{ getTotalQuestionsCount() === 1 ? '' : 's' }}
          </div>
          <div class="d-flex align-items-center gap-16 actions-right">
            <button class="btn-cancel" type="button" mat-dialog-close>Cancel</button>
            
            <!-- Save Template keeps it as DRAFT (only shown/enabled if it's draft or new) -->
            <button class="btn-save btn-secondary" type="submit" [disabled]="isSaving" *ngIf="!isEditMode || data?.status === 'DRAFT'">
              {{ isSaving ? 'Saving...' : 'Save as Draft' }}
            </button>
            
            <!-- Publish saves and publishes (only shown/enabled if it has questions) -->
            <button class="btn-save" type="button" (click)="onPublish()" [disabled]="isSaving || !getTotalQuestionsCount()" *ngIf="!isEditMode || data?.status === 'DRAFT'">
              Publish
            </button>

            <!-- Standard Save for active templates (no separate draft/publish needed since it's already active) -->
            <button class="btn-save" type="submit" [disabled]="isSaving" *ngIf="isEditMode && data?.status !== 'DRAFT'">
              {{ isSaving ? 'Saving...' : 'Save Template' }}
            </button>
          </div>
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
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 6px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        &:hover {
          background-color: #f1f5f9;
          color: #1e293b;
        }
      }
    }

    /* Body Styling */
    .custom-dialog-body {
      padding: 32px;
      max-height: 65vh;
      overflow-y: auto;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-label {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .form-input {
      background-color: #f1f5f9;
      border: 1px solid transparent;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 14px;
      color: #1e293b;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      transition: all 0.2s ease;

      &::placeholder {
        color: #94a3b8;
      }

      &:focus {
        border-color: #cbd5e1;
        background-color: #f8fafc;
      }
    }

    /* Custom select wrapper for clean arrow */
    .select-wrapper {
      position: relative;
      width: 100%;
    }

    .select-chevron {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      pointer-events: none;
      width: 16px;
      height: 16px;
    }

    .form-select {
      background-color: #f1f5f9;
      border: 1px solid transparent;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 14px;
      color: #1e293b;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      appearance: none;
      cursor: pointer;
      transition: all 0.2s ease;

      &:focus {
        border-color: #cbd5e1;
        background-color: #f8fafc;
      }

      &:disabled {
        background-color: #e2e8f0;
        cursor: not-allowed;
        color: #64748b;
      }
    }

    /* Weekly Builder Layout */
    .weekly-builder-grid {
      display: flex;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      min-height: 380px; /* stable height to prevent layout shifts */
    }

    /* Left Weeks panel */
    .left-weeks-panel {
      width: 220px;
      background-color: #f8fafc;
      border-right: 1px solid #e2e8f0;
      padding: 20px 0;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;

      .panel-section-label {
        font-size: 10px;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 1px;
        padding: 0 20px;
        margin-bottom: 16px;
        text-transform: uppercase;
      }
    }

    .weeks-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 8px;
    }

    .week-nav-item {
      background: transparent;
      border: none;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      text-align: left;
      width: 100%;
      flex-shrink: 0;
      white-space: nowrap;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f1f5f9;
      }

      &.active {
        background-color: #2b3447;
        color: #ffffff;

        .week-dot-badge {
          background-color: #3e4b63;
          color: #ffffff;
        }

        .week-subtitle {
          color: #94a3b8;
        }

        .week-title {
          color: #ffffff;
        }
      }

      .week-dot-badge {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #e2e8f0;
        color: #64748b;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.scheduled {
          background-color: #dcfce7;
          color: #166534;
        }
      }

      .week-text-meta {
        display: flex;
        flex-direction: column;
        justify-content: center;
        flex-shrink: 0;
      }

      .week-title {
        font-size: 13.5px;
        font-weight: 600;
        color: #1e293b;
        white-space: nowrap;
      }

      .week-subtitle {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
        white-space: nowrap;
      }
    }

    /* Right Questions panel */
    .right-questions-panel {
      flex: 1;
      padding: 24px 32px;
      background-color: #ffffff;
    }

    .right-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 16px;

      .panel-title {
        font-size: 15px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .panel-subtitle {
        font-size: 12px;
        color: #64748b;
        margin-top: 2px;
      }
    }

    .btn-duplicate-from {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      height: 36px;
      box-sizing: border-box;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f8fafc;
        border-color: #cbd5e1;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .icon-15 {
        width: 15px;
        height: 15px;
      }
    }

    .status-badge {
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 8px;
      text-transform: capitalize;
      background-color: #f1f5f9;
      color: #64748b;
      display: inline-flex;
      align-items: center;
      height: 36px;
      box-sizing: border-box;

      &.scheduled {
        background-color: #e8fbf1;
        color: #107e47;
      }
    }

    /* Question Row List styling */
    .question-row-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
    }

    .num-badge {
      background-color: #f1f5f9;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      width: 38px;
      height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .action-circle-btn {
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      padding: 0;
      transition: all 0.2s ease;

      &.plus {
        width: 32px;
        height: 32px;
        border: 1.5px solid #cbd5e1;
        border-radius: 50%;
        color: #475569;

        &:hover {
          background-color: #f1f5f9;
          color: #1e293b;
          border-color: #94a3b8;
        }
      }

      &.minus {
        width: 32px;
        height: 32px;
        color: #94a3b8;

        &:hover {
          color: #ef4444;
        }
      }

      .action-icon {
        width: 14px;
        height: 14px;
      }
    }

    /* Footer Row Styling */
    .custom-dialog-actions-row {
      padding: 24px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;

      .summary-meta {
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
      }

      .btn-cancel {
        background: transparent;
        border: none;
        font-size: 14px;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        padding: 10px 16px;
        transition: color 0.2s ease;

        &:hover {
          color: #1e293b;
        }
      }

      .btn-save {
        background-color: #1e293b;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 10px 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: #0f172a;
        }

        &.btn-secondary {
          background-color: #ffffff;
          color: #1e293b;
          border: 1.5px solid #cbd5e1;

          &:hover {
            background-color: #f8fafc;
            border-color: #94a3b8;
          }
        }

        &:disabled {
          background-color: #94a3b8;
          border-color: #94a3b8;
          color: #ffffff;
          cursor: not-allowed;
        }
      }
    }

    /* Validation Errors */
    .validation-error {
      color: #ef4444;
      font-size: 11px;
      margin-top: 4px;
      font-weight: 600;
    }

    .error-banner {
      background-color: #fff1f2;
      border: 1px solid #fecdd3;
      color: #be123c;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
    }

    /* Global margins & utilities */
    .m-b-24 { margin-bottom: 24px; }
    .m-b-16 { margin-bottom: 16px; }
    .m-t-16 { margin-top: 16px; }
    .m-l-12 { margin-left: 12px; }
    .m-r-8 { margin-right: 8px; }
    .gap-12 { gap: 12px; }
    .gap-16 { gap: 16px; }
    .flex-grow-1 { flex-grow: 1; }

    /* Media query for mobile & tablet responsiveness */
    @media (max-width: 768px) {
      .custom-dialog-header {
        padding: 16px 20px;
        
        .dialog-title {
          font-size: 16px;
        }
        .dialog-subtitle {
          font-size: 11.5px;
        }
      }
      .custom-dialog-body {
        padding: 20px;
      }
      .m-b-16-mobile {
        margin-bottom: 16px;
      }
      .weekly-builder-grid {
        flex-direction: column;
        min-height: 380px; /* keep stable height on mobile to prevent dialog resizing/glitch */
      }
      .left-weeks-panel {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
        padding: 12px 0;

        .panel-section-label {
          padding: 0 16px;
          margin-bottom: 10px;
        }
      }
      .weeks-list {
        flex-direction: row;
        overflow-x: auto;
        padding: 4px 16px;
        gap: 12px;
        /* Hide scrollbars but keep swipe */
        -ms-overflow-style: none;
        scrollbar-width: none;
        &::-webkit-scrollbar {
          display: none;
        }
      }
      .week-nav-item {
        width: auto;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        white-space: nowrap;
        
        .week-dot-badge {
          width: 32px;
          height: 32px;
          font-size: 11px;
        }
        .week-title {
          font-size: 13.5px;
          white-space: nowrap;
        }
        .week-subtitle {
          font-size: 10.5px;
          white-space: nowrap;
        }
      }
      .right-questions-panel {
        padding: 20px;
      }
      .right-panel-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        
        .d-flex {
          width: 100%;
          justify-content: space-between;
        }
      }
      .btn-duplicate-from {
        padding: 6px 12px;
        font-size: 12px;
        height: 32px;
      }
      .status-badge {
        padding: 4px 10px;
        font-size: 11px;
        height: 32px;
      }
      .question-row-item {
        gap: 8px;
      }
      .num-badge {
        width: 32px;
        height: 32px;
        font-size: 10px;
      }
      .form-input {
        padding: 10px 12px;
        font-size: 13px;
      }
      .custom-dialog-actions-row {
        padding: 16px 20px;
        flex-direction: column;
        gap: 16px;
        align-items: center;
        text-align: center;
        
        .summary-meta {
          order: 2;
        }
        .actions-right {
          width: 100%;
          justify-content: center;
          order: 1;
        }
      }
    }
  `]
})
export class WeeklyTemplateEditDialogComponent implements OnInit {
  templateForm: FormGroup;
  isEditMode = false;
  isSaving = false;
  submitted = false;
  errorMessage = '';
  roles: any[] = [];
  cycleMonthsList: string[] = [];

  activeWeek = 1;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<WeeklyTemplateEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private taskService: TaskAccountabilityService,
    private masterDataService: MasterDataService,
    private notificationService: NotificationService
  ) {
    this.isEditMode = !!(data && data.id);
    this.generateCycleMonths();

    const displayMonth = this.isEditMode && data.cycleMonth
      ? this.formatCycleMonthFromApi(data.cycleMonth)
      : this.getDefaultCycleMonth();

    this.templateForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      roleId: [data?.roleId || null, Validators.required],
      cycleMonth: [displayMonth, Validators.required],
      questions: this.fb.array([])
    });

    if (this.isEditMode) {
      if (data.weeks && data.weeks.length > 0) {
        data.weeks.forEach((w: any) => {
          const wNum = w.weekNumber || 1;
          const questionsList = w.questions || [];
          const sorted = [...questionsList].sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
          sorted.forEach((q: any) => {
            this.questions.push(this.fb.group({
              id: [q.id],
              questionText: [q.questionText || '', Validators.required],
              displayOrder: [q.displayOrder || 0],
              weekNumber: [wNum]
            }));
          });
        });
      } else if (data.questions) {
        const sortedQuestions = [...data.questions].sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
        sortedQuestions.forEach((q: any) => {
          this.questions.push(this.fb.group({
            id: [q.id],
            questionText: [q.questionText || '', Validators.required],
            displayOrder: [q.displayOrder || 0],
            weekNumber: [q.weekNumber || 1]
          }));
        });
      }
    } else {
      this.addQuestion();
    }
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  get questions(): FormArray {
    return this.templateForm.get('questions') as FormArray;
  }

  generateCycleMonths(): void {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const now = new Date();
    const currentMonthIdx = now.getMonth(); // 0-indexed: 0 for January, 11 for December
    const currentYear = now.getFullYear();
    const result = [];
    
    // Add current and upcoming months of this year
    for (let m = currentMonthIdx; m < 12; m++) {
      result.push(`${months[m]} ${currentYear}`);
    }
    
    // Add all months of the next year
    const nextYear = currentYear + 1;
    for (let m = 0; m < 12; m++) {
      result.push(`${months[m]} ${nextYear}`);
    }
    
    this.cycleMonthsList = result;
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

  loadRoles(): void {
    this.masterDataService.getRoles().subscribe({
      next: (res) => {
        if (res && res.success) {
          this.roles = (res.data || []).filter((r: any) => r.name.toUpperCase() !== 'ADMIN');
        }
      }
    });
  }

  selectWeek(weekNum: number): void {
    this.activeWeek = weekNum;
    const activeCtrls = this.questions.controls.filter(c => c.get('weekNumber')?.value === weekNum);
    if (activeCtrls.length === 0) {
      this.addQuestion();
    }
  }

  addQuestion(): void {
    this.questions.push(this.fb.group({
      id: [null],
      questionText: ['', Validators.required],
      displayOrder: [this.questions.length],
      weekNumber: [this.activeWeek]
    }));
  }

  removeQuestion(idx: number): void {
    const activeCtrls = this.questions.controls.filter(c => c.get('weekNumber')?.value === this.activeWeek);
    if (activeCtrls.length <= 1) {
      this.questions.at(idx).get('questionText')?.setValue('');
      return;
    }

    this.questions.removeAt(idx);
    
    this.questions.controls.forEach((ctrl, i) => {
      ctrl.get('displayOrder')?.setValue(i);
    });
  }

  duplicateFromWeek(fromWeekNum: number): void {
    const toRemoveIndices: number[] = [];
    this.questions.controls.forEach((ctrl, idx) => {
      if (ctrl.get('weekNumber')?.value === this.activeWeek) {
        toRemoveIndices.push(idx);
      }
    });
    
    for (let i = toRemoveIndices.length - 1; i >= 0; i--) {
      this.questions.removeAt(toRemoveIndices[i]);
    }

    const sourceCtrls = this.questions.controls.filter(c => c.get('weekNumber')?.value === fromWeekNum);
    sourceCtrls.forEach(c => {
      this.questions.push(this.fb.group({
        id: [null],
        questionText: [c.get('questionText')?.value || '', Validators.required],
        displayOrder: [this.questions.length],
        weekNumber: [this.activeWeek]
      }));
    });

    this.notificationService.showSuccessToast(`Duplicated question set from Week ${fromWeekNum}.`, 'Success');
  }

  hasOtherWeeksWithQuestions(): boolean {
    return [1, 2, 3, 4].some(w => w !== this.activeWeek && this.getWeekQuestionCount(w) > 0);
  }

  getWeekQuestionCount(weekNum: number): number {
    return this.questions.controls.filter(c => {
      const val = c.get('questionText')?.value;
      return c.get('weekNumber')?.value === weekNum && val && val.trim() !== '';
    }).length;
  }

  getWeeksScheduledCount(): number {
    return [1, 2, 3, 4].filter(w => this.getWeekQuestionCount(w) > 0).length;
  }

  getTotalQuestionsCount(): number {
    return this.questions.controls.filter(c => {
      const val = c.get('questionText')?.value;
      return val && val.trim() !== '';
    }).length;
  }

  getRelativeIndex(targetCtrl: any): string {
    let count = 0;
    for (const ctrl of this.questions.controls) {
      if (ctrl.get('weekNumber')?.value === this.activeWeek) {
        count++;
        if (ctrl === targetCtrl) {
          return String(count).padStart(2, '0');
        }
      }
    }
    return '01';
  }

  isLastActiveQuestion(targetCtrl: any): boolean {
    const activeCtrls = this.questions.controls.filter(c => c.get('weekNumber')?.value === this.activeWeek);
    return activeCtrls[activeCtrls.length - 1] === targetCtrl;
  }

  getWeekSubtitle(weekNum: number): string {
    const count = this.getWeekQuestionCount(weekNum);
    if (count > 0) {
      return `${count} question${count === 1 ? '' : 's'}`;
    }
    return this.activeWeek === weekNum ? '0 questions' : 'Not scheduled';
  }

  getWeekDaysRange(weekNum: number): string {
    switch (weekNum) {
      case 1: return '01 – 07';
      case 2: return '08 – 14';
      case 3: return '15 – 21';
      case 4: return '22 – 28';
      default: return '01 - 07';
    }
  }

  onPublish(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.templateForm.invalid) {
      return;
    }

    this.isSaving = true;
    const formValue = this.templateForm.getRawValue();

    const weeksArray = [1, 2, 3, 4].map(w => {
      const weekQuestions = formValue.questions
        .filter((q: any) => q.weekNumber === w && q.questionText && q.questionText.trim() !== '')
        .map((q: any, i: number) => ({
          id: q.id || undefined,
          questionText: q.questionText.trim(),
          displayOrder: i
        }));

      return {
        weekNumber: w,
        dueWeekday: 'FRIDAY',
        questions: weekQuestions
      };
    });

    const payload = {
      name: formValue.name,
      roleId: Number(formValue.roleId),
      cycleMonth: this.formatCycleMonthToApi(formValue.cycleMonth),
      weeks: weeksArray
    };

    const action$ = this.isEditMode
      ? this.taskService.updateWeeklyTemplate(this.data.id, payload)
      : this.taskService.createWeeklyTemplate(payload);

    action$.subscribe({
      next: (res) => {
        const templateId = this.isEditMode ? this.data.id : (res && res.data ? res.data.id : null);
        if (!templateId) {
          this.isSaving = false;
          this.errorMessage = 'Failed to retrieve template ID for publishing.';
          return;
        }

        this.taskService.publishWeeklyTemplate(templateId).subscribe({
          next: () => {
            this.isSaving = false;
            this.notificationService.showSuccessToast(
              'Weekly template saved and published successfully.',
              'Template Published'
            );
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.isSaving = false;
            console.error('Failed to publish weekly template:', err);
            if (err.status === 409) {
              const roleName = this.roles.find(r => r.id === Number(formValue.roleId))?.displayName || 'This role';
              this.errorMessage = `${roleName} already has an active check-in template — deactivate or delete it first.`;
            } else {
              this.errorMessage = err.error?.message || err.message || 'Template saved, but publishing failed.';
            }
          }
        });
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Failed to save weekly template before publishing:', err);
        this.errorMessage = err.error?.message || err.message || 'Failed to save template. Please check input values.';
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.templateForm.invalid) {
      return;
    }

    const formValue = this.templateForm.getRawValue();
    this.isSaving = true;

    // Map questions FormArray back into the structured nested weeks format expected by REST endpoint
    const weeksArray = [1, 2, 3, 4].map(w => {
      const weekQuestions = formValue.questions
        .filter((q: any) => q.weekNumber === w && q.questionText && q.questionText.trim() !== '')
        .map((q: any, i: number) => ({
          id: q.id || undefined,
          questionText: q.questionText.trim(),
          displayOrder: i
        }));

      return {
        weekNumber: w,
        dueWeekday: 'FRIDAY',
        questions: weekQuestions
      };
    });

    const payload = {
      name: formValue.name,
      roleId: Number(formValue.roleId),
      cycleMonth: this.formatCycleMonthToApi(formValue.cycleMonth),
      weeks: weeksArray
    };

    const action$ = this.isEditMode
      ? this.taskService.updateWeeklyTemplate(this.data.id, payload)
      : this.taskService.createWeeklyTemplate(payload);

    action$.subscribe({
      next: (res) => {
        this.isSaving = false;
        this.notificationService.showSuccessToast(
          this.isEditMode ? 'Weekly template updated successfully.' : 'Weekly template created as Draft.',
          'Template Saved'
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Failed to save weekly template:', err);
        this.errorMessage = err.error?.message || err.message || 'Failed to save template. Please check input values.';
      }
    });
  }
}
