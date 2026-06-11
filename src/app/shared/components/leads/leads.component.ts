import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { LeadService } from '../../../core/services/lead.service';
import { LeadDetailsDialogComponent } from './lead-details-dialog/lead-details-dialog.component';
import { ReasonDialogComponent } from './reason-dialog/reason-dialog.component';
import { AddLeadDialogComponent } from './add-lead-dialog/add-lead-dialog.component';

export interface Lead {
  id?: number;
  name: string;
  role: string;
  avatar: string;
  email: string;
  phone: string;
  status: string;
  assignedTo: string;
  assignedAvatar: string;
  addedBy: string;
  addedByRole: string;
  country: string;
  university: string;
  leadDate: string;
  isUpdatingStatus?: boolean;
  branchId?: number;
  countryCode?: string;
  counsellorId?: number;
  countryId?: number;
  universityId?: number;
  course?: string;
  intake?: string;
}

@Component({
  selector: 'app-leads',
  template: `
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">Sales Leads Queue</h5>
          </mat-card-title>
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box flex-1-auto">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" placeholder="Search leads..." class="search-input" />
            </div>
            <div class="view-mode-toggle d-flex align-items-center">
              <button (click)="viewMode = 'table'" class="toggle-btn" [class.active]="viewMode === 'table'" title="List view">
                <i-tabler name="list" class="icon-18"></i-tabler>
              </button>
              <button (click)="viewMode = 'card'" class="toggle-btn" [class.active]="viewMode === 'card'" title="Card view">
                <i-tabler name="layout-grid" class="icon-18"></i-tabler>
              </button>
            </div>
            <button mat-flat-button color="primary" class="d-flex align-items-center add-btn desktop-add-btn" (click)="addLead()">
              <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler>
              <span class="add-btn-text">Add Lead</span>
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content class="p-0">
          
          <!-- Loading State -->
          <div *ngIf="isLoading" class="d-flex justify-content-center align-items-center p-24">
            <i-tabler name="loader" class="icon-24 spinning text-primary m-r-8"></i-tabler>
            <span class="f-s-14 text-muted">Loading leads...</span>
          </div>

          <!-- Error State -->
          <div *ngIf="!isLoading && hasError" class="d-flex flex-column justify-content-center align-items-center p-24">
            <i-tabler name="alert-circle" class="icon-48 text-danger m-b-8"></i-tabler>
            <h6 class="mat-subtitle-1 m-b-4">Failed to load leads</h6>
            <span class="f-s-14 text-muted m-b-16">There was an error communicating with the server.</span>
            <button mat-stroked-button color="primary" (click)="loadLeads()">Try Again</button>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && !hasError && dataSource.data.length === 0" class="d-flex flex-column justify-content-center align-items-center p-24">
            <i-tabler name="inbox" class="icon-48 text-muted m-b-8"></i-tabler>
            <h6 class="mat-subtitle-1 m-b-4">No leads found</h6>
            <span class="f-s-14 text-muted">Get started by adding a new lead.</span>
          </div>

          <div *ngIf="!isLoading && !hasError && dataSource.data.length > 0 && viewMode === 'table'" class="table-responsive view-container">
            <table mat-table [dataSource]="dataSource" class="w-100">
              
              <!-- Lead Column -->
              <ng-container matColumnDef="lead">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Lead</th>
                <td mat-cell *matCellDef="let element" (click)="viewDetails(element)" class="cursor-pointer">
                  <div class="d-flex align-items-center">
                    <img [src]="element.avatar" class="rounded-circle m-r-12 object-cover avatar-animated" width="40" height="40" />
                    <div>
                      <span class="f-w-600 d-block text-dark f-s-14">{{ element.name }}</span>
                      <span class="text-muted f-s-12 d-block">{{ element.role }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Contact Info Column -->
              <ng-container matColumnDef="contactInfo">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Contact Info</th>
                <td mat-cell *matCellDef="let element">
                  <span class="d-flex align-items-center f-w-500 text-dark f-s-13 m-b-4"><i-tabler name="mail" class="icon-14 m-r-4 text-muted"></i-tabler>{{ element.email || 'N/A' }}</span>
                  <span class="d-flex align-items-center text-muted f-s-12"><i-tabler name="phone" class="icon-14 m-r-4"></i-tabler>{{ element.phone || 'N/A' }}</span>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Status</th>
                <td mat-cell *matCellDef="let element" (click)="$event.stopPropagation()">
                  <span class="status-badge cursor-pointer d-inline-flex align-items-center" [ngClass]="element.status" [matMenuTriggerFor]="element.isUpdatingStatus ? null : statusMenu">
                    {{ element.status | titlecase }}
                    <i-tabler *ngIf="!element.isUpdatingStatus" name="chevron-down" class="icon-14 m-l-4"></i-tabler>
                    <i-tabler *ngIf="element.isUpdatingStatus" name="loader" class="icon-14 m-l-4 spinning"></i-tabler>
                  </span>
                  <mat-menu #statusMenu="matMenu" class="cardWithShadow">
                    <button mat-menu-item *ngFor="let s of availableStatuses" (click)="changeStatus(element, s)">
                      <span class="status-badge m-r-8" [ngClass]="s.toLowerCase()">{{ s | titlecase }}</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <!-- Assigned To Column -->
              <ng-container matColumnDef="assignedTo">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Assigned To</th>
                <td mat-cell *matCellDef="let element">
                  <div class="d-flex align-items-center">
                    <img [src]="element.assignedAvatar" class="rounded-circle m-r-8 object-cover" width="28" height="28" />
                    <span class="f-w-500 text-dark f-s-13">{{ element.assignedTo }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Added By Column -->
              <ng-container matColumnDef="addedBy">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Added By</th>
                <td mat-cell *matCellDef="let element">
                  <span class="f-w-500 text-dark d-block f-s-13">{{ element.addedBy }}</span>
                  <span class="text-muted f-s-11 d-block">{{ element.addedByRole }}</span>
                </td>
              </ng-container>

              <!-- Country/University Column -->
              <ng-container matColumnDef="countryUniversity">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Country / University</th>
                <td mat-cell *matCellDef="let element">
                  <span class="d-flex align-items-center f-w-500 text-dark f-s-13 m-b-4"><i-tabler name="map-pin" class="icon-14 m-r-4 text-muted"></i-tabler>{{ element.country || 'N/A' }}</span>
                  <span class="d-flex align-items-center text-muted f-s-12"><i-tabler name="building" class="icon-14 m-r-4"></i-tabler>{{ element.university || 'N/A' }}</span>
                </td>
              </ng-container>

              <!-- Lead Date Column -->
              <ng-container matColumnDef="leadDate">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Lead Date</th>
                <td mat-cell *matCellDef="let element" class="text-muted f-s-13">
                  {{ element.leadDate }}
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
                    <button mat-menu-item (click)="viewDetails(element)">
                      <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                      <span>View details</span>
                    </button>
                    <button mat-menu-item (click)="editLead(element)">
                      <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                      <span>Edit lead</span>
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item class="text-danger" (click)="deleteLead(element)">
                      <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                      <span>Delete</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="lead-row" (click)="viewDetails(row)"></tr>
            </table>
          </div>

          <!-- Card View -->
          <div *ngIf="!isLoading && !hasError && dataSource.data.length > 0 && viewMode === 'card'" class="card-grid view-container p-24">
            <mat-card *ngFor="let element of dataSource.connect() | async" class="lead-card cardWithShadow cursor-pointer" (click)="viewDetails(element)">
              <mat-card-content class="p-16">
                <div class="d-flex align-items-center m-b-16">
                  <img [src]="element.avatar" class="rounded-circle m-r-12 object-cover avatar-animated" width="48" height="48" />
                  <div>
                    <h6 class="mat-subtitle-1 f-w-600 m-b-0">{{ element.name }}</h6>
                    <span class="f-s-13 text-muted">{{ element.role }}</span>
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
                      <button mat-menu-item (click)="editLead(element)">
                        <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                        <span>Edit lead</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item class="text-danger" (click)="deleteLead(element)">
                        <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>
                
                <div class="d-flex align-items-center justify-content-between m-b-12">
                  <span class="f-s-13 text-muted d-flex align-items-center"><i-tabler name="mail" class="icon-16 m-r-4"></i-tabler> {{ element.email || 'N/A' }}</span>
                </div>
                <div class="d-flex align-items-center justify-content-between m-b-16">
                  <span class="f-s-13 text-muted d-flex align-items-center"><i-tabler name="phone" class="icon-16 m-r-4"></i-tabler> {{ element.phone || 'N/A' }}</span>
                </div>
                
                <div class="d-flex align-items-center justify-content-between m-b-16">
                  <div class="d-flex align-items-center">
                    <img [src]="element.assignedAvatar" class="rounded-circle m-r-8 object-cover" width="24" height="24" />
                    <span class="f-s-13 text-muted">{{ element.assignedTo }}</span>
                  </div>
                  <span class="status-badge cursor-pointer d-inline-flex align-items-center" [ngClass]="element.status" [matMenuTriggerFor]="element.isUpdatingStatus ? null : cardStatusMenu" (click)="$event.stopPropagation()">
                    {{ element.status | titlecase }}
                    <i-tabler *ngIf="!element.isUpdatingStatus" name="chevron-down" class="icon-14 m-l-4"></i-tabler>
                    <i-tabler *ngIf="element.isUpdatingStatus" name="loader" class="icon-14 m-l-4 spinning"></i-tabler>
                  </span>
                  <mat-menu #cardStatusMenu="matMenu" class="cardWithShadow">
                    <button mat-menu-item *ngFor="let s of availableStatuses" (click)="changeStatus(element, s)">
                      <span class="status-badge m-r-8" [ngClass]="s.toLowerCase()">{{ s | titlecase }}</span>
                    </button>
                  </mat-menu>
                </div>
                
                <mat-divider class="m-b-12"></mat-divider>
                <div class="d-flex align-items-center justify-content-between text-muted f-s-12 m-b-8">
                  <span class="d-flex align-items-center"><i-tabler name="map-pin" class="icon-14 m-r-4"></i-tabler> {{ element.country || 'N/A' }}</span>
                  <span class="d-flex align-items-center"><i-tabler name="calendar" class="icon-14 m-r-4"></i-tabler> {{ element.leadDate || 'N/A' }}</span>
                </div>
                <div class="d-flex align-items-center text-muted f-s-12">
                  <span class="d-flex align-items-center"><i-tabler name="building" class="icon-14 m-r-4"></i-tabler> {{ element.university || 'N/A' }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <mat-paginator [pageSizeOptions]="[5, 10, 15]" [pageSize]="10" showFirstLastButtons class="p-y-12"></mat-paginator>
        </mat-card-content>
      </mat-card>
      
      <!-- Mobile FAB -->
      <button mat-fab color="primary" class="mobile-fab" (click)="addLead()">
        <i-tabler name="plus" class="icon-24"></i-tabler>
      </button>
    </div>
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
    
    .lead-row:hover .avatar-animated,
    .lead-card:hover .avatar-animated {
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

    .lead-card {
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
    
    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    
    table {
      min-width: 900px;
    }

    .lead-row {
      transition: background-color 0.2s ease;
      cursor: pointer;
      &:hover {
        background-color: #f8fafc;
      }
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      text-transform: capitalize;
      
      &.active, &.won, &.enrolled, &.registered {
        background-color: rgba(19, 222, 185, 0.1);
        color: #13deb9;
      }
      
      &.lost, &.inactive {
        background-color: rgba(250, 137, 107, 0.1);
        color: #fa896b;
      }
      
      &.pending, &.lead, &.prospective {
        background-color: rgba(255, 174, 31, 0.1);
        color: #ffae1f;
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
    .m-l-4 { margin-left: 4px; }
    .m-b-0 { margin-bottom: 0 !important; }
    .p-0 { padding: 0 !important; }
    .object-cover { object-fit: cover; }
    .text-success { color: #13deb9 !important; }
    .text-danger { color: #fa896b !important; }

    /* Mobile FAB */
    .mobile-fab {
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

    :host-context(.dark-theme) {
      .lead-row:hover {
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
        &.active, &.won, &.enrolled, &.registered {
          background-color: rgba(19, 222, 185, 0.2);
          color: #80f1d4;
        }
        &.lost, &.inactive {
          background-color: rgba(250, 137, 107, 0.2);
          color: #ffab91;
        }
        &.pending, &.lead, &.prospective {
          background-color: rgba(255, 174, 31, 0.2);
          color: #ffca70;
        }
      }
    }
  `]
})
export class LeadsComponent implements OnInit, AfterViewInit {
  viewMode: 'table' | 'card' = 'table';
  isLoading = true;
  hasError = false;

  availableStatuses = ['LEAD', 'REGISTERED', 'LOST', 'STUDENT', 'PROSPECTIVE'];

  displayedColumns: string[] = [
    'lead',
    'contactInfo',
    'status',
    'assignedTo',
    'addedBy',
    'countryUniversity',
    'leadDate',
    'actions'
  ];

  dataSource = new MatTableDataSource<Lead>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private notificationService: NotificationService,
    private leadService: LeadService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadLeads();
    this.route.queryParams.subscribe(params => {
      if (params['openAdd'] === 'true') {
        setTimeout(() => this.addLead(), 100);
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadLeads(): void {
    this.isLoading = true;
    this.hasError = false;
    this.leadService.getLeads(0, 100).subscribe({
      next: (res) => {
        this.isLoading = false;
        const raw: any[] = res?.data?.content || res?.data || res?.content || (Array.isArray(res) ? res : []);
        this.dataSource.data = raw.map(l => this.mapLead(l));
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        console.error('Failed to load leads:', err);
      }
    });
  }

  /** Map a raw API lead object to the Lead display model */
  private mapLead(l: any): Lead {
    const u = l.user || {};
    const fullName = u.fullName || (u.firstName ? u.firstName + ' ' + (u.lastName || '') : '').trim() || l.fullName || 'Unknown User';

    const assignedEmployee = l.assignedBy || {};
    const assignedName = assignedEmployee.fullName || (assignedEmployee.firstName ? assignedEmployee.firstName + ' ' + (assignedEmployee.lastName || '') : '').trim() || 'Unassigned';
    const assignedAvatar = assignedEmployee.profilePicture || assignedEmployee.avatar || '/assets/images/profile/user-1.jpg';

    const addedByUser = l.createdByUser || {};
    const addedByName = addedByUser.fullName || (addedByUser.firstName ? addedByUser.firstName + ' ' + (addedByUser.lastName || '') : '').trim() || 'System';
    const addedByRole = l.branchName || addedByUser.role || addedByUser.roleName || 'System';

    const rawDate = l.createdAt || l.leadDate || '';
    const leadDate = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    return {
      id: l.id,
      name: fullName,
      role: l.courseName || u.role || 'Lead',
      avatar: u.profilePicture || u.avatar || '/assets/images/profile/user-1.jpg',
      email: u.email || l.email || '',
      phone: u.phone || l.phone || '',
      status: (l.status || 'pending').toLowerCase(),
      assignedTo: assignedName,
      assignedAvatar: assignedAvatar,
      addedBy: addedByName,
      addedByRole: addedByRole,
      country: l.countryName || l.country || '',
      university: l.universityName || l.university || '',
      leadDate: leadDate,
      branchId: l.branch?.id || l.branchId || u.branchId || null,
      countryCode: l.mcc?.mobileCode || u.mcc?.mobileCode || l.countryCode || u.countryCode || '+91',
      counsellorId: l.assignedTo?.id || l.assignedBy?.id || l.counsellorId || null,
      countryId: l.country?.id || l.countryId || null,
      universityId: l.university?.id || l.universityId || null,
      course: l.courseName || l.course || '',
      intake: l.intakePeriod || l.intake || ''
    };
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addLead(): void {
    const dialogRef = this.dialog.open(AddLeadDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      height: '680px',
      maxHeight: '95vh',
      panelClass: 'onboarding-dialog',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Send payload to backend API here
        this.leadService.createLead(result).subscribe({
          next: () => {
            this.notificationService.showSuccessPopup(
              'New sales lead created and assigned to the queue.',
              'Lead Created',
              'Done'
            ).subscribe(() => {
              this.notificationService.showSuccessToast('Lead has been created.', 'Success');
              this.loadLeads(); // Refresh list
            });
          },
          error: (err) => {
             console.error('Failed to create lead:', err);
             const errorMessage = err.error?.message || err.message || 'Failed to create student lead.';
             this.notificationService.showErrorPopup(errorMessage, 'Creation Failed', 'Close').subscribe();
          }
        });
      }
    });
  }

  viewDetails(lead: Lead): void {
    this.dialog.open(LeadDetailsDialogComponent, {
      data: lead,
      width: '500px',
      panelClass: 'lead-details-dialog'
    });
  }

  editLead(lead: Lead): void {
    if (!lead.id) return;

    this.leadService.getLead(lead.id).subscribe({
      next: (res) => {
        const fullLead = res?.data || res;
        const dialogRef = this.dialog.open(AddLeadDialogComponent, {
          width: '1000px',
          maxWidth: '95vw',
          height: '680px',
          maxHeight: '95vh',
          panelClass: 'onboarding-dialog',
          disableClose: true,
          data: fullLead
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.notificationService.showSuccessToast(`Lead updates saved for ${lead.name}.`, 'Changes Saved');
          }
        });
      },
      error: (err) => {
        console.error('Failed to load lead details:', err);
        this.notificationService.showErrorPopup('Failed to load lead details.', 'Error', 'Close').subscribe();
      }
    });
  }

  changeStatus(lead: Lead, newStatus: string): void {
    if (lead.status.toUpperCase() === newStatus) return;

    if (newStatus === 'LOST') {
      const dialogRef = this.dialog.open(ReasonDialogComponent, {
        width: '400px',
        panelClass: 'reason-dialog'
      });

      dialogRef.afterClosed().subscribe((reason) => {
        if (reason) {
          this.executeStatusUpdate(lead, newStatus, reason);
        }
      });
    } else {
      this.executeStatusUpdate(lead, newStatus);
    }
  }

  private executeStatusUpdate(lead: Lead, status: string, reason?: string): void {
    if (!lead.id) return;
    lead.isUpdatingStatus = true;
    this.leadService.updateLeadStatus(lead.id, status, reason).subscribe({
      next: () => {
        lead.isUpdatingStatus = false;
        this.notificationService.showSuccessToast(`Status updated to ${status}.`, 'Success');
        lead.status = status.toLowerCase(); // Optimistically update the UI
        // Optionally, call this.loadLeads() to get fresh data
      },
      error: (err) => {
        lead.isUpdatingStatus = false;
        console.error('Failed to update status:', err);
        const errorMessage = err.error?.message || err.message || 'An unexpected error occurred while updating the status.';
        this.notificationService.showErrorPopup(errorMessage, 'Update Failed', 'Close').subscribe();
      }
    });
  }

  deleteLead(lead: Lead): void {
    if (!lead.id) return;
    this.notificationService.showErrorPopup(
      `Are you sure you want to permanently delete the lead: ${lead.name}?`,
      'Confirm Lead Deletion',
      'Delete'
    ).subscribe(() => {
      this.leadService.deleteLead(lead.id!).subscribe({
        next: () => {
          this.notificationService.showSuccessToast(`Lead ${lead.name} deleted successfully.`, 'Deleted');
          this.loadLeads();
        },
        error: (err) => {
          console.error('Failed to delete lead:', err);
          const errorMessage = err.error?.message || err.message || 'Failed to delete the lead.';
          this.notificationService.showErrorPopup(errorMessage, 'Deletion Failed', 'Close').subscribe();
        }
      });
    });
  }
}
