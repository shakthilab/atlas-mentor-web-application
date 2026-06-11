import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TablerIconsModule } from 'angular-tabler-icons';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

export interface BranchManager {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-add-branch-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    TablerIconsModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between p-x-24 p-t-24 p-b-16">
        <div class="d-flex align-items-center">
          <div class="header-icon-box m-r-16 d-flex align-items-center justify-content-center bg-light-primary rounded">
            <i-tabler [name]="isEditMode ? 'pencil' : 'building'" class="icon-24 text-primary"></i-tabler>
          </div>
          <div>
            <h2 class="mat-headline-6 f-w-600 m-b-4">{{ isEditMode ? 'Edit Branch' : 'Add New Branch' }}</h2>
            <span class="f-s-14 text-muted">{{ isEditMode ? 'Update details for the branch.' : 'Enter details for the new branch.' }}</span>
          </div>
        </div>
        <button mat-icon-button (click)="closeDialog()" class="text-muted">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <mat-dialog-content class="p-x-24 p-t-8 p-b-24 mat-typography">
        <form [formGroup]="branchForm" class="branch-form">

          <!-- Branch Name -->
          <div class="m-b-12">
            <mat-label class="f-w-600 m-b-8 d-flex align-items-center text-dark field-label">
              <i-tabler name="building" class="icon-16 m-r-6 text-primary"></i-tabler>
              Branch Name
            </mat-label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
              <input matInput formControlName="name" placeholder="e.g., Chennai" />
              <mat-error *ngIf="branchForm.get('name')?.hasError('required')">Branch name is required</mat-error>
            </mat-form-field>
          </div>

          <!-- Location -->
          <div class="m-b-12">
            <mat-label class="f-w-600 m-b-8 d-flex align-items-center text-dark field-label">
              <i-tabler name="map-pin" class="icon-16 m-r-6 text-primary"></i-tabler>
              Location / Address
            </mat-label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
              <textarea matInput formControlName="location" placeholder="Full address of the branch" rows="3"></textarea>
              <mat-error *ngIf="branchForm.get('location')?.hasError('required')">Location is required</mat-error>
            </mat-form-field>
          </div>

          <!-- Manager -->
          <div class="m-b-12">
            <mat-label class="f-w-600 m-b-8 d-flex align-items-center text-dark field-label">
              <i-tabler name="user-circle" class="icon-16 m-r-6 text-primary"></i-tabler>
              Branch Manager
            </mat-label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
              <mat-select formControlName="managerId" placeholder="Select Manager">
                <mat-option *ngFor="let mgr of managers" [value]="mgr.id">
                  <div class="d-flex align-items-center">
                    <img [src]="getManagerAvatar(mgr.id)" class="rounded-circle m-r-8 object-cover" width="24" height="24" />
                    <span>{{ mgr.name }}</span>
                    <span class="f-s-12 text-muted m-l-8">{{ mgr.email }}</span>
                  </div>
                </mat-option>
              </mat-select>
              <mat-hint *ngIf="isLoadingManagers">Loading managers...</mat-hint>
              <mat-error *ngIf="branchForm.get('managerId')?.hasError('required')">Manager is required</mat-error>
            </mat-form-field>
          </div>

          <!-- Status (edit only) -->
          <div class="m-b-12" *ngIf="isEditMode">
            <mat-label class="f-w-600 m-b-8 d-flex align-items-center text-dark field-label">
              <i-tabler name="toggle-right" class="icon-16 m-r-6 text-primary"></i-tabler>
              Status
            </mat-label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
              <mat-select formControlName="status">
                <mat-option value="ACTIVE">Active</mat-option>
                <mat-option value="INACTIVE">Inactive</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="p-x-24 p-b-24 d-flex justify-content-end gap-12" align="end">
        <button mat-stroked-button (click)="closeDialog()" [disabled]="isSubmitting">Cancel</button>
        <button mat-flat-button color="primary" (click)="onSubmit()"
          [disabled]="branchForm.invalid || isSubmitting || isLoadingManagers"
          class="d-flex align-items-center">
          <i-tabler *ngIf="isSubmitting" name="loader" class="icon-18 m-r-8 spinning"></i-tabler>
          <i-tabler *ngIf="!isSubmitting" [name]="isEditMode ? 'device-floppy' : 'plus'" class="icon-18 m-r-8"></i-tabler>
          {{ isEditMode ? 'Save Changes' : 'Create Branch' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      min-width: 480px;
      max-width: 560px;
      background-color: var(--mat-dialog-container-color, #ffffff);
      color: var(--mat-dialog-container-text-color, #1e293b);
      @media (max-width: 600px) { min-width: unset; width: 100%; }
    }

    .header-icon-box { width: 48px; height: 48px; }
    .bg-light-primary { background-color: rgba(97, 93, 255, 0.1) !important; }
    .object-cover { object-fit: cover; }
    .field-label { gap: 4px; margin-bottom: 8px; }
    .m-r-6 { margin-right: 6px; }

    ::ng-deep .theme-input .mat-mdc-text-field-wrapper { background-color: transparent !important; }
    ::ng-deep .theme-input .mdc-notched-outline__leading,
    ::ng-deep .theme-input .mdc-notched-outline__notch,
    ::ng-deep .theme-input .mdc-notched-outline__trailing { border-color: #e2e8f0 !important; border-width: 1px !important; }
    ::ng-deep .theme-input.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .theme-input.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .theme-input.mat-focused .mdc-notched-outline__trailing { border-color: #615dff !important; border-width: 2px !important; }

    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .m-b-4 { margin-bottom: 4px; } .m-b-8 { margin-bottom: 8px; } .m-b-12 { margin-bottom: 12px; }
    .m-r-8 { margin-right: 8px; } .m-r-16 { margin-right: 16px; } .m-l-8 { margin-left: 8px; }
    .p-x-24 { padding-left: 24px; padding-right: 24px; }
    .p-t-8 { padding-top: 8px; } .p-t-24 { padding-top: 24px; }
    .p-b-16 { padding-bottom: 16px; } .p-b-24 { padding-bottom: 24px; }
    .gap-12 { gap: 12px; }

    :host-context(.dark-theme) {
      .dialog-container { background-color: var(--dark-sidebarbg, #1e293b); }
      .text-dark { color: #f8fafc !important; }
      ::ng-deep .theme-input .mdc-notched-outline__leading,
      ::ng-deep .theme-input .mdc-notched-outline__notch,
      ::ng-deep .theme-input .mdc-notched-outline__trailing { border-color: var(--dark-formborderColor, #334155) !important; }
      ::ng-deep .theme-input input,
      ::ng-deep .theme-input textarea,
      ::ng-deep .theme-input .mat-mdc-select-value-text { color: #f8fafc !important; }
    }
  `]
})
export class AddBranchDialogComponent implements OnInit {
  branchForm: FormGroup;
  managers: BranchManager[] = [];
  isSubmitting = false;
  isEditMode = false;
  isLoadingManagers = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddBranchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.branchForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      managerId: ['', Validators.required],
      status: ['ACTIVE']
    });
  }

  ngOnInit(): void {
    if (this.data?.id) {
      this.isEditMode = true;
      this.branchForm.patchValue({
        name: this.data.name,
        location: this.data.location,
        managerId: this.data.manager?.id || this.data.managerId,
        status: this.data.status || 'ACTIVE'
      });
    }
    this.loadManagers();
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });
  }

  getManagerAvatar(managerId?: number): string {
    if (!managerId) return '/assets/images/profile/user-1.jpg';
    return `/assets/images/profile/user-${(managerId % 4) + 1}.jpg`;
  }

  loadManagers(): void {
    this.isLoadingManagers = true;
    this.http.get<any>(`${environment.apiUrl}/branches/managers`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.isLoadingManagers = false;
        this.managers = res?.data || res || [];
      },
      error: () => {
        this.isLoadingManagers = false;
        console.error('Failed to load managers');
      }
    });
  }

  closeDialog(result?: any): void {
    this.dialogRef.close(result);
  }

  onSubmit(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = { ...this.branchForm.value };
    // Ensure managerId is a number
    payload.managerId = Number(payload.managerId);

    if (this.isEditMode) {
      this.http.put<any>(
        `${environment.apiUrl}/branches/${this.data.id}`,
        payload,
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notificationService.showSuccessToast('Branch updated successfully.', 'Success');
          this.closeDialog(res);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error updating branch:', err);
          this.notificationService.showErrorToast('Failed to update branch.', 'Error');
        }
      });
    } else {
      this.http.post<any>(
        `${environment.apiUrl}/branches`,
        payload,
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notificationService.showSuccessToast('Branch created successfully.', 'Success');
          this.closeDialog(res);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error creating branch:', err);
          this.notificationService.showErrorToast('Failed to create branch.', 'Error');
        }
      });
    }
  }
}
