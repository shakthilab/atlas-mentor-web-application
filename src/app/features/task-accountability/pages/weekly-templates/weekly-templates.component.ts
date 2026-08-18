import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { WeeklyTemplateEditDialogComponent } from './weekly-template-edit-dialog.component';
import { WeeklyTemplateDuplicateDialogComponent } from './weekly-template-duplicate-dialog.component';

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
        <div class="filters-row">
          <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
            <mat-label>Filter by Role</mat-label>
            <mat-select [(value)]="selectedRoleId" (selectionChange)="onFilterChange()">
              <mat-option [value]="''">All Roles</mat-option>
              <mat-option *ngFor="let role of roles" [value]="role.id">{{ role.displayName || role.name }}</mat-option>
            </mat-select>
          </mat-form-field>

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
              <span class="status-chip" [class]="temp.status?.toLowerCase() || 'draft'">
                {{ temp.status }}
              </span>
              <span class="created-date-meta">
                {{ formatRelativeDate(temp.createdAt || temp.updatedAt) }}
              </span>
            </div>
            
            <h3 class="template-name m-t-16 m-b-8 font-semibold text-dark">{{ temp.name }}</h3>
            <p class="template-desc text-muted f-s-13">
              {{ getTemplateDescription(temp) }}
            </p>
          </div>

          <mat-divider></mat-divider>

          <div class="card-footer p-16 d-flex align-items-center justify-content-between">
            <div class="footer-pills-left">
              <span class="pill-badge-meta">Role: {{ getRoleDisplayName(temp.roleId) }}</span>
              <span class="pill-badge-meta">{{ getTotalQuestions(temp) }} Question{{ getTotalQuestions(temp) === 1 ? '' : 's' }}</span>
            </div>

            <div class="footer-actions-right">
              <button mat-icon-button [matMenuTriggerFor]="cardMenu" class="dots-btn" title="Options">
                <i-tabler name="dots-vertical" class="icon-18 text-muted"></i-tabler>
              </button>
              
              <mat-menu #cardMenu="matMenu" class="premium-menu-panel" xPosition="before">
                <!-- Edit is always allowed -->
                <button mat-menu-item (click)="openEditTemplateModal(temp)">
                  <i-tabler name="edit" class="icon-16 m-r-8 text-primary"></i-tabler>
                  <span>Edit Template</span>
                </button>

                <!-- Duplicate Template -->
                <button mat-menu-item (click)="duplicateWeeklyTemplate(temp)">
                  <i-tabler name="copy" class="icon-16 m-r-8 text-success"></i-tabler>
                  <span>Duplicate Template</span>
                </button>

                <!-- Publish Template -->
                <button mat-menu-item (click)="publishTemplate(temp)" *ngIf="temp.status === 'DRAFT'" [disabled]="!getTotalQuestions(temp)">
                  <i-tabler name="circle-check" class="icon-16 m-r-8 text-primary"></i-tabler>
                  <span>Publish Template</span>
                </button>

                <!-- Deactivate Template -->
                <button mat-menu-item (click)="updateStatus(temp, 'INACTIVE')" *ngIf="temp.status === 'ACTIVE'">
                  <i-tabler name="circle-x" class="icon-16 m-r-8 text-danger"></i-tabler>
                  <span>Deactivate Template</span>
                </button>

                <!-- Reactivate Template -->
                <button mat-menu-item (click)="updateStatus(temp, 'ACTIVE')" *ngIf="temp.status === 'INACTIVE'">
                  <i-tabler name="circle-check" class="icon-16 m-r-8 text-success"></i-tabler>
                  <span>Reactivate Template</span>
                </button>

                <mat-divider *ngIf="temp.status === 'DRAFT' || temp.status === 'INACTIVE'"></mat-divider>

                <!-- Delete Template -->
                <button mat-menu-item color="warn" (click)="deleteTemplate(temp)" *ngIf="temp.status === 'DRAFT' || temp.status === 'INACTIVE'">
                  <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                  <span class="text-danger">Delete Template</span>
                </button>
              </mat-menu>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .templates-container {
      padding: 24px;
      box-sizing: border-box;
      max-width: 100%;
    }
    .templates-header {
      flex-wrap: wrap;
      gap: 16px;
    }
    .templates-header > div:first-child {
      min-width: 0;
    }
    .section-title {
      font-size: 20px;
      margin-bottom: 4px;
      word-break: break-word;
    }
    .section-subtitle {
      color: #64748b;
      margin-bottom: 0;
      word-break: break-word;
    }
    .premium-btn {
      padding: 0 20px;
      font-weight: 600;
      flex-shrink: 0;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .filters-card {
      box-sizing: border-box;
    }
    .filters-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }
    
    .template-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      position: relative;
      overflow: hidden;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 20px -8px rgba(0,0,0,0.08);
        border-color: #cbd5e1;
      }
    }
    
    .card-top {
      padding: 24px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    
    .card-top-badges {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    
    .created-date-meta {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }
    
    .template-name {
      font-size: 16px;
      line-height: 1.4;
      font-weight: 700;
      color: #1e293b !important;
      margin: 0 0 8px 0;
      word-break: break-word;
    }
    
    .template-desc {
      font-size: 13px;
      line-height: 1.5;
      color: #64748b;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 38px;
    }
    
    .status-chip {
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      
      &.active {
        background-color: #ecfdf5;
        color: #059669;
      }
      &.draft {
        background-color: #fff7ed;
        color: #ea580c;
      }
      &.inactive {
        background-color: #f1f5f9;
        color: #475569;
      }
    }
    
    .card-footer {
      padding: 14px 20px;
      background: #fafafa;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #f1f5f9;
    }
    
    .footer-pills-left {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    
    .pill-badge-meta {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      background-color: #f1f5f9;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
    }
    
    .dots-btn {
      width: 32px;
      height: 32px;
      line-height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      
      &:hover {
        background-color: #f1f5f9;
      }
    }
    
    .premium-menu-panel {
      min-width: 180px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    @media (max-width: 768px) {
      .templates-container {
        padding: 16px;
      }
      .templates-header {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center !important;
        gap: 12px;
      }
      .templates-header > div:first-child {
        flex: 1 1 0;
        min-width: 0;
      }
      .premium-btn {
        flex-shrink: 0;
        height: 38px !important;
        width: auto !important;
        padding: 0 16px;
      }
      .filters-row {
        grid-template-columns: 1fr;
      }
      .templates-grid {
        gap: 16px;
      }
    }

    @media (max-width: 480px) {
      .templates-container {
        padding: 12px;
      }
      .filters-card {
        padding: 12px !important;
      }
      .filters-row {
        grid-template-columns: 1fr;
      }
      .card-top {
        padding: 16px;
      }
      .card-footer {
        padding: 12px 16px;
        flex-wrap: wrap;
        gap: 10px;
      }
    }
  `]
})
export class WeeklyTemplatesComponent implements OnInit {
  templates: any[] = [];
  roles: any[] = [];
  selectedRoleId = '';
  selectedStatus = '';
  isLoading = true;

  formatRelativeDate(dateStr: string): string {
    if (!dateStr) return 'Created recently';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return `Created ${dateStr}`;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `Created ${months[date.getMonth()]} ${date.getDate()}`;
    } catch (e) {
      return `Created ${dateStr}`;
    }
  }

  getTemplateDescription(temp: any): string {
    if (temp.description && temp.description.trim() !== '') return temp.description;
    const roleName = this.getRoleDisplayName(temp.roleId);
    return `Weekly check-in audit and accountability questionnaire assigned to ${roleName}.`;
  }

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
      width: '850px',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadTemplates();
    });
  }

  openEditTemplateModal(template: any): void {
    const dialogRef = this.dialog.open(WeeklyTemplateEditDialogComponent, {
      width: '850px',
      maxWidth: '90vw',
      data: template,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadTemplates();
    });
  }

  duplicateWeeklyTemplate(template: any): void {
    if (!template) return;

    const dialogRef = this.dialog.open(WeeklyTemplateDuplicateDialogComponent, {
      width: '500px',
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

  updateStatus(template: any, newStatus: 'ACTIVE' | 'INACTIVE'): void {
    if (!template) return;
    
    const confirmMessage = newStatus === 'ACTIVE'
      ? `Are you sure you want to reactivate the template: ${template.name}?`
      : `Are you sure you want to deactivate the template: ${template.name}?`;

    this.notificationService.showErrorPopup(
      confirmMessage,
      newStatus === 'ACTIVE' ? 'Reactivate Template' : 'Deactivate Template',
      newStatus === 'ACTIVE' ? 'Reactivate' : 'Deactivate'
    ).subscribe(() => {
      this.taskService.updateWeeklyTemplateStatus(template.id, newStatus).subscribe({
        next: () => {
          this.notificationService.showSuccessToast(
            `Template status updated to ${newStatus} successfully.`,
            'Status Updated'
          );
          this.loadTemplates();
        },
        error: (err) => {
          console.error('Failed to update status:', err);
          this.notificationService.showErrorPopup(
            err.error?.message || err.message || 'Failed to update template status.',
            'Error',
            'Close'
          ).subscribe();
        }
      });
    });
  }

  getTotalQuestions(template: any): number {
    if (!template) return 0;
    if (template.weeks) {
      return template.weeks.reduce((acc: number, w: any) => acc + (w.questions ? w.questions.length : 0), 0);
    }
    return template.questions ? template.questions.length : 0;
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
