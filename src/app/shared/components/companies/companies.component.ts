import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { CompanyService } from '../../../core/services/company.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { environment } from '../../../../environments/environment';
import { CompanyDetailDialogComponent } from './company-detail-dialog/company-detail-dialog.component';
import { AddCompanyDialogComponent } from './add-company-dialog/add-company-dialog.component';

export interface Company {
  id: number;
  companyName: string;
  logo: string;
  industry: string;
  location: string;
  website: string;
  status: string;
  branchName?: string | null;
  branchId?: number | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  mobileCountryCodeId?: number | null;
  totalStaffs?: number;
  totalStudents?: number;
  assignedTo?: any;
  firstName?: string | null;
  lastName?: string | null;
}

export interface BranchOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-companies',
  template: `
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">Companies Directory</h5>
          </mat-card-title>
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" placeholder="Search companies..." class="search-input" />
            </div>
            <!-- Branch Filter inline -->
            <div class="branch-filter-inline">
              <button class="filter-trigger-btn d-flex align-items-center" [class.filter-active]="selectedBranchId !== null" [matMenuTriggerFor]="branchFilterMenu">
                <i-tabler name="filter" class="icon-16 m-r-6"></i-tabler>
                <span class="f-s-13">{{ selectedBranchId !== null ? getSelectedBranchName() : 'Branch' }}</span>
                <i-tabler name="chevron-down" class="icon-14 m-l-4"></i-tabler>
              </button>
              <mat-menu #branchFilterMenu="matMenu" class="branch-filter-menu cardWithShadow">
                <button mat-menu-item (click)="setBranchFilter(null)" [class.menu-item-active]="selectedBranchId === null">
                  <i-tabler name="list" class="icon-16 m-r-8"></i-tabler>
                  All Branches
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item *ngFor="let branch of branches" (click)="setBranchFilter(branch.id)" [class.menu-item-active]="selectedBranchId === branch.id">
                  <i-tabler name="building" class="icon-16 m-r-8"></i-tabler>
                  {{ branch.name }}
                </button>
              </mat-menu>
            </div>
            <!-- Clear filter badge -->
            <button *ngIf="selectedBranchId !== null" mat-icon-button class="clear-filter-icon-btn" matTooltip="Clear branch filter" (click)="clearFilter()">
              <i-tabler name="x" class="icon-16"></i-tabler>
            </button>
            <div class="view-mode-toggle d-flex align-items-center">
              <button (click)="viewMode = 'table'" class="toggle-btn" [class.active]="viewMode === 'table'">
                <i-tabler name="list" class="icon-18"></i-tabler>
              </button>
              <button (click)="viewMode = 'card'" class="toggle-btn" [class.active]="viewMode === 'card'">
                <i-tabler name="layout-grid" class="icon-18"></i-tabler>
              </button>
            </div>
            <button mat-flat-button color="primary" class="d-flex align-items-center desktop-add-btn" (click)="addCompany()">
              <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler>
              Add Company
            </button>
          </div>
        </mat-card-header>

        <!-- Mobile-only filter strip (shown below search bar on small screens) -->
        <div class="mobile-filter-strip d-flex align-items-center gap-12 p-x-16 p-y-10">
          <div class="branch-filter-inline">
            <button class="filter-trigger-btn d-flex align-items-center" [class.filter-active]="selectedBranchId !== null" [matMenuTriggerFor]="mobileFilterMenu">
              <i-tabler name="filter" class="icon-16 m-r-6"></i-tabler>
              <span class="f-s-13">{{ selectedBranchId !== null ? getSelectedBranchName() : 'Branch' }}</span>
              <i-tabler name="chevron-down" class="icon-14 m-l-4"></i-tabler>
            </button>
            <mat-menu #mobileFilterMenu="matMenu" class="branch-filter-menu cardWithShadow">
              <button mat-menu-item (click)="setBranchFilter(null)" [class.menu-item-active]="selectedBranchId === null">
                <i-tabler name="list" class="icon-16 m-r-8"></i-tabler>
                All Branches
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item *ngFor="let branch of branches" (click)="setBranchFilter(branch.id)" [class.menu-item-active]="selectedBranchId === branch.id">
                <i-tabler name="building" class="icon-16 m-r-8"></i-tabler>
                {{ branch.name }}
              </button>
            </mat-menu>
          </div>
          <button *ngIf="selectedBranchId !== null" mat-icon-button class="clear-filter-icon-btn" matTooltip="Clear filter" (click)="clearFilter()">
            <i-tabler name="x" class="icon-16"></i-tabler>
          </button>
          <span *ngIf="selectedBranchId !== null" class="mobile-filter-chip f-s-12">
            {{ getSelectedBranchName() }}
          </span>
        </div>

        <mat-card-content class="p-0">
          <!-- Loading Spinner -->
          <div *ngIf="isLoading" class="d-flex align-items-center justify-content-center p-y-40">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <ng-container *ngIf="!isLoading">
            <!-- Table View -->
            <div *ngIf="viewMode === 'table'" class="table-responsive view-container">
              <table mat-table [dataSource]="dataSource" class="w-100">

                <ng-container matColumnDef="companyName">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Company Name</th>
                  <td mat-cell *matCellDef="let element">
                    <div class="d-flex align-items-center">
                      <div class="company-avatar m-r-12 d-flex align-items-center justify-content-center">
                        <i-tabler name="building-store" class="icon-20 text-primary"></i-tabler>
                      </div>
                      <span class="f-w-600 d-block text-dark f-s-14">{{ element.companyName }}</span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="industry">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Industry</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="d-block f-w-500 text-dark f-s-13">{{ element.industry || '—' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="location">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Location</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="d-block f-w-500 text-dark f-s-13 line-clamp-2-mobile">{{ element.location || '—' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="website">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Website</th>
                  <td mat-cell *matCellDef="let element">
                    <a *ngIf="element.website" [href]="'https://' + element.website" target="_blank" class="text-primary f-s-13" (click)="$event.stopPropagation()">{{ element.website }}</a>
                    <span *ngIf="!element.website" class="text-muted f-s-13">—</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="branch">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Branch</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="branch-badge f-s-12" *ngIf="element.branchName">{{ element.branchName }}</span>
                    <span class="text-muted f-s-13" *ngIf="!element.branchName">—</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Status</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="status-badge" [ngClass]="element.status.toLowerCase()">
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
                      <button mat-menu-item (click)="editCompany(element)">
                        <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                        <span>Edit company</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'ACTIVE'" class="text-danger" (click)="toggleStatus(element); $event.stopPropagation()">
                        <i-tabler name="ban" class="icon-16 m-r-8 text-danger"></i-tabler>
                        <span>Deactivate</span>
                      </button>
                      <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() !== 'ACTIVE'" (click)="toggleStatus(element); $event.stopPropagation()">
                        <i-tabler name="check" class="icon-16 m-r-8 text-success"></i-tabler>
                        <span>Activate</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item class="text-danger" (click)="deleteCompany(element); $event.stopPropagation()">
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
              <div *ngIf="companies.length === 0" class="empty-state d-flex flex-column align-items-center justify-content-center p-y-48">
                <i-tabler name="building-off" class="icon-48 text-muted m-b-12"></i-tabler>
                <h6 class="mat-subtitle-1 text-muted m-b-4">No companies found</h6>
                <p class="f-s-13 text-muted">{{ selectedBranchId !== null ? 'No companies match the selected branch filter.' : 'Get started by adding your first company.' }}</p>
              </div>
            </div>

            <!-- Card View -->
            <div *ngIf="viewMode === 'card'" class="card-grid view-container p-24">
              <mat-card *ngFor="let element of companies" class="company-card cardWithShadow cursor-pointer" (click)="viewDetails(element)">
                <mat-card-content class="p-16">
                  <div class="d-flex align-items-center m-b-16">
                    <div class="company-avatar m-r-12 d-flex align-items-center justify-content-center">
                      <i-tabler name="building-store" class="icon-24 text-primary"></i-tabler>
                    </div>
                    <div>
                      <h6 class="mat-subtitle-1 f-w-600 m-b-0">{{ element.companyName }}</h6>
                      <span class="status-badge mt-1 d-inline-block" [ngClass]="element.status.toLowerCase()">{{ element.status | titlecase }}</span>
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
                        <button mat-menu-item (click)="editCompany(element)">
                          <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                          <span>Edit company</span>
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() === 'ACTIVE'" class="text-danger" (click)="toggleStatus(element); $event.stopPropagation()">
                          <i-tabler name="ban" class="icon-16 m-r-8 text-danger"></i-tabler>
                          <span>Deactivate</span>
                        </button>
                        <button mat-menu-item *ngIf="(element.status || 'ACTIVE').toUpperCase() !== 'ACTIVE'" (click)="toggleStatus(element); $event.stopPropagation()">
                          <i-tabler name="check" class="icon-16 m-r-8 text-success"></i-tabler>
                          <span>Activate</span>
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item class="text-danger" (click)="deleteCompany(element); $event.stopPropagation()">
                          <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                          <span>Delete</span>
                        </button>
                      </mat-menu>
                    </div>
                  </div>

                  <div *ngIf="element.industry" class="d-flex align-items-center m-b-10">
                    <span class="f-s-13 text-muted d-flex align-items-center">
                      <i-tabler name="briefcase" class="icon-16 m-r-4"></i-tabler> {{ element.industry }}
                    </span>
                  </div>

                  <div *ngIf="element.location" class="d-flex align-items-start m-b-10">
                    <i-tabler name="map-pin" class="icon-16 m-r-4" style="flex-shrink:0; margin-top:2px;"></i-tabler>
                    <span class="f-s-13 text-muted line-clamp-2-mobile">{{ element.location }}</span>
                  </div>

                  <div *ngIf="element.branchName" class="d-flex align-items-center m-b-10">
                    <span class="f-s-13 text-muted d-flex align-items-center">
                      <i-tabler name="building" class="icon-16 m-r-4"></i-tabler>
                      <span class="branch-badge f-s-12 m-l-4">{{ element.branchName }}</span>
                    </span>
                  </div>

                  <mat-divider class="m-b-12"></mat-divider>
                  <div class="d-flex align-items-center justify-content-between text-muted f-s-12">
                    <a *ngIf="element.website" [href]="'https://' + element.website" target="_blank" class="text-primary f-s-13 d-flex align-items-center" (click)="$event.stopPropagation()">
                      <i-tabler name="world" class="icon-14 m-r-4"></i-tabler> {{ element.website }}
                    </a>
                    <span *ngIf="!element.website" class="text-muted f-s-13">No website listed</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Empty state for card view -->
              <div *ngIf="companies.length === 0" class="empty-state d-flex flex-column align-items-center justify-content-center p-y-48" style="grid-column: 1/-1">
                <i-tabler name="building-off" class="icon-48 text-muted m-b-12"></i-tabler>
                <h6 class="mat-subtitle-1 text-muted m-b-4">No companies found</h6>
                <p class="f-s-13 text-muted">{{ selectedBranchId !== null ? 'No companies match the selected branch filter.' : 'Get started by adding your first company.' }}</p>
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
    <button mat-fab color="primary" class="company-mobile-fab" (click)="addCompany()" aria-label="Add Company">
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
    .company-mobile-fab {
      position: fixed; bottom: 84px; right: 24px; z-index: 1000;
      display: none !important;
      @media (max-width: 576px) { display: flex !important; align-items: center; justify-content: center; }
    }

    .branch-filter-inline { position: relative; }
    /* Hide inline filter on mobile — shown in the mobile strip instead */
    @media (max-width: 576px) { .header-actions .branch-filter-inline, .header-actions .clear-filter-icon-btn { display: none !important; } }
    .filter-trigger-btn {
      height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid #e2e8f0;
      background: #f1f5f9; color: #64748b; cursor: pointer; gap: 6px;
      font-size: 13px; font-weight: 500; transition: all 0.2s ease;
      white-space: nowrap;
      &:hover { background: #e8edf5; border-color: #cbd5e1; }
      &.filter-active {
        background: rgba(97,93,255,0.1); border-color: #615dff;
        color: #615dff; font-weight: 600;
      }
    }
    .clear-filter-icon-btn { width: 32px; height: 32px; color: #fa896b; }
    .menu-item-active { color: #615dff; font-weight: 600; }
    .m-r-6 { margin-right: 6px; } .m-l-4 { margin-left: 4px; }

    /* Mobile filter strip — hidden on desktop */
    .mobile-filter-strip {
      display: none;
      border-bottom: 1px solid #e2e8f0; background: #f8fafc;
      @media (max-width: 576px) { display: flex; }
    }
    .mobile-filter-chip {
      background: rgba(97,93,255,0.12); color: #615dff;
      border-radius: 20px; padding: 3px 10px; font-weight: 600;
    }

    .table-responsive { width: 100%; overflow-x: auto; }
    table { min-width: 900px; }
    .element-row { transition: background-color 0.2s ease; cursor: pointer; &:hover { background-color: #f8fafc; } }
    .cursor-pointer { cursor: pointer; }

    .company-avatar {
      width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%;
      background: rgba(97, 93, 255, 0.1);
    }

    .view-container { animation: fadeIn 0.4s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; @media (max-width: 576px) { grid-template-columns: 1fr; padding: 16px !important; } }
    .company-card { transition: transform 0.2s ease, box-shadow 0.2s ease; &:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; } }

    .view-mode-toggle {
      background-color: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; overflow: hidden;
      .toggle-btn {
        width: 42px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center;
        color: #64748b; background: transparent; border: none; cursor: pointer; transition: all 0.2s ease;
        &.active { background-color: #615dff; color: #ffffff; }
        &:hover:not(.active) { background-color: #f1f5f9; }
      }
    }

    .branch-badge {
      background: rgba(97, 93, 255, 0.12); color: #615dff;
      border-radius: 4px; padding: 3px 8px; font-weight: 600;
    }

    .status-badge {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; text-transform: capitalize;
      &.active { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
      &.pending { background-color: rgba(255, 174, 31, 0.1); color: #ffae1f; }
      &.inactive { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    }

    .search-box {
      position: relative; display: flex; align-items: center; background-color: #f1f5f9;
      border-radius: 8px; padding: 0 12px; border: 1px solid #e2e8f0; width: 240px; height: 38px; transition: all 0.2s ease-in-out;
      @media (max-width: 576px) { width: calc(100% - 140px); }
      &:focus-within { background-color: #ffffff; border-color: #615dff; box-shadow: 0 0 0 3px rgba(97, 93, 255, 0.1); }
      .search-icon { color: #64748b; margin-right: 8px; }
      .search-input { border: none; background: transparent; outline: none; width: 100%; font-size: 13px; color: #1e293b; &::placeholder { color: #94a3b8; } }
    }

    .empty-state { width: 100%; }
    .gap-12 { gap: 12px; }
    .m-r-12 { margin-right: 12px; } .m-r-8 { margin-right: 8px; } .m-r-4 { margin-right: 4px; } .m-l-4 { margin-left: 4px; }
    .m-b-10 { margin-bottom: 10px; } .m-b-12 { margin-bottom: 12px; } .m-b-16 { margin-bottom: 16px; }
    .p-0 { padding: 0 !important; }
    .text-danger { color: #fa896b !important; }
    .text-success { color: #13deb9 !important; }

    @media (max-width: 576px) {
      .line-clamp-2-mobile {
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        /* autoprefixer: ignore next */
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: pre-line !important;
        word-break: break-word !important;
      }
    }

    :host-context(.dark-theme) {
      .mobile-filter-strip { background: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); }
      .filter-trigger-btn { background: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); color: #94a3b8; &:hover { background: var(--dark-hoverbgcolor); } &.filter-active { background: rgba(97,93,255,0.2); border-color: #615dff; color: #a5a1ff; } }
      .element-row:hover { background-color: var(--dark-hoverbgcolor); }
      .search-box { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .search-input { color: #f8fafc; } }
      .view-mode-toggle {
        background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor);
        .toggle-btn { color: #94a3b8; &.active { background-color: #615dff; color: #ffffff; } &:hover:not(.active) { background-color: var(--dark-hoverbgcolor); } }
      }
      .status-badge {
        &.active { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
        &.pending { background-color: rgba(255, 174, 31, 0.2); color: #ffe082; }
        &.inactive { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      }
      .company-avatar { background: rgba(97, 93, 255, 0.2); }
    }
  `]
})
export class CompaniesComponent implements OnInit, AfterViewInit {
  viewMode: 'table' | 'card' = 'table';
  displayedColumns: string[] = ['companyName', 'industry', 'location', 'website', 'branch', 'status', 'actions'];

  companies: Company[] = [];
  dataSource = new MatTableDataSource<Company>([]);
  branches: BranchOption[] = [];

  isLoading = false;
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  selectedBranchId: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private companyService: CompanyService,
    private masterDataService: MasterDataService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.loadCompanies();
  }

  ngAfterViewInit(): void {}

  loadBranches(): void {
    this.masterDataService.getBranches(true).subscribe({
      next: (res) => {
        if (res?.data) {
          this.branches = res.data.map((b: any) => ({ id: b.id, name: b.name }));
        }
      },
      error: (err) => console.error('Failed to load branches for filter', err)
    });
  }

  loadCompanies(): void {
    this.isLoading = true;
    this.companyService.getCompanies(this.currentPage, this.pageSize, this.selectedBranchId).subscribe({
      next: (res) => {
        // Handle various possible paginated response shapes
        const rawList: any[] =
          res?.content ??
          res?.data?.content ??
          (Array.isArray(res?.data) ? res.data : null) ??
          (Array.isArray(res) ? res : []);

        this.companies = rawList.map((c: any) => this.mapCompany(c));
        this.dataSource.data = this.companies;
        this.totalElements =
          res?.totalElements ?? res?.data?.totalElements ?? rawList.length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load companies', err);
        this.notificationService.showErrorToast('Failed to load companies. Please try again.', 'Error');
        this.isLoading = false;
      },
    });
  }

  private mapCompany(c: any): Company {
    const details = c.companyDetails || {};
    return {
      id: c.id,
      companyName: details.companyName || c.firstName || c.companyName || c.name || 'Unknown',
      logo: c.logo || c.logoUrl || '',
      industry: details.industry || c.industry || '',
      location: details.address || c.location || '',
      website: details.website || c.website || '',
      status: c.status || 'ACTIVE',
      branchName: c.branchName || c.branch?.name || null,
      branchId: c.branchId || c.branch?.id || null,
      contactPerson: details.contactPerson || null,
      email: c.email || null,
      phone: c.phone || null,
      mobileCountryCodeId: c.mobileCountryCodeId || null,
      totalStaffs: c.userCounts?.totalStaffs || 0,
      totalStudents: c.userCounts?.totalStudents || 0,
      assignedTo: details.assignedTo || c.assignedTo || null,
      firstName: c.firstName || null,
      lastName: c.lastName || null
    };
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCompanies();
  }

  setBranchFilter(branchId: number | null): void {
    this.selectedBranchId = branchId;
    this.onBranchFilterChange();
  }

  getSelectedBranchName(): string {
    const branch = this.branches.find(b => b.id === this.selectedBranchId);
    return branch ? branch.name : 'Branch';
  }

  onBranchFilterChange(): void {
    this.currentPage = 0;
    if (this.paginator) this.paginator.firstPage();
    this.loadCompanies();
  }

  clearFilter(): void {
    this.selectedBranchId = null;
    this.onBranchFilterChange();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addCompany(): void {
    const dialogRef = this.dialog.open(AddCompanyDialogComponent, {
      panelClass: 'dialog-container-custom'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCompanies();
      }
    });
  }

  viewDetails(company: Company): void {
    const dialogRef = this.dialog.open(CompanyDetailDialogComponent, {
      data: {
        company,
        onToggleStatus: (c: Company) => this.toggleStatus(c)
      },
      panelClass: 'dialog-container-custom'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'statusChanged') {
        // Status changed was already handled by toggleStatus which reloads the list
      }
    });
  }

  editCompany(company: Company): void {
    const dialogRef = this.dialog.open(AddCompanyDialogComponent, {
      data: company,
      panelClass: 'dialog-container-custom'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCompanies();
      }
    });
  }

  toggleStatus(company: Company): void {
    if (!company.id) return;
    
    const currentStatus = (company.status || 'ACTIVE').toUpperCase();
    const actionText = currentStatus === 'ACTIVE' ? 'deactivate' : 'activate';

    this.companyService.toggleCompanyStatus(company.id).subscribe({
      next: () => {
        this.notificationService.showSuccessToast(`Company ${actionText}d successfully.`, 'Status Updated');
        this.loadCompanies();
      },
      error: (err) => {
        console.error('Failed to update status', err);
        this.notificationService.showErrorToast(`Failed to ${actionText} company.`, 'Error');
      }
    });
  }

  deleteCompany(company: Company): void {
    if (!company.id) return;

    this.notificationService.showErrorPopup(
      `Are you sure you want to delete the company "${company.companyName}"? This action cannot be undone.`,
      'Delete Company',
      'Delete'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.companyService.deleteCompany(company.id!).subscribe({
          next: () => {
            this.notificationService.showSuccessToast('Company deleted successfully.', 'Deleted');
            this.loadCompanies();
          },
          error: (err) => {
            console.error('Failed to delete company', err);
            this.notificationService.showErrorToast('Failed to delete company.', 'Error');
          }
        });
      }
    });
  }
}
