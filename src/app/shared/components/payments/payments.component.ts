import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../core/services/notification.service';
import { StudentService, Payout } from '../../../core/services/student.service';
import { PaymentDetailsDialogComponent } from './payment-details-dialog/payment-details-dialog.component';
import { TableColumn } from '../data-table/data-table.models';
import { createSearchPredicate, encodeSearch } from '../data-table/table-filter.util';

export interface Payment {
  id: number;
  studentName: string;
  studentAvatar: string;
  source: string;
  assigned: string;
  assignedAvatar: string;
  paid: string;
  paidAmount: number;
  balance: string;
  balanceAmount: number;
  studentStatus: 'active' | 'inactive';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  approval: 'approved' | 'pending' | 'rejected';
  date: string;
  dateRaw?: string;
}

@Component({
  selector: 'app-payments',
  template: `
    <div class="page-head">
      <div>
        <div class="eyebrow">Management</div>
        <h1 class="page-title">Payments Directory</h1>
        <p class="page-sub">Monitor revenue, track payments, and manage outstanding balances.</p>
      </div>
    </div>
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">Payments Directory</h5>
          </mat-card-title>
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box flex-1-auto">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" placeholder="Search payments..." class="search-input" />
            </div>
            <div class="view-mode-toggle d-flex align-items-center">
              <button (click)="viewMode = 'table'" class="toggle-btn" [class.active]="viewMode === 'table'" title="List view">
                <i-tabler name="list" class="icon-18"></i-tabler>
              </button>
              <button (click)="viewMode = 'card'" class="toggle-btn" [class.active]="viewMode === 'card'" title="Card view">
                <i-tabler name="layout-grid" class="icon-18"></i-tabler>
              </button>
            </div>
            <button mat-flat-button color="primary" class="d-flex align-items-center add-btn desktop-add-btn" (click)="addPayment()">
              <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler>
              <span class="add-btn-text">Add Payment</span>
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content class="p-0">
          <div *ngIf="viewMode === 'table'" class="view-container">
            <app-data-table
              [columns]="tableColumns"
              [rows]="dataSource.filteredData"
              trackByKey="id"
              [clickableRows]="true"
              exportFileName="payments"
              noFilterResultsMessage="No payments on this page match the current filters."
              (rowClick)="viewDetails($event)"
            >
              <ng-template appCellDef="studentName" let-element="row">
                <div class="d-flex align-items-center">
                  <img [src]="element.studentAvatar" class="rounded-circle m-r-12 object-cover avatar-animated" width="40" height="40" />
                  <span class="f-w-600 d-block text-dark f-s-14">{{ element.studentName }}</span>
                </div>
              </ng-template>

              <ng-template appRowActions let-element="row">
                <button mat-icon-button [matMenuTriggerFor]="menu" class="text-muted">
                  <i-tabler name="dots" class="icon-18"></i-tabler>
                </button>
                <mat-menu #menu="matMenu" class="cardWithShadow">
                  <button mat-menu-item (click)="viewDetails(element)">
                    <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                    <span>View details</span>
                  </button>
                  <button mat-menu-item (click)="editPayment(element)">
                    <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                    <span>Edit payment</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item class="text-danger" (click)="deletePayment(element)">
                    <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </ng-template>
            </app-data-table>
          </div>

          <!-- Card View -->
          <div *ngIf="viewMode === 'card'" class="card-grid view-container p-24">
            <mat-card *ngFor="let element of dataSource.connect() | async" class="payment-card cardWithShadow cursor-pointer" (click)="viewDetails(element)">
              <mat-card-content class="p-16">
                <div class="d-flex align-items-center m-b-16">
                  <img [src]="element.studentAvatar" class="rounded-circle m-r-12 object-cover avatar-animated" width="48" height="48" />
                  <div>
                    <h6 class="mat-subtitle-1 f-w-600 m-b-0">{{ element.studentName }}</h6>
                    <span class="status-badge" [ngClass]="element.studentStatus">{{ element.studentStatus | titlecase }}</span>
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
                      <button mat-menu-item (click)="editPayment(element)">
                        <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                        <span>Edit payment</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item class="text-danger" (click)="deletePayment(element)">
                        <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>
                
                <div class="d-flex align-items-center justify-content-between m-b-12">
                  <span class="f-s-13 text-muted">Paid: <span class="text-dark f-w-500">{{ element.paid }}</span></span>
                  <span class="f-s-13 text-muted">Balance: <span class="text-dark f-w-500">{{ element.balance }}</span></span>
                </div>
                
                <div class="d-flex align-items-center justify-content-between m-b-16">
                  <span class="status-badge" [ngClass]="element.paymentStatus">{{ element.paymentStatus | titlecase }}</span>
                  <span class="status-badge" [ngClass]="element.approval">{{ element.approval | titlecase }}</span>
                </div>
                
                <mat-divider class="m-b-12"></mat-divider>
                <div class="d-flex align-items-center justify-content-between text-muted f-s-12">
                  <span class="d-flex align-items-center"><img [src]="element.assignedAvatar" class="rounded-circle m-r-4 object-cover" width="16" height="16" /> {{ element.assigned }}</span>
                  <span class="d-flex align-items-center"><i-tabler name="calendar" class="icon-14 m-r-4"></i-tabler> {{ element.date }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <mat-paginator [length]="totalElements"
                         [pageSize]="pageSize"
                         [pageSizeOptions]="[5, 10, 15]"
                         (page)="pageChanged($event)"
                         showFirstLastButtons 
                         class="p-y-12">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Mobile FAB -->
    <button mat-fab color="primary" class="payment-mobile-fab" (click)="addPayment()" aria-label="Add Payment">
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

    .view-container { animation: fadeIn 0.4s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .avatar-animated {
      transition: transform 0.3s ease;
    }
    
    .payment-card:hover .avatar-animated {
      transform: scale(1.1) rotate(5deg);
      animation: gentle-bounce 1s infinite alternate ease-in-out;
    }
    
    @keyframes gentle-bounce {
      0% { transform: scale(1.1) rotate(3deg) translateY(0); }
      100% { transform: scale(1.1) rotate(7deg) translateY(-3px); }
    }

    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; @media (max-width: 576px) { grid-template-columns: 1fr; padding: 16px !important; } }
    .payment-card { transition: transform 0.2s ease, box-shadow 0.2s ease; &:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; } }
    .view-mode-toggle { background-color: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; overflow: hidden; .toggle-btn { width: 42px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; color: #64748b; background: transparent; border: none; cursor: pointer; transition: all 0.2s ease; &.active { background-color: var(--brand-primary); color: #ffffff; } &:hover:not(.active) { background-color: #f1f5f9; } } }

    .status-badge {
      display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; text-transform: capitalize;
      &.active, &.paid, &.approved { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
      &.pending { background-color: rgba(255, 174, 31, 0.1); color: #ffae1f; }
      &.inactive, &.overdue, &.rejected { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    }

    .cursor-pointer { cursor: pointer; }

    .search-box {
      position: relative; display: flex; align-items: center; background-color: #f1f5f9; border-radius: 8px; padding: 0 12px; border: 1px solid #e2e8f0; min-width: 0; height: 38px; transition: all 0.2s ease-in-out;
      &:focus-within { background-color: #ffffff; border-color: var(--brand-primary); box-shadow: 0 0 0 3px rgba(var(--brand-primary-rgb), 0.1); }
      .search-icon { color: #64748b; margin-right: 8px; flex-shrink: 0; }
      .search-input { border: none; background: transparent; outline: none; width: 100%; font-size: 13px; color: #1e293b; &::placeholder { color: #94a3b8; } }
    }

    .flex-1-auto { flex: 1 1 auto; }

    .gap-12 { gap: 12px; } .m-r-12 { margin-right: 12px; } .m-r-8 { margin-right: 8px; } .m-r-4 { margin-right: 4px; } .p-0 { padding: 0 !important; } .object-cover { object-fit: cover; }

    /* Mobile FAB */
    .payment-mobile-fab {
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
      .search-box { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .search-input { color: #f8fafc; } }
      .view-mode-toggle { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .toggle-btn { color: #94a3b8; &.active { background-color: var(--brand-primary); color: #ffffff; } &:hover:not(.active) { background-color: var(--dark-hoverbgcolor); } } }
      .status-badge {
        &.active, &.paid, &.approved { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
        &.pending { background-color: rgba(255, 174, 31, 0.2); color: #ffe082; }
        &.inactive, &.overdue, &.rejected { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      }
    }
  `]
})
export class PaymentsComponent implements OnInit, AfterViewInit {
  viewMode: 'table' | 'card' = 'table';
  dataSource = new MatTableDataSource<Payment>([]);

  tableColumns: TableColumn<Payment>[] = [
    { key: 'studentName', header: 'Student Name', type: 'custom', exportValueFn: r => r.studentName, filter: { type: 'text', getValue: r => r.studentName } },
    { key: 'source', header: 'Source', type: 'text', valueFn: r => r.source, maxWidth: '110px', filter: { type: 'text' } },
    {
      key: 'assigned', header: 'Assigned By', type: 'avatar',
      avatarFn: r => r.assignedAvatar, valueFn: r => r.assigned,
      filter: { type: 'text' },
    },
    { key: 'paid', header: 'Paid', type: 'text', valueFn: r => r.paid, align: 'right', maxWidth: '90px', filter: { type: 'number-range', getValue: r => r.paidAmount } },
    { key: 'balance', header: 'Balance', type: 'text', valueFn: r => r.balance, align: 'right', maxWidth: '90px', filter: { type: 'number-range', getValue: r => r.balanceAmount } },
    {
      key: 'studentStatus', header: 'Student Status', type: 'pill',
      valueFn: r => this.titleCase(r.studentStatus),
      classFn: r => this.studentStatusPillClass(r.studentStatus),
      filter: {
        type: 'select',
        options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }],
        getValue: r => r.studentStatus,
      },
    },
    {
      key: 'paymentStatus', header: 'Payment Status', type: 'pill',
      valueFn: r => this.titleCase(r.paymentStatus),
      classFn: r => this.paymentStatusPillClass(r.paymentStatus),
      filter: {
        type: 'select',
        options: [
          { value: 'paid', label: 'Paid' },
          { value: 'pending', label: 'Pending' },
          { value: 'overdue', label: 'Overdue' },
        ],
        getValue: r => r.paymentStatus,
      },
    },
    {
      key: 'approval', header: 'Approval', type: 'pill',
      valueFn: r => this.titleCase(r.approval),
      classFn: r => this.approvalPillClass(r.approval),
      filter: {
        type: 'select',
        options: [
          { value: 'approved', label: 'Approved' },
          { value: 'pending', label: 'Pending' },
          { value: 'rejected', label: 'Rejected' },
        ],
        getValue: r => r.approval,
      },
    },
    {
      key: 'date', header: 'Date', type: 'date', valueFn: r => r.date,
      filter: { type: 'date-range', getValue: r => (r.dateRaw ? new Date(r.dateRaw) : null) },
    },
    { key: 'actions', header: 'Actions', type: 'actions', align: 'right' },
  ];

  private searchText = '';

  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  searchQuery = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private notificationService: NotificationService,
    private studentService: StudentService,
    private dialog: MatDialog
  ) {
    this.dataSource.filterPredicate = createSearchPredicate();
  }

  ngOnInit(): void {
    this.loadPayments();
  }

  ngAfterViewInit(): void {
    // Custom pagination handled via pageChanged event
  }

  loadPayments(): void {
    this.studentService.getPaymentsByReferralCompany(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        if (data && data.payouts) {
          this.dataSource.data = data.payouts.map(p => this.mapToPayment(p));
          // Since the API doesn't return totalElements currently, we'll fall back to array length
          this.totalElements = data.payouts.length; 
        }
      },
      error: (err) => {
        console.error('Error fetching payments:', err);
        this.notificationService.showErrorToast('Failed to load payments.', 'Error');
      }
    });
  }

  mapToPayment(payout: Payout): Payment {
    const avatarIndex = (payout.studentId % 4) + 1;
    const assignedIndex = ((payout.user?.id || 1) % 4) + 1;
    
    const rawDate = payout.disputedAt || payout.respondedAt || payout.createdAt;
    const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString() : 'N/A';

    return {
      id: payout.id,
      studentName: payout.studentName || 'Unknown Student',
      studentAvatar: `/assets/images/profile/user-${avatarIndex}.jpg`,
      source: payout.sourceType || 'UNKNOWN',
      assigned: payout.user?.username || 'Unassigned',
      assignedAvatar: `/assets/images/profile/user-${assignedIndex}.jpg`,
      paid: `$${payout.paidAmount || 0}`,
      paidAmount: payout.paidAmount || 0,
      balance: `$${payout.balanceAmount || 0}`,
      balanceAmount: payout.balanceAmount || 0,
      studentStatus: 'active', // Placeholder as not in API
      paymentStatus: this.mapStatus(payout.payoutStatus) as any,
      approval: payout.paymentStageDisplay as any || 'Pending',
      date: formattedDate,
      dateRaw: rawDate,
    };
  }

  titleCase(value?: string | null): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  studentStatusPillClass(status?: string | null): string {
    switch ((status || '').toLowerCase()) {
      case 'active': return 'pill--success';
      case 'inactive': return 'pill--danger';
      default: return 'pill--neutral';
    }
  }

  paymentStatusPillClass(status?: string | null): string {
    switch ((status || '').toLowerCase()) {
      case 'paid': return 'pill--success';
      case 'pending': return 'pill--warning';
      case 'overdue': return 'pill--danger';
      default: return 'pill--neutral';
    }
  }

  approvalPillClass(status?: string | null): string {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'pill--success';
      case 'pending': return 'pill--warning';
      case 'rejected': return 'pill--danger';
      default: return 'pill--neutral';
    }
  }

  mapStatus(status: string): string {
    if (!status) return 'pending';
    switch(status.toUpperCase()) {
      case 'PAID': return 'paid';
      case 'REJECTED': return 'rejected';
      case 'DISPUTE': return 'overdue';
      case 'PENDING': return 'pending';
      default: return 'pending';
    }
  }

  pageChanged(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPayments();
  }

  applyFilter(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value;
    this.dataSource.filter = encodeSearch(this.searchText);
  }

  addPayment(): void {
    this.notificationService.showSuccessToast('Payment created successfully.', 'Success');
  }

  viewDetails(payment: Payment): void {
    this.dialog.open(PaymentDetailsDialogComponent, {
      data: payment,
      width: '500px',
      panelClass: 'payment-details-dialog'
    });
  }

  editPayment(payment: Payment): void {
    this.notificationService.showSuccessToast(`Updates saved for ${payment.studentName}.`, 'Saved');
  }

  deletePayment(payment: Payment): void {
    this.notificationService.showErrorToast(`Payment for ${payment.studentName} deleted.`, 'Deleted');
  }
}
