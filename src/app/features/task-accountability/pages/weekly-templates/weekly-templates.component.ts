import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { WeeklyTemplateEditDialogComponent } from './weekly-template-edit-dialog.component';

@Component({
  selector: 'app-weekly-templates',
  template: `
    <div class="templates-container">
      <!-- Top Bar -->
      <div class="templates-header m-b-24 d-flex align-items-center justify-content-between">
        <div>
          <h2 class="section-title">Weekly Check-in Templates</h2>
          <p class="section-subtitle">Manage weekly check-in forms and questionnaires assigned to different roles.</p>
        </div>
        <button mat-flat-button color="primary" class="premium-btn" (click)="openNewTemplateModal()">
          <i-tabler name="plus" class="icon-18 m-r-8"></i-tabler>
          New Weekly Template
        </button>
      </div>

      <!-- Filters Panel -->
      <div class="filters-card cardWithShadow p-16 m-b-24">
        <div class="row align-items-center">
          <div class="col-sm-4">
            <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
              <mat-label>Filter by Role</mat-label>
              <mat-select [(value)]="selectedRoleId" (selectionChange)="onFilterChange()">
                <mat-option [value]="''">All Roles</mat-option>
                <mat-option *ngFor="let role of roles" [value]="role.id">{{ role.displayName || role.name }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="col-sm-4">
            <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
              <mat-label>Filter by Status</mat-label>
              <mat-select [(value)]="selectedStatus" (selectionChange)="onFilterChange()">
                <mat-option [value]="''">All Statuses</mat-option>
                <mat-option [value]="'DRAFT'">Draft</mat-option>
                <mat-option [value]="'ACTIVE'">Active</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="text-center p-40" *ngIf="isLoading">
        <mat-spinner diameter="40" class="m-x-auto"></mat-spinner>
        <p class="text-muted m-t-16">Loading weekly templates...</p>
      </div>

      <!-- Empty State -->
      <div class="cardWithShadow p-40 text-center" *ngIf="!isLoading && templates.length === 0">
        <i-tabler name="checklist" class="icon-40 text-muted m-b-16"></i-tabler>
        <h4 class="font-semibold text-dark m-b-8">No Weekly Templates Found</h4>
        <p class="text-muted m-b-24">Create a check-in template to start tracking weekly performance for roles.</p>
        <button mat-flat-button color="primary" (click)="openNewTemplateModal()">
          Create Check-in Template
        </button>
      </div>

      <!-- Grid list -->
      <div class="templates-grid" *ngIf="!isLoading && templates.length > 0">
        <div class="template-card" *ngFor="let temp of templates">
          <div class="card-top">
            <div class="card-top-badges">
              <div class="role-badge">{{ getRoleDisplayName(temp.roleId) }}</div>
              <div class="status-chip" [class.active]="temp.status === 'ACTIVE'">
                {{ temp.status }}
              </div>
            </div>
            
            <h3 class="template-name m-t-12 m-b-8 font-semibold text-dark">{{ temp.name }}</h3>
            <p class="question-count text-muted f-s-13">
              <i-tabler name="help-circle" class="icon-14 m-r-4"></i-tabler>
              {{ temp.questions?.length || 0 }} Questions
            </p>
          </div>

          <mat-divider></mat-divider>

          <div class="card-actions p-16 d-flex align-items-center justify-content-between">
            <div class="left-actions">
              <!-- Edit is always allowed -->
              <button mat-icon-button (click)="openEditTemplateModal(temp)" title="Edit Template">
                <i-tabler name="edit" class="icon-18 text-primary"></i-tabler>
              </button>
              
              <!-- Delete is only allowed for DRAFT -->
              <button mat-icon-button color="warn" (click)="deleteTemplate(temp)" *ngIf="temp.status === 'DRAFT'" title="Delete Template">
                <i-tabler name="trash" class="icon-18"></i-tabler>
              </button>
            </div>

            <div class="right-actions">
              <!-- Publish is only allowed for DRAFT -->
              <button mat-flat-button color="primary" class="publish-btn" (click)="publishTemplate(temp)" *ngIf="temp.status === 'DRAFT'" [disabled]="!temp.questions?.length">
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .templates-container {
      padding: 24px;
    }
    .section-title {
      font-size: 20px;
      margin-bottom: 4px;
    }
    .section-subtitle {
      color: #64748b;
      margin-bottom: 0;
    }
    .premium-btn {
      padding: 0 20px;
      font-weight: 600;
    }
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }
    .template-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease-in-out;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      }
    }
    .card-top {
      padding: 20px;
      flex-grow: 1;
    }
    .card-top-badges {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .role-badge {
      background-color: #f1f5f9;
      color: #475569;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-chip {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      background-color: #fee2e2;
      color: #ef4444;
      
      &.active {
        background-color: #dcfce7;
        color: #15803d;
      }
    }
    .question-count {
      display: flex;
      align-items: center;
    }
    .publish-btn {
      height: 32px;
      line-height: 30px;
      padding: 0 14px;
      font-size: 12px;
    }
  `]
})
export class WeeklyTemplatesComponent implements OnInit {
  templates: any[] = [];
  roles: any[] = [];
  selectedRoleId = '';
  selectedStatus = '';
  isLoading = true;

  constructor(
    private taskService: TaskAccountabilityService,
    private masterDataService: MasterDataService,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadTemplates();
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

  loadTemplates(): void {
    this.isLoading = true;
    this.taskService.getWeeklyTemplates(this.selectedRoleId, this.selectedStatus).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.templates = res.data || [];
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load weekly templates:', err);
        this.notificationService.showErrorPopup('Failed to load weekly templates.', 'Error', 'Close');
      }
    });
  }

  onFilterChange(): void {
    this.loadTemplates();
  }

  getRoleDisplayName(roleId: number): string {
    const matched = this.roles.find(r => r.id === roleId);
    return matched ? (matched.displayName || matched.name) : `Role ${roleId}`;
  }

  openNewTemplateModal(): void {
    const dialogRef = this.dialog.open(WeeklyTemplateEditDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadTemplates();
    });
  }

  openEditTemplateModal(template: any): void {
    const dialogRef = this.dialog.open(WeeklyTemplateEditDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: template,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadTemplates();
    });
  }

  publishTemplate(template: any): void {
    this.taskService.publishWeeklyTemplate(template.id).subscribe({
      next: () => {
        this.notificationService.showSuccessToast(`Weekly template published for ${this.getRoleDisplayName(template.roleId)}.`, 'Published');
        this.loadTemplates();
      },
      error: (err) => {
        console.error('Failed to publish template:', err);
        if (err.status === 409) {
          const roleName = this.getRoleDisplayName(template.roleId);
          this.notificationService.showErrorPopup(
            `${roleName} already has an active check-in template — delete or replace it first.`,
            'Conflict Detected',
            'Close'
          ).subscribe();
        } else {
          this.notificationService.showErrorPopup(err.error?.message || err.message || 'Failed to publish template.', 'Error', 'Close').subscribe();
        }
      }
    });
  }

  deleteTemplate(template: any): void {
    this.notificationService.showErrorPopup(
      `Are you sure you want to permanently delete the template: ${template.name}?`,
      'Confirm Deletion',
      'Delete'
    ).subscribe(() => {
      this.taskService.deleteWeeklyTemplate(template.id).subscribe({
        next: () => {
          this.notificationService.showSuccessToast('Template deleted successfully.', 'Deleted');
          this.loadTemplates();
        },
        error: (err) => {
          console.error('Failed to delete template:', err);
          if (err.status === 409) {
            this.notificationService.showErrorPopup('Active templates cannot be deleted.', 'Action Blocked', 'Close').subscribe();
          } else {
            this.notificationService.showErrorPopup(err.error?.message || err.message || 'Failed to delete template.', 'Error', 'Close').subscribe();
          }
        }
      });
    });
  }
}
