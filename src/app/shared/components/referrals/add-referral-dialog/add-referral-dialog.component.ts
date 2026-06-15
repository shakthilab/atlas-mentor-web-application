import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MasterDataService, Branch, MobileCountryCode } from '../../../../core/services/master-data.service';
import { ReferralService } from '../../../../core/services/referral.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-add-referral-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatDividerModule, TablerIconsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="d-flex align-items-center justify-content-between p-x-24 p-t-24 p-b-16">
        <div class="d-flex align-items-center">
          <div class="header-icon-box m-r-16 d-flex align-items-center justify-content-center bg-light-primary text-primary rounded">
            <i-tabler [name]="isEditMode ? 'edit' : 'user-plus'" class="icon-24"></i-tabler>
          </div>
          <div>
            <h2 class="mat-headline-6 f-w-600 m-b-4">{{ isEditMode ? 'Edit Referral' : 'Add New Referral' }}</h2>
            <span class="f-s-14 text-muted">{{ isEditMode ? 'Update details for the referral partner.' : 'Enter details for the new referral partner.' }}</span>
          </div>
        </div>
        <button mat-icon-button (click)="closeDialog()" class="text-muted">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <mat-dialog-content class="p-x-24 p-t-8 p-b-24 mat-typography">
        <form [formGroup]="referralForm">

          <div class="m-b-16 m-t-8">
            <h6 class="mat-subtitle-2 f-w-600 m-b-12 text-primary d-flex align-items-center">
              <i-tabler name="user" class="icon-16 m-r-8"></i-tabler> Personal Details
            </h6>
          </div>

          <div class="row">
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">First Name *</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <input matInput formControlName="firstName" placeholder="e.g., John" />
                <mat-error *ngIf="referralForm.get('firstName')?.hasError('required')">First name is required</mat-error>
              </mat-form-field>
            </div>
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">Last Name</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <input matInput formControlName="lastName" placeholder="e.g., Doe" />
              </mat-form-field>
            </div>
          </div>

          <div class="m-b-12">
            <mat-label class="f-w-600 m-b-8 d-block text-dark">Email Address *</mat-label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
              <input matInput formControlName="email" type="email" placeholder="john@example.com" />
              <mat-error *ngIf="referralForm.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="referralForm.get('email')?.hasError('email')">Enter a valid email</mat-error>
            </mat-form-field>
          </div>

          <div class="m-b-12">
            <mat-label class="f-w-600 m-b-8 d-block text-dark">Phone Number *</mat-label>
            <div class="phone-input-group">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="mcc-select theme-input">
                <mat-select formControlName="mobileCountryCodeId">
                  <mat-select-trigger>
                    <div class="d-flex align-items-center" *ngIf="getSelectedMcc()">
                      <img [src]="getSelectedMcc()?.flagUrl" width="20" class="m-r-6" style="border-radius:2px" alt="" />
                      {{ getSelectedMcc()?.mobileCode }}
                    </div>
                  </mat-select-trigger>
                  <mat-option *ngFor="let mcc of mobileCountryCodes" [value]="mcc.id">
                    <div class="d-flex align-items-center">
                      <img [src]="mcc.flagUrl" width="20" class="m-r-8" style="border-radius:2px" alt="" />
                      {{ mcc.mobileCode }} ({{ mcc.countryName }})
                    </div>
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="phone-number w-100 theme-input">
                <input matInput formControlName="phone" placeholder="Phone number" [maxlength]="getSelectedMcc()?.mobileNumberLength || 15" (keypress)="allowOnlyNumbers($event)" />
                <mat-error *ngIf="referralForm.get('phone')?.hasError('required')">Phone is required</mat-error>
                <mat-error *ngIf="referralForm.get('phone')?.hasError('minlength') || referralForm.get('phone')?.hasError('maxlength')">
                  Phone number must be {{ getSelectedMcc()?.mobileNumberLength }} digits
                </mat-error>
              </mat-form-field>
            </div>
          </div>

          <mat-divider class="m-y-16"></mat-divider>

          <div class="m-b-16">
            <h6 class="mat-subtitle-2 f-w-600 m-b-12 text-primary d-flex align-items-center">
              <i-tabler name="settings" class="icon-16 m-r-8"></i-tabler> Assignment Details
            </h6>
          </div>

          <div class="row">
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">Referral Type *</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <mat-select formControlName="referralType" placeholder="Select Type">
                  <mat-option *ngFor="let type of referralTypes" [value]="type">
                    {{ formatType(type) }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="referralForm.get('referralType')?.hasError('required')">Type is required</mat-error>
              </mat-form-field>
            </div>
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">Branch *</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <mat-select formControlName="branchId" placeholder="Select Branch">
                  <mat-option *ngFor="let branch of branches" [value]="branch.id">
                    {{ branch.name }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="referralForm.get('branchId')?.hasError('required')">Branch is required</mat-error>
              </mat-form-field>
            </div>
          </div>

          <div class="m-b-12">
            <div class="d-flex align-items-center justify-content-between m-b-8">
              <mat-label class="f-w-600 text-dark">Assign To</mat-label>
              <div class="d-flex align-items-center gap-8">
                <span class="f-s-12 text-muted">Filter by Role:</span>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="role-filter theme-input">
                  <mat-select [(value)]="selectedRoleId" (selectionChange)="onRoleFilterChange()" placeholder="Role">
                    <mat-option *ngFor="let role of employeeRoles" [value]="role.id">{{ role.name | titlecase }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
              <mat-select formControlName="assignedToIds" placeholder="Select Assignees" multiple>
                <mat-option *ngIf="isLoadingAssignees" disabled>
                  <span class="text-muted f-s-13">Loading...</span>
                </mat-option>
                <mat-option *ngIf="!isLoadingAssignees && assignees.length === 0 && referralForm.get('branchId')?.value" disabled>
                  <span class="text-muted f-s-13">No employees found for this branch</span>
                </mat-option>
                <mat-option *ngFor="let emp of assignees" [value]="emp.id">
                  {{ emp.firstName }} {{ emp.lastName }}
                </mat-option>
              </mat-select>
              <mat-hint *ngIf="!referralForm.get('branchId')?.value" class="text-muted">Select a branch first to load assignees</mat-hint>
            </mat-form-field>
          </div>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="p-x-24 p-b-24 d-flex justify-content-end gap-12" align="end">
        <button mat-stroked-button (click)="closeDialog()" [disabled]="isSubmitting">Cancel</button>
        <button mat-flat-button color="primary" (click)="onSubmit()" [disabled]="isSubmitting" class="d-flex align-items-center">
          <i-tabler *ngIf="isSubmitting" name="loader" class="icon-18 m-r-8 spinning"></i-tabler>
          {{ isEditMode ? 'Save Changes' : 'Create Referral' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container { width: 100%; min-width: 520px; max-width: 680px; @media (max-width: 680px) { min-width: unset; width: 100%; } }
    .header-icon-box { width: 48px; height: 48px; }
    .bg-light-primary { background-color: rgba(97,93,255,0.1) !important; }
    .row { display: flex; flex-wrap: wrap; margin: 0 -12px; }
    .col-sm-6 { flex: 0 0 50%; max-width: 50%; padding: 0 12px; @media (max-width: 576px) { flex: 0 0 100%; max-width: 100%; } }
    .phone-input-group { display: flex; gap: 12px; .mcc-select { width: 130px; flex-shrink: 0; } }
    .role-filter { width: 120px; }
    .m-y-16 { margin: 16px 0; } .m-b-4 { margin-bottom: 4px; } .m-b-8 { margin-bottom: 8px; } .m-b-12 { margin-bottom: 12px; } .m-b-16 { margin-bottom: 16px; } .m-t-8 { margin-top: 8px; } .m-r-6 { margin-right: 6px; } .m-r-8 { margin-right: 8px; } .m-r-16 { margin-right: 16px; }
    .p-x-24 { padding: 0 24px; } .p-t-8 { padding-top: 8px; } .p-t-24 { padding-top: 24px; } .p-b-16 { padding-bottom: 16px; } .p-b-24 { padding-bottom: 24px; }
    .gap-8 { gap: 8px; } .gap-12 { gap: 12px; } .text-primary { color: #615dff !important; }
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    ::ng-deep .theme-input .mat-mdc-text-field-wrapper { background-color: transparent !important; }
    :host-context(.dark-theme) { .text-dark { color: #f8fafc !important; } }
  `]
})
export class AddReferralDialogComponent implements OnInit {
  referralForm: FormGroup;
  referralTypes: string[] = [];
  branches: Branch[] = [];
  mobileCountryCodes: MobileCountryCode[] = [];
  assignees: any[] = [];
  employeeRoles: any[] = [];
  selectedRoleId: number | null = null;
  isSubmitting = false;
  isEditMode = false;
  isLoadingAssignees = false;
  private isInitializing = false;
  private initialAssignedToIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddReferralDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private masterDataService: MasterDataService,
    private referralService: ReferralService,
    private notificationService: NotificationService
  ) {
    this.referralForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      mobileCountryCodeId: ['', Validators.required],
      referralType: ['', Validators.required],
      branchId: ['', Validators.required],
      assignedToIds: [[]]
    });
  }

  ngOnInit(): void {
    if (this.data?.id) {
      this.isEditMode = true;
      this.isInitializing = true;
      const assignedIds = (this.data.assignedToUsers || []).map((u: any) => Number(u.id || u));
      this.initialAssignedToIds = assignedIds;
      this.referralForm.patchValue({
        firstName: this.data.firstName || '',
        lastName: this.data.lastName || '',
        email: this.data.email || '',
        phone: this.data.phone || '',
        mobileCountryCodeId: this.data.mobileCountryCodeId || '',
        referralType: this.data.referralType || '',
        branchId: this.data.branchId || '',
        assignedToIds: assignedIds
      });
      this.isInitializing = false;
    }

    this.loadMasterData();

    this.referralForm.get('branchId')?.valueChanges.subscribe(branchId => {
      if (!this.isInitializing) {
        this.assignees = [];
        this.referralForm.patchValue({ assignedToIds: [] }, { emitEvent: false });
      }
      if (branchId) this.loadAssignees(branchId);
    });

    this.referralForm.get('mobileCountryCodeId')?.valueChanges.subscribe(mccId => {
      const mcc = this.mobileCountryCodes.find(m => m.id === mccId);
      if (mcc && mcc.mobileNumberLength) {
        this.referralForm.get('phone')?.setValidators([
          Validators.required,
          Validators.minLength(mcc.mobileNumberLength),
          Validators.maxLength(mcc.mobileNumberLength)
        ]);
        this.referralForm.get('phone')?.updateValueAndValidity();
      }
    });
  }

  loadMasterData(): void {
    this.referralService.getReferralTypes().subscribe({
      next: types => { this.referralTypes = types || []; },
      error: () => console.error('Failed to load referral types')
    });

    this.masterDataService.getBranches(true).subscribe({
      next: res => { if (res?.data) this.branches = res.data; },
      error: () => console.error('Failed to load branches')
    });

    this.masterDataService.getMobileCountryCodes().subscribe({
      next: res => {
        if (res?.data) {
          this.mobileCountryCodes = res.data;
          if (!this.referralForm.get('mobileCountryCodeId')?.value) {
            const def = this.mobileCountryCodes.find(m => m.mobileCode === '+91') || this.mobileCountryCodes[0];
            if (def) this.referralForm.patchValue({ mobileCountryCodeId: def.id });
          }
        }
      },
      error: () => console.error('Failed to load country codes')
    });

    this.masterDataService.getRoles().subscribe({
      next: res => {
        if (res?.data) {
          this.employeeRoles = res.data.filter((r: any) => !['ADMIN','STUDENT','REFERRAL','COMPANY'].includes(r.name?.toUpperCase()));
          const mgr = this.employeeRoles.find(r => r.name?.toUpperCase() === 'MANAGER');
          if (mgr) {
            this.selectedRoleId = mgr.id;
            const branch = this.referralForm.get('branchId')?.value;
            if (branch) this.loadAssignees(branch);
          }
        }
      },
      error: () => console.error('Failed to load roles')
    });
  }

  loadAssignees(branchId: number): void {
    if (!this.selectedRoleId) return;
    this.isLoadingAssignees = true;
    this.masterDataService.getManagersByBranch(branchId, [this.selectedRoleId]).subscribe({
      next: res => {
        this.isLoadingAssignees = false;
        const data = res?.data?.content || res?.data || res?.content || [];
        this.assignees = Array.isArray(data) ? data : [];
        if (this.isEditMode && this.initialAssignedToIds.length > 0) {
          this.referralForm.patchValue({ assignedToIds: this.initialAssignedToIds }, { emitEvent: false });
        }
      },
      error: () => { this.isLoadingAssignees = false; this.assignees = []; }
    });
  }

  onRoleFilterChange(): void {
    const branch = this.referralForm.get('branchId')?.value;
    if (branch) {
      this.assignees = [];
      this.referralForm.patchValue({ assignedToIds: [] }, { emitEvent: false });
      this.loadAssignees(branch);
    }
  }

  formatType(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  getSelectedMcc(): MobileCountryCode | undefined {
    const id = this.referralForm.get('mobileCountryCodeId')?.value;
    return this.mobileCountryCodes.find(m => m.id === id);
  }

  allowOnlyNumbers(event: KeyboardEvent): boolean {
    const c = event.which ?? event.keyCode;
    return !(c > 31 && (c < 48 || c > 57));
  }

  closeDialog(result?: any): void { this.dialogRef.close(result); }

  onSubmit(): void {
    if (this.referralForm.invalid) {
      this.referralForm.markAllAsTouched();
      this.notificationService.showErrorToast('Please fill all required fields.', 'Validation Error');
      return;
    }
    this.isSubmitting = true;
    const v = this.referralForm.value;
    const payload = {
      ...v,
      name: `${v.firstName} ${v.lastName}`.trim(),
      assignedToIds: v.assignedToIds || []
    };

    const call$ = this.isEditMode
      ? this.referralService.updateReferral(this.data.id, payload)
      : this.referralService.createReferral(payload);

    call$.subscribe({
      next: () => {
        this.isSubmitting = false;
        const msg = this.isEditMode ? 'Referral updated successfully.' : 'Referral created successfully.';
        this.notificationService.showSuccessToast(msg, 'Success');
        this.closeDialog(true);
      },
      error: err => {
        this.isSubmitting = false;
        console.error(err);
        this.notificationService.showErrorToast(this.isEditMode ? 'Failed to update referral.' : 'Failed to create referral.', 'Error');
      }
    });
  }
}
