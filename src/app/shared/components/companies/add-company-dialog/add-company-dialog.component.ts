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
import { MasterDataService, Branch, MobileCountryCode, Role } from '../../../../core/services/master-data.service';
import { CompanyService } from '../../../../core/services/company.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-add-company-dialog',
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
    MatDividerModule,
    TablerIconsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="d-flex align-items-center justify-content-between p-x-24 p-t-24 p-b-16">
        <div class="d-flex align-items-center">
          <div class="header-icon-box m-r-16 d-flex align-items-center justify-content-center bg-light-primary text-primary rounded">
            <i-tabler [name]="isEditMode ? 'edit' : 'building'" class="icon-24"></i-tabler>
          </div>
          <div>
            <h2 class="mat-headline-6 f-w-600 m-b-4">{{ isEditMode ? 'Edit Company' : 'Add New Company' }}</h2>
            <span class="f-s-14 text-muted">{{ isEditMode ? 'Update details for the company.' : 'Enter details for the new company.' }}</span>
          </div>
        </div>
        <button mat-icon-button (click)="closeDialog()" class="text-muted">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <mat-dialog-content class="p-x-24 p-t-8 p-b-24 mat-typography">
        <form [formGroup]="companyForm" class="company-form">
          <!-- Company Info Section -->
          <div class="m-b-16 m-t-8">
            <h6 class="mat-subtitle-2 f-w-600 m-b-12 text-primary d-flex align-items-center">
              <i-tabler name="building" class="icon-16 m-r-8"></i-tabler> Company Information
            </h6>
          </div>
          
          <div class="row">
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">Company Name</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <input matInput formControlName="name" placeholder="e.g., Acme Corp" />
                <mat-error *ngIf="companyForm.get('name')?.hasError('required')">Company name is required</mat-error>
              </mat-form-field>
            </div>
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">Industry</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <input matInput formControlName="industry" placeholder="e.g., Information Technology" />
                <mat-error *ngIf="companyForm.get('industry')?.hasError('required')">Industry is required</mat-error>
              </mat-form-field>
            </div>
          </div>

          <div class="row">
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">Website</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <input matInput formControlName="website" placeholder="e.g., www.acme.com" />
              </mat-form-field>
            </div>
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">Address</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <input matInput formControlName="address" placeholder="e.g., 123 Main St, City" />
                <mat-error *ngIf="companyForm.get('address')?.hasError('required')">Address is required</mat-error>
              </mat-form-field>
            </div>
          </div>

          <mat-divider class="m-y-16"></mat-divider>

          <!-- Contact Person Section -->
          <div class="m-b-16">
            <h6 class="mat-subtitle-2 f-w-600 m-b-12 text-primary d-flex align-items-center">
              <i-tabler name="user" class="icon-16 m-r-8"></i-tabler> Contact Person Details
            </h6>
          </div>

          <div class="row">
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">First Name</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <input matInput formControlName="firstName" placeholder="e.g., John" />
                <mat-error *ngIf="companyForm.get('firstName')?.hasError('required')">First name is required</mat-error>
              </mat-form-field>
            </div>
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">Last Name</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <input matInput formControlName="lastName" placeholder="e.g., Smith" />
              </mat-form-field>
            </div>
          </div>

          <div class="m-b-12">
            <mat-label class="f-w-600 m-b-8 d-block text-dark">Email Address</mat-label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
              <input matInput formControlName="email" type="email" placeholder="john.smith@acme.com" />
              <mat-error *ngIf="companyForm.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="companyForm.get('email')?.hasError('email')">Please enter a valid email address</mat-error>
            </mat-form-field>
          </div>

          <div class="m-b-12">
            <mat-label class="f-w-600 m-b-8 d-block text-dark">Phone Number</mat-label>
            <div class="phone-input-group">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="mcc-select theme-input">
                <mat-select formControlName="mobileCountryCodeId">
                  <mat-select-trigger>
                    <div class="d-flex align-items-center" *ngIf="getSelectedMcc()">
                      <img [src]="getSelectedMcc()?.flagUrl" width="20" class="m-r-8 shadow-sm" style="border-radius: 2px;" alt="flag" />
                      {{ getSelectedMcc()?.mobileCode }}
                    </div>
                  </mat-select-trigger>
                  <mat-option *ngFor="let mcc of mobileCountryCodes" [value]="mcc.id">
                    <div class="d-flex align-items-center">
                      <img [src]="mcc.flagUrl" width="20" class="m-r-8 shadow-sm" style="border-radius: 2px;" alt="flag" />
                      {{ mcc.mobileCode }} ({{ mcc.countryName }})
                    </div>
                  </mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="phone-number w-100 theme-input">
                <input matInput formControlName="phone" placeholder="Phone number" [maxlength]="getSelectedMcc()?.mobileNumberLength || 15" (keypress)="allowOnlyNumbers($event)" />
                <mat-error *ngIf="companyForm.get('phone')?.hasError('required')">Phone is required</mat-error>
                <mat-error *ngIf="companyForm.get('phone')?.hasError('minlength') || companyForm.get('phone')?.hasError('maxlength')">
                  Phone number must be {{ getSelectedMcc()?.mobileNumberLength }} digits
                </mat-error>
              </mat-form-field>
            </div>
          </div>

          <mat-divider class="m-y-16"></mat-divider>

          <!-- Branch & Assignment -->
          <div class="m-b-16">
            <h6 class="mat-subtitle-2 f-w-600 m-b-12 text-primary d-flex align-items-center">
              <i-tabler name="settings" class="icon-16 m-r-8"></i-tabler> Assignment Details
            </h6>
          </div>

          <div class="row">
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">Branch</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <mat-select formControlName="branchId" placeholder="Select Branch">
                  <mat-option *ngFor="let branch of branches" [value]="branch.id">
                    {{ branch.name }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="companyForm.get('branchId')?.hasError('required')">Branch is required</mat-error>
              </mat-form-field>
            </div>
            
            <div class="col-sm-6 m-b-12">
              <mat-label class="f-w-600 m-b-8 d-block text-dark">Assigned Manager</mat-label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-100 theme-input">
                <mat-select formControlName="assignedTo" placeholder="Select Manager">
                  <mat-option [value]="null">None</mat-option>
                  <mat-option *ngFor="let mgr of managers" [value]="mgr.id">
                    {{ mgr.firstName }} {{ mgr.lastName }}
                  </mat-option>
                </mat-select>
                <mat-hint *ngIf="isLoadingManagers" class="text-muted">Loading managers...</mat-hint>
                <mat-hint *ngIf="!isLoadingManagers && managers.length === 0 && companyForm.get('branchId')?.value">No managers found for this branch</mat-hint>
                <mat-error *ngIf="companyForm.get('assignedTo')?.hasError('required')">Manager is required</mat-error>
              </mat-form-field>
            </div>
          </div>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="p-x-24 p-b-24 d-flex justify-content-end gap-12" align="end">
        <button mat-stroked-button (click)="closeDialog()" [disabled]="isSubmitting">Cancel</button>
        <button mat-flat-button color="primary" (click)="onSubmit()" [disabled]="isSubmitting" class="d-flex align-items-center">
          <i-tabler *ngIf="isSubmitting" name="loader" class="icon-18 m-r-8 spinning"></i-tabler>
          {{ isEditMode ? 'Save Changes' : 'Create Company' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      min-width: 500px;
      max-width: 700px;
      background-color: var(--mat-dialog-container-color, #ffffff);
      color: var(--mat-dialog-container-text-color, #1e293b);
      
      @media (max-width: 700px) {
        min-width: unset;
        width: 100%;
      }
    }

    .header-icon-box { width: 48px; height: 48px; }
    .bg-light-primary { background-color: rgba(97, 93, 255, 0.1) !important; }

    .row { display: flex; flex-wrap: wrap; margin-right: -12px; margin-left: -12px; }
    .col-sm-6 {
      flex: 0 0 50%; max-width: 50%; padding-right: 12px; padding-left: 12px;
      @media (max-width: 576px) { flex: 0 0 100%; max-width: 100%; }
    }

    .phone-input-group {
      display: flex; gap: 12px;
      .mcc-select { width: 130px; flex-shrink: 0; }
    }

    ::ng-deep .theme-input .mat-mdc-text-field-wrapper { background-color: transparent !important; }
    ::ng-deep .theme-input .mdc-notched-outline__leading,
    ::ng-deep .theme-input .mdc-notched-outline__notch,
    ::ng-deep .theme-input .mdc-notched-outline__trailing { border-color: #e2e8f0 !important; border-width: 1px !important; }
    ::ng-deep .theme-input.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .theme-input.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .theme-input.mat-focused .mdc-notched-outline__trailing { border-color: #615dff !important; border-width: 2px !important; }

    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .m-b-4 { margin-bottom: 4px; } .m-b-8 { margin-bottom: 8px; } .m-b-12 { margin-bottom: 12px; } .m-b-16 { margin-bottom: 16px; }
    .m-t-8 { margin-top: 8px; } .m-r-8 { margin-right: 8px; } .m-r-16 { margin-right: 16px; }
    .m-y-16 { margin-top: 16px; margin-bottom: 16px; }
    .p-x-24 { padding-left: 24px; padding-right: 24px; } .p-t-8 { padding-top: 8px; } .p-t-24 { padding-top: 24px; }
    .p-b-16 { padding-bottom: 16px; } .p-b-24 { padding-bottom: 24px; }
    .gap-12 { gap: 12px; } .text-primary { color: #615dff !important; }

    :host-context(.dark-theme) {
      .dialog-container { background-color: var(--dark-sidebarbg, #1e293b); }
      .text-dark { color: #f8fafc !important; }
      ::ng-deep .theme-input .mdc-notched-outline__leading,
      ::ng-deep .theme-input .mdc-notched-outline__notch,
      ::ng-deep .theme-input .mdc-notched-outline__trailing { border-color: var(--dark-formborderColor, #334155) !important; }
      ::ng-deep .theme-input input, ::ng-deep .theme-input .mat-mdc-select-value-text { color: #f8fafc !important; }
    }
  `]
})
export class AddCompanyDialogComponent implements OnInit {
  companyForm: FormGroup;
  branches: Branch[] = [];
  mobileCountryCodes: MobileCountryCode[] = [];
  managers: any[] = [];
  
  isSubmitting = false;
  isEditMode = false;
  isLoadingManagers = false;
  private managerRoleId: number | null = null;
  private initialAssignedToId: number | null = null;
  private isInitializing = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddCompanyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private masterDataService: MasterDataService,
    private companyService: CompanyService,
    private notificationService: NotificationService
  ) {
    this.companyForm = this.fb.group({
      name: ['', Validators.required],
      industry: ['', Validators.required],
      website: [''],
      address: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      mobileCountryCodeId: ['', Validators.required],
      branchId: ['', Validators.required],
      assignedTo: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.id) {
      this.isEditMode = true;
      
      let firstName = this.data.firstName || '';
      let lastName = this.data.lastName || '';
      
      // Split contactPerson if firstName is missing
      if (this.data.contactPerson && !firstName) {
        const parts = this.data.contactPerson.split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
      }
      
      const assignedToId = typeof this.data.assignedTo === 'object' && this.data.assignedTo !== null 
        ? this.data.assignedTo.id 
        : this.data.assignedTo;
        
      const parsedAssignedToId = assignedToId ? Number(assignedToId) : null;
      this.initialAssignedToId = parsedAssignedToId;
      this.isInitializing = true;

      this.companyForm.patchValue({
        name: this.data.companyName || '',
        industry: this.data.industry || '',
        website: this.data.website || '',
        address: this.data.location || '',
        firstName: firstName,
        lastName: lastName,
        email: this.data.email || '',
        phone: this.data.phone || '',
        mobileCountryCodeId: this.data.mobileCountryCodeId || '',
        branchId: this.data.branchId || '',
        assignedTo: parsedAssignedToId
      });
      
      this.isInitializing = false;
    }

    this.loadMasterData();

    this.companyForm.get('mobileCountryCodeId')?.valueChanges.subscribe(mccId => {
      const mcc = this.mobileCountryCodes.find(m => m.id === mccId);
      if (mcc && mcc.mobileNumberLength) {
        this.companyForm.get('phone')?.setValidators([
          Validators.required,
          Validators.minLength(mcc.mobileNumberLength),
          Validators.maxLength(mcc.mobileNumberLength)
        ]);
        this.companyForm.get('phone')?.updateValueAndValidity();
      }
    });

    // When branch changes, reset manager and fetch new ones
    this.companyForm.get('branchId')?.valueChanges.subscribe(branchId => {
      this.managers = [];
      
      // Don't reset assignedTo during initial edit mode patch
      if (!this.isInitializing) {
        this.companyForm.patchValue({ assignedTo: null }, { emitEvent: false });
      }
      
      if (branchId && this.managerRoleId) {
        this.loadManagers(branchId);
      }
    });
  }

  allowOnlyNumbers(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  loadMasterData(): void {
    // 1. Get Branches
    this.masterDataService.getBranches(true).subscribe({
      next: (res) => {
        if (res?.data) this.branches = res.data;
      },
      error: () => console.error('Failed to load branches')
    });

    // 2. Get Mobile Country Codes
    this.masterDataService.getMobileCountryCodes().subscribe({
      next: (res) => {
        if (res?.data) {
          this.mobileCountryCodes = res.data;
          // Set default to India (+91) if exists, else first one
          if (!this.isEditMode || !this.companyForm.get('mobileCountryCodeId')?.value) {
            const defaultMcc = this.mobileCountryCodes.find(m => m.mobileCode === '+91') || this.mobileCountryCodes[0];
            if (defaultMcc) {
              this.companyForm.patchValue({ mobileCountryCodeId: defaultMcc.id });
            }
          }
        }
      },
      error: () => console.error('Failed to load mobile country codes')
    });

    // 3. Get Roles to find the MANAGER role ID
    this.masterDataService.getRoles().subscribe({
      next: (res) => {
        if (res?.data) {
          const managerRole = res.data.find(r => r.name?.toUpperCase() === 'MANAGER');
          if (managerRole) {
            this.managerRoleId = managerRole.id;
            // If branch is already selected (edit mode), load managers
            const currentBranch = this.companyForm.get('branchId')?.value;
            if (currentBranch) {
              this.loadManagers(currentBranch);
            }
          }
        }
      },
      error: () => console.error('Failed to load roles')
    });
  }

  getSelectedMcc(): MobileCountryCode | undefined {
    const id = this.companyForm.get('mobileCountryCodeId')?.value;
    return this.mobileCountryCodes.find(m => m.id === id);
  }

  loadManagers(branchId: number): void {
    if (!this.managerRoleId) return;
    this.isLoadingManagers = true;
    this.managers = [];

    this.masterDataService.getManagersByBranch(branchId, [this.managerRoleId]).subscribe({
      next: (res) => {
        this.isLoadingManagers = false;
        const data = res?.data?.content || res?.data || res?.content || [];
        this.managers = Array.isArray(data) ? data : [];
        
        // After managers load in edit mode, restore the saved assignedTo
        if (this.isEditMode && this.initialAssignedToId) {
          this.companyForm.patchValue({ assignedTo: this.initialAssignedToId }, { emitEvent: false });
        }
      },
      error: () => {
        this.isLoadingManagers = false;
        this.managers = [];
        console.error('Failed to load managers');
      }
    });
  }

  closeDialog(result?: any): void {
    this.dialogRef.close(result);
  }

  onSubmit(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      this.notificationService.showErrorToast('Please fill all required fields.', 'Validation Error');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.companyForm.value;
    
    // Construct payload as requested: combine firstName and lastName for contactPerson
    const payload = {
      ...formValue,
      contactPerson: `${formValue.firstName} ${formValue.lastName}`.trim()
    };

    if (this.isEditMode) {
      this.companyService.updateCompany(this.data.id, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notificationService.showSuccessToast('Company updated successfully.', 'Success');
          this.closeDialog(true);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error updating company:', err);
          this.notificationService.showErrorToast('Failed to update company.', 'Error');
        }
      });
    } else {
      this.companyService.createCompany(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notificationService.showSuccessToast('Company created successfully.', 'Success');
          this.closeDialog(true);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error creating company:', err);
          this.notificationService.showErrorToast('Failed to create company.', 'Error');
        }
      });
    }
  }
}
