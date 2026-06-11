import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NotificationService } from '../../../core/services/notification.service';

export interface Payment {
  id: number;
  studentName: string;
  studentAvatar: string;
  source: string;
  assigned: string;
  assignedAvatar: string;
  paid: string;
  balance: string;
  studentStatus: 'active' | 'inactive';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  approval: 'approved' | 'pending' | 'rejected';
  date: string;
}

@Component({
  selector: 'app-payments',
  template: `
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">Payments Directory</h5>
          </mat-card-title>
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" placeholder="Search payments..." class="search-input" />
            </div>
            <div class="view-mode-toggle d-flex align-items-center">
              <button (click)="viewMode = 'table'" class="toggle-btn" [class.active]="viewMode === 'table'">
                <i-tabler name="list" class="icon-18"></i-tabler>
              </button>
              <button (click)="viewMode = 'card'" class="toggle-btn" [class.active]="viewMode === 'card'">
                <i-tabler name="layout-grid" class="icon-18"></i-tabler>
              </button>
            </div>
            <button mat-flat-button color="primary" class="d-flex align-items-center" (click)="addPayment()">
              <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler>
              Add Payment
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content class="p-0">
          <div *ngIf="viewMode === 'table'" class="table-responsive view-container">
            <table mat-table [dataSource]="dataSource" class="w-100">
              
              <ng-container matColumnDef="studentName">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Student Name</th>
                <td mat-cell *matCellDef="let element">
                  <div class="d-flex align-items-center">
                    <img [src]="element.studentAvatar" class="rounded-circle m-r-12 object-cover" width="40" height="40" />
                    <span class="f-w-600 d-block text-dark f-s-14">{{ element.studentName }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="source">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Source</th>
                <td mat-cell *matCellDef="let element">
                  <span class="d-block f-w-500 text-dark f-s-13">{{ element.source }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="assigned">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Assigned</th>
                <td mat-cell *matCellDef="let element">
                  <div class="d-flex align-items-center">
                    <img [src]="element.assignedAvatar" class="rounded-circle m-r-8 object-cover" width="28" height="28" />
                    <span class="f-w-500 text-dark f-s-13">{{ element.assigned }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="paid">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Paid</th>
                <td mat-cell *matCellDef="let element">
                  <span class="d-block f-w-500 text-dark f-s-13">{{ element.paid }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Balance</th>
                <td mat-cell *matCellDef="let element">
                  <span class="d-block f-w-500 text-dark f-s-13">{{ element.balance }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="studentStatus">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Student Status</th>
                <td mat-cell *matCellDef="let element">
                  <span class="status-badge" [ngClass]="element.studentStatus">
                    {{ element.studentStatus | titlecase }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="paymentStatus">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Payment Status</th>
                <td mat-cell *matCellDef="let element">
                  <span class="status-badge" [ngClass]="element.paymentStatus">
                    {{ element.paymentStatus | titlecase }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="approval">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Approval</th>
                <td mat-cell *matCellDef="let element">
                  <span class="status-badge" [ngClass]="element.approval">
                    {{ element.approval | titlecase }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Date</th>
                <td mat-cell *matCellDef="let element" class="text-muted f-s-13">
                  {{ element.date }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14 text-center">Actions</th>
                <td mat-cell *matCellDef="let element" class="text-center">
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
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="element-row"></tr>
            </table>
          </div>

          <!-- Card View -->
          <div *ngIf="viewMode === 'card'" class="card-grid view-container p-24">
            <mat-card *ngFor="let element of dataSource.connect() | async" class="payment-card cardWithShadow">
              <mat-card-content class="p-16">
                <div class="d-flex align-items-center m-b-16">
                  <img [src]="element.studentAvatar" class="rounded-circle m-r-12 object-cover" width="48" height="48" />
                  <div>
                    <h6 class="mat-subtitle-1 f-w-600 m-b-0">{{ element.studentName }}</h6>
                    <span class="status-badge" [ngClass]="element.studentStatus">{{ element.studentStatus | titlecase }}</span>
                  </div>
                  <div class="m-l-auto">
                    <button mat-icon-button [matMenuTriggerFor]="cardMenu" class="text-muted">
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

          <mat-paginator [pageSizeOptions]="[5, 10, 15]" [pageSize]="10" showFirstLastButtons class="p-y-12"></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .table-container { padding: 24px; @media (max-width: 768px) { padding: 12px 8px; } }
    mat-card-header { @media (max-width: 576px) { flex-direction: column !important; align-items: flex-start !important; gap: 16px; } }
    .header-actions { @media (max-width: 576px) { width: 100%; justify-content: space-between; } button { white-space: nowrap; flex-shrink: 0; } }
    .table-responsive { width: 100%; overflow-x: auto; }
    table { min-width: 1050px; }
    .element-row { transition: background-color 0.2s ease; &:hover { background-color: #f8fafc; } }

    .view-container { animation: fadeIn 0.4s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; @media (max-width: 576px) { grid-template-columns: 1fr; padding: 16px !important; } }
    .payment-card { transition: transform 0.2s ease, box-shadow 0.2s ease; &:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; } }
    .view-mode-toggle { background-color: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; overflow: hidden; .toggle-btn { width: 42px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; color: #64748b; background: transparent; border: none; cursor: pointer; transition: all 0.2s ease; &.active { background-color: #615dff; color: #ffffff; } &:hover:not(.active) { background-color: #f1f5f9; } } }

    .status-badge {
      display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; text-transform: capitalize;
      &.active, &.paid, &.approved { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
      &.pending { background-color: rgba(255, 174, 31, 0.1); color: #ffae1f; }
      &.inactive, &.overdue, &.rejected { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    }

    .search-box {
      position: relative; display: flex; align-items: center; background-color: #f1f5f9; border-radius: 8px; padding: 0 12px; border: 1px solid #e2e8f0; width: 240px; height: 38px; transition: all 0.2s ease-in-out;
      @media (max-width: 576px) { width: calc(100% - 140px); }
      &:focus-within { background-color: #ffffff; border-color: #615dff; box-shadow: 0 0 0 3px rgba(97, 93, 255, 0.1); }
      .search-icon { color: #64748b; margin-right: 8px; }
      .search-input { border: none; background: transparent; outline: none; width: 100%; font-size: 13px; color: #1e293b; &::placeholder { color: #94a3b8; } }
    }

    .gap-12 { gap: 12px; } .m-r-12 { margin-right: 12px; } .m-r-8 { margin-right: 8px; } .m-r-4 { margin-right: 4px; } .p-0 { padding: 0 !important; } .object-cover { object-fit: cover; }

    :host-context(.dark-theme) {
      .element-row:hover { background-color: var(--dark-hoverbgcolor); }
      .search-box { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .search-input { color: #f8fafc; } }
      .view-mode-toggle { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .toggle-btn { color: #94a3b8; &.active { background-color: #615dff; color: #ffffff; } &:hover:not(.active) { background-color: var(--dark-hoverbgcolor); } } }
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
  displayedColumns: string[] = ['studentName', 'source', 'assigned', 'paid', 'balance', 'studentStatus', 'paymentStatus', 'approval', 'date', 'actions'];
  dataSource = new MatTableDataSource<Payment>(PAYMENT_DATA);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addPayment(): void {
    this.notificationService.showSuccessToast('Payment created successfully.', 'Success');
  }

  viewDetails(payment: Payment): void {
    this.notificationService.showSuccessToast(`Loading details for ${payment.studentName}.`, 'Loading');
  }

  editPayment(payment: Payment): void {
    this.notificationService.showSuccessToast(`Updates saved for ${payment.studentName}.`, 'Saved');
  }

  deletePayment(payment: Payment): void {
    this.notificationService.showErrorToast(`Payment for ${payment.studentName} deleted.`, 'Deleted');
  }
}

const PAYMENT_DATA: Payment[] = [
  { id: 1, studentName: 'John Doe', studentAvatar: '/assets/images/profile/user-1.jpg', source: 'Bank Transfer', assigned: 'Admin Officer', assignedAvatar: '/assets/images/profile/user-2.jpg', paid: '$1,200', balance: '$0', studentStatus: 'active', paymentStatus: 'paid', approval: 'approved', date: 'Oct 10, 2026' },
  { id: 2, studentName: 'Jane Smith', studentAvatar: '/assets/images/profile/user-3.jpg', source: 'Credit Card', assigned: 'Manager', assignedAvatar: '/assets/images/profile/user-4.jpg', paid: '$500', balance: '$1,000', studentStatus: 'active', paymentStatus: 'pending', approval: 'pending', date: 'Oct 12, 2026' },
];
