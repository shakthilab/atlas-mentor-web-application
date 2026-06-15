import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../core/services/notification.service';
import { ResourceService, ResourceData } from '../../../core/services/resource.service';
import { AddResourceDialogComponent } from './add-resource-dialog/add-resource-dialog.component';
import { ResourceDetailsDialogComponent } from './resource-details-dialog/resource-details-dialog.component';

export interface Resource {
  id: number;
  resourceDetail: string;
  type: string;
  ownership: string;
  storage: string;
  created: string;
  status: 'available' | 'in-use' | 'archived';
  originalData?: any;
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
            <div class="search-box flex-1-auto">
              <i-tabler name="search" class="icon-16 search-icon"></i-tabler>
              <input (keyup)="applyFilter($event)" placeholder="Search resources..." class="search-input" />
            </div>
            <div class="view-mode-toggle d-flex align-items-center">
              <button (click)="viewMode = 'table'" class="toggle-btn" [class.active]="viewMode === 'table'" title="List view">
                <i-tabler name="list" class="icon-18"></i-tabler>
              </button>
              <button (click)="viewMode = 'card'" class="toggle-btn" [class.active]="viewMode === 'card'" title="Card view">
                <i-tabler name="layout-grid" class="icon-18"></i-tabler>
              </button>
            </div>
            <button mat-flat-button color="primary" class="d-flex align-items-center add-btn desktop-add-btn" (click)="addResource()">
              <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler>
              <span class="add-btn-text">Add Resource</span>
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content class="p-0">
          <div *ngIf="viewMode === 'table'" class="table-responsive view-container">
            <table mat-table [dataSource]="dataSource" class="w-100">
              
              <ng-container matColumnDef="resourceDetail">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Resource Detail</th>
                <td mat-cell *matCellDef="let element">
                  <div class="d-flex align-items-center">
                    <div class="m-r-12 rounded d-flex align-items-center justify-content-center" 
                         [ngClass]="getIconClass(element.type)"
                         style="width: 40px; height: 40px; flex-shrink: 0;">
                      <i-tabler [name]="getFileIcon(element.type)" class="icon-20"></i-tabler>
                    </div>
                    <div>
                      <span class="f-w-600 d-block text-dark f-s-14">{{ element.resourceDetail }}</span>
                      <span class="f-s-12 text-muted text-truncate d-block" style="max-width: 200px;" [title]="element.originalData?.description || 'No description'">
                        {{ element.originalData?.description || 'No description' }}
                      </span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Type</th>
                <td mat-cell *matCellDef="let element">
                  <span class="d-block f-w-500 text-dark f-s-13">{{ element.type }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="ownership">
                <th mat-header-cell *matHeaderCellDef class="f-w-600 f-s-14">Owner Type</th>
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
                  <button mat-icon-button [matMenuTriggerFor]="menu" class="text-muted" (click)="$event.stopPropagation()">
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
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="element-row cursor-pointer" (click)="viewDetails(row)"></tr>
            </table>
          </div>

          <!-- Card View -->
          <div *ngIf="viewMode === 'card'" class="card-grid view-container p-24">
            <mat-card *ngFor="let element of dataSource.data" class="resource-card cardWithShadow cursor-pointer" (click)="viewDetails(element)">
              <mat-card-content class="p-16">
                <div class="d-flex align-items-center m-b-16">
                  <div class="m-r-12 rounded d-flex align-items-center justify-content-center" 
                       [ngClass]="getIconClass(element.type)"
                       style="width: 48px; height: 48px; flex-shrink: 0;">
                    <i-tabler [name]="getFileIcon(element.type)" class="icon-24"></i-tabler>
                  </div>
                  <div>
                    <h6 class="mat-subtitle-1 f-w-600 m-b-0">{{ element.resourceDetail }}</h6>
                    <span class="status-badge mt-1 d-inline-block" [ngClass]="element.status">{{ element.status | titlecase }}</span>
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

          <mat-paginator [length]="totalElements"
                         [pageSize]="pageSize"
                         [pageSizeOptions]="[5, 10, 20]"
                         (page)="pageChanged($event)"
                         showFirstLastButtons 
                         class="p-y-12">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Mobile FAB -->
    <button mat-fab color="primary" class="resource-mobile-fab" (click)="addResource()" aria-label="Add Resource">
      <i-tabler name="plus" class="icon-24"></i-tabler>
    </button>
  `,
  styles: [`
    .table-container { padding: 24px; @media (max-width: 768px) { padding: 12px 8px; } }
    mat-card-header { @media (max-width: 576px) { flex-direction: column !important; align-items: flex-start !important; gap: 16px; } }
    .header-actions { @media (max-width: 576px) { width: 100%; justify-content: space-between; } button.desktop-add-btn { white-space: nowrap; flex-shrink: 0; @media (max-width: 576px) { display: none !important; } } }
    .table-responsive { width: 100%; overflow-x: auto; }
    table { min-width: 1050px; }
    .element-row { transition: background-color 0.2s ease; cursor: pointer; &:hover { background-color: #f8fafc; } }
    .cursor-pointer { cursor: pointer; }

    .view-container { animation: fadeIn 0.4s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; @media (max-width: 576px) { grid-template-columns: 1fr; padding: 16px !important; } }
    .resource-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; &:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; } }
    
    .view-mode-toggle { background-color: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; overflow: hidden; .toggle-btn { width: 42px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; color: #64748b; background: transparent; border: none; cursor: pointer; transition: all 0.2s ease; &.active { background-color: #615dff; color: #ffffff; } &:hover:not(.active) { background-color: #f1f5f9; } } }

    .status-badge {
      display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; text-transform: capitalize;
      &.available { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
      &.in-use { background-color: rgba(255, 174, 31, 0.1); color: #ffae1f; }
      &.archived { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    }

    .search-box {
      position: relative; display: flex; align-items: center; background-color: #f1f5f9; border-radius: 8px; padding: 0 12px; border: 1px solid #e2e8f0; min-width: 0; height: 38px; transition: all 0.2s ease-in-out;
      &:focus-within { background-color: #ffffff; border-color: #615dff; box-shadow: 0 0 0 3px rgba(97, 93, 255, 0.1); }
      .search-icon { color: #64748b; margin-right: 8px; flex-shrink: 0; }
      .search-input { border: none; background: transparent; outline: none; width: 100%; font-size: 13px; color: #1e293b; &::placeholder { color: #94a3b8; } }
    }

    .flex-1-auto { flex: 1 1 auto; }
    .gap-12 { gap: 12px; } .m-r-12 { margin-right: 12px; } .m-r-8 { margin-right: 8px; } .m-r-4 { margin-right: 4px; } .p-0 { padding: 0 !important; }

    /* Dynamic Icon Colors */
    .icon-bg-image { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
    .icon-bg-video { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    .icon-bg-audio { background-color: rgba(183, 136, 255, 0.1); color: #b788ff; }
    .icon-bg-document { background-color: rgba(93, 135, 255, 0.1); color: #5d87ff; }
    .icon-bg-spreadsheet { background-color: rgba(19, 222, 185, 0.1); color: #13deb9; }
    .icon-bg-presentation { background-color: rgba(250, 137, 107, 0.1); color: #fa896b; }
    .icon-bg-link { background-color: rgba(93, 135, 255, 0.1); color: #5d87ff; }
    .icon-bg-archive { background-color: rgba(255, 174, 31, 0.1); color: #ffae1f; }
    .icon-bg-default { background-color: rgba(73, 190, 255, 0.1); color: #49beff; }

    /* Mobile FAB */
    .resource-mobile-fab {
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
      .element-row:hover { background-color: var(--dark-hoverbgcolor); }
      .search-box { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .search-input { color: #f8fafc; } }
      .view-mode-toggle { background-color: var(--dark-sidebarbg); border-color: var(--dark-formborderColor); .toggle-btn { color: #94a3b8; &.active { background-color: #615dff; color: #ffffff; } &:hover:not(.active) { background-color: var(--dark-hoverbgcolor); } } }
      .status-badge {
        &.available { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
        &.in-use { background-color: rgba(255, 174, 31, 0.2); color: #ffe082; }
        &.archived { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      }
      .icon-bg-image { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
      .icon-bg-video { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      .icon-bg-audio { background-color: rgba(183, 136, 255, 0.2); color: #d6bfff; }
      .icon-bg-document { background-color: rgba(93, 135, 255, 0.2); color: #a6bfff; }
      .icon-bg-spreadsheet { background-color: rgba(19, 222, 185, 0.2); color: #80f1d4; }
      .icon-bg-presentation { background-color: rgba(250, 137, 107, 0.2); color: #ffab91; }
      .icon-bg-link { background-color: rgba(93, 135, 255, 0.2); color: #a6bfff; }
      .icon-bg-archive { background-color: rgba(255, 174, 31, 0.2); color: #ffe082; }
      .icon-bg-default { background-color: rgba(73, 190, 255, 0.2); color: #8fd8ff; }
    }
  `]
})
export class ResourcesComponent implements OnInit, AfterViewInit {
  viewMode: 'table' | 'card' = 'table';
  displayedColumns: string[] = ['resourceDetail', 'type', 'ownership', 'storage', 'created', 'status', 'actions'];
  dataSource = new MatTableDataSource<Resource>([]);
  
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  searchQuery = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private notificationService: NotificationService,
    private resourceService: ResourceService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadResources();
  }

  ngAfterViewInit(): void {
    // Custom pagination handled through pageChanged event
  }

  loadResources(): void {
    const filters = this.searchQuery ? { search: this.searchQuery } : undefined;
    
    this.resourceService.getResources(this.currentPage, this.pageSize, filters).subscribe({
      next: (response: any) => {
        const pageData = response?.data || response;
        if (pageData && pageData.content) {
          this.dataSource.data = pageData.content.map((item: any) => this.mapToResource(item));
          this.totalElements = pageData.totalElements || pageData.content.length;
        } else if (Array.isArray(pageData)) {
          this.dataSource.data = pageData.map((item: any) => this.mapToResource(item));
          this.totalElements = pageData.length;
        }
      },
      error: (err) => {
        console.error('Error fetching resources:', err);
        this.notificationService.showErrorToast('Failed to load resources.', 'Error');
      }
    });
  }

  mapToResource(data: any): Resource {
    return {
      id: data.id,
      resourceDetail: data.fileName || data.description || 'Unknown Resource',
      type: data.resourceType || 'UNKNOWN',
      ownership: data.ownerType || 'Unknown',
      storage: data.storageType || 'UNKNOWN',
      created: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A',
      status: data.isActive ? 'available' : 'archived',
      originalData: data
    };
  }

  pageChanged(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadResources();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchQuery = filterValue.trim();
    this.currentPage = 0; // Reset to first page
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadResources();
  }

  getFileIcon(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('IMAGE')) return 'photo';
    if (t.includes('VIDEO')) return 'video';
    if (t.includes('AUDIO')) return 'volume';
    if (t.includes('SPREADSHEET')) return 'file-spreadsheet';
    if (t.includes('PRESENTATION')) return 'presentation';
    if (t.includes('LINK')) return 'link';
    if (t.includes('DOCUMENT') || t.includes('PDF')) return 'file-description';
    if (t.includes('ARCHIVE') || t.includes('ZIP')) return 'folder-zip';
    return 'file';
  }

  getIconClass(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('IMAGE')) return 'icon-bg-image';
    if (t.includes('VIDEO')) return 'icon-bg-video';
    if (t.includes('AUDIO')) return 'icon-bg-audio';
    if (t.includes('SPREADSHEET')) return 'icon-bg-spreadsheet';
    if (t.includes('PRESENTATION')) return 'icon-bg-presentation';
    if (t.includes('LINK')) return 'icon-bg-link';
    if (t.includes('DOCUMENT') || t.includes('PDF')) return 'icon-bg-document';
    if (t.includes('ARCHIVE') || t.includes('ZIP')) return 'icon-bg-archive';
    return 'icon-bg-default';
  }

  addResource(): void {
    const dialogRef = this.dialog.open(AddResourceDialogComponent, {
      width: '600px',
      panelClass: 'add-resource-dialog',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResources();
      }
    });
  }

  viewDetails(resource: Resource): void {
    this.dialog.open(ResourceDetailsDialogComponent, {
      width: '500px',
      data: resource,
      panelClass: 'resource-details-dialog'
    });
  }

  editResource(resource: Resource): void {
    const dialogRef = this.dialog.open(AddResourceDialogComponent, {
      width: '600px',
      data: resource.originalData,
      panelClass: 'add-resource-dialog',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResources();
      }
    });
  }

  deleteResource(resource: Resource): void {
    this.notificationService.showErrorPopup(
      `Are you sure you want to completely remove "${resource.resourceDetail}"?`,
      'Confirm Deletion',
      'Delete'
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.resourceService.deleteResource(resource.id).subscribe({
          next: () => {
            this.notificationService.showSuccessToast('Resource deleted successfully', 'Success');
            this.loadResources();
          },
          error: (err) => {
            console.error('Error deleting resource:', err);
            this.notificationService.showErrorToast('Failed to delete resource', 'Error');
          }
        });
      }
    });
  }
}
