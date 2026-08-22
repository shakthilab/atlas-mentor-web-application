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
import { getPriorityTierLabel, getPrioritySubCategoryLabel, LEAD_PRIORITY_TIERS, getSubCategoriesForTier } from '../../constants/lead-classification.constants';
import { TranslateService } from '@ngx-translate/core';

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
  priority?: string;
  priorityDisplayName?: string;
  prioritySubCategory?: string;
  prioritySubCategoryDisplayName?: string;
  isUpdatingPriority?: boolean;
  isUpdatingSubCategory?: boolean;
}

@Component({
  selector: 'app-students',
  template: `
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">{{ 'students.title' | translate }}</h5>
          </mat-card-title>
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" [placeholder]="'students.searchPlaceholder' | translate" class="search-input" />
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
              {{ 'students.addStudent' | translate }}
            </button>
          </div>
        </mat-card-header>

        <mat-card-content class="p-0">
          <!-- Loading State -->
          <div *ngIf="isLoading" class="d-flex justify-content-center align-items-center p-24">
            <i-tabler name="loader" class="icon-24 spinning text-primary m-r-8"></i-tabler>
            <span class="f-s-14 text-muted">{{ 'students.loading' | translate }}</span>
          </div>

          <!-- Error State -->
          <div *ngIf="!isLoading && hasError" class="d-flex flex-column justify-content-center align-items-center p-24">
            <i-tabler name="alert-circle" class="icon-48 text-danger m-b-8"></i-tabler>
            <h6 class="mat-subtitle-1 m-b-4">{{ 'students.loadFailedTitle' | translate }}</h6>
            <span class="f-s-14 text-muted m-b-16">{{ 'leads.loadFailedDesc' | translate }}</span>
            <button mat-stroked-button color="primary" (click)="loadStudents(0, 10)">{{ 'common.tryAgain' | translate }}</button>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && !hasError && dataSource.data.length === 0" class="d-flex flex-column justify-content-center align-items-center p-24">
            <i-tabler name="inbox" class="icon-48 text-muted m-b-8"></i-tabler>
            <h6 class="mat-subtitle-1 m-b-4">{{ 'students.noStudentsFound' | translate }}</h6>
            <span class="f-s-14 text-muted">{{ 'students.noRegisteredStudents' | translate }}</span>
          </div>

          <div *ngIf="!isLoading && !hasError && dataSource.data.length > 0 && viewMode === 'table'" class="table-responsive view-container">
            <table mat-table [dataSource]="dataSource" class="w-100">

              <!-- Student Column -->
              <ng-container matColumnDef="student">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">{{ 'partnerDashboard.student' | translate }}</th>
                <td mat-cell *matCellDef="let element" (click)="viewProfile(element)" class="cursor-pointer">
                  <div class="d-flex align-items-center">
                     <img [src]="element.avatar" class="rounded-circle m-r-12 object-cover" width="40" height="40" />
                    <div>
                      <span class="f-w-600 d-block text-dark f-s-14">{{ element.name }}</span>
                      <span class="text-muted f-s-12 d-block">{{ element.major }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Contact Info Column -->
              <ng-container matColumnDef="contactInfo">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">{{ 'leads.colContactInfo' | translate }}</th>
                <td mat-cell *matCellDef="let element">
                  <span class="d-block f-w-500 text-dark f-s-13">{{ element.email }}</span>
                  <span class="text-muted f-s-12 d-block">{{ element.phone }}</span>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">{{ 'taskAccountability.taskTable.colStatus' | translate }}</th>
                <td mat-cell *matCellDef="let element">
                  <span class="status-badge" [ngClass]="element.status">
                    {{ (element.status === 'enrolled' ? 'students.enrolled' : element.status === 'pending' ? 'taskAccountability.pendingReview.pending' : 'students.completed') | translate }}
                  </span>
                </td>
              </ng-container>

              <!-- Source Column -->
              <ng-container matColumnDef="source">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">{{ 'leads.colSource' | translate }}</th>
                <td mat-cell *matCellDef="let element">
                  <span class="f-w-600 text-dark f-s-13">{{ element.source || '—' }}</span>
                </td>
              </ng-container>

              <!-- Shared dummy empty menu (avoids null panelId crash) -->
              <mat-menu #loadingMenu="matMenu"></mat-menu>

              <!-- Priority Column -->
              <ng-container matColumnDef="priority">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">{{ 'students.colPriority' | translate }}</th>
                <td mat-cell *matCellDef="let element" (click)="$event.stopPropagation()">
                  <span class="priority-badge cursor-pointer d-inline-flex align-items-center"
                        [ngClass]="element.priority ? element.priority.toLowerCase() : 'none'"
                        [matMenuTriggerFor]="element.isUpdatingPriority ? loadingMenu : priorityMenu">
                    {{ element.priority ? (element.priorityDisplayName || getPriorityLabel(element.priority)) : 'Not Set' }}
                    <i-tabler *ngIf="!element.isUpdatingPriority" name="chevron-down" class="icon-14 m-l-4"></i-tabler>
                    <i-tabler *ngIf="element.isUpdatingPriority" name="loader" class="icon-14 m-l-4 spinning"></i-tabler>
                  </span>
                  <mat-menu #priorityMenu="matMenu" class="priority-menu-panel" xPosition="before">
                    <ng-container *ngFor="let t of priorityTiers">
                      <button mat-menu-item [matMenuTriggerFor]="tierSubMenu" class="priority-menu-btn">
                        <div class="d-flex align-items-center gap-8">
                          <span class="priority-menu-dot" [ngClass]="t.value.toLowerCase()"></span>
                          <span class="f-w-500">{{ t.label }}</span>
                        </div>
                      </button>
                      <mat-menu #tierSubMenu="matMenu" class="subcategory-menu-panel">
                        <button mat-menu-item *ngFor="let sc of t.subCategories" (click)="changePriorityAndSubCategory(element, t.value, sc.value)">
                          <span class="f-w-500">{{ sc.label }}</span>
                        </button>
                      </mat-menu>
                    </ng-container>
                  </mat-menu>
                </td>
              </ng-container>

              <!-- Sub Category Column -->
              <ng-container matColumnDef="subCategory">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">{{ 'leads.colSubCategory' | translate }}</th>
                <td mat-cell *matCellDef="let element" (click)="$event.stopPropagation()">
                  <span class="subcategory-badge cursor-pointer d-inline-flex align-items-center"
                        [matMenuTriggerFor]="element.isUpdatingSubCategory ? loadingMenu : subCatMenu">
                    {{ element.prioritySubCategory ? (element.prioritySubCategoryDisplayName || getSubCategoryLabel(element.prioritySubCategory)) : 'Not Set' }}
                    <i-tabler *ngIf="!element.isUpdatingSubCategory" name="chevron-down" class="icon-14 m-l-4"></i-tabler>
                    <i-tabler *ngIf="element.isUpdatingSubCategory" name="loader" class="icon-14 m-l-4 spinning"></i-tabler>
                  </span>
                  <mat-menu #subCatMenu="matMenu" class="subcategory-menu-panel" xPosition="before">
                    <ng-container *ngIf="getSubCategoriesForPriority(element.priority) as subs">
                      <button mat-menu-item *ngFor="let sc of subs" (click)="changeSubCategory(element, sc.value)" class="subcategory-menu-btn">
                        <span class="f-w-500">{{ sc.label }}</span>
                      </button>
                      <div *ngIf="subs.length === 0" class="p-x-16 p-y-8 text-muted f-s-12">Set priority first</div>
                    </ng-container>
                  </mat-menu>
                </td>
              </ng-container>

              <!-- Active Status Column -->
              <ng-container matColumnDef="activeStatus">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">{{ 'common.active' | translate }}</th>
                <td mat-cell *matCellDef="let element">
                  <span class="status-badge" [ngClass]="element.isActive ? 'active' : 'inactive'">
                    {{ (element.isActive ? 'common.active' : 'common.inactive') | translate }}
                  </span>
                </td>
              </ng-container>

              <!-- Counsellor Column -->
              <ng-container matColumnDef="counsellor">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">{{ 'students.colCounsellor' | translate }}</th>
                <td mat-cell *matCellDef="let element">
                  <div class="d-flex align-items-center">
                    <img [src]="element.counsellorAvatar" class="rounded-circle m-r-8 object-cover" width="28" height="28" />
                    <span class="f-w-500 text-dark f-s-13">{{ element.counsellor }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Added By Column -->
              <ng-container matColumnDef="addedBy">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">{{ 'leads.colAddedBy' | translate }}</th>
                <td mat-cell *matCellDef="let element">
                  <span class="f-w-500 text-dark d-block f-s-13">{{ element.addedBy }}</span>
                  <span class="text-muted f-s-11 d-block">{{ element.addedByRole }}</span>
                </td>
              </ng-container>

              <!-- Country/University Column -->
              <ng-container matColumnDef="countryUniversity">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">{{ 'leads.colCountryUniversity' | translate }}</th>
                <td mat-cell *matCellDef="let element">
                  <span class="f-w-500 text-dark d-block f-s-13">{{ element.country }}</span>
                  <span class="text-muted f-s-12 d-block">{{ element.university }}</span>
                </td>
              </ng-container>

              <!-- Joined Date Column -->
              <ng-container matColumnDef="joinedDate">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">{{ 'students.colJoinedDate' | translate }}</th>
                <td mat-cell *matCellDef="let element" class="text-muted f-s-13">
                  {{ element.joinedDate }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14 text-center">{{ 'common.actions' | translate }}</th>
                <td mat-cell *matCellDef="let element" class="text-center" (click)="$event.stopPropagation()">
                  <button mat-icon-button [matMenuTriggerFor]="menu" class="text-muted">
                    <i-tabler name="dots" class="icon-18"></i-tabler>
                  </button>
                  <mat-menu #menu="matMenu" class="cardWithShadow">
                    <button mat-menu-item (click)="viewProfile(element)">
                      <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                      <span>{{ 'students.viewProfile' | translate }}</span>
                    </button>
                    <button mat-menu-item (click)="editDetails(element)">
                      <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                      <span>{{ 'employees.editDetails' | translate }}</span>
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item *ngIf="!element.isActive" (click)="toggleStatus(element)">
                      <i-tabler name="user-check" class="icon-16 m-r-8 text-success"></i-tabler>
                      <span>{{ 'common.activate' | translate }}</span>
                    </button>
                    <button mat-menu-item *ngIf="element.isActive" (click)="toggleStatus(element)">
                      <i-tabler name="user-x" class="icon-16 m-r-8 text-warning"></i-tabler>
                      <span>{{ 'common.deactivate' | translate }}</span>
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item class="text-danger" (click)="removeStudent(element)">
                      <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                      <span>{{ 'students.remove' | translate }}</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="student-row" (click)="viewProfile(row)"></tr>
            </table>
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
                        <span>{{ 'students.viewProfile' | translate }}</span>
                      </button>
                      <button mat-menu-item (click)="editDetails(element)">
                        <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                        <span>{{ 'employees.editDetails' | translate }}</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item *ngIf="!element.isActive" (click)="toggleStatus(element)">
                        <i-tabler name="user-check" class="icon-16 m-r-8 text-success"></i-tabler>
                        <span>{{ 'common.activate' | translate }}</span>
                      </button>
                      <button mat-menu-item *ngIf="element.isActive" (click)="toggleStatus(element)">
                        <i-tabler name="user-x" class="icon-16 m-r-8 text-warning"></i-tabler>
                        <span>{{ 'common.deactivate' | translate }}</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item class="text-danger" (click)="removeStudent(element)">
                        <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                        <span>{{ 'students.remove' | translate }}</span>
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
                      {{ (element.isActive ? 'common.active' : 'common.inactive') | translate }}
                    </span>
                    <span class="status-badge" [ngClass]="element.status">
                      {{ (element.status === 'enrolled' ? 'students.enrolled' : element.status === 'pending' ? 'taskAccountability.pendingReview.pending' : 'students.completed') | translate }}
                    </span>
                  </div>
                </div>

                <mat-divider class="m-b-12"></mat-divider>
                <div class="d-flex align-items-center justify-content-between text-muted f-s-12 m-b-8">
                  <span class="d-flex align-items-center"><i-tabler name="map-pin" class="icon-14 m-r-4"></i-tabler> {{ element.country }}</span>
                  <span class="d-flex align-items-center"><i-tabler name="calendar" class="icon-14 m-r-4"></i-tabler> {{ element.joinedDate }}</span>
                </div>
                <div class="d-flex align-items-center text-muted f-s-12">
                  <span class="d-flex align-items-center"><i-tabler name="world" class="icon-14 m-r-4"></i-tabler> {{ 'leads.colSource' | translate }}: {{ element.source || '—' }}</span>
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
          background-color: #2D2E32;
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
    
    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    
    table {
      min-width: 1250px;
    }

    .student-row {
      transition: background-color 0.2s ease;
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
      
      &.enrolled {
        background-color: rgba(45,46,50, 0.1);
        color: #2D2E32;
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

    .priority-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 6px;
      transition: all 0.2s ease;

      &.p1 {
        background-color: rgba(250, 137, 107, 0.12);
        color: #fa896b;
      }
      &.p2 {
        background-color: rgba(255, 174, 31, 0.12);
        color: #ffae1f;
      }
      &.p3 {
        background-color: rgba(45, 46, 50, 0.1);
        color: #2D2E32;
      }
      &.none {
        background-color: rgba(148, 163, 184, 0.1);
        color: #94a3b8;
      }
      &:hover { opacity: 0.85; }
    }

    .subcategory-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 500;
      border-radius: 6px;
      background-color: rgba(99, 102, 241, 0.08);
      color: #6366f1;
      border: 1px solid rgba(99, 102, 241, 0.15);
      transition: all 0.2s ease;
      &:hover { opacity: 0.85; }
    }

    ::ng-deep .priority-menu-panel {
      min-width: 170px !important;
      border-radius: 12px !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.06) !important;
      background-color: #ffffff !important;
      padding: 6px 0 !important;
      overflow: hidden !important;

      .priority-menu-btn {
        height: 40px !important;
        line-height: 40px !important;
        padding: 0 16px !important;
        transition: all 0.15s ease !important;
        &:hover { background-color: #f8fafc !important; }
      }
    }

    .priority-menu-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      &.p1 { background-color: #fa896b; }
      &.p2 { background-color: #ffae1f; }
      &.p3 { background-color: #94a3b8; }
    }

    ::ng-deep .subcategory-menu-panel {
      min-width: 200px !important;
      max-width: 300px !important;
      border-radius: 12px !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.06) !important;
      background-color: #ffffff !important;
      padding: 6px 0 !important;
      overflow: hidden !important;

      .subcategory-menu-btn {
        height: 38px !important;
        line-height: 38px !important;
        padding: 0 16px !important;
        font-size: 13px !important;
        transition: all 0.15s ease !important;
        white-space: normal !important;
        &:hover { background-color: #f8fafc !important; }
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
        border-color: #2D2E32;
        box-shadow: 0 0 0 3px rgba(45,46,50, 0.1);
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
          &.active { background-color: #2D2E32; color: #ffffff; }
          &:hover:not(.active) { background-color: var(--dark-hoverbgcolor); }
        }
      }
      .status-badge {
        &.enrolled {
          background-color: rgba(45,46,50, 0.2);
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
      .priority-badge {
        &.p1 {
          background-color: rgba(250, 137, 107, 0.2);
          color: #ffab91;
        }
        &.p2 {
          background-color: rgba(255, 174, 31, 0.2);
          color: #ffca70;
        }
        &.p3 {
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        &.none {
          background-color: rgba(148, 163, 184, 0.15);
          color: #94a3b8;
        }
      }

      .subcategory-badge {
        background-color: rgba(99, 102, 241, 0.15);
        color: #a5b4fc;
        border-color: rgba(99, 102, 241, 0.25);
      }

      ::ng-deep .priority-menu-panel {
        background-color: var(--dark-sidebarbg, #1e293b) !important;
        border-color: var(--dark-formborderColor, #334155) !important;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3) !important;
        .priority-menu-btn {
          &:hover {
            background-color: var(--dark-hoverbgcolor, #334155) !important;
          }
          span { color: #f8fafc; }
        }
      }

      ::ng-deep .subcategory-menu-panel {
        background-color: var(--dark-sidebarbg, #1e293b) !important;
        border-color: var(--dark-formborderColor, #334155) !important;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3) !important;
        .subcategory-menu-btn {
          &:hover {
            background-color: var(--dark-hoverbgcolor, #334155) !important;
          }
          span { color: #f8fafc; }
        }
        .text-muted { color: #94a3b8 !important; }
      }
    }
  `]
})
export class StudentsComponent implements OnInit, AfterViewInit, OnDestroy {
  viewMode: 'table' | 'card' = 'table';
  isLoading = false;
  hasError = false;
  totalElements = 0;

  displayedColumns: string[] = [
    'student',
    'contactInfo',
    'status',
    'source',
    'priority',
    'subCategory',
    'activeStatus',
    'counsellor',
    'addedBy',
    'countryUniversity',
    'joinedDate',
    'actions'
  ];

  dataSource = new MatTableDataSource<Student>([]);
  priorityTiers = LEAD_PRIORITY_TIERS;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private studentService: StudentService,
    private leadService: LeadService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

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
        this.notificationService.showErrorToast(this.translate.instant('students.toast.loadFailed'), this.translate.instant('employees.toast.errorTitle'));
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
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
                this.notificationService.showSuccessToast(this.translate.instant('leads.toast.updatesSaved', { name: student.name }), this.translate.instant('leads.toast.changesSaved'));
                this.loadStudents(this.paginator?.pageIndex || 0, this.paginator?.pageSize || 10);
              },
              error: (err) => {
                console.error('Failed to update student profile:', err);
                const errorMessage = err.error?.message || err.message || this.translate.instant('students.toast.saveUpdatesFailed');
                this.notificationService.showErrorPopup(errorMessage, this.translate.instant('students.toast.updateFailedTitle'), this.translate.instant('common.close')).subscribe();
              }
            });
          }
        });
      },
      error: (err) => {
        console.error('Failed to load student details:', err);
        this.notificationService.showErrorPopup(this.translate.instant('students.toast.loadDetailsFailed'), this.translate.instant('employees.toast.errorTitle'), this.translate.instant('common.close')).subscribe();
      }
    });
  }

  removeStudent(student: Student): void {
    if (!student.id) return;
    this.notificationService.showErrorPopup(
      this.translate.instant('students.confirmRemoveMessage', { name: student.name }),
      this.translate.instant('employees.confirmDeleteTitle'),
      this.translate.instant('common.delete')
    ).subscribe(() => {
      this.leadService.deleteLead(student.id).subscribe({
        next: () => {
          this.notificationService.showSuccessToast(this.translate.instant('students.toast.removed', { name: student.name }), this.translate.instant('leads.toast.deleted'));
          this.loadStudents(this.paginator?.pageIndex || 0, this.paginator?.pageSize || 10);
        },
        error: (err) => {
          console.error('Failed to remove student:', err);
          const errorMessage = err.error?.message || err.message || this.translate.instant('students.toast.removeFailed');
          this.notificationService.showErrorPopup(errorMessage, this.translate.instant('students.toast.deletionFailedTitle'), this.translate.instant('common.close')).subscribe();
        }
      });
    });
  }

  getPriorityLabel(priority: string): string {
    return getPriorityTierLabel(priority);
  }

  getSubCategoryLabel(subCategory: string): string {
    return getPrioritySubCategoryLabel(subCategory);
  }

  getSubCategoriesForPriority(priority: string | undefined): { value: string; label: string }[] {
    return getSubCategoriesForTier(priority);
  }

  changePriority(student: Student, newPriority: string): void {
    if (student.priority === newPriority) return;
    if (!student.id) return;
    student.isUpdatingPriority = true;
    this.studentService.updateStudentPriority(student.id, { priority: newPriority }).subscribe({
      next: () => {
        student.isUpdatingPriority = false;
        this.notificationService.showSuccessToast(`Priority updated to ${getPriorityTierLabel(newPriority)}.`, 'Success');
        this.loadStudents(this.paginator?.pageIndex || 0, this.paginator?.pageSize || 10);
      },
      error: (err) => {
        student.isUpdatingPriority = false;
        console.error('Failed to update priority:', err);
        const errorMessage = err.error?.message || err.message || 'Failed to update priority.';
        this.notificationService.showErrorPopup(errorMessage, 'Update Failed', 'Close').subscribe();
      }
    });
  }

  changePriorityAndSubCategory(student: Student, newPriority: string, newSubCategory: string): void {
    if (student.priority === newPriority && student.prioritySubCategory === newSubCategory) return;
    if (!student.id) return;
    student.isUpdatingPriority = true;
    student.isUpdatingSubCategory = true;
    this.studentService.updateStudentPriority(student.id, { priority: newPriority, prioritySubCategory: newSubCategory }).subscribe({
      next: () => {
        student.isUpdatingPriority = false;
        student.isUpdatingSubCategory = false;
        this.notificationService.showSuccessToast(`Priority updated to ${getPriorityTierLabel(newPriority)} and sub-category to ${getPrioritySubCategoryLabel(newSubCategory)}.`, 'Success');
        this.loadStudents(this.paginator?.pageIndex || 0, this.paginator?.pageSize || 10);
      },
      error: (err) => {
        student.isUpdatingPriority = false;
        student.isUpdatingSubCategory = false;
        console.error('Failed to update priority and sub-category:', err);
        const errorMessage = err.error?.message || err.message || 'Failed to update priority and sub-category.';
        this.notificationService.showErrorPopup(errorMessage, 'Update Failed', 'Close').subscribe();
      }
    });
  }

  changeSubCategory(student: Student, newSubCategory: string): void {
    if (student.prioritySubCategory === newSubCategory) return;
    if (!student.id) return;
    student.isUpdatingSubCategory = true;
    this.studentService.updateStudentPriority(student.id, { prioritySubCategory: newSubCategory }).subscribe({
      next: () => {
        student.isUpdatingSubCategory = false;
        this.notificationService.showSuccessToast(`Sub-category updated to ${getPrioritySubCategoryLabel(newSubCategory)}.`, 'Success');
        this.loadStudents(this.paginator?.pageIndex || 0, this.paginator?.pageSize || 10);
      },
      error: (err) => {
        student.isUpdatingSubCategory = false;
        console.error('Failed to update sub-category:', err);
        const errorMessage = err.error?.message || err.message || 'Failed to update sub-category.';
        this.notificationService.showErrorPopup(errorMessage, 'Update Failed', 'Close').subscribe();
      }
    });
  }

  toggleStatus(student: Student): void {
    if (!student.id) return;
    
    const newStatus = student.isActive ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

    this.studentService.updateActiveStatus(student.id, newStatus).subscribe({
      next: () => {
        this.notificationService.showSuccessToast(
          this.translate.instant(newStatus === 'ACTIVE' ? 'employees.toast.activated' : 'employees.toast.deactivated'),
          this.translate.instant('employees.toast.statusUpdated')
        );
        this.loadStudents(this.paginator?.pageIndex || 0, this.paginator?.pageSize || 10);
      },
      error: (err) => {
        console.error(`Failed to ${actionText} student:`, err);
        const errorMessage = err.error?.message || err.message || this.translate.instant(newStatus === 'ACTIVE' ? 'employees.toast.activateFailed' : 'employees.toast.deactivateFailed');
        this.notificationService.showErrorToast(errorMessage, this.translate.instant('students.toast.updateFailedTitle'));
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
    priority: dto.priority || '',
    priorityDisplayName: dto.priorityDisplayName || '',
    prioritySubCategory: dto.prioritySubCategory || '',
    prioritySubCategoryDisplayName: dto.prioritySubCategoryDisplayName || '',
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
