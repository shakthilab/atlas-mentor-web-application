import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { BranchDetailsDialogComponent } from './branch-details-dialog/branch-details-dialog.component';
import { AddBranchDialogComponent } from './add-branch-dialog/add-branch-dialog.component';

export interface BranchManager {
  id: number;
  name: string;
  email: string;
}

export interface BranchUserCounts {
  totalStaffs: number;
  totalStudents: number;
}

export interface Branch {
  id: number;
  name: string;
  location: string;
  manager: BranchManager;
  status: string;
  userCounts: BranchUserCounts;
  createdAt: string;
}

@Component({
  selector: 'app-branches',
  template: `
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">Branches Directory</h5>
          </mat-card-title>
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" placeholder="Search branches..." class="search-input" />
            </div>
            <div class="view-mode-toggle d-flex align-items-center">
              <button (click)="viewMode = 'table'" class="toggle-btn" [class.active]="viewMode === 'table'">
                <i-tabler name="list" class="icon-18"></i-tabler>
              </button>
              <button (click)="viewMode = 'card'" class="toggle-btn" [class.active]="viewMode === 'card'">
                <i-tabler name="layout-grid" class="icon-18"></i-tabler>
              </button>
            </div>
            <button mat-flat-button color="primary" class="d-flex align-items-center desktop-add-btn" (click)="addBranch()">
              <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler>
              Add Branch
            </button>
          </div>
        </mat-card-header>

        <mat-card-content class="p-0">

          <!-- Loading Spinner -->
          <div *ngIf="isLoading" class="d-flex align-items-center justify-content-center p-y-40">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <ng-container *ngIf="!isLoading">
            <!-- Table View -->
            <div *ngIf="viewMode === 'table'" class="table-responsive view-container">
              <table mat-table [dataSource]="dataSource" class="w-100">

                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Branch Name</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="f-w-600 d-block text-dark f-s-14">{{ element.name }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="location">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Location</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="location-cell f-w-500 text-dark f-s-13">{{ element.location }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="manager">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Manager</th>
                  <td mat-cell *matCellDef="let element">
                    <div class="d-flex align-items-center">
                      <img [src]="getManagerAvatar(element.manager?.id)" class="rounded-circle m-r-8 object-cover avatar-img" width="36" height="36" />
                      <div>
                        <span class="f-w-500 text-dark f-s-13 d-block">{{ element.manager?.name }}</span>
                        <span class="f-s-12 text-muted">{{ element.manager?.email }}</span>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="employees">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Staff</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="d-block f-w-500 text-dark f-s-13">{{ element.userCounts?.totalStaffs }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="students">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Students</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="d-block f-w-500 text-dark f-s-13">{{ element.userCounts?.totalStudents }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Status</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="status-badge" [ngClass]="element.status?.toLowerCase()">
                      {{ element.status | titlecase }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14 text-center">Actions</th>
                  <td mat-cell *matCellDef="let element" class="text-center">
                    <button mat-icon-button [matMenuTriggerFor]="menu" class="text-muted" (click)="$event.stopPropagation()">
                      <i-tabler name="dots" class="icon-18"></i-tabler>
                    </button>
                    <mat-menu #menu="matMenu" class="cardWithShadow">
                      <button mat-menu-item (click)="viewDetails(element)">
                        <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                        <span>View details</span>
                      </button>
                      <button mat-menu-item (click)="editBranch(element)">
                        <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                        <span>Edit branch</span>
                      </button>
                      <button mat-menu-item *ngIf="element.status?.toUpperCase() === 'INACTIVE'" (click)="toggleStatus(element)">
                        <i-tabler name="check" class="icon-16 m-r-8 text-success"></i-tabler>
                        <span>Activate</span>
                      </button>
                      <button mat-menu-item *ngIf="element.status?.toUpperCase() === 'ACTIVE'" (click)="toggleStatus(element)">
                        <i-tabler name="ban" class="icon-16 m-r-8 text-warning"></i-tabler>
                        <span>Deactivate</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item class="text-danger" (click)="deleteBranch(element)">
                        <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="element-row cursor-pointer" (click)="viewDetails(row)"></tr>
              </table>
            </div>

            <!-- Card View -->
            <div *ngIf="viewMode === 'card'" class="card-grid view-container p-24">
              <mat-card *ngFor="let element of branches" class="branch-card cardWithShadow cursor-pointer" (click)="viewDetails(element)">
                <mat-card-content class="p-16">
                  <div class="d-flex align-items-center m-b-16">
                    <div class="m-r-12 bg-light-primary rounded d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                      <i-tabler name="building" class="icon-24 text-primary"></i-tabler>
                    </div>
                    <div>
                      <h6 class="mat-subtitle-1 f-w-600 m-b-0">{{ element.name }}</h6>
                      <span class="status-badge mt-1 d-inline-block" [ngClass]="element.status?.toLowerCase()">{{ element.status | titlecase }}</span>
                    </div>
                    <div class="m-l-auto">
                      <button mat-icon-button [matMenuTriggerFor]="cardMenu" class="text-muted" (click)="$event.stopPropagation()">
                        <i-tabler name="dots-vertical" class="icon-18"></i-tabler>
                      </button>
                      <mat-menu #cardMenu="matMenu" class="cardWithShadow">
                        <button mat-menu-item (click)="viewDetails(element)">
                          <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                          <span>View details</span>
                        </button>
                        <button mat-menu-item (click)="editBranch(element)">
                          <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                          <span>Edit branch</span>
                        </button>
                        <button mat-menu-item *ngIf="element.status?.toUpperCase() === 'INACTIVE'" (click)="toggleStatus(element)">
                          <i-tabler name="check" class="icon-16 m-r-8 text-success"></i-tabler>
                          <span>Activate</span>
                        </button>
                        <button mat-menu-item *ngIf="element.status?.toUpperCase() === 'ACTIVE'" (click)="toggleStatus(element)">
                          <i-tabler name="ban" class="icon-16 m-r-8 text-warning"></i-tabler>
                          <span>Deactivate</span>
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item class="text-danger" (click)="deleteBranch(element)">
                          <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                          <span>Delete</span>
                        </button>
                      </mat-menu>
                    </div>
                  </div>

                  <div class="d-flex align-items-center m-b-12">
                    <span class="f-s-13 text-muted d-flex align-items-center">
                      <i-tabler name="map-pin" class="icon-16 m-r-4"></i-tabler> {{ element.location }}
                    </span>
                  </div>

                  <div class="d-flex align-items-center m-b-16">
                    <img [src]="getManagerAvatar(element.manager?.id)" class="rounded-circle m-r-8 object-cover avatar-img" width="32" height="32" />
                    <div>
                      <span class="f-s-13 text-dark f-w-500 d-block">{{ element.manager?.name }} <span class="badge-role">Manager</span></span>
                      <span class="f-s-12 text-muted">{{ element.manager?.email }}</span>
                    </div>
                  </div>

                  <mat-divider class="m-b-12"></mat-divider>
                  <div class="d-flex align-items-center justify-content-between text-muted f-s-12">
                    <span class="d-flex align-items-center"><i-tabler name="users" class="icon-14 m-r-4"></i-tabler> {{ element.userCounts?.totalStaffs }} Staff</span>
                    <span class="d-flex align-items-center"><i-tabler name="school" class="icon-14 m-r-4"></i-tabler> {{ element.userCounts?.totalStudents }} Students</span>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </ng-container>

          <mat-paginator
            [length]="totalElements"
            [pageSizeOptions]="[5, 10, 15]"
            [pageSize]="pageSize"
            (page)="onPageChange($event)"
            showFirstLastButtons
            class="p-y-12">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Mobile FAB -->
    <button mat-fab color="primary" class="branch-mobile-fab" (click)="addBranch()" aria-label="Add Branch">
      <i-tabler name="plus" class="icon-24"></i-tabler>
    </button>
  `,
  styles: [`
    .table-container { padding: 24px; @media (max-width: 768px) { padding: 12px 8px; } }
    mat-card-header { @media (max-width: 576px) { flex-direction: column !important; align-items: flex-start !important; gap: 16px; } }
    .header-actions {
      @media (max-width: 576px) { width: 100%; justify-content: space-between; }
      button.desktop-add-btn { white-space: nowrap; flex-shrink: 0; @media (max-width: 576px) { display: none !important; } }
      button { white-space: nowrap; flex-shrink: 0; }
    }
    .branch-mobile-fab {
      position: fixed; bottom: 84px; right: 24px; z-index: 1000;
      display: none !important;
      @media (max-width: 576px) { display: flex !important; align-items: center; justify-content: center; }
    }
    .table-responsive { width: 100%; overflow-x: auto; }
    table { min-width: 700px; }
    .element-row { transition: background-color 0.2s ease; &:hover { background-color: #f8fafc; } }
    .location-cell {
      display: block; max-width: 280px; white-space: normal; line-height: 1.4; word-break: break-word;
      @media (max-width: 768px) {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
    }
    .avatar-img { object-fit: cover; flex-shrink: 0; }

    .view-container { animation: fadeIn 0.4s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; @media (max-width: 576px) { grid-template-columns: 1fr; padding: 16px !important; } }
    .branch-card { transition: transform 0.2s ease, box-shadow 0.2s ease; &:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; } }
    .view-mode-toggle { background-color: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; overflow: hidden;
      .toggle-btn { width: 42px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; color: #64748b; background: transparent; border: none; cursor: pointer; transition: all 0.2s ease;
        &.active { background-color: #615dff; color: #ffffff; }
        &:hover:not(.active) { background-color: #f1f5f9; }
      }
    }

    .badge-role { background: rgba(97,93,255,0.12); color: #615dff; border-radius: 4px; padding: 1px 6px; font-size: 11px; font-weight: 600; margin-left: 4px; }

    .status-badge {
      display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; text-transform: capitalize;
      &.active { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
      &.setup { background-color: rgba(255, 174, 31, 0.1); color: #ffae1f; }
      &.inactive { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    }

    .search-box {
      position: relative; display: flex; align-items: center; background-color: #f1f5f9; border-radius: 8px; padding: 0 12px; border: 1px solid #e2e8f0; width: 240px; height: 38px; transition: all 0.2s ease-in-out;
      @media (max-width: 576px) { width: calc(100% - 140px); }
      &:focus-within { background-color: #ffffff; border-color: #615dff; box-shadow: 0 0 0 3px rgba(97, 93, 255, 0.1); }
      .search-icon { color: #64748b; margin-right: 8px; }
      .search-input { border: none; background: transparent; outline: none; width: 100%; font-size: 13px; color: #1e293b; &::placeholder { color: #94a3b8; } }
    }

    .gap-12 { gap: 12px; } .m-r-12 { margin-right: 12px; } .m-r-8 { margin-right: 8px; } .m-r-4 { margin-right: 4px; } .p-0 { padding: 0 !important; } .object-cover { object-fit: cover; }
    .cursor-pointer { cursor: pointer; }
    .text-success { color: #13deb9 !important; } .text-warning { color: #ffae1f !important; }

    :host-context(.dark-theme) {
      .element-row:hover { background-color: var(--dark-hoverbgcolor); }
      .search-box { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .search-input { color: #f8fafc; } }
      .view-mode-toggle { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .toggle-btn { color: #94a3b8; &.active { background-color: #615dff; color: #ffffff; } &:hover:not(.active) { background-color: var(--dark-hoverbgcolor); } } }
      .status-badge {
        &.active { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
        &.setup { background-color: rgba(255, 174, 31, 0.2); color: #ffe082; }
        &.inactive { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      }
    }
  `]
})
export class BranchesComponent implements OnInit {
  viewMode: 'table' | 'card' = 'table';
  displayedColumns: string[] = ['name', 'location', 'manager', 'employees', 'students', 'status', 'actions'];

  branches: Branch[] = [];
  dataSource = new MatTableDataSource<Branch>([]);

  isLoading = false;
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  getManagerAvatar(managerId?: number): string {
    if (!managerId) return '/assets/images/profile/user-1.jpg';
    return `/assets/images/profile/user-${(managerId % 4) + 1}.jpg`;
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadBranches(): void {
    this.isLoading = true;
    const url = `${environment.apiUrl}/branches?page=${this.currentPage}&size=${this.pageSize}&includeInactive=true`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.branches = res.data;
          this.dataSource.data = this.branches;
          // If the API returns pagination metadata use it; otherwise fall back to array length
          this.totalElements = res.totalElements ?? res.data.length;
        } else {
          this.branches = [];
          this.dataSource.data = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load branches', err);
        this.notificationService.showErrorToast('Failed to load branches. Please try again.', 'Error');
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBranches();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addBranch(): void {
    const dialogRef = this.dialog.open(AddBranchDialogComponent, {
      width: '560px',
      panelClass: 'add-branch-dialog',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadBranches();
    });
  }

  viewDetails(branch: Branch): void {
    this.dialog.open(BranchDetailsDialogComponent, {
      data: branch,
      width: '520px',
      panelClass: 'branch-details-dialog'
    });
  }

  editBranch(branch: Branch): void {
    const dialogRef = this.dialog.open(AddBranchDialogComponent, {
      width: '560px',
      panelClass: 'add-branch-dialog',
      disableClose: true,
      data: branch
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadBranches();
    });
  }

  toggleStatus(branch: Branch): void {
    const currentStatus = (branch.status || 'ACTIVE').toUpperCase();
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

    this.http.put<any>(
      `${environment.apiUrl}/branches/${branch.id}/status`,
      { status: newStatus },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.notificationService.showSuccessToast(
          `Branch "${branch.name}" ${actionText}d successfully.`,
          'Status Updated'
        );
        this.loadBranches();
      },
      error: () => this.notificationService.showErrorToast(`Failed to ${actionText} branch.`, 'Error')
    });
  }

  deleteBranch(branch: Branch): void {
    this.notificationService.showErrorPopup(
      `Are you sure you want to permanently delete the branch "${branch.name}"? This action cannot be undone.`,
      'Delete Branch',
      'Delete'
    ).subscribe((confirmed) => {
      if (!confirmed) return;

      this.http.delete<any>(
        `${environment.apiUrl}/branches/${branch.id}`,
        { headers: this.getHeaders() }
      ).subscribe({
        next: () => {
          this.notificationService.showSuccessToast(`Branch "${branch.name}" deleted successfully.`, 'Deleted');
          this.loadBranches();
        },
        error: () => this.notificationService.showErrorToast(`Failed to delete branch "${branch.name}".`, 'Error')
      });
    });
  }
}
