import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../core/services/notification.service';
import { ReferralService } from '../../../core/services/referral.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { AddReferralDialogComponent } from './add-referral-dialog/add-referral-dialog.component';
import { ReferralDetailDialogComponent } from './referral-detail-dialog/referral-detail-dialog.component';

@Component({
  selector: 'app-referrals',
  template: `
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">Referrals Directory</h5>
          </mat-card-title>
          
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applySearchFilter($event)" placeholder="Search referrals..." class="search-input" />
            </div>

            <!-- Inline Filters (Desktop) -->
            <div class="branch-filter-inline desktop-only">
              <button class="filter-trigger-btn d-flex align-items-center" [class.filter-active]="selectedBranchId !== null" [matMenuTriggerFor]="branchFilterMenu">
                <i-tabler name="filter" class="icon-16 m-r-6"></i-tabler>
                <span class="f-s-13">{{ selectedBranchId !== null ? getSelectedBranchName() : 'Branch' }}</span>
                <i-tabler name="chevron-down" class="icon-14 m-l-4"></i-tabler>
              </button>
            </div>
            
            <div class="type-filter-inline desktop-only">
              <button class="filter-trigger-btn d-flex align-items-center" [class.filter-active]="selectedType !== null" [matMenuTriggerFor]="typeFilterMenu">
                <i-tabler name="filter" class="icon-16 m-r-6"></i-tabler>
                <span class="f-s-13">{{ selectedType !== null ? formatType(selectedType) : 'Type' }}</span>
                <i-tabler name="chevron-down" class="icon-14 m-l-4"></i-tabler>
              </button>
            </div>

            <button *ngIf="selectedBranchId !== null || selectedType !== null" mat-icon-button class="clear-filter-icon-btn desktop-only" matTooltip="Clear filters" (click)="clearFilters()">
              <i-tabler name="x" class="icon-16"></i-tabler>
            </button>

            <div class="view-mode-toggle d-flex align-items-center">
              <button (click)="viewMode = 'table'" class="toggle-btn" [class.active]="viewMode === 'table'" style="border: none; border-radius: 6px;">
                <i-tabler name="list" class="icon-18"></i-tabler>
              </button>
              <button (click)="viewMode = 'card'" class="toggle-btn" [class.active]="viewMode === 'card'" style="border: none; border-radius: 6px;">
                <i-tabler name="layout-grid" class="icon-18"></i-tabler>
              </button>
            </div>
            
            <button mat-flat-button color="primary" class="d-flex align-items-center desktop-add-btn" (click)="addReferral()">
              <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler>
              Add Referral
            </button>
          </div>
        </mat-card-header>

        <!-- Mobile Filter Strip -->
        <div class="mobile-filter-strip d-flex align-items-center gap-12 p-x-16 p-y-10 mobile-only w-100 overflow-auto">
          <button class="filter-trigger-btn d-flex align-items-center flex-shrink-0" [class.filter-active]="selectedBranchId !== null" [matMenuTriggerFor]="branchFilterMenu">
            <i-tabler name="filter" class="icon-16 m-r-6"></i-tabler>
            <span class="f-s-13">{{ selectedBranchId !== null ? getSelectedBranchName() : 'Branch' }}</span>
            <i-tabler name="chevron-down" class="icon-14 m-l-4"></i-tabler>
          </button>
          
          <button class="filter-trigger-btn d-flex align-items-center flex-shrink-0" [class.filter-active]="selectedType !== null" [matMenuTriggerFor]="typeFilterMenu">
            <i-tabler name="filter" class="icon-16 m-r-6"></i-tabler>
            <span class="f-s-13">{{ selectedType !== null ? formatType(selectedType) : 'Type' }}</span>
            <i-tabler name="chevron-down" class="icon-14 m-l-4"></i-tabler>
          </button>

          <button *ngIf="selectedBranchId !== null || selectedType !== null" mat-icon-button class="clear-filter-icon-btn flex-shrink-0" (click)="clearFilters()">
            <i-tabler name="x" class="icon-16"></i-tabler>
          </button>
        </div>

        <!-- Menus -->
        <mat-menu #branchFilterMenu="matMenu" class="branch-filter-menu cardWithShadow">
          <button mat-menu-item (click)="setBranchFilter(null)" [class.menu-item-active]="selectedBranchId === null">All Branches</button>
          <mat-divider></mat-divider>
          <button mat-menu-item *ngFor="let branch of branches" (click)="setBranchFilter(branch.id)" [class.menu-item-active]="selectedBranchId === branch.id">{{ branch.name }}</button>
        </mat-menu>
        
        <mat-menu #typeFilterMenu="matMenu" class="branch-filter-menu cardWithShadow">
          <button mat-menu-item (click)="setTypeFilter(null)" [class.menu-item-active]="selectedType === null">All Types</button>
          <mat-divider></mat-divider>
          <button mat-menu-item *ngFor="let type of referralTypes" (click)="setTypeFilter(type)" [class.menu-item-active]="selectedType === type">{{ formatType(type) }}</button>
        </mat-menu>
        
        <mat-card-content class="p-0">
          <div *ngIf="isLoading" class="d-flex align-items-center justify-content-center p-y-40">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <ng-container *ngIf="!isLoading">
            <!-- Table View -->
            <div *ngIf="viewMode === 'table'" class="table-responsive view-container">
              <table mat-table [dataSource]="dataSource" class="w-100">
                
                <ng-container matColumnDef="referralName">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Referral Name</th>
                  <td mat-cell *matCellDef="let element">
                    <div class="d-flex align-items-center">
                      <img [src]="getAvatar(element)" class="rounded-circle m-r-12 object-cover avatar-animated" width="40" height="40" />
                      <span class="f-w-600 d-block text-dark f-s-14">{{ element.referralName }}</span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Type</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="d-block f-w-500 text-dark f-s-13">{{ formatType(element.referralType) }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="branch">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Branch</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="d-block f-w-500 text-dark f-s-13">{{ element.branchName || '—' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Status</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="status-badge" [ngClass]="(element.status || '').toLowerCase()">
                      {{ element.status | titlecase }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="leads">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Leads</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="d-block f-w-500 text-dark f-s-13">{{ element.userCounts?.leadsCount || 0 }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="registered">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Registered</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="d-block f-w-500 text-dark f-s-13">{{ element.userCounts?.registeredCount || 0 }}</span>
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
                      <button mat-menu-item (click)="editReferral(element)">
                        <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                        <span>Edit referral</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'ACTIVE'" class="text-danger" (click)="toggleStatus(element)">
                        <i-tabler name="ban" class="icon-16 m-r-8 text-danger"></i-tabler>
                        <span>Deactivate</span>
                      </button>
                      <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() !== 'ACTIVE'" (click)="toggleStatus(element)">
                        <i-tabler name="check" class="icon-16 m-r-8 text-success"></i-tabler>
                        <span>Activate</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item class="text-danger" (click)="deleteReferral(element)">
                        <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="element-row cursor-pointer" (click)="viewDetails(row)"></tr>
              </table>

              <!-- Empty state -->
              <div *ngIf="referrals.length === 0" class="empty-state d-flex flex-column align-items-center justify-content-center p-y-48">
                <i-tabler name="user-off" class="icon-48 text-muted m-b-12"></i-tabler>
                <h6 class="mat-subtitle-1 text-muted m-b-4">No referrals found</h6>
                <p class="f-s-13 text-muted">Try adjusting your filters or add a new referral.</p>
              </div>
            </div>

            <!-- Card View -->
            <div *ngIf="viewMode === 'card'" class="card-grid view-container p-24">
              <mat-card *ngFor="let element of referrals" class="referral-card cardWithShadow cursor-pointer" (click)="viewDetails(element)">
                <mat-card-content class="p-16">
                  <div class="d-flex align-items-center m-b-16">
                    <img [src]="getAvatar(element)" class="rounded-circle m-r-12 object-cover avatar-animated" width="48" height="48" />
                    <div>
                      <h6 class="mat-subtitle-1 f-w-600 m-b-0">{{ element.referralName }}</h6>
                      <span class="status-badge mt-1 d-inline-block" [ngClass]="(element.status || '').toLowerCase()">{{ element.status | titlecase }}</span>
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
                        <button mat-menu-item (click)="editReferral(element)">
                          <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                          <span>Edit referral</span>
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'ACTIVE'" class="text-danger" (click)="toggleStatus(element)">
                          <i-tabler name="ban" class="icon-16 m-r-8 text-danger"></i-tabler>
                          <span>Deactivate</span>
                        </button>
                        <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() !== 'ACTIVE'" (click)="toggleStatus(element)">
                          <i-tabler name="check" class="icon-16 m-r-8 text-success"></i-tabler>
                          <span>Activate</span>
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item class="text-danger" (click)="deleteReferral(element)">
                          <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                          <span>Delete</span>
                        </button>
                      </mat-menu>
                    </div>
                  </div>
                  
                  <div class="d-flex align-items-center justify-content-between m-b-12">
                    <span class="f-s-13 text-muted d-flex align-items-center"><i-tabler name="badge" class="icon-16 m-r-4"></i-tabler> {{ formatType(element.referralType) }}</span>
                    <span class="f-s-13 text-muted d-flex align-items-center"><i-tabler name="building" class="icon-16 m-r-4"></i-tabler> {{ element.branchName || '—' }}</span>
                  </div>
                  
                  <div class="d-flex align-items-center justify-content-between m-b-16">
                    <span class="f-s-13 text-muted">Leads: <span class="text-dark f-w-500">{{ element.userCounts?.leadsCount || 0 }}</span></span>
                    <span class="f-s-13 text-muted">Registered: <span class="text-dark f-w-500">{{ element.userCounts?.registeredCount || 0 }}</span></span>
                  </div>
                </mat-card-content>
              </mat-card>

              <div *ngIf="referrals.length === 0" class="empty-state d-flex flex-column align-items-center justify-content-center p-y-48" style="grid-column: 1/-1">
                <i-tabler name="user-off" class="icon-48 text-muted m-b-12"></i-tabler>
                <h6 class="mat-subtitle-1 text-muted m-b-4">No referrals found</h6>
                <p class="f-s-13 text-muted">Try adjusting your filters or add a new referral.</p>
              </div>
            </div>
          </ng-container>

          <mat-paginator
            [length]="totalElements"
            [pageSizeOptions]="[5, 10, 15, 25]"
            [pageSize]="pageSize"
            (page)="onPageChange($event)"
            showFirstLastButtons 
            class="p-y-12">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Mobile FAB -->
    <button mat-fab color="primary" class="referral-mobile-fab" (click)="addReferral()" aria-label="Add Referral">
      <i-tabler name="plus" class="icon-24"></i-tabler>
    </button>
  `,
  styles: [`
    .table-container { padding: 24px; @media (max-width: 768px) { padding: 12px 8px; } }
    mat-card-header { @media (max-width: 576px) { flex-direction: column !important; align-items: flex-start !important; gap: 16px; } }
    .header-actions { @media (max-width: 576px) { gap: 8px !important; } button.desktop-add-btn { white-space: nowrap; flex-shrink: 0; @media (max-width: 576px) { display: none !important; } } }
    .desktop-only { display: block; @media (max-width: 576px) { display: none !important; } }
    .mobile-only { display: none !important; @media (max-width: 576px) { display: flex !important; } }
    .table-responsive { width: 100%; overflow-x: auto; }
    table { min-width: 1050px; }
    .element-row { transition: background-color 0.2s ease; &:hover { background-color: #f8fafc; } }

    .view-container { animation: fadeIn 0.4s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; @media (max-width: 576px) { grid-template-columns: 1fr; padding: 16px !important; } }
    .referral-card { transition: transform 0.2s ease, box-shadow 0.2s ease; &:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; } }
    
    .view-mode-toggle { background-color: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; overflow: hidden; .toggle-btn { width: 42px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; color: #64748b; background: transparent; border: none; cursor: pointer; transition: all 0.2s ease; &.active { background-color: #615dff; color: #ffffff; } &:hover:not(.active) { background-color: #f1f5f9; } } }

    .search-box { position: relative; display: flex; align-items: center; background-color: #f1f5f9; border-radius: 8px; padding: 0 12px; border: 1px solid #e2e8f0; height: 38px; transition: all 0.2s ease-in-out; &:focus-within { background-color: #ffffff; border-color: #615dff; box-shadow: 0 0 0 3px rgba(97, 93, 255, 0.1); } .search-icon { color: #64748b; margin-right: 8px; flex-shrink: 0; } .search-input { border: none; background: transparent; outline: none; width: 100%; font-size: 13px; color: #1e293b; &::placeholder { color: #94a3b8; } } }
    
    .filter-trigger-btn { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; color: #475569; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; &:hover { background: #f8fafc; } &.filter-active { background: rgba(97,93,255,0.1); border-color: #615dff; color: #615dff; } }
    .mobile-filter-strip { background: #f8fafc; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
    .menu-item-active { color: #615dff !important; font-weight: 600; background: rgba(97,93,255,0.05); }
    .clear-filter-icon-btn { width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; color: #94a3b8; &:hover { color: #fa896b; background: rgba(250, 137, 107, 0.1); } }

    .avatar-animated { transition: transform 0.3s ease; }
    .element-row:hover .avatar-animated, .referral-card:hover .avatar-animated { transform: scale(1.1) rotate(5deg); animation: gentle-bounce 1s infinite alternate ease-in-out; }
    @keyframes gentle-bounce { 0% { transform: scale(1.1) rotate(3deg) translateY(0); } 100% { transform: scale(1.1) rotate(7deg) translateY(-3px); } }

    .status-badge {
      display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; text-transform: capitalize;
      &.active { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
      &.inactive { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    }

    .gap-12 { gap: 12px; } .m-r-12 { margin-right: 12px; } .m-r-8 { margin-right: 8px; } .m-r-6 { margin-right: 6px; } .m-r-4 { margin-right: 4px; } .m-l-4 { margin-left: 4px; } .m-l-auto { margin-left: auto; } .m-b-16 { margin-bottom: 16px; } .m-b-0 { margin-bottom: 0; } .p-0 { padding: 0 !important; } .p-x-16 { padding-left: 16px; padding-right: 16px; } .p-y-10 { padding-top: 10px; padding-bottom: 10px; }

    /* Mobile FAB */
    .referral-mobile-fab {
      position: fixed; bottom: 84px; right: 24px; z-index: 1000; display: none !important;
      @media (max-width: 576px) { display: flex !important; align-items: center; justify-content: center; }
    }

    :host-context(.dark-theme) {
      .element-row:hover { background-color: var(--dark-hoverbgcolor); }
      .search-box { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .search-input { color: #f8fafc; } }
      .filter-trigger-btn { background: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); color: #94a3b8; &:hover { background: var(--dark-hoverbgcolor); } &.filter-active { background: rgba(97,93,255,0.2); border-color: #615dff; color: #a5a1ff; } }
      .mobile-filter-strip { background: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); }
      .view-mode-toggle { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .toggle-btn { color: #94a3b8; &.active { background-color: #615dff; color: #ffffff; } &:hover:not(.active) { background-color: var(--dark-hoverbgcolor); } } }
      .status-badge {
        &.active { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
        &.inactive { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      }
    }
  `]
})
export class ReferralsComponent implements OnInit, AfterViewInit {
  viewMode: 'table' | 'card' = 'table';
  displayedColumns: string[] = ['referralName', 'type', 'branch', 'status', 'leads', 'registered', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  referrals: any[] = [];
  branches: any[] = [];
  referralTypes: string[] = [];
  
  selectedBranchId: number | null = null;
  selectedType: string | null = null;
  
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private notificationService: NotificationService,
    private referralService: ReferralService,
    private masterDataService: MasterDataService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadMasterData();
    this.loadReferrals();
  }

  ngAfterViewInit(): void {}

  loadMasterData(): void {
    this.masterDataService.getBranches(true).subscribe({
      next: (res) => { if (res?.data) this.branches = res.data; }
    });
    this.referralService.getReferralTypes().subscribe({
      next: (types) => { this.referralTypes = types || []; }
    });
  }

  getAvatar(referral: any): string {
    if (referral.avatar) return referral.avatar;
    const id = referral.id || Math.floor(Math.random() * 4) + 1;
    const avatarIndex = (id % 4) + 1;
    return `/assets/images/profile/user-${avatarIndex}.jpg`;
  }

  loadReferrals(): void {
    this.isLoading = true;
    this.referralService.getReferrals(this.currentPage, this.pageSize, this.selectedType, this.selectedBranchId).subscribe({
      next: (res) => {
        const rawList = res?.content ?? res?.data?.content ?? res?.data ?? res ?? [];
        this.referrals = Array.isArray(rawList) ? rawList.map(r => this.mapReferral(r)) : [];
        this.dataSource.data = this.referrals;
        this.totalElements = res?.totalElements ?? res?.data?.totalElements ?? this.referrals.length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load referrals', err);
        this.notificationService.showErrorToast('Failed to load referrals.', 'Error');
        this.isLoading = false;
      }
    });
  }

  mapReferral(r: any): any {
    const name = r.name || r.firstName ? `${r.firstName || ''} ${r.lastName || ''}`.trim() : 'Unknown';
    return {
      ...r,
      referralName: name,
      branchName: r.branch?.name || null,
      branchId: r.branch?.id || null
    };
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadReferrals();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadReferrals();
  }

  setBranchFilter(branchId: number | null): void {
    this.selectedBranchId = branchId;
    this.onFilterChange();
  }

  setTypeFilter(type: string | null): void {
    this.selectedType = type;
    this.onFilterChange();
  }

  clearFilters(): void {
    this.selectedBranchId = null;
    this.selectedType = null;
    this.onFilterChange();
  }

  getSelectedBranchName(): string {
    const branch = this.branches.find(b => b.id === this.selectedBranchId);
    return branch ? branch.name : 'Branch';
  }

  applySearchFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  formatType(type: string): string {
    if (!type) return '—';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  addReferral(): void {
    const dialogRef = this.dialog.open(AddReferralDialogComponent, {
      panelClass: 'dialog-container-custom'
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadReferrals();
    });
  }

  viewDetails(referral: any): void {
    const dialogRef = this.dialog.open(ReferralDetailDialogComponent, {
      data: { referral },
      panelClass: 'dialog-container-custom'
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res === 'edit') this.editReferral(referral);
      else if (res === 'toggle') this.toggleStatus(referral);
    });
  }

  editReferral(referral: any): void {
    const dialogRef = this.dialog.open(AddReferralDialogComponent, {
      data: referral,
      panelClass: 'dialog-container-custom'
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadReferrals();
    });
  }

  toggleStatus(referral: any): void {
    if (!referral.id) return;
    const currentStatus = (referral.status || 'ACTIVE').toUpperCase();
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

    this.referralService.toggleStatus(referral.id, newStatus).subscribe({
      next: () => {
        this.notificationService.showSuccessToast(`Referral ${actionText}d successfully.`, 'Status Updated');
        this.loadReferrals();
      },
      error: (err) => {
        console.error('Failed to update status', err);
        this.notificationService.showErrorToast(`Failed to ${actionText} referral.`, 'Error');
      }
    });
  }

  deleteReferral(referral: any): void {
    if (!referral.id) return;
    this.notificationService.showErrorPopup(
      `Are you sure you want to delete "${referral.referralName}"?`,
      'Delete Referral',
      'Delete'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.referralService.deleteReferral(referral.id).subscribe({
          next: () => {
            this.notificationService.showSuccessToast('Referral deleted successfully.', 'Deleted');
            this.loadReferrals();
          },
          error: (err) => {
            console.error('Failed to delete referral', err);
            this.notificationService.showErrorToast('Failed to delete referral.', 'Error');
          }
        });
      }
    });
  }
}
