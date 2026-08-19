import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';
import { StudentService, RegisteredStudentDto } from '../../../core/services/student.service';
import { LeadService } from '../../../core/services/lead.service';
import { StudentDetailsDialogComponent } from './student-details-dialog/student-details-dialog.component';
import { AddLeadDialogComponent } from '../leads/add-lead-dialog/add-lead-dialog.component';
import { TableColumn } from '../data-table/data-table.models';
import { createSearchPredicate, encodeSearch } from '../data-table/table-filter.util';

export interface Student {
  id: number;
  name: string;
  major: string;
  avatar: string;
  email: string;
  phone: string;
  status: 'enrolled' | 'pending' | 'completed';
  counsellor: string;
  counsellorAvatar: string;
  addedBy: string;
  addedByRole: string;
  country: string;
  university: string;
  joinedDate: string;
  rawStatus?: string;
  isActive?: boolean;
  source?: string;
}

@Component({
  selector: 'app-students',
  template: `
    <div class="page-head">
      <div>
        <div class="eyebrow">Management</div>
        <h1 class="page-title">Students Directory</h1>
        <p class="page-sub">Track every enrolled and prospective student in one place.</p>
      </div>
    </div>
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">Students Directory</h5>
          </mat-card-title>
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" placeholder="Search students..." class="search-input" />
            </div>
            <div class="view-mode-toggle d-flex align-items-center">
              <button (click)="viewMode = 'table'" class="toggle-btn" [class.active]="viewMode === 'table'">
                <i-tabler name="list" class="icon-18"></i-tabler>
              </button>
              <button (click)="viewMode = 'card'" class="toggle-btn" [class.active]="viewMode === 'card'">
                <i-tabler name="layout-grid" class="icon-18"></i-tabler>
              </button>
            </div>
            <button mat-flat-button color="primary" class="add-btn d-flex align-items-center" (click)="addStudent()">
              <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler>
              Add Student
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content class="p-0">
          <!-- Loading State -->
          <div *ngIf="isLoading" class="d-flex justify-content-center align-items-center p-24">
            <i-tabler name="loader" class="icon-24 spinning text-primary m-r-8"></i-tabler>
            <span class="f-s-14 text-muted">Loading students...</span>
          </div>

          <!-- Error State -->
          <div *ngIf="!isLoading && hasError" class="d-flex flex-column justify-content-center align-items-center p-24">
            <i-tabler name="alert-circle" class="icon-48 text-danger m-b-8"></i-tabler>
            <h6 class="mat-subtitle-1 m-b-4">Failed to load students</h6>
            <span class="f-s-14 text-muted m-b-16">There was an error communicating with the server.</span>
            <button mat-stroked-button color="primary" (click)="loadStudents(0, 10)">Try Again</button>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && !hasError && dataSource.data.length === 0" class="d-flex flex-column justify-content-center align-items-center p-24">
            <i-tabler name="inbox" class="icon-48 text-muted m-b-8"></i-tabler>
            <h6 class="mat-subtitle-1 m-b-4">No students found</h6>
            <span class="f-s-14 text-muted">No registered students found.</span>
          </div>

          <div *ngIf="!isLoading && !hasError && dataSource.data.length > 0 && viewMode === 'table'" class="view-container">
            <app-data-table
              [columns]="tableColumns"
              [rows]="dataSource.filteredData"
              trackByKey="id"
              [clickableRows]="true"
              exportFileName="students"
              (rowClick)="viewProfile($event)"
            >
              <ng-template appRowActions let-element="row">
                <button mat-icon-button [matMenuTriggerFor]="menu" class="text-muted">
                  <i-tabler name="dots" class="icon-18"></i-tabler>
                </button>
                <mat-menu #menu="matMenu" class="cardWithShadow">
                  <button mat-menu-item (click)="viewProfile(element)">
                    <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                    <span>View profile</span>
                  </button>
                  <button mat-menu-item (click)="editDetails(element)">
                    <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                    <span>Edit details</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item *ngIf="!element.isActive" (click)="toggleStatus(element)">
                    <i-tabler name="user-check" class="icon-16 m-r-8 text-success"></i-tabler>
                    <span>Activate</span>
                  </button>
                  <button mat-menu-item *ngIf="element.isActive" (click)="toggleStatus(element)">
                    <i-tabler name="user-x" class="icon-16 m-r-8 text-warning"></i-tabler>
                    <span>Deactivate</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item class="text-danger" (click)="removeStudent(element)">
                    <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                    <span>Remove</span>
                  </button>
                </mat-menu>
              </ng-template>
            </app-data-table>
          </div>

          <!-- Card View -->
          <div *ngIf="!isLoading && !hasError && dataSource.data.length > 0 && viewMode === 'card'" class="card-grid view-container p-24">
            <mat-card *ngFor="let element of dataSource.filteredData" class="student-card cardWithShadow cursor-pointer" (click)="viewProfile(element)">
              <mat-card-content class="p-16">
                <div class="d-flex align-items-center m-b-16">
                  <img [src]="element.avatar" class="rounded-circle m-r-12 object-cover" width="48" height="48" />
                  <div>
                    <h6 class="mat-subtitle-1 f-w-600 m-b-0">{{ element.name }}</h6>
                    <span class="f-s-13 text-muted">{{ element.major }}</span>
                  </div>
                  <div class="m-l-auto">
                    <button mat-icon-button [matMenuTriggerFor]="cardMenu" class="text-muted" (click)="$event.stopPropagation()">
                      <i-tabler name="dots-vertical" class="icon-18"></i-tabler>
                    </button>
                    <mat-menu #cardMenu="matMenu" class="cardWithShadow">
                      <button mat-menu-item (click)="viewProfile(element)">
                        <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                        <span>View profile</span>
                      </button>
                      <button mat-menu-item (click)="editDetails(element)">
                        <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                        <span>Edit details</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item *ngIf="!element.isActive" (click)="toggleStatus(element)">
                        <i-tabler name="user-check" class="icon-16 m-r-8 text-success"></i-tabler>
                        <span>Activate</span>
                      </button>
                      <button mat-menu-item *ngIf="element.isActive" (click)="toggleStatus(element)">
                        <i-tabler name="user-x" class="icon-16 m-r-8 text-warning"></i-tabler>
                        <span>Deactivate</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item class="text-danger" (click)="removeStudent(element)">
                        <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                        <span>Remove</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>
                
                <div class="d-flex align-items-center justify-content-between m-b-12">
                  <span class="f-s-13 text-muted d-flex align-items-center"><i-tabler name="mail" class="icon-16 m-r-4"></i-tabler> {{ element.email }}</span>
                </div>
                <div class="d-flex align-items-center justify-content-between m-b-16">
                  <span class="f-s-13 text-muted d-flex align-items-center"><i-tabler name="phone" class="icon-16 m-r-4"></i-tabler> {{ element.phone }}</span>
                </div>
                
                <div class="d-flex align-items-center justify-content-between m-b-16">
                  <div class="d-flex align-items-center">
                    <img [src]="element.counsellorAvatar" class="rounded-circle m-r-8 object-cover" width="24" height="24" />
                    <span class="f-s-13 text-muted">{{ element.counsellor }}</span>
                  </div>
                  <div class="d-flex gap-12">
                    <span class="status-badge" [ngClass]="element.isActive ? 'active' : 'inactive'">
                      {{ element.isActive ? 'Active' : 'Inactive' }}
                    </span>
                    <span class="status-badge" [ngClass]="element.status">
                      {{ element.status === 'enrolled' ? 'Enrolled' : element.status === 'pending' ? 'Pending' : 'Completed' }}
                    </span>
                  </div>
                </div>
                
                <mat-divider class="m-b-12"></mat-divider>
                <div class="d-flex align-items-center justify-content-between text-muted f-s-12 m-b-8">
                  <span class="d-flex align-items-center"><i-tabler name="map-pin" class="icon-14 m-r-4"></i-tabler> {{ element.country }}</span>
                  <span class="d-flex align-items-center"><i-tabler name="calendar" class="icon-14 m-r-4"></i-tabler> {{ element.joinedDate }}</span>
                </div>
                <div class="d-flex align-items-center text-muted f-s-12">
                  <span class="d-flex align-items-center"><i-tabler name="world" class="icon-14 m-r-4"></i-tabler> Source: {{ element.source || '—' }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <mat-paginator [pageSizeOptions]="[5, 10, 15]" [pageSize]="10" [length]="totalElements" showFirstLastButtons class="p-y-12"></mat-paginator>
        </mat-card-content>
      </mat-card>
      
      <!-- Mobile FAB -->
      <button mat-fab color="primary" class="mobile-fab" (click)="addStudent()">
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

    .view-container {
      animation: fadeIn 0.4s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
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

    .student-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
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
          background-color: var(--brand-primary);
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

      button.add-btn {
        white-space: nowrap;
        flex-shrink: 0;
        @media (max-width: 576px) {
          display: none !important;
        }
      }
    }
    
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
      
      &.enrolled {
        background-color: rgba(var(--brand-primary-rgb), 0.1);
        color: var(--brand-primary);
      }
      
      &.pending {
        background-color: rgba(255, 174, 31, 0.1);
        color: #ffae1f;
      }
      
      &.completed {
        background-color: rgba(19, 222, 185, 0.1);
        color: #13deb9;
      }
      
      &.active {
        background-color: rgba(19, 222, 185, 0.1);
        color: #13deb9;
      }
      
      &.inactive {
        background-color: rgba(250, 137, 107, 0.1);
        color: #fa896b;
      }
    }

    /* Header Actions */
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 0 12px;
      border: 1px solid #e2e8f0;
      width: 240px;
      height: 38px;
      transition: all 0.2s ease-in-out;
      
      @media (max-width: 576px) {
        width: calc(100% - 140px);
      }
      
      &:focus-within {
        background-color: #ffffff;
        border-color: var(--brand-primary);
        box-shadow: 0 0 0 3px rgba(var(--brand-primary-rgb), 0.1);
      }
      
      .search-icon {
        color: #64748b;
        margin-right: 8px;
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

    .gap-12 {
      gap: 12px;
    }
    .m-r-12 { margin-right: 12px; }
    .m-r-8 { margin-right: 8px; }
    .m-r-4 { margin-right: 4px; }
    .p-0 { padding: 0 !important; }
    .object-cover { object-fit: cover; }
    .cursor-pointer { cursor: pointer; }
    .text-success { color: #13deb9 !important; }
    .text-warning { color: #ffae1f !important; }

    :host-context(.dark-theme) {
      .student-row:hover {
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
          &.active { background-color: var(--brand-primary); color: #ffffff; }
          &:hover:not(.active) { background-color: var(--dark-hoverbgcolor); }
        }
      }
      .status-badge {
        &.enrolled {
          background-color: rgba(var(--brand-primary-rgb), 0.2);
          color: #a5a2ff;
        }
        &.pending {
          background-color: rgba(255, 174, 31, 0.2);
          color: #ffe082;
        }
        &.completed {
          background-color: rgba(19, 222, 185, 0.2);
          color: #80f1d4;
        }
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
export class StudentsComponent implements OnInit, AfterViewInit, OnDestroy {
  viewMode: 'table' | 'card' = 'table';
  isLoading = false;
  hasError = false;
  totalElements = 0;

  tableColumns: TableColumn<Student>[] = [
    {
      key: 'student', header: 'Student', type: 'avatar',
      avatarFn: r => r.avatar, valueFn: r => r.name, subFn: r => r.major,
    },
    {
      key: 'contactInfo', header: 'Contact Info', type: 'two-line',
      valueFn: r => r.email, subFn: r => r.phone, maxWidth: '170px',
    },
    {
      key: 'status', header: 'Status', type: 'pill',
      valueFn: r => r.status === 'enrolled' ? 'Enrolled' : r.status === 'pending' ? 'Pending' : 'Completed',
      classFn: r => r.status === 'enrolled' ? 'pill--info' : r.status === 'pending' ? 'pill--warning' : 'pill--success',
    },
    { key: 'source', header: 'Source', type: 'text', valueFn: r => r.source || '—', maxWidth: '110px' },
    {
      key: 'activeStatus', header: 'Active', type: 'pill',
      valueFn: r => r.isActive ? 'Active' : 'Inactive',
      classFn: r => r.isActive ? 'pill--success' : 'pill--danger',
    },
    {
      key: 'counsellor', header: 'Counsellor', type: 'avatar',
      avatarFn: r => r.counsellorAvatar, valueFn: r => r.counsellor,
    },
    {
      key: 'addedBy', header: 'Added By', type: 'two-line',
      valueFn: r => r.addedBy, subFn: r => r.addedByRole, maxWidth: '150px',
    },
    {
      key: 'countryUniversity', header: 'Country / University', type: 'two-line',
      valueFn: r => r.country, subFn: r => r.university, maxWidth: '170px',
    },
    {
      key: 'joinedDate', header: 'Joined Date', type: 'date',
      valueFn: r => r.joinedDate,
    },
    {
      key: 'actions', header: 'Actions', type: 'actions', align: 'right',
    },
  ];

  private searchText = '';

  dataSource = new MatTableDataSource<Student>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private studentService: StudentService,
    private leadService: LeadService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.dataSource.filterPredicate = createSearchPredicate();
  }

  ngOnInit(): void {
    this.loadStudents(0, 10);
  }

  ngAfterViewInit(): void {
    this.paginator.page.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadStudents(this.paginator.pageIndex, this.paginator.pageSize);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStudents(page: number, size: number): void {
    this.isLoading = true;
    this.hasError = false;
    this.studentService.getRegisteredStudents(page, size).subscribe({
      next: (res) => {
        this.dataSource.data = res.content.map(mapToStudent);
        this.totalElements = res.totalElements;
        this.isLoading = false;
        this.hasError = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
        this.notificationService.showErrorToast('Failed to load students.', 'Error');
      }
    });
  }

  applyFilter(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value;
    this.dataSource.filter = encodeSearch(this.searchText);
  }

  addStudent(): void {
    this.router.navigate(['../leads'], { relativeTo: this.route, queryParams: { openAdd: 'true' } });
  }

  viewProfile(student: Student): void {
    this.dialog.open(StudentDetailsDialogComponent, {
      data: student,
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'student-details-dialog'
    });
  }

  editDetails(student: Student): void {
    if (!student.id) return;

    this.leadService.getLead(student.id).subscribe({
      next: (res) => {
        const fullStudent = res?.data || res;
        const dialogRef = this.dialog.open(AddLeadDialogComponent, {
          width: '1000px',
          maxWidth: '95vw',
          height: '680px',
          maxHeight: '95vh',
          panelClass: 'onboarding-dialog',
          disableClose: true,
          data: fullStudent
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.leadService.updateLead(student.id!, result).subscribe({
              next: () => {
                this.notificationService.showSuccessToast(`Profile updates saved for ${student.name}.`, 'Changes Saved');
                this.loadStudents(this.paginator?.pageIndex || 0, this.paginator?.pageSize || 10);
              },
              error: (err) => {
                console.error('Failed to update student profile:', err);
                const errorMessage = err.error?.message || err.message || 'Failed to save student profile updates.';
                this.notificationService.showErrorPopup(errorMessage, 'Update Failed', 'Close').subscribe();
              }
            });
          }
        });
      },
      error: (err) => {
        console.error('Failed to load student details:', err);
        this.notificationService.showErrorPopup('Failed to load student details.', 'Error', 'Close').subscribe();
      }
    });
  }

  removeStudent(student: Student): void {
    if (!student.id) return;
    this.notificationService.showErrorPopup(
      `Are you sure you want to deactivate and remove student ${student.name} from the directory?`,
      'Confirm Deletion',
      'Delete'
    ).subscribe(() => {
      this.leadService.deleteLead(student.id).subscribe({
        next: () => {
          this.notificationService.showSuccessToast(`${student.name} has been removed.`, 'Deleted');
          this.loadStudents(this.paginator?.pageIndex || 0, this.paginator?.pageSize || 10);
        },
        error: (err) => {
          console.error('Failed to remove student:', err);
          const errorMessage = err.error?.message || err.message || 'Failed to remove the student.';
          this.notificationService.showErrorPopup(errorMessage, 'Deletion Failed', 'Close').subscribe();
        }
      });
    });
  }

  toggleStatus(student: Student): void {
    if (!student.id) return;
    
    const newStatus = student.isActive ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

    this.studentService.updateActiveStatus(student.id, newStatus).subscribe({
      next: () => {
        this.notificationService.showSuccessToast(`Student ${actionText}d successfully.`, 'Status Updated');
        this.loadStudents(this.paginator?.pageIndex || 0, this.paginator?.pageSize || 10);
      },
      error: (err) => {
        console.error(`Failed to ${actionText} student:`, err);
        const errorMessage = err.error?.message || err.message || `Failed to ${actionText} student.`;
        this.notificationService.showErrorToast(errorMessage, 'Update Failed');
      }
    });
  }
}

function mapToStudent(dto: RegisteredStudentDto): Student {
  const joinedDate = dto.createdAt
    ? new Date(dto.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  return {
    id: dto.id,
    name: dto.fullName || `${dto.firstName} ${dto.lastName}`.trim() || '—',
    major: dto.courseName || '—',
    avatar: '/assets/images/profile/user-1.jpg',
    email: dto.email,
    phone: dto.phone || '—',
    status: mapStatus(dto.status),
    counsellor: dto.assignedByName || '—',
    counsellorAvatar: '/assets/images/profile/user-1.jpg',
    addedBy: dto.createdByName || '—',
    addedByRole: dto.branchName || '—',
    country: dto.countryName || '—',
    university: dto.universityName || '—',
    joinedDate,
    rawStatus: dto.status,
    isActive: dto.isActive,
    source: dto.source || '—',
  };
}

function mapStatus(status?: string): 'enrolled' | 'pending' | 'completed' {
  switch (status?.toUpperCase()) {
    case 'ENROLLED':
    case 'ACTIVE':
    case 'REGISTERED': return 'enrolled';
    case 'COMPLETED':
    case 'GRADUATED': return 'completed';
    default: return 'pending';
  }
}
