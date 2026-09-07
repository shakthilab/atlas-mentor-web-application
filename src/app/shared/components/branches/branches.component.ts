import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../core/services/notification.service';
import { HierarchyService } from '../../../core/services/hierarchy.service';
import { extractListData } from '../../../core/utils/api-response.util';
import { BranchDetailsDialogComponent } from './branch-details-dialog/branch-details-dialog.component';
import { AddBranchDialogComponent } from './add-branch-dialog/add-branch-dialog.component';
import { TableColumn } from '../data-table/data-table.models';
import { createSearchPredicate, encodeSearch } from '../data-table/table-filter.util';
import { TranslateService } from '@ngx-translate/core';

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
  manager?: BranchManager | null;
  status?: string | null;
  userCounts?: BranchUserCounts | null;
  createdAt?: string | null;
}

@Component({
  selector: 'app-branches',
  template: `
    <div class="page-head">
      <div>
        <div class="eyebrow">Organization</div>
        <h1 class="page-title">Branches Directory</h1>
        <p class="page-sub">Manage and monitor all organizational branches.</p>
      </div>
    </div>
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">{{ 'branches.title' | translate }}</h5>
          </mat-card-title>
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" [placeholder]="'branches.searchPlaceholder' | translate" class="search-input" />
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
              {{ 'branches.addBranch' | translate }}
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
            <div *ngIf="viewMode === 'table'" class="view-container">
              <app-data-table
                [columns]="tableColumns"
                [mobileColumns]="['location', 'manager', 'employees', 'students', 'status']"
                [rows]="dataSource.filteredData"
                trackByKey="id"
                [clickableRows]="true"
                exportFileName="branches"
                noFilterResultsMessage="No branches on this page match the current filters."
                (rowClick)="viewDetails($event)"
              >
                <ng-template appCellDef="name" let-element="row">
                  <div class="d-flex align-items-center">
                    <div class="bg-light-primary rounded d-flex align-items-center justify-content-center m-r-12 flex-shrink-0" style="width: 40px; height: 40px;">
                      <i-tabler name="building" class="icon-20 text-primary"></i-tabler>
                    </div>
                    <span class="f-w-600 d-block text-dark f-s-14 text-truncate">{{ element.name }}</span>
                  </div>
                </ng-template>

                <ng-template appRowActions let-element="row">
                  <button mat-icon-button [matMenuTriggerFor]="menu" class="text-muted" (click)="$event.stopPropagation()">
                    <i-tabler name="dots" class="icon-18"></i-tabler>
                  </button>
                  <mat-menu #menu="matMenu" class="cardWithShadow">
                    <button mat-menu-item (click)="viewDetails(element)">
                      <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                      <span>{{ 'leads.viewDetails' | translate }}</span>
                    </button>
                    <button mat-menu-item (click)="editBranch(element)">
                      <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                      <span>{{ 'branches.editBranch' | translate }}</span>
                    </button>
                    <button mat-menu-item *ngIf="element.status?.toUpperCase() === 'INACTIVE'" (click)="toggleStatus(element)">
                      <i-tabler name="check" class="icon-16 m-r-8 text-success"></i-tabler>
                      <span>{{ 'common.activate' | translate }}</span>
                    </button>
                    <button mat-menu-item *ngIf="element.status?.toUpperCase() === 'ACTIVE'" (click)="toggleStatus(element)">
                      <i-tabler name="ban" class="icon-16 m-r-8 text-warning"></i-tabler>
                      <span>{{ 'common.deactivate' | translate }}</span>
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item class="text-danger" (click)="deleteBranch(element)">
                      <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                      <span>{{ 'common.delete' | translate }}</span>
                    </button>
                  </mat-menu>
                </ng-template>
              </app-data-table>
            </div>

            <!-- Card View -->
            <div *ngIf="viewMode === 'card'" class="card-grid view-container p-24">
              <mat-card *ngFor="let element of branches" class="branch-card cardWithShadow cursor-pointer" (click)="viewDetails(element)">
                <mat-card-content class="p-16">
                  <div class="d-flex align-items-center m-b-16">
                    <div class="m-r-12 bg-light-primary rounded d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px;">
                      <i-tabler name="building" class="icon-24 text-primary"></i-tabler>
                    </div>
                    <div class="min-w-0 flex-grow-1">
                      <h6 class="mat-subtitle-1 f-w-600 m-b-0 text-truncate">{{ element.name }}</h6>
                      <span class="status-badge mt-1 d-inline-block" [ngClass]="(element.status || '').toLowerCase()">{{ ((element.status || '').toUpperCase() === 'ACTIVE' ? 'common.active' : 'common.inactive') | translate }}</span>
                    </div>
                    <div class="m-l-auto flex-shrink-0">
                      <button mat-icon-button [matMenuTriggerFor]="cardMenu" class="text-muted" (click)="$event.stopPropagation()">
                        <i-tabler name="dots-vertical" class="icon-18"></i-tabler>
                      </button>
                      <mat-menu #cardMenu="matMenu" class="cardWithShadow">
                        <button mat-menu-item (click)="viewDetails(element)">
                          <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                          <span>{{ 'leads.viewDetails' | translate }}</span>
                        </button>
                        <button mat-menu-item (click)="editBranch(element)">
                          <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                          <span>{{ 'branches.editBranch' | translate }}</span>
                        </button>
                        <button mat-menu-item *ngIf="element.status?.toUpperCase() === 'INACTIVE'" (click)="toggleStatus(element)">
                          <i-tabler name="check" class="icon-16 m-r-8 text-success"></i-tabler>
                          <span>{{ 'common.activate' | translate }}</span>
                        </button>
                        <button mat-menu-item *ngIf="element.status?.toUpperCase() === 'ACTIVE'" (click)="toggleStatus(element)">
                          <i-tabler name="ban" class="icon-16 m-r-8 text-warning"></i-tabler>
                          <span>{{ 'common.deactivate' | translate }}</span>
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item class="text-danger" (click)="deleteBranch(element)">
                          <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                          <span>{{ 'common.delete' | translate }}</span>
                        </button>
                      </mat-menu>
                    </div>
                  </div>

                  <div class="d-flex align-items-center m-b-12">
                    <span class="f-s-13 text-muted d-flex align-items-center text-truncate">
                      <i-tabler name="map-pin" class="icon-16 m-r-4 flex-shrink-0"></i-tabler>
                      <span class="text-truncate">{{ element.location }}</span>
                    </span>
                  </div>

                  <div class="d-flex align-items-center m-b-16">
                    <img [src]="getManagerAvatar(element.manager?.id)" class="rounded-circle m-r-8 object-cover avatar-img" width="32" height="32" />
                    <div class="min-w-0 flex-grow-1">
                      <span class="f-s-13 text-dark f-w-500 d-block text-truncate">
                        {{ element.manager?.name || ('leads.notAvailable' | translate) }}
                        <span class="badge-role" *ngIf="element.manager?.name">{{ 'branches.managerBadge' | translate }}</span>
                      </span>
                      <span class="f-s-12 text-muted text-truncate d-block" *ngIf="element.manager?.email">{{ element.manager?.email }}</span>
                    </div>
                  </div>

                  <mat-divider class="m-b-12"></mat-divider>
                  <div class="d-flex align-items-center justify-content-between text-muted f-s-12">
                    <span class="d-flex align-items-center text-truncate me-2"><i-tabler name="users" class="icon-14 m-r-4 flex-shrink-0"></i-tabler> <span class="text-truncate">{{ 'branches.staffCount' | translate:{ count: element.userCounts?.totalStaffs } }}</span></span>
                    <span class="d-flex align-items-center flex-shrink-0 ms-auto"><i-tabler name="school" class="icon-14 m-r-4"></i-tabler> {{ 'branches.studentsCount' | translate:{ count: element.userCounts?.totalStudents } }}</span>
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
    <button mat-fab color="primary" class="branch-mobile-fab" (click)="addBranch()" [attr.aria-label]="'branches.addBranch' | translate" title="Add Branch">
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

    .branch-mobile-fab {
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

    .branch-card {
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

    .badge-role { background: rgba(var(--brand-primary-rgb),0.12); color: var(--brand-primary); border-radius: 4px; padding: 1px 6px; font-size: 11px; font-weight: 600; margin-left: 4px; }

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
      &.setup {
        background-color: rgba(255, 174, 31, 0.1);
        color: #ffae1f;
      }
      &.inactive {
        background-color: rgba(250, 137, 107, 0.1);
        color: #fa896b;
      }
    }

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
    .cursor-pointer { cursor: pointer; }
    .text-success { color: #13deb9 !important; }
    .text-warning { color: #ffae1f !important; }

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
        &.setup {
          background-color: rgba(255, 174, 31, 0.2);
          color: #ffe082;
        }
        &.inactive {
          background-color: rgba(250, 137, 107, 0.2);
          color: #ffab91;
        }
      }
      mat-card.cardWithShadow, .branch-card {
        background-color: var(--dark-cardbg, #1e293b);
        border-color: var(--dark-border, #334155);
      }
    }
  `]
})
export class BranchesComponent implements OnInit {
  viewMode: 'table' | 'card' = 'table';

  tableColumns: TableColumn<Branch>[] = [
    { key: 'name', header: 'Branch Name', type: 'custom', filter: { type: 'text', getValue: r => r.name } },
    { key: 'location', header: 'Location', type: 'text', valueFn: r => r.location, maxWidth: '220px', filter: { type: 'text' } },
    {
      key: 'manager', header: 'Manager', type: 'avatar',
      avatarFn: r => this.getManagerAvatar(r.manager?.id),
      valueFn: r => r.manager?.name || 'N/A',
      subFn: r => r.manager?.email || '',
      filter: { type: 'text', getValue: r => `${r.manager?.name || ''} ${r.manager?.email || ''}` },
    },
    {
      key: 'employees', header: 'Staff', type: 'text', valueFn: r => String(r.userCounts?.totalStaffs ?? 0), align: 'right', maxWidth: '70px',
      filter: { type: 'number-range', getValue: r => r.userCounts?.totalStaffs ?? 0 },
    },
    {
      key: 'students', header: 'Students', type: 'text', valueFn: r => String(r.userCounts?.totalStudents ?? 0), align: 'right', maxWidth: '80px',
      filter: { type: 'number-range', getValue: r => r.userCounts?.totalStudents ?? 0 },
    },
    {
      key: 'status', header: 'Status', type: 'pill',
      valueFn: r => this.titleCase(r.status),
      classFn: r => this.statusPillClass(r.status),
      filter: {
        type: 'select',
        options: [
          { value: 'ACTIVE', label: 'Active' },
          { value: 'SETUP', label: 'Setup' },
          { value: 'INACTIVE', label: 'Inactive' },
        ],
        getValue: r => (r.status || 'ACTIVE').toUpperCase(),
      },
    },
    { key: 'actions', header: 'Actions', type: 'actions', align: 'right' },
  ];

  private searchText = '';

  branches: Branch[] = [];
  dataSource = new MatTableDataSource<Branch>([]);

  isLoading = false;
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private hierarchyService: HierarchyService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.dataSource.filterPredicate = createSearchPredicate();
  }

  ngOnInit(): void {
    this.loadBranches();
  }

  getManagerAvatar(managerId?: number): string {
    if (!managerId) return '/assets/images/profile/user-1.jpg';
    return `/assets/images/profile/user-${(managerId % 4) + 1}.jpg`;
  }

  titleCase(value?: string | null): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  statusPillClass(status?: string | null): string {
    switch ((status || '').toLowerCase()) {
      case 'active': return 'pill--success';
      case 'setup': return 'pill--warning';
      case 'inactive': return 'pill--danger';
      default: return 'pill--neutral';
    }
  }

  loadBranches(): void {
    this.isLoading = true;

    this.hierarchyService.getBranchesPaginated(this.currentPage, this.pageSize, true).subscribe({
      next: (res) => {
        const branchesList = extractListData<Branch>(res);
        this.branches = branchesList;
        this.dataSource.data = this.branches;
        this.totalElements = res?.totalElements ?? res?.data?.totalElements ?? branchesList.length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load branches', err);
        this.notificationService.showErrorToast(this.translate.instant('branches.toast.loadFailed'), this.translate.instant('employees.toast.errorTitle'));
        this.isLoading = false;
        this.branches = [];
        this.dataSource.data = [];
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBranches();
  }

  applyFilter(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value;
    this.dataSource.filter = encodeSearch(this.searchText);
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

    this.hierarchyService.updateBranchStatus(branch.id, newStatus).subscribe({
      next: () => {
        this.notificationService.showSuccessToast(
          this.translate.instant(newStatus === 'ACTIVE' ? 'branches.toast.activated' : 'branches.toast.deactivated', { name: branch.name }),
          this.translate.instant('employees.toast.statusUpdated')
        );
        this.loadBranches();
      },
      error: () => this.notificationService.showErrorToast(
        this.translate.instant(newStatus === 'ACTIVE' ? 'employees.toast.activateFailed' : 'employees.toast.deactivateFailed'),
        this.translate.instant('employees.toast.errorTitle')
      )
    });
  }

  deleteBranch(branch: Branch): void {
    this.notificationService.showErrorPopup(
      this.translate.instant('branches.confirmDeleteMessage', { name: branch.name }),
      this.translate.instant('branches.confirmDeleteTitle'),
      this.translate.instant('common.delete')
    ).subscribe((confirmed) => {
      if (!confirmed) return;

      this.hierarchyService.deleteBranch(branch.id).subscribe({
        next: () => {
          this.notificationService.showSuccessToast(this.translate.instant('branches.toast.deleted', { name: branch.name }), this.translate.instant('leads.toast.deleted'));
          this.loadBranches();
        },
        error: () => this.notificationService.showErrorToast(this.translate.instant('branches.toast.deleteFailed', { name: branch.name }), this.translate.instant('employees.toast.errorTitle'))
      });
    });
  }
}
