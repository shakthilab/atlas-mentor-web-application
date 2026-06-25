import { Component, OnInit, Inject, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ResourceService } from '../../../../core/services/resource.service';
import { MasterDataService, Role, Branch } from '../../../../core/services/master-data.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-add-resource-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TablerIconsModule
  ],
  template: `
    <div class="dialog-header d-flex align-items-center justify-content-between p-24">
      <div class="d-flex align-items-center">
        <div class="icon-container m-r-12">
          <i-tabler name="link" class="icon-24 text-primary"></i-tabler>
        </div>
        <div>
          <h2 class="mat-headline-6 m-b-0">{{ isEditMode ? 'Edit Resource' : 'Add New Resource' }}</h2>
          <span class="f-s-14 text-muted">{{ isEditMode ? 'Update existing shared resource details.' : 'Register a new shared resource.' }}</span>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close>
        <i-tabler name="x" class="icon-20"></i-tabler>
      </button>
    </div>

    <form [formGroup]="resourceForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="p-x-24 p-b-24">
        <div class="row">
          <div class="col-sm-6 m-b-16">
            <mat-label class="mat-subtitle-2 f-s-14 f-w-600 m-b-8 d-block">Resource Name <span class="text-error">*</span></mat-label>
            <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
              <input matInput formControlName="fileName" placeholder="e.g. Marketing Guide" />
              <mat-error *ngIf="resourceForm.get('fileName')?.invalid">Resource name is required</mat-error>
            </mat-form-field>
          </div>
          
          <div class="col-sm-6 m-b-16">
            <mat-label class="mat-subtitle-2 f-s-14 f-w-600 m-b-8 d-block">Type <span class="text-error">*</span></mat-label>
            <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
              <mat-select formControlName="resourceType" placeholder="Select Type">
                <mat-option value="DOCUMENT">DOCUMENT</mat-option>
                <mat-option value="IMAGE">IMAGE</mat-option>
                <mat-option value="VIDEO">VIDEO</mat-option>
                <mat-option value="AUDIO">AUDIO</mat-option>
                <mat-option value="SPREADSHEET">SPREADSHEET</mat-option>
                <mat-option value="PRESENTATION">PRESENTATION</mat-option>
                <mat-option value="LINK">LINK</mat-option>
                <mat-option value="OTHER">OTHER</mat-option>
              </mat-select>
              <mat-error *ngIf="resourceForm.get('resourceType')?.invalid">Type is required</mat-error>
            </mat-form-field>
          </div>

          <div class="col-sm-6 m-b-16">
            <mat-label class="mat-subtitle-2 f-s-14 f-w-600 m-b-8 d-block">Storage <span class="text-error">*</span></mat-label>
            <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
              <mat-select formControlName="storageType" placeholder="Select Storage">
                <mat-option value="GOOGLE_DRIVE">GOOGLE_DRIVE</mat-option>
                <mat-option value="ONEDRIVE">ONEDRIVE</mat-option>
                <mat-option value="DROPBOX">DROPBOX</mat-option>
                <mat-option value="S3_UPLOAD">S3_UPLOAD</mat-option>
                <mat-option value="OTHER">OTHER</mat-option>
              </mat-select>
              <mat-error *ngIf="resourceForm.get('storageType')?.invalid">Storage is required</mat-error>
            </mat-form-field>
          </div>

          <div class="col-sm-6 m-b-16">
            <mat-label class="mat-subtitle-2 f-s-14 f-w-600 m-b-8 d-block">External URL</mat-label>
            <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
              <input matInput formControlName="externalUrl" placeholder="https://..." />
            </mat-form-field>
          </div>

          <div class="col-12 m-b-24">
            <mat-label class="mat-subtitle-2 f-s-14 f-w-600 m-b-8 d-block">Description</mat-label>
            <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
              <textarea matInput formControlName="description" rows="3" placeholder="Brief details about this resource..."></textarea>
            </mat-form-field>
          </div>
        </div>

        <div class="bg-light p-16 rounded m-b-16">
          <h6 class="mat-subtitle-2 f-s-12 text-muted m-b-12 text-uppercase letter-spacing-1">Ownership & Meta</h6>
          
          <div class="row">
            <div class="col-12 m-b-16">
              <mat-label class="mat-subtitle-2 f-s-14 f-w-600 m-b-8 d-block">Role <span class="text-error">*</span></mat-label>
              <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                <mat-select formControlName="roleId" placeholder="Select Role" (selectionChange)="onRoleChange()">
                  <mat-option *ngFor="let role of roles" [value]="role.id">{{ role.name }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="col-12">
              <mat-label class="mat-subtitle-2 f-s-14 f-w-600 m-b-8 d-block">Select User <span class="text-error">*</span></mat-label>
              <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                <mat-select formControlName="ownerIds" placeholder="Select User" multiple [disabled]="!users.length">
                  <mat-option *ngFor="let user of users" [value]="user.id">{{ user.firstName }} {{ user.lastName }}</mat-option>
                </mat-select>
                <mat-error *ngIf="resourceForm.get('ownerIds')?.invalid">At least one user must be selected</mat-error>
              </mat-form-field>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="p-24 p-t-0 d-flex justify-content-end gap-12">
        <button mat-stroked-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="resourceForm.invalid || isSaving">
          {{ isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Resource') }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-header {
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 16px;
    }
    
    .icon-container {
      width: 48px;
      height: 48px;
      background-color: rgba(93, 135, 255, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bg-light {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .letter-spacing-1 {
      letter-spacing: 1px;
    }

    :host-context(.dark-theme) {
      .dialog-header { border-color: var(--dark-formborderColor); }
      .bg-light { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); }
      .icon-container { background-color: rgba(93, 135, 255, 0.2); }
    }
  `]
})
export class AddResourceDialogComponent implements OnInit {
  resourceForm: FormGroup;
  roles: Role[] = [];
  branches: Branch[] = [];
  users: any[] = [];
  isSaving = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddResourceDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private resourceService: ResourceService,
    private masterDataService: MasterDataService,
    private notificationService: NotificationService
  ) {
    this.isEditMode = !!(data && data.id);

    this.resourceForm = this.fb.group({
      fileName: [data?.fileName || '', Validators.required],
      resourceType: [data?.resourceType || 'DOCUMENT', Validators.required],
      storageType: [data?.storageType || 'GOOGLE_DRIVE', Validators.required],
      externalUrl: [data?.externalUrl || ''],
      description: [data?.description || ''],
      roleId: [null, this.isEditMode ? [] : Validators.required],
      ownerIds: [data?.ownerIds || [], Validators.required]
    });

    if (this.isEditMode && data?.ownerIds && data?.ownerNames) {
      this.users = data.ownerIds.map((id: number, idx: number) => ({
        id: id,
        firstName: data.ownerNames[idx] || `User ${id}`,
        lastName: ''
      }));
    }
  }

  ngOnInit(): void {
    this.loadMasterData();
  }

  loadMasterData(): void {
    this.masterDataService.getRoles().subscribe({
      next: (res) => {
        if (res.success) {
          this.roles = res.data.filter(r => 
            r.name.toUpperCase() !== 'ADMIN'
          );
          
          if (this.isEditMode && this.data?.ownerType) {
            const matchedRole = this.roles.find(r => r.name.toUpperCase() === this.data.ownerType.toUpperCase());
            if (matchedRole) {
              this.resourceForm.patchValue({ roleId: matchedRole.id });
            }
          }
        }
      }
    });
  }

  onRoleChange(): void {
    const roleId = this.resourceForm.get('roleId')?.value;

    if (roleId) {
      this.resourceForm.get('ownerIds')?.setValue([]);
      this.resourceService.getUsersByRoleAndBranch(roleId).subscribe({
        next: (res) => {
          this.users = Array.isArray(res) ? res : (res as any).data || [];
        },
        error: (err) => {
          console.error('Failed to fetch users', err);
          this.users = [];
        }
      });
    } else {
      this.users = [];
    }
  }

  onSubmit(): void {
    if (this.resourceForm.invalid) return;

    this.isSaving = true;
    const formValue = this.resourceForm.value;

    let ownerType = this.data?.ownerType || 'REFERRAL';
    const selectedRole = this.roles.find(r => r.id === formValue.roleId);
    if (selectedRole) {
       ownerType = selectedRole.name.toUpperCase();
    }

    const payload = {
      ownerType: ownerType,
      resourceType: formValue.resourceType,
      storageType: formValue.storageType,
      isActive: this.isEditMode ? (this.data.isActive !== undefined ? this.data.isActive : true) : true,
      fileSize: this.data?.fileSize || 0,
      mimeType: this.data?.mimeType || 'application/octet-stream',
      fileName: formValue.fileName,
      externalUrl: formValue.externalUrl,
      description: formValue.description,
      ownerIds: formValue.ownerIds
    };

    if (this.isEditMode) {
      this.resourceService.updateResource(this.data.id, payload).subscribe({
        next: (res) => {
          this.notificationService.showSuccessToast('Resource updated successfully', 'Success');
          this.dialogRef.close(res);
        },
        error: (err) => {
          console.error(err);
          this.notificationService.showErrorToast('Failed to update resource', 'Error');
          this.isSaving = false;
        }
      });
    } else {
      this.resourceService.createResource(payload).subscribe({
        next: (res) => {
          this.notificationService.showSuccessToast('Resource created successfully', 'Success');
          this.dialogRef.close(res);
        },
        error: (err) => {
          console.error(err);
          this.notificationService.showErrorToast('Failed to create resource', 'Error');
          this.isSaving = false;
        }
      });
    }
  }
}
