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

@Component({
  selector: 'app-employees',
  template: `
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">Employees Directory</h5>
          </mat-card-title>
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box flex-1-auto">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" placeholder="Search employees..." class="search-input" />
            </div>
            <div class="view-mode-toggle d-flex align-items-center">
              <button (click)="viewMode = 'table'" class="toggle-btn" [class.active]="viewMode === 'table'" title="List view">
                <i-tabler name="list" class="icon-18"></i-tabler>
              </button>
              <button (click)="viewMode = 'card'" class="toggle-btn" [class.active]="viewMode === 'card'" title="Card view">
                <i-tabler name="layout-grid" class="icon-18"></i-tabler>
              </button>
            </div>
            <button mat-flat-button color="primary" class="d-flex align-items-center add-btn desktop-add-btn" (click)="addEmployee()">
              <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler>
              <span class="add-btn-text">Add Employee</span>
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content class="p-0">
          <!-- Table View -->
          <div *ngIf="viewMode === 'table'" class="table-responsive view-container">
            <table mat-table [dataSource]="dataSource" class="w-100">
              
              <!-- Employee Column -->
              <ng-container matColumnDef="employee">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Employee</th>
                <td mat-cell *matCellDef="let element" (click)="viewProfile(element)" class="cursor-pointer">
                  <div class="d-flex align-items-center">
                    <img [src]="getAvatar(element)" class="rounded-circle m-r-12 object-cover avatar-animated" width="40" height="40" />
                    <div>
                      <span class="f-w-600 d-block text-dark f-s-14">{{ element.firstName }} {{ element.lastName }}</span>
                      <span class="text-muted f-s-12 d-block">{{ element.email }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Role Column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Role</th>
                <td mat-cell *matCellDef="let element" class="f-w-500 text-dark f-s-13">
                  {{ element.role?.name || element.role || 'Role ' + element.roleId }}
                </td>
              </ng-container>

              <!-- Branch Column -->
              <ng-container matColumnDef="branch">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Branch</th>
                <td mat-cell *matCellDef="let element" class="text-muted f-s-13">
                  {{ element.branch?.name || element.branch || 'Branch ' + element.branchId }}
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Status</th>
                <td mat-cell *matCellDef="let element">
                  <span class="status-badge" [ngClass]="(element.status || 'ACTIVE').toLowerCase()">
                    {{ element.status || 'ACTIVE' | titlecase }}
                  </span>
                </td>
              </ng-container>

              <!-- Phone Column -->
              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Phone</th>
                <td mat-cell *matCellDef="let element" class="text-muted f-s-13">
                  {{ element.phone || 'N/A' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14 text-center">Actions</th>
                <td mat-cell *matCellDef="let element" class="text-center">
                  <button mat-icon-button [matMenuTriggerFor]="menu" class="text-muted" (click)="$event.stopPropagation()">
                    <i-tabler name="dots" class="icon-18"></i-tabler>
                  </button>
                  <mat-menu #menu="matMenu" class="cardWithShadow">
                    <button mat-menu-item (click)="viewProfile(element)">
                      <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                      <span>View details</span>
                    </button>
                    <button mat-menu-item (click)="editDetails(element)">
                      <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                      <span>Edit details</span>
                    </button>
                    <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'INACTIVE'" (click)="toggleStatus(element)">
                      <i-tabler name="user-check" class="icon-16 m-r-8 text-success"></i-tabler>
                      <span>Activate</span>
                    </button>
                    <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'ACTIVE'" (click)="toggleStatus(element)">
                      <i-tabler name="user-x" class="icon-16 m-r-8 text-warning"></i-tabler>
                      <span>Deactivate</span>
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item class="text-danger" (click)="deleteEmployee(element)">
                      <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                      <span>Delete</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="employee-row"></tr>
            </table>
          </div>

          <!-- Card View -->
          <div *ngIf="viewMode === 'card'" class="card-grid view-container p-24">
            <mat-card *ngFor="let element of dataSource.data" class="employee-card cardWithShadow cursor-pointer" (click)="viewProfile(element)">
              <mat-card-content class="p-16">
                <div class="d-flex align-items-center m-b-16">
                  <img [src]="getAvatar(element)" class="rounded-circle m-r-12 object-cover avatar-animated" width="48" height="48" />
                  <div>
                    <h6 class="mat-subtitle-1 f-w-600 m-b-0">{{ element.firstName }} {{ element.lastName }}</h6>
                    <span class="f-s-13 text-muted">{{ element.role?.name || element.role || 'Role ' + element.roleId }}</span>
                  </div>
                  <div class="m-l-auto">
                    <button mat-icon-button [matMenuTriggerFor]="cardMenu" class="text-muted" (click)="$event.stopPropagation()">
                      <i-tabler name="dots-vertical" class="icon-18"></i-tabler>
                    </button>
                    <mat-menu #cardMenu="matMenu" class="cardWithShadow">
                      <button mat-menu-item (click)="viewProfile(element)">
                        <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                        <span>View details</span>
                      </button>
                      <button mat-menu-item (click)="editDetails(element)">
                        <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                        <span>Edit details</span>
                      </button>
                      <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'INACTIVE'" (click)="toggleStatus(element)">
                        <i-tabler name="user-check" class="icon-16 m-r-8 text-success"></i-tabler>
                        <span>Activate</span>
                      </button>
                      <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'ACTIVE'" (click)="toggleStatus(element)">
                        <i-tabler name="user-x" class="icon-16 m-r-8 text-warning"></i-tabler>
                        <span>Deactivate</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item class="text-danger" (click)="deleteEmployee(element)">
                        <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>
                
                <div class="d-flex align-items-center justify-content-between m-b-12">
                  <span class="f-s-13 text-muted d-flex align-items-center"><i-tabler name="mail" class="icon-16 m-r-4"></i-tabler> {{ element.email }}</span>
                </div>
                
                <div class="d-flex align-items-center justify-content-between m-b-16">
                  <div class="d-flex align-items-center">
                    <i-tabler name="phone" class="icon-16 m-r-4 text-muted"></i-tabler>
                    <span class="f-s-13 text-muted">{{ element.phone || 'N/A' }}</span>
                  </div>
                  <span class="status-badge" [ngClass]="(element.status || 'ACTIVE').toLowerCase()">
                    {{ element.status || 'ACTIVE' | titlecase }}
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
    <button mat-fab color="primary" class="employee-mobile-fab" (click)="addEmployee()" aria-label="Add Employee">
      <i-tabler name="plus" class="icon-24"></i-tabler>
    </button>
  `,
  styles: [`
    .table-container {
      padding: 24px;
      
      @media (max-width: 768px) {
        padding: 12px 8px;
      }
    }

    mat-card-header {
      @media (max-width: 576px) {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 16px;
      }
    }
    
    .header-actions {
      @media (max-width: 576px) {
        width: 100%;
        justify-content: space-between;
      }

      button.desktop-add-btn {
        white-space: nowrap;
        flex-shrink: 0;
        @media (max-width: 576px) {
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
    
    .employee-row:hover .avatar-animated,
    .employee-card:hover .avatar-animated {
      transform: scale(1.1) rotate(5deg);
      animation: gentle-bounce 1s infinite alternate ease-in-out;
    }
    
    @keyframes gentle-bounce {
      0% { transform: scale(1.1) rotate(3deg) translateY(0); }
      100% { transform: scale(1.1) rotate(7deg) translateY(-3px); }
    }
    
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      
      @media (max-width: 576px) {
        grid-template-columns: 1fr;
        padding: 16px !important;
      }
    }

    .employee-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: pointer;
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important;
      }
    }

    .view-mode-toggle {
      background-color: #ffffff;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      display: flex;
      overflow: hidden;
      
      .toggle-btn {
        width: 42px;
        height: 36px;
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
          background-color: #615dff;
          color: #ffffff;
        }
        &:hover:not(.active) {
          background-color: #f1f5f9;
        }
      }
    }

    mat-card-header {
      @media (max-width: 576px) {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 16px;
      }
    }
    
    .header-actions {
      @media (max-width: 576px) {
        width: 100%;
        justify-content: space-between;
      }

      button {
        white-space: nowrap;
        flex-shrink: 0;
      }
    }
    
    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    
    table {
      min-width: 800px;
    }

    .employee-row {
      transition: background-color 0.2s ease;
      cursor: pointer;
      &:hover {
        background-color: #f8fafc;
      }
    }

    /* Status Badges */
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
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 0 12px;
      border: 1px solid #e2e8f0;
      min-width: 0;
      height: 38px;
      transition: all 0.2s ease-in-out;
      
      &:focus-within {
        background-color: #ffffff;
        border-color: #615dff;
        box-shadow: 0 0 0 3px rgba(97, 93, 255, 0.1);
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
      bottom: 84px;
      right: 24px;
      z-index: 1000;
      display: none !important;
      
      @media (max-width: 576px) {
        display: flex !important;
        align-items: center;
        justify-content: center;
      }
    }

    @keyframes fabIn {
      from { transform: scale(0.5); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    :host-context(.dark-theme) {
      .employee-row:hover {
        background-color: var(--dark-hoverbgcolor);
      }
      .search-box {
        background-color: var(--dark-sidebarbg);
        border-color: var(--dark-formborderColor);
        .search-input {
          color: #f8fafc;
        }
      }
      .view-mode-toggle {
        background-color: var(--dark-sidebarbg);
        border-color: var(--dark-formborderColor);
        .toggle-btn {
          color: #94a3b8;
          &.active { background-color: #615dff; color: #ffffff; }
          &:hover:not(.active) { background-color: var(--dark-hoverbgcolor); }
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
    }
  `]
})
export class EmployeesComponent implements OnInit, AfterViewInit {
  viewMode: 'table' | 'card' = 'table';
  
  displayedColumns: string[] = [
    'employee',
    'role',
    'branch',
    'phone',
    'status',
    'actions'
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
    private dialog: MatDialog
  ) {}

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
        this.notificationService.showErrorToast('Failed to load employees.', 'Error');
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
    const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

    this.employeeService.updateEmployeeStatus(employee.id, newStatus).subscribe({
      next: () => {
        this.notificationService.showSuccessToast(`Employee ${actionText}d successfully.`, 'Status Updated');
        this.loadEmployees();
      },
      error: () => this.notificationService.showErrorToast(`Failed to ${actionText} employee.`, 'Error')
    });
  }

  deleteEmployee(employee: Employee): void {
    if (!employee.id) return;

    this.notificationService.showErrorPopup(
      `Are you sure you want to completely remove ${employee.firstName}?`,
      'Confirm Deletion',
      'Delete'
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.employeeService.deleteEmployee(employee.id!).subscribe({
          next: () => {
            this.notificationService.showSuccessToast(`${employee.firstName} deleted.`, 'Deleted');
            this.loadEmployees();
          },
          error: () => this.notificationService.showErrorToast('Failed to delete employee.', 'Error')
        });
      }
    });
  }
}
