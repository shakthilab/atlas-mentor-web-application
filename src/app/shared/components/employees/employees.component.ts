import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NotificationService } from '../../../core/services/notification.service';
import { EmployeeService, Employee, Page } from '../../../core/services/employee.service';
import { EmployeeDetailsDialogComponent } from './employee-details-dialog/employee-details-dialog.component';
import { AddEmployeeDialogComponent } from './add-employee-dialog/add-employee-dialog.component';
import { AuthService } from '../../../core/services/auth.service';
import { TableColumn } from '../data-table/data-table.models';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-employees',
  template: `
    <div class="page-head">
      <div>
        <div class="eyebrow">Management</div>
        <h1 class="page-title">Employees Directory</h1>
        <p class="page-sub">Manage your team across all branches.</p>
      </div>
    </div>
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">{{ 'employees.title' | translate }}</h5>
          </mat-card-title>
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" [placeholder]="'employees.searchPlaceholder' | translate" class="search-input" />
            </div>
            <div class="view-mode-toggle d-flex align-items-center">
              <button (click)="viewMode = 'table'" class="toggle-btn" [class.active]="viewMode === 'table'" [title]="'leads.listView' | translate">
                <i-tabler name="list" class="icon-18"></i-tabler>
              </button>
              <button (click)="viewMode = 'card'" class="toggle-btn" [class.active]="viewMode === 'card'" [title]="'leads.cardView' | translate">
                <i-tabler name="layout-grid" class="icon-18"></i-tabler>
              </button>
            </div>
            <button mat-flat-button color="primary" class="d-flex align-items-center add-btn desktop-add-btn" (click)="addEmployee()">
              <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler>
              <span class="add-btn-text">{{ 'employees.addEmployee' | translate }}</span>
            </button>
          </div>
        </mat-card-header>

        <mat-card-content class="p-0">
          <!-- Table View -->
          <div *ngIf="viewMode === 'table'" class="view-container">
            <app-data-table
              [columns]="tableColumns"
              [mobileColumns]="['role', 'contactInfo', 'branch', 'manager', 'status']"
              [rows]="dataSource.filteredData"
              trackByKey="id"
              [clickableRows]="true"
              exportFileName="employees"
              noFilterResultsMessage="No employees on this page match the current filters. Filters only apply to the currently loaded page — try clearing filters before paging."
              (rowClick)="viewProfile($event)"
            >
              <ng-template appCellDef="employee" let-element="row">
                <div class="d-flex align-items-center">
                  <img [src]="getAvatar(element)" class="rounded-circle m-r-12 object-cover avatar-animated flex-shrink-0" width="40" height="40" />
                  <div class="min-w-0">
                    <span class="f-w-600 d-block text-dark f-s-14 text-truncate">{{ element.firstName }} {{ element.lastName }}</span>
                    <span class="text-muted f-s-12 d-block text-truncate">{{ element.email }}</span>
                  </div>
                </div>
              </ng-template>

              <ng-template appRowActions let-element="row">
                <button mat-icon-button [matMenuTriggerFor]="menu" class="text-muted" (click)="$event.stopPropagation()">
                  <i-tabler name="dots" class="icon-18"></i-tabler>
                </button>
                <mat-menu #menu="matMenu" class="cardWithShadow">
                  <button mat-menu-item (click)="viewProfile(element)">
                    <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                    <span>{{ 'leads.viewDetails' | translate }}</span>
                  </button>
                  <button mat-menu-item (click)="editDetails(element)">
                    <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                    <span>{{ 'employees.editDetails' | translate }}</span>
                  </button>
                  <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'INACTIVE'" (click)="toggleStatus(element)">
                    <i-tabler name="user-check" class="icon-16 m-r-8 text-success"></i-tabler>
                    <span>{{ 'common.activate' | translate }}</span>
                  </button>
                  <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'ACTIVE'" (click)="toggleStatus(element)">
                    <i-tabler name="user-x" class="icon-16 m-r-8 text-warning"></i-tabler>
                    <span>{{ 'common.deactivate' | translate }}</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item class="text-danger" (click)="deleteEmployee(element)">
                    <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                    <span>{{ 'common.delete' | translate }}</span>
                  </button>
                </mat-menu>
              </ng-template>
            </app-data-table>
          </div>

          <!-- Card View -->
          <div *ngIf="viewMode === 'card'" class="card-grid view-container p-24">
            <mat-card *ngFor="let element of dataSource.data" class="employee-card cardWithShadow cursor-pointer" (click)="viewProfile(element)">
              <mat-card-content class="p-16">
                <div class="d-flex align-items-center m-b-16">
                  <img [src]="getAvatar(element)" class="rounded-circle m-r-12 object-cover avatar-animated flex-shrink-0" width="48" height="48" />
                  <div class="min-w-0 flex-grow-1">
                    <h6 class="mat-subtitle-1 f-w-600 m-b-0 text-truncate">{{ element.firstName }} {{ element.lastName }}</h6>
                    <span class="f-s-13 text-muted text-truncate d-block">{{ getRoleDisplayName(element) }}</span>
                  </div>
                  <div class="m-l-auto flex-shrink-0">
                    <button mat-icon-button [matMenuTriggerFor]="cardMenu" class="text-muted" (click)="$event.stopPropagation()">
                      <i-tabler name="dots-vertical" class="icon-18"></i-tabler>
                    </button>
                    <mat-menu #cardMenu="matMenu" class="cardWithShadow">
                      <button mat-menu-item (click)="viewProfile(element)">
                        <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                        <span>{{ 'leads.viewDetails' | translate }}</span>
                      </button>
                      <button mat-menu-item (click)="editDetails(element)">
                        <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                        <span>{{ 'employees.editDetails' | translate }}</span>
                      </button>
                      <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'INACTIVE'" (click)="toggleStatus(element)">
                        <i-tabler name="user-check" class="icon-16 m-r-8 text-success"></i-tabler>
                        <span>{{ 'common.activate' | translate }}</span>
                      </button>
                      <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'ACTIVE'" (click)="toggleStatus(element)">
                        <i-tabler name="user-x" class="icon-16 m-r-8 text-warning"></i-tabler>
                        <span>{{ 'common.deactivate' | translate }}</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item class="text-danger" (click)="deleteEmployee(element)">
                        <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                        <span>{{ 'common.delete' | translate }}</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>

                <div class="d-flex align-items-center justify-content-between m-b-10">
                  <span class="f-s-13 text-muted d-flex align-items-center text-truncate">
                    <i-tabler name="mail" class="icon-15 m-r-6 flex-shrink-0"></i-tabler>
                    <span class="text-truncate">{{ element.email }}</span>
                  </span>
                </div>

                <div class="d-flex align-items-center justify-content-between m-b-14">
                  <div class="d-flex align-items-center text-truncate me-2">
                    <i-tabler name="phone" class="icon-15 m-r-6 text-muted flex-shrink-0"></i-tabler>
                    <span class="f-s-13 text-muted text-truncate">{{ element.phone || ('leads.notAvailable' | translate) }}</span>
                  </div>
                  <span class="status-badge flex-shrink-0" [ngClass]="(element.status || 'ACTIVE').toLowerCase()">
                    {{ ((element.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'common.active' : 'common.inactive') | translate }}
                  </span>
                </div>

                <mat-divider class="m-b-10"></mat-divider>
                <div class="d-flex align-items-center justify-content-between text-muted f-s-12">
                  <span class="d-flex align-items-center text-truncate" *ngIf="element.branch?.name || element.branch">
                    <i-tabler name="building" class="icon-13 m-r-4 flex-shrink-0"></i-tabler>
                    <span class="text-truncate">{{ element.branch?.name || element.branch }}</span>
                  </span>
                  <span class="d-flex align-items-center flex-shrink-0 ms-auto" *ngIf="element.manager?.firstName || element.manager?.name">
                    <i-tabler name="user" class="icon-13 m-r-4"></i-tabler>
                    {{ element.manager?.firstName || element.manager?.name }}
                  </span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <mat-paginator [length]="totalElements"
                         [pageSize]="pageSize"
                         [pageSizeOptions]="[5, 10, 20]"
                         (page)="pageChanged($event)"
                         showFirstLastButtons
                         class="p-y-12">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Mobile FAB -->
    <button mat-fab color="primary" class="employee-mobile-fab" (click)="addEmployee()" [attr.aria-label]="'employees.addEmployee' | translate" title="Add Employee">
      <i-tabler name="plus" class="icon-24"></i-tabler>
    </button>
  `,
  styles: [`
    .page-head {
      padding: 24px 28px 0;
      max-width: 1680px;
      margin: 0 auto;

      @media (max-width: 1200px) {
        padding: 20px 20px 0;
      }

      @media (max-width: 768px) {
        padding: 16px 14px 0;
      }

      @media (max-width: 480px) {
        padding: 12px 10px 0;
      }

      .page-title {
        font-size: clamp(20px, 2.2vw, 28px);
        font-weight: 800;
        color: #1a1d23;
        line-height: 1.25;
        letter-spacing: -0.5px;
        margin-bottom: 4px;
      }

      .page-sub {
        font-size: 13px;
        color: #718096;
        margin-bottom: 0;
      }

      .eyebrow {
        font-size: 11px;
        font-weight: 700;
        color: #8a94a6;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        margin-bottom: 4px;
      }
    }

    .table-container {
      padding: 20px 28px 48px;
      max-width: 1680px;
      margin: 0 auto;
      box-sizing: border-box;

      @media (max-width: 1200px) {
        padding: 16px 20px 40px;
      }

      @media (max-width: 768px) {
        padding: 14px 14px calc(84px + env(safe-area-inset-bottom, 0px));
      }

      @media (max-width: 480px) {
        padding: 10px 10px calc(80px + env(safe-area-inset-bottom, 0px));
      }
    }

    mat-card.cardWithShadow {
      border-radius: 16px;
      border: 1px solid var(--border, #e5e9f0);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03);
      overflow: hidden;

      @media (max-width: 576px) {
        border-radius: 12px;
      }
    }

    mat-card-header {
      @media (max-width: 768px) {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 14px;
        padding: 14px 16px !important;
      }

      @media (max-width: 480px) {
        padding: 12px 12px !important;
        gap: 12px;
      }
    }
    
    .header-actions {
      @media (max-width: 768px) {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      button.desktop-add-btn {
        white-space: nowrap;
        flex-shrink: 0;
        @media (max-width: 768px) {
          display: none !important;
        }
      }
    }

    .view-container {
      animation: fadeIn 0.4s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .avatar-animated {
      transition: transform 0.3s ease;
    }
    
    .employee-card:hover .avatar-animated {
      transform: scale(1.08) rotate(4deg);
      animation: gentle-bounce 1s infinite alternate ease-in-out;
    }
    
    @keyframes gentle-bounce {
      0% { transform: scale(1.08) rotate(3deg) translateY(0); }
      100% { transform: scale(1.08) rotate(5deg) translateY(-2px); }
    }
    
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      padding: 20px !important;
      
      @media (max-width: 768px) {
        gap: 14px;
        padding: 14px !important;
      }

      @media (max-width: 576px) {
        grid-template-columns: 1fr;
        gap: 12px;
        padding: 12px 8px !important;
      }
    }

    .employee-card {
      border-radius: 12px;
      border: 1px solid var(--border, #e5e9f0);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: pointer;
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06) !important;
      }
    }

    .view-mode-toggle {
      background-color: #ffffff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      display: flex;
      overflow: hidden;
      flex-shrink: 0;
      
      .toggle-btn {
        width: 38px;
        height: 38px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &.active {
          background-color: var(--brand-primary, #14213D);
          color: #ffffff;
        }
        &:hover:not(.active) {
          background-color: #f1f5f9;
        }
      }
    }
    
    /* Status Badges (card view) */
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      text-transform: capitalize;
      
      &.active {
        background-color: rgba(19, 222, 185, 0.1);
        color: #13deb9;
      }
      
      &.inactive {
        background-color: rgba(250, 137, 107, 0.1);
        color: #fa896b;
      }
    }

    .cursor-pointer { cursor: pointer; }

    /* Header Actions */
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 0 12px;
      border: 1px solid #e2e8f0;
      min-width: 0;
      flex: 1 1 auto;
      height: 38px;
      transition: all 0.2s ease-in-out;
      
      &:focus-within {
        background-color: #ffffff;
        border-color: var(--brand-primary, #14213D);
        box-shadow: 0 0 0 3px rgba(20, 33, 61, 0.08);
      }
      
      .search-icon {
        color: #64748b;
        margin-right: 8px;
        flex-shrink: 0;
      }
      
      .search-input {
        border: none;
        background: transparent;
        outline: none;
        width: 100%;
        font-size: 13px;
        color: #1e293b;
        
        &::placeholder {
          color: #94a3b8;
        }
      }
    }

    .flex-1-auto { flex: 1 1 auto; }
    .gap-12 { gap: 12px; }
    .m-r-12 { margin-right: 12px; }
    .m-r-8 { margin-right: 8px; }
    .m-r-4 { margin-right: 4px; }
    .p-0 { padding: 0 !important; }
    .object-cover { object-fit: cover; }
    .text-success { color: #13deb9 !important; }
    .text-warning { color: #ffae1f !important; }

    /* Mobile FAB */
    .employee-mobile-fab {
      position: fixed;
      bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
      right: 16px !important;
      z-index: 1000;
      display: none !important;
      width: 48px !important;
      height: 48px !important;
      border-radius: 50% !important;
      background-color: var(--brand-primary, #14213D) !important;
      color: #ffffff !important;
      box-shadow: 0 4px 14px rgba(20, 33, 61, 0.35) !important;
      cursor: pointer;
      
      @media (max-width: 768px) {
        display: flex !important;
        align-items: center;
        justify-content: center;
      }

      i-tabler {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    :host-context(.dark-theme) {
      .page-head {
        .page-title { color: #f8fafc; }
        .page-sub { color: #94a3b8; }
      }
      .search-box {
        background-color: var(--dark-sidebarbg, #1e293b);
        border-color: var(--dark-formborderColor, #334155);
        .search-input {
          color: #f8fafc;
        }
      }
      .view-mode-toggle {
        background-color: var(--dark-sidebarbg, #1e293b);
        border-color: var(--dark-formborderColor, #334155);
        .toggle-btn {
          color: #94a3b8;
          &.active { background-color: var(--brand-primary, #14213D); color: #ffffff; }
          &:hover:not(.active) { background-color: var(--dark-hoverbgcolor, #334155); }
        }
      }
      .status-badge {
        &.active {
          background-color: rgba(19, 222, 185, 0.2);
          color: #80f1d4;
        }
        &.inactive {
          background-color: rgba(250, 137, 107, 0.2);
          color: #ffab91;
        }
      }
      mat-card.cardWithShadow, .employee-card {
        background-color: var(--dark-cardbg, #1e293b);
        border-color: var(--dark-border, #334155);
      }
    }
  `]
})
export class EmployeesComponent implements OnInit, AfterViewInit {
  viewMode: 'table' | 'card' = 'table';

  tableColumns: TableColumn<Employee>[] = [
    {
      key: 'employee', header: 'Employee', type: 'custom',
      filter: { type: 'text', getValue: (r: any) => `${r.firstName || ''} ${r.lastName || ''} ${r.email || ''}` },
    },
    {
      key: 'role', header: 'Role', type: 'text', valueFn: r => this.getRoleDisplayName(r), maxWidth: '160px',
      filter: { type: 'text' },
    },
    {
      key: 'branch', header: 'Branch', type: 'text',
      valueFn: (r: any) => r.branch?.name || r.branch || ('Branch ' + r.branchId),
      maxWidth: '160px',
      filter: { type: 'text' },
    },
    {
      key: 'status', header: 'Status', type: 'pill',
      valueFn: r => this.titleCase(r.status || 'ACTIVE'),
      classFn: r => this.statusPillClass(r.status || 'ACTIVE'),
      filter: {
        type: 'select',
        options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }],
        getValue: r => (r.status || 'ACTIVE').toUpperCase(),
      },
    },
    { key: 'phone', header: 'Phone', type: 'text', valueFn: r => r.phone || 'N/A', maxWidth: '130px', filter: { type: 'text' } },
    { key: 'actions', header: 'Actions', type: 'actions', align: 'right' },
  ];

  dataSource = new MatTableDataSource<Employee>([]);

  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  searchQuery = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private notificationService: NotificationService,
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  titleCase(value?: string | null): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  statusPillClass(status?: string | null): string {
    switch ((status || '').toLowerCase()) {
      case 'active': return 'pill--success';
      case 'inactive': return 'pill--danger';
      default: return 'pill--neutral';
    }
  }

  getRoleDisplayName(element: any): string {
    if (!element) return '';
    const roleObj = element.role;
    const rawRole = roleObj?.displayName || roleObj?.name || roleObj || this.translate.instant('employees.roleN', { id: element.roleId });
    return this.authService.formatRoleName(rawRole);
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  ngAfterViewInit(): void {
    // Note: We use custom paginator events to call the backend instead of hooking it to the local datasource
  }

  getAvatar(employee: Employee): string {
    if (employee.avatar) return employee.avatar;
    // Cycle through the 4 local 3D avatars based on employee ID
    const id = employee.id || Math.floor(Math.random() * 4) + 1;
    const avatarIndex = (id % 4) + 1;
    return `/assets/images/profile/user-${avatarIndex}.jpg`;
  }

  loadEmployees(): void {
    const filters = this.searchQuery ? { search: this.searchQuery } : undefined;
    
    this.employeeService.getEmployees(this.currentPage, this.pageSize, filters).subscribe({
      next: (response: any) => {
        const pageData = response?.data || response;
        if (pageData && pageData.content) {
          this.dataSource.data = pageData.content;
          this.totalElements = pageData.totalElements || pageData.content.length;
        } else if (Array.isArray(pageData)) {
          // Fallback if API returns an array directly
          this.dataSource.data = pageData;
          this.totalElements = pageData.length;
        }
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
        this.notificationService.showErrorToast(this.translate.instant('employees.toast.loadFailed'), this.translate.instant('employees.toast.errorTitle'));
      }
    });
  }

  pageChanged(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadEmployees();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchQuery = filterValue.trim();
    this.currentPage = 0; // Reset to first page
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadEmployees();
  }

  addEmployee(): void {
    const dialogRef = this.dialog.open(AddEmployeeDialogComponent, {
      width: '600px',
      panelClass: 'add-employee-dialog',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the list if an employee was created
        this.loadEmployees();
      }
    });
  }

  viewProfile(employee: Employee): void {
    this.dialog.open(EmployeeDetailsDialogComponent, {
      data: employee,
      width: '500px',
      panelClass: 'employee-details-dialog'
    });
  }

  editDetails(employee: Employee): void {
    if (!employee.id) return;
    
    const dialogRef = this.dialog.open(AddEmployeeDialogComponent, {
      width: '600px',
      panelClass: 'add-employee-dialog',
      disableClose: true,
      data: employee
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEmployees();
      }
    });
  }

  toggleStatus(employee: Employee): void {
    if (!employee.id) return;
    
    const currentStatus = (employee.status || 'ACTIVE').toUpperCase();
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const isActivating = newStatus === 'ACTIVE';

    this.employeeService.updateEmployeeStatus(employee.id, newStatus).subscribe({
      next: () => {
        this.notificationService.showSuccessToast(
          this.translate.instant(isActivating ? 'employees.toast.activated' : 'employees.toast.deactivated'),
          this.translate.instant('employees.toast.statusUpdated')
        );
        this.loadEmployees();
      },
      error: () => this.notificationService.showErrorToast(
        this.translate.instant(isActivating ? 'employees.toast.activateFailed' : 'employees.toast.deactivateFailed'),
        this.translate.instant('employees.toast.errorTitle')
      )
    });
  }

  deleteEmployee(employee: Employee): void {
    if (!employee.id) return;

    this.notificationService.showErrorPopup(
      this.translate.instant('employees.confirmDeleteMessage', { name: employee.firstName }),
      this.translate.instant('employees.confirmDeleteTitle'),
      this.translate.instant('common.delete')
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.employeeService.deleteEmployee(employee.id!).subscribe({
          next: () => {
            this.notificationService.showSuccessToast(
              this.translate.instant('employees.toast.employeeDeleted', { name: employee.firstName }),
              this.translate.instant('leads.toast.deleted')
            );
            this.loadEmployees();
          },
          error: () => this.notificationService.showErrorToast(
            this.translate.instant('employees.toast.deleteFailed'),
            this.translate.instant('employees.toast.errorTitle')
          )
        });
      }
    });
  }
}
