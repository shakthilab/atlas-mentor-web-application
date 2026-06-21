import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'src/app/core/services/notification.service';
import { HierarchyService } from 'src/app/core/services/hierarchy.service';

export interface AssignDialogData {
  managerId: string;
  numericManagerId: number;
  managerName: string;
  branchId: number;
  managerRole?: string;
}

@Component({
  selector: 'app-hierarchy-assign-dialog',
  templateUrl: './hierarchy-assign-dialog.component.html',
  styleUrls: ['./hierarchy-assign-dialog.component.scss']
})
export class HierarchyAssignDialogComponent implements OnInit {
  assignForm: FormGroup;
  roles: any[] = [];
  candidates: any[] = [];
  isLoadingRoles = false;
  isLoadingCandidates = false;
  isSubmitting = false;
  selectedCandidates: Set<number> = new Set<number>();

  constructor(
    private dialogRef: MatDialogRef<HierarchyAssignDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignDialogData,
    private fb: FormBuilder,
    private hierarchyService: HierarchyService,
    private notificationService: NotificationService
  ) {
    this.assignForm = this.fb.group({
      roleId: ['', Validators.required]
    });
  }

  get isAssigningToSenior(): boolean {
    return this.data.managerRole?.toUpperCase().includes('SENIOR COUNSELLOR') || false;
  }

  ngOnInit(): void {
    this.loadRoles();
    
    // Listen for role selection changes to fetch candidates
    this.assignForm.get('roleId')?.valueChanges.subscribe(roleId => {
      this.selectedCandidates.clear();
      if (roleId) {
        const selectedRole = this.roles.find(r => r.id === roleId);
        if (selectedRole) {
          this.loadCandidates(selectedRole.name);
        }
      } else {
        this.candidates = [];
      }
    });
  }

  loadRoles(): void {
    this.isLoadingRoles = true;
    this.hierarchyService.getRoles().subscribe({
      next: (res) => {
        let fetchedRoles = res.data || [];
        
        if (this.data.managerRole && this.data.managerRole.toUpperCase().includes('SENIOR COUNSELLOR')) {
          fetchedRoles = fetchedRoles.filter((r: any) => r.name === 'JUNIOR_COUNSELLOR');
        }

        this.roles = fetchedRoles;
        this.isLoadingRoles = false;

        if (this.roles.length === 1) {
          this.assignForm.get('roleId')?.setValue(this.roles[0].id);
        }
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showErrorToast('Failed to load roles.');
        this.isLoadingRoles = false;
      }
    });
  }

  loadCandidates(roleName: string): void {
    if (!this.data.branchId) {
      this.notificationService.showErrorToast('Manager branch ID is missing.');
      return;
    }
    this.isLoadingCandidates = true;
    this.hierarchyService.getUsersByRole(roleName, this.data.branchId).subscribe({
      next: (res) => {
        this.candidates = res.data || [];
        this.isLoadingCandidates = false;
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showErrorToast(`Failed to load candidates for ${roleName}.`);
        this.candidates = [];
        this.isLoadingCandidates = false;
      }
    });
  }

  toggleCandidate(candidateId: number, isChecked: boolean): void {
    if (isChecked) {
      this.selectedCandidates.add(candidateId);
    } else {
      this.selectedCandidates.delete(candidateId);
    }
  }

  isCandidateSelected(candidateId: number): boolean {
    return this.selectedCandidates.has(candidateId);
  }

  onSubmit(): void {
    if (this.assignForm.invalid || this.selectedCandidates.size === 0) {
      return;
    }

    this.isSubmitting = true;

    if (this.isAssigningToSenior) {
      const payload = {
        seniorCounsellorId: this.data.numericManagerId,
        juniorCounsellorIds: Array.from(this.selectedCandidates)
      };

      this.hierarchyService.assignJuniorCounsellors(payload).subscribe({
        next: () => {
          this.notificationService.showSuccessToast(`Successfully mapped ${this.selectedCandidates.size} employees.`);
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          this.notificationService.showErrorToast('Failed to assign employees.');
          this.isSubmitting = false;
        }
      });
    } else {
      const payload = {
        roleId: this.assignForm.get('roleId')?.value,
        managerId: this.data.numericManagerId,
        userIds: Array.from(this.selectedCandidates)
      };

      this.hierarchyService.assignEmployeeByRoles(payload).subscribe({
        next: () => {
          this.notificationService.showSuccessToast(`Successfully mapped ${this.selectedCandidates.size} employees.`);
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          this.notificationService.showErrorToast('Failed to assign employees.');
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
