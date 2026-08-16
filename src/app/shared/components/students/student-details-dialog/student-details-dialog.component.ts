import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { TablerIconsModule } from 'angular-tabler-icons';
import { environment } from '../../../../../environments/environment';
import { DocumentViewDialogComponent } from '../../leads/document-view-dialog/document-view-dialog.component';

@Component({
  selector: 'app-student-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    TablerIconsModule,
    DocumentViewDialogComponent
  ],
  template: `
    <div class="dialog-container p-24">
      <div class="d-flex align-items-center justify-content-between m-b-24">
        <h2 class="mat-headline-6 f-w-600 m-b-0">Student Details</h2>
        <button mat-icon-button (click)="closeDialog()" class="text-muted" type="button" style="border: none; background: transparent; cursor: pointer;">
          <i-tabler name="x" class="icon-20"></i-tabler>
        </button>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="loading" class="d-flex justify-content-center align-items-center p-32">
        <mat-spinner diameter="40" strokeWidth="4"></mat-spinner>
      </div>

      <div *ngIf="!loading && fullStudent">
        <div class="profile-header d-flex align-items-center m-b-24">
          <img [src]="fullStudent.avatar || '/assets/images/profile/user-1.jpg'" class="rounded-circle m-r-16 object-cover avatar-animated" width="64" height="64" />
          <div>
            <h3 class="mat-subtitle-1 f-w-600 m-b-4 f-s-18">{{ fullStudent.fullName || fullStudent.name }}</h3>
            <span class="f-s-14 text-muted d-block">{{ fullStudent.courseName || fullStudent.major || 'N/A' }}</span>
            <span class="status-badge m-t-8" [ngClass]="(fullStudent.status || 'pending').toLowerCase()">
              {{ getStatusDisplayName(fullStudent.status) }}
            </span>
          </div>
        </div>

        <mat-tab-group class="custom-tab-group">
          <!-- TAB 1: Detail -->
          <mat-tab label="Detail">
            <div class="details-grid p-t-16">
              <div class="detail-item">
                <span class="detail-label">Email Address</span>
                <span class="detail-value d-flex align-items-center">
                  <i-tabler name="mail" class="icon-16 m-r-8 text-muted"></i-tabler>
                  {{ fullStudent.email || 'N/A' }}
                </span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Phone Number</span>
                <span class="detail-value d-flex align-items-center">
                  <i-tabler name="phone" class="icon-16 m-r-8 text-muted"></i-tabler>
                  {{ fullStudent.phone || 'N/A' }}
                </span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Country</span>
                <span class="detail-value d-flex align-items-center">
                  <i-tabler name="map-pin" class="icon-16 m-r-8 text-muted"></i-tabler>
                  {{ fullStudent.countryName || fullStudent.country || 'N/A' }}
                </span>
              </div>

              <div class="detail-item">
                <span class="detail-label">University</span>
                <span class="detail-value d-flex align-items-center">
                  <i-tabler name="building" class="icon-16 m-r-8 text-muted"></i-tabler>
                  {{ fullStudent.universityName || fullStudent.university || 'N/A' }}
                </span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Course / Major</span>
                <span class="detail-value d-flex align-items-center">
                  <i-tabler name="book" class="icon-16 m-r-8 text-muted"></i-tabler>
                  {{ fullStudent.courseName || fullStudent.major || 'N/A' }}
                </span>
              </div>

              <div class="detail-item" *ngIf="fullStudent.intakePeriod">
                <span class="detail-label">Intake Period</span>
                <span class="detail-value d-flex align-items-center">
                  <i-tabler name="calendar-event" class="icon-16 m-r-8 text-muted"></i-tabler>
                  {{ fullStudent.intakePeriod }}
                </span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Counsellor</span>
                <span class="detail-value d-flex align-items-center">
                  <img *ngIf="fullStudent.counsellorAvatar" [src]="fullStudent.counsellorAvatar" class="rounded-circle m-r-8 object-cover" width="20" height="20" />
                  <i-tabler *ngIf="!fullStudent.counsellorAvatar" name="user" class="icon-16 m-r-8 text-muted"></i-tabler>
                  {{ fullStudent.assignedByName || fullStudent.counsellor || 'Unassigned' }}
                </span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Added By</span>
                <span class="detail-value d-flex align-items-center">
                  <i-tabler name="user-plus" class="icon-16 m-r-8 text-muted"></i-tabler>
                  <span>{{ fullStudent.createdByName || fullStudent.addedBy || 'System' }}</span>
                </span>
              </div>

              <div class="detail-item" *ngIf="fullStudent.createdAt">
                <span class="detail-label">Joined Date</span>
                <span class="detail-value d-flex align-items-center">
                  <i-tabler name="calendar" class="icon-16 m-r-8 text-muted"></i-tabler>
                  {{ fullStudent.createdAt | date:'mediumDate' }}
                </span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Source</span>
                <span class="detail-value d-flex align-items-center">
                  <i-tabler name="world" class="icon-16 m-r-8 text-muted"></i-tabler>
                  {{ fullStudent.source || '—' }}
                </span>
              </div>
            </div>
          </mat-tab>

          <!-- TAB 2: Academic -->
          <mat-tab label="Academic">
            <div class="academic-history-container p-t-16">
              <div *ngIf="!fullStudent.academicHistory || fullStudent.academicHistory.length === 0" class="text-center p-24">
                <i-tabler name="school" class="icon-32 text-muted m-b-12" style="width: 32px; height: 32px;"></i-tabler>
                <p class="text-muted m-b-0">No academic history records found.</p>
              </div>
              
              <div *ngFor="let acad of fullStudent.academicHistory" class="academic-record-card border rounded p-16 m-b-16 bg-white">
                <div class="d-flex justify-content-between align-items-center m-b-12">
                  <span class="card-title-text f-w-700 text-dark f-s-14">{{ getQualificationName(acad.qualification) }}</span>
                  <span class="passing-year-chip f-s-11 f-w-600 border rounded p-x-8 p-y-2 text-muted bg-light" *ngIf="acad.passingYear">
                    Passed: {{ acad.passingYear }}
                  </span>
                </div>
                <div class="academic-grid">
                  <div class="academic-item" *ngIf="acad.institutionName">
                    <span class="detail-label">Institution</span>
                    <span class="detail-value f-s-13 text-truncate-custom" [title]="acad.institutionName">{{ acad.institutionName }}</span>
                  </div>
                  <div class="academic-item" *ngIf="acad.boardUniversity">
                    <span class="detail-label">Board / University</span>
                    <span class="detail-value f-s-13 text-truncate-custom" [title]="acad.boardUniversity">{{ acad.boardUniversity }}</span>
                  </div>
                  <div class="academic-item" *ngIf="acad.stream">
                    <span class="detail-label">Stream</span>
                    <span class="detail-value f-s-13">{{ acad.stream }}</span>
                  </div>
                  <div class="academic-item" *ngIf="acad.score">
                    <span class="detail-label">Score / CGPA</span>
                    <span class="detail-value f-s-13">{{ acad.score }}</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- TAB 3: Documents -->
          <mat-tab label="Documents">
            <div class="documents-tab-container p-t-16">
              <div *ngIf="!fullStudent.documents || fullStudent.documents.length === 0" class="text-center p-24">
                <i-tabler name="file" class="icon-32 text-muted m-b-12" style="width: 32px; height: 32px;"></i-tabler>
                <p class="text-muted m-b-0">No uploaded documents found.</p>
              </div>

              <div class="row">
                <div class="col-12 m-b-12" *ngFor="let doc of fullStudent.documents">
                  <div class="d-flex align-items-center justify-content-between p-16 border rounded bg-white doc-item-card">
                    <div class="d-flex align-items-center overflow-hidden flex-1" style="min-width: 0;">
                      <div class="doc-icon-wrapper uploaded m-r-12">
                        <i-tabler name="file-text" class="icon-18 text-primary" style="color: var(--brand-primary) !important;"></i-tabler>
                      </div>
                      <div class="d-flex flex-column overflow-hidden flex-1" style="min-width: 0;">
                        <span class="f-s-14 f-w-700 text-dark text-truncate d-block w-100" [title]="getDocDisplayName(doc.documentType)">
                          {{ getDocDisplayName(doc.documentType) }}
                        </span>
                        <span class="f-s-11 text-muted text-truncate d-block w-100" *ngIf="doc.createdAt">
                          Uploaded: {{ doc.createdAt | date:'mediumDate' }}
                        </span>
                      </div>
                    </div>
                    
                    <div class="d-flex align-items-center gap-8 flex-shrink-0">
                      <button mat-icon-button [matMenuTriggerFor]="docMenu" class="icon-btn-action text-muted flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; border-radius: 50%; min-width: 32px; padding: 0; border: none; background: transparent; cursor: pointer;" type="button">
                        <i-tabler name="dots-vertical" class="icon-16"></i-tabler>
                      </button>
                      <mat-menu #docMenu="matMenu" class="duplicate-menu-panel" xPosition="before">
                        <button mat-menu-item (click)="viewServerDocument(doc)" [disabled]="!doc.id" type="button">
                          <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                          <span>View</span>
                        </button>
                        <button mat-menu-item (click)="downloadServerDocument(doc)" [disabled]="!doc.id" type="button">
                          <i-tabler name="download" class="icon-16 m-r-8"></i-tabler>
                          <span>Download</span>
                        </button>
                      </mat-menu>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>

      <div class="d-flex justify-content-end align-items-center m-t-24">
        <button mat-stroked-button (click)="closeDialog()" style="background: transparent; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 16px; cursor: pointer; font-weight: 500;">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      background-color: var(--mat-dialog-container-color, #ffffff);
      color: var(--mat-dialog-container-text-color, #1e293b);
    }
    .object-cover { object-fit: cover; }
    .m-b-24 { margin-bottom: 24px; }
    .m-b-12 { margin-bottom: 12px; }
    .m-b-16 { margin-bottom: 16px; }
    .m-b-4 { margin-bottom: 4px; }
    .m-r-16 { margin-right: 16px; }
    .m-r-8 { margin-right: 8px; }
    .m-r-12 { margin-right: 12px; }
    .m-t-8 { margin-top: 8px; }
    .m-t-24 { margin-top: 24px; }
    .p-t-16 { padding-top: 16px; }
    .p-x-8 { padding-left: 8px; padding-right: 8px; }
    .p-y-2 { padding-top: 2px; padding-bottom: 2px; }
    .text-truncate-custom {
      display: block;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .avatar-animated {
      transition: transform 0.3s ease;
    }
    
    .profile-header:hover .avatar-animated {
      transform: scale(1.1) rotate(5deg);
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
      
      &.enrolled, &.registered {
        background-color: rgba(var(--brand-primary-rgb), 0.1);
        color: var(--brand-primary);
      }
      &.pending, &.lead {
        background-color: rgba(255, 174, 31, 0.1);
        color: #ffae1f;
      }
      &.completed {
        background-color: rgba(19, 222, 185, 0.1);
        color: #13deb9;
      }
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
    }

    .academic-record-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
      transition: box-shadow 0.2s ease;
      &:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      }
    }

    .academic-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px 12px;
    }

    .academic-item {
      display: flex;
      flex-direction: column;
    }

    .doc-item-card {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      border-radius: 8px;
      transition: all 0.2s ease;
      &:hover {
        border-color: var(--brand-primary);
        box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      }
    }

    .doc-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(var(--brand-primary-rgb), 0.08);
    }

    .icon-btn-action {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        background: #f1f5f9;
        color: #1e293b;
      }
    }

    /* Style overrides for Angular Material tabs matching brand theme */
    ::ng-deep .custom-tab-group {
      .mat-mdc-tab-header {
        border-bottom: 1px solid #e2e8f0;
      }
      .mat-mdc-tab .mdc-tab__text-label {
        font-weight: 600 !important;
        color: #64748b !important;
      }
      .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
        color: var(--brand-primary) !important;
      }
      .mat-mdc-tab-group.mat-primary .mat-mdc-tab-header-pagination-chevron {
        border-color: var(--brand-primary) !important;
      }
      .mat-mdc-tab-header-pagination {
        color: var(--brand-primary) !important;
      }
      .mat-mdc-tab-group.mat-primary .mat-mdc-tab-label-container {
        border-bottom-color: var(--brand-primary) !important;
      }
      .mat-mdc-tab-group.mat-primary .mat-mdc-tab-header-pagination-chevron {
        border-color: var(--brand-primary) !important;
      }
      .mdc-tab-indicator__content--activated {
        border-color: var(--brand-primary) !important;
        border-bottom-width: 2px !important;
      }
    }

    :host-context(.dark-theme) {
      .dialog-container {
        background-color: var(--dark-sidebarbg, #1e293b);
        color: #f8fafc;
      }
      .detail-label {
        color: #94a3b8;
      }
      .detail-value {
        color: #f8fafc;
      }
      .academic-record-card {
        border-color: var(--dark-formborderColor, #334155);
        background: var(--dark-hoverbgcolor, #1e293b);
      }
      .doc-item-card {
        border-color: var(--dark-formborderColor, #334155);
        background: var(--dark-sidebarbg, #1e293b);
        &:hover {
          border-color: #ffffff;
        }
      }
      .doc-icon-wrapper {
        background: rgba(255,255,255,0.08);
      }
      .status-badge {
        &.enrolled, &.registered {
          background-color: rgba(255,255,255, 0.1);
          color: #ffffff;
        }
        &.pending, &.lead {
          background-color: rgba(255, 174, 31, 0.2);
          color: #ffca70;
        }
        &.completed {
          background-color: rgba(19, 222, 185, 0.2);
          color: #80f1d4;
        }
      }
    }
  `]
})
export class StudentDetailsDialogComponent implements OnInit {
  loading = true;
  fullStudent: any = null;

  constructor(
    public dialogRef: MatDialogRef<StudentDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public studentData: any,
    private http: HttpClient,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    const studentId = this.studentData.id;
    if (studentId) {
      this.http.get<any>(`${environment.apiUrl}/students/${studentId}`).subscribe({
        next: (res) => {
          this.fullStudent = res.data || res;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load student details:', err);
          this.loading = false;
          this.fullStudent = this.studentData;
        }
      });
    } else {
      this.fullStudent = this.studentData;
      this.loading = false;
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getStatusDisplayName(status: string): string {
    if (!status) return 'Pending';
    const s = status.toUpperCase();
    if (s === 'ENROLLED' || s === 'REGISTERED') return 'Enrolled';
    if (s === 'COMPLETED') return 'Completed';
    return status;
  }

  getQualificationName(qualification: string): string {
    if (!qualification) return 'Academic Record';
    if (qualification === '10th') return '10th Standard';
    if (qualification === '12th') return '12th Standard';
    return qualification;
  }

  getDocDisplayName(type: string): string {
    if (!type) return 'Document';
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  base64ToBlob(content: string, fileType: string): Blob {
    const byteArray = Uint8Array.from(atob(content), c => c.charCodeAt(0));
    return new Blob([byteArray], { type: fileType });
  }

  viewServerDocument(doc: any): void {
    if (!doc || !doc.id) return;
    this.http.get<any>(`${environment.apiUrl}/students/documents/${doc.id}/download`)
      .subscribe({
        next: (res) => {
          const docData = res.data || res;
          if (docData && docData.content) {
            const blob = this.base64ToBlob(docData.content, docData.fileType || 'application/pdf');
            const fileURL = URL.createObjectURL(blob);
            
            const dialogRef = this.dialog.open(DocumentViewDialogComponent, {
              width: '900px',
              maxWidth: '95vw',
              data: {
                title: doc.documentType ? this.getDocDisplayName(doc.documentType) : 'View Document',
                url: fileURL,
                fileType: docData.fileType || 'application/pdf'
              }
            });
            dialogRef.afterClosed().subscribe(() => {
              URL.revokeObjectURL(fileURL);
            });
          }
        },
        error: (err) => {
          console.error('Failed to view document:', err);
        }
      });
  }

  downloadServerDocument(doc: any): void {
    if (!doc || !doc.id) return;
    this.http.get<any>(`${environment.apiUrl}/students/documents/${doc.id}/download`)
      .subscribe({
        next: (res) => {
          const docData = res.data || res;
          if (docData && docData.content) {
            const blob = this.base64ToBlob(docData.content, docData.fileType || 'application/octet-stream');
            const fileURL = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = fileURL;
            link.download = docData.fileName || doc.documentName || doc.documentType || 'document';
            link.click();
            URL.revokeObjectURL(fileURL);
          }
        },
        error: (err) => {
          console.error('Failed to download document:', err);
        }
      });
  }
}
