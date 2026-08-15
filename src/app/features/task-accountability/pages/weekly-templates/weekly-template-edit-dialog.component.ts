import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-weekly-template-edit-dialog',
  template: `
    <div class="dialog-header d-flex align-items-center justify-content-between p-24 p-b-16">
      <h3 class="mat-h3 m-b-0 font-semibold text-dark">{{ isEditMode ? 'Edit Weekly Template' : 'Create Weekly Template' }}</h3>
      <button mat-icon-button type="button" mat-dialog-close>
        <i-tabler name="x" class="icon-20"></i-tabler>
      </button>
    </div>

    <form [formGroup]="templateForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="p-24 p-t-0">
        <div class="row m-b-16">
          <div class="col-12 m-b-16">
            <mat-label class="mat-subtitle-2 f-s-14 f-w-600 m-b-8 d-block">Template Name <span class="text-error">*</span></mat-label>
            <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
              <input matInput formControlName="name" placeholder="e.g. Senior Counsellor Weekly Check-in" />
            </mat-form-field>
            <mat-error *ngIf="submitted && templateForm.get('name')?.invalid" class="f-s-12 m-t-4 text-error">Name is required</mat-error>
          </div>

          <div class="col-12 m-b-16">
            <mat-label class="mat-subtitle-2 f-s-14 f-w-600 m-b-8 d-block">Assigned Role <span class="text-error">*</span></mat-label>
            <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
              <mat-select formControlName="roleId" placeholder="Select Role" [disabled]="isEditMode">
                <mat-option *ngFor="let role of roles" [value]="role.id">{{ role.displayName || role.name }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-error *ngIf="submitted && templateForm.get('roleId')?.invalid" class="f-s-12 m-t-4 text-error">Role is required</mat-error>
          </div>
        </div>

        <div class="bg-light p-16 rounded m-b-16">
          <div class="d-flex align-items-center justify-content-between m-b-12">
            <h4 class="mat-subtitle-2 f-s-14 f-w-600 m-b-0 text-dark">Questions (Checklist)</h4>
            <button mat-stroked-button type="button" color="primary" class="btn-xs" (click)="addQuestion()">
              <i-tabler name="plus" class="icon-14 m-r-4"></i-tabler> Add Question
            </button>
          </div>

          <div formArrayName="questions">
            <div *ngIf="questions.length === 0" class="text-center p-16 text-muted f-s-13">
              No questions added yet. Click "Add Question" to start.
            </div>

            <div *ngFor="let q of questions.controls; let idx = index" [formGroupName]="idx" class="question-row d-flex align-items-center gap-12 m-b-12">
              <span class="drag-handle text-muted f-s-14 f-w-600">#{{ idx + 1 }}</span>
              
              <mat-form-field appearance="outline" class="flex-grow-1" subscriptSizing="dynamic">
                <input matInput formControlName="questionText" placeholder="e.g. List weekly achievements & milestones" />
              </mat-form-field>

              <button mat-icon-button type="button" color="warn" (click)="removeQuestion(idx)" [disabled]="questions.length === 1">
                <i-tabler name="trash" class="icon-16"></i-tabler>
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="errorMessage" class="alert alert-danger m-b-0 m-t-16 f-s-13">
          {{ errorMessage }}
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="p-24 p-t-0 d-flex justify-content-end gap-12">
        <button mat-stroked-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="isSaving">
          {{ isSaving ? 'Saving...' : 'Save Template' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-header {
      border-bottom: 1px solid #e2e8f0;
    }
    .question-row {
      background: #ffffff;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .btn-xs {
      height: 28px;
      line-height: 26px;
      padding: 0 10px;
      font-size: 11px;
    }
    .alert-danger {
      background-color: #fff1f2;
      border: 1px solid #fecdd3;
      color: #e11d48;
      padding: 10px 14px;
      border-radius: 6px;
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

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<WeeklyTemplateEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private taskService: TaskAccountabilityService,
    private masterDataService: MasterDataService,
    private notificationService: NotificationService
  ) {
    this.isEditMode = !!(data && data.id);

    this.templateForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      roleId: [data?.roleId || null, Validators.required],
      questions: this.fb.array([])
    });

    if (this.isEditMode && data.questions) {
      // Sort existing questions by displayOrder
      const sortedQuestions = [...data.questions].sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
      sortedQuestions.forEach((q: any) => {
        this.questions.push(this.fb.group({
          id: [q.id],
          questionText: [q.questionText || '', Validators.required],
          displayOrder: [q.displayOrder || 0]
        }));
      });
    } else {
      // Start with one default question
      this.addQuestion();
    }
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  get questions(): FormArray {
    return this.templateForm.get('questions') as FormArray;
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

  addQuestion(): void {
    this.questions.push(this.fb.group({
      id: [null],
      questionText: ['', Validators.required],
      displayOrder: [this.questions.length]
    }));
  }

  removeQuestion(idx: number): void {
    this.questions.removeAt(idx);
    // Recalculate displayOrder
    this.questions.controls.forEach((ctrl, i) => {
      ctrl.get('displayOrder')?.setValue(i);
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

    const payload = {
      name: formValue.name,
      roleId: formValue.roleId,
      questions: formValue.questions.map((q: any, i: number) => ({
        id: q.id || undefined,
        questionText: q.questionText,
        displayOrder: i
      }))
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
