import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NotificationService } from '../../../core/services/notification.service';

export interface Resource {
  id: number;
  resourceDetail: string;
  type: string;
  ownership: string;
  storage: string;
  created: string;
  status: 'available' | 'in-use' | 'archived';
}

@Component({
  selector: 'app-resources',
  template: `
    <div class="table-container">
      <mat-card class="cardWithShadow">
        <mat-card-header class="d-flex align-items-center justify-content-between p-x-24 p-y-16">
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">Resources Directory</h5>
          </mat-card-title>
          <div class="header-actions d-flex align-items-center gap-12">
            <div class="search-box">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" placeholder="Search resources..." class="search-input" />
            </div>
            <div class="view-mode-toggle d-flex align-items-center">
              <button mat-icon-button (click)="viewMode = 'table'" [color]="viewMode === 'table' ? 'primary' : ''" class="toggle-btn" [class.active]="viewMode === 'table'">
                <i-tabler name="list" class="icon-18"></i-tabler>
              </button>
              <button mat-icon-button (click)="viewMode = 'card'" [color]="viewMode === 'card' ? 'primary' : ''" class="toggle-btn" [class.active]="viewMode === 'card'">
                <i-tabler name="layout-grid" class="icon-18"></i-tabler>
              </button>
            </div>
            <button mat-flat-button color="primary" class="d-flex align-items-center" (click)="addResource()">
              <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler>
              Add Resource
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content class="p-0">
          <div *ngIf="viewMode === 'table'" class="table-responsive view-container">
            <table mat-table [dataSource]="dataSource" class="w-100">
              
              <ng-container matColumnDef="resourceDetail">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Resource Detail</th>
                <td mat-cell *matCellDef="let element">
                  <span class="f-w-600 d-block text-dark f-s-14">{{ element.resourceDetail }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Type</th>
                <td mat-cell *matCellDef="let element">
                  <span class="d-block f-w-500 text-dark f-s-13">{{ element.type }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="ownership">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Ownership</th>
                <td mat-cell *matCellDef="let element">
                  <span class="d-block f-w-500 text-dark f-s-13">{{ element.ownership }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="storage">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Storage</th>
                <td mat-cell *matCellDef="let element">
                  <span class="d-block f-w-500 text-dark f-s-13">{{ element.storage }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="created">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Created</th>
                <td mat-cell *matCellDef="let element" class="text-muted f-s-13">
                  {{ element.created }}
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Status</th>
                <td mat-cell *matCellDef="let element">
                  <span class="status-badge" [ngClass]="element.status">
                    {{ element.status | titlecase }}
                  </span>
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
                    <button mat-menu-item (click)="editResource(element)">
                      <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                      <span>Edit resource</span>
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item class="text-danger" (click)="deleteResource(element)">
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
            <mat-card *ngFor="let element of dataSource.connect() | async" class="resource-card cardWithShadow">
              <mat-card-content class="p-16">
                <div class="d-flex align-items-center m-b-16">
                  <div class="m-r-12 bg-light-primary rounded d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                    <i-tabler name="folder" class="icon-24 text-primary"></i-tabler>
                  </div>
                  <div>
                    <h6 class="mat-subtitle-1 f-w-600 m-b-0">{{ element.resourceDetail }}</h6>
                    <span class="status-badge mt-1 d-inline-block" [ngClass]="element.status">{{ element.status | titlecase }}</span>
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
                      <button mat-menu-item (click)="editResource(element)">
                        <i-tabler name="edit" class="icon-16 m-r-8"></i-tabler>
                        <span>Edit resource</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item class="text-danger" (click)="deleteResource(element)">
                        <i-tabler name="trash" class="icon-16 m-r-8 text-danger"></i-tabler>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>
                
                <div class="d-flex align-items-center justify-content-between m-b-12">
                  <span class="f-s-13 text-muted d-flex align-items-center"><i-tabler name="file" class="icon-16 m-r-4"></i-tabler> {{ element.type }}</span>
                  <span class="f-s-13 text-muted d-flex align-items-center"><i-tabler name="cloud" class="icon-16 m-r-4"></i-tabler> {{ element.storage }}</span>
                </div>
                
                <div class="d-flex align-items-center justify-content-between m-b-16">
                  <span class="f-s-13 text-muted d-flex align-items-center"><i-tabler name="users" class="icon-16 m-r-4"></i-tabler> {{ element.ownership }}</span>
                </div>
                
                <mat-divider class="m-b-12"></mat-divider>
                <div class="d-flex align-items-center justify-content-between text-muted f-s-12">
                  <span class="d-flex align-items-center"><i-tabler name="calendar" class="icon-14 m-r-4"></i-tabler> {{ element.created }}</span>
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
    .resource-card { transition: transform 0.2s ease, box-shadow 0.2s ease; &:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; } }
    .view-mode-toggle { background-color: #f1f5f9; border-radius: 8px; padding: 2px; border: 1px solid #e2e8f0; .toggle-btn { width: 34px; height: 34px; padding: 0; display: flex; align-items: center; justify-content: center; color: #64748b; &.active { background-color: #ffffff; color: #615dff; box-shadow: 0 2px 4px rgba(0,0,0,0.05); } } }

    .status-badge {
      display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; text-transform: capitalize;
      &.available { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
      &.in-use { background-color: rgba(255, 174, 31, 0.1); color: #ffae1f; }
      &.archived { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    }

    .search-box {
      position: relative; display: flex; align-items: center; background-color: #f1f5f9; border-radius: 8px; padding: 0 12px; border: 1px solid #e2e8f0; width: 240px; height: 38px; transition: all 0.2s ease-in-out;
      @media (max-width: 576px) { width: calc(100% - 140px); }
      &:focus-within { background-color: #ffffff; border-color: #615dff; box-shadow: 0 0 0 3px rgba(97, 93, 255, 0.1); }
      .search-icon { color: #64748b; margin-right: 8px; }
      .search-input { border: none; background: transparent; outline: none; width: 100%; font-size: 13px; color: #1e293b; &::placeholder { color: #94a3b8; } }
    }

    .gap-12 { gap: 12px; } .m-r-12 { margin-right: 12px; } .m-r-8 { margin-right: 8px; } .m-r-4 { margin-right: 4px; } .p-0 { padding: 0 !important; }

    :host-context(.dark-theme) {
      .element-row:hover { background-color: var(--dark-hoverbgcolor); }
      .search-box { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .search-input { color: #f8fafc; } }
      .view-mode-toggle { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .toggle-btn { color: #94a3b8; &.active { background-color: var(--dark-hoverbgcolor); color: #a5a2ff; } } }
      .status-badge {
        &.available { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
        &.in-use { background-color: rgba(255, 174, 31, 0.2); color: #ffe082; }
        &.archived { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      }
    }
  `]
})
export class ResourcesComponent implements OnInit, AfterViewInit {
  viewMode: 'table' | 'card' = 'table';
  displayedColumns: string[] = ['resourceDetail', 'type', 'ownership', 'storage', 'created', 'status', 'actions'];
  dataSource = new MatTableDataSource<Resource>(RESOURCE_DATA);

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

  addResource(): void {
    this.notificationService.showSuccessToast('Resource added successfully.', 'Success');
  }

  viewDetails(resource: Resource): void {
    this.notificationService.showSuccessToast(`Loading details for ${resource.resourceDetail}.`, 'Loading');
  }

  editResource(resource: Resource): void {
    this.notificationService.showSuccessToast(`Updates saved for ${resource.resourceDetail}.`, 'Saved');
  }

  deleteResource(resource: Resource): void {
    this.notificationService.showErrorToast(`Resource ${resource.resourceDetail} deleted.`, 'Deleted');
  }
}

const RESOURCE_DATA: Resource[] = [
  { id: 1, resourceDetail: 'Marketing Brochure 2026', type: 'Document', ownership: 'Marketing Team', storage: 'Google Drive', created: 'Oct 01, 2026', status: 'available' },
  { id: 2, resourceDetail: 'Project Alpha Assets', type: 'Archive', ownership: 'Design Team', storage: 'AWS S3', created: 'Sep 15, 2026', status: 'archived' },
];
