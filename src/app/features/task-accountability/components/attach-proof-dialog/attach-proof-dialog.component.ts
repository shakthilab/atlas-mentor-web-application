import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TaskItem, AttachmentItem } from '../../interfaces/accountability.interface';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslateService } from '@ngx-translate/core';

export interface AttachProofDialogData {
  task: TaskItem;
}

@Component({
  selector: 'app-attach-proof-dialog',
  standalone: false,
  template: `
    <div class="attach-proof-dialog-container">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-title-group">
          <div class="icon-circle">
            <i-tabler name="shield-check" class="icon-20 text-primary"></i-tabler>
          </div>
          <div>
            <h2 class="dialog-title">{{ 'taskAccountability.taskDetails.proofRequired' | translate }}</h2>
            <p class="dialog-subtitle">
              {{ 'taskAccountability.taskTable.taskIdPrefix' | translate:{ id: data.task.id } }} &bull; {{ data.task.name }}
            </p>
          </div>
        </div>
        <button class="close-btn" mat-dialog-close [disabled]="isUploading" type="button" aria-label="Close">
          <i-tabler name="x" class="icon-18"></i-tabler>
        </button>
      </div>

      <!-- Body -->
      <div class="dialog-body">
        <p class="instruction-text">
          {{ 'taskAccountability.taskDetails.attachProofHint' | translate }}. {{ 'taskAccountability.taskDetails.proofPending' | translate }}.
        </p>

        <!-- Dropzone / File Picker Area (when no file selected) -->
        <div 
          class="proof-dropzone"
          *ngIf="!selectedFile"
          [class.drag-over]="isDragging"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
        >
          <div class="dropzone-icon-circle">
            <i-tabler name="cloud-upload" class="icon-28 text-primary"></i-tabler>
          </div>
          <p class="dropzone-primary-text">{{ 'taskAccountability.taskDetails.dragAndDropProof' | translate }}</p>
          <p class="dropzone-secondary-text">{{ 'taskAccountability.taskDetails.acceptedProofFormats' | translate }}</p>

          <input 
            type="file" 
            #fileInput 
            style="display: none" 
            (change)="onFileSelected($event)"
            accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.mp3,.m4a,.ogg,.wav,.webm,.pdf,.doc,.docx,.xls,.xlsx,.csv,image/*,video/*,audio/*,application/pdf"
          />
        </div>

        <!-- Selected File Preview Card (when a file has been picked) -->
        <div class="selected-file-card" *ngIf="selectedFile">
          <div class="file-preview-left">
            <!-- Image thumbnail if image -->
            <img [src]="previewUrl" *ngIf="previewUrl" class="file-thumbnail" alt="Proof preview" />
            <!-- Generic icon if document/video/audio -->
            <div class="file-icon-box" *ngIf="!previewUrl">
              <i-tabler [name]="getFileIcon(selectedFile.name)" class="icon-24 text-primary"></i-tabler>
            </div>
            <div class="file-details">
              <span class="file-name" [title]="selectedFile.name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
          </div>
          <button 
            type="button" 
            class="btn-remove-file" 
            (click)="removeSelectedFile()" 
            [disabled]="isUploading"
            title="{{ 'taskAccountability.taskDetails.removeAttachment' | translate }}"
          >
            <i-tabler name="trash" class="icon-16"></i-tabler>
          </button>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="dialog-footer">
        <button mat-button class="btn-cancel" mat-dialog-close [disabled]="isUploading" type="button">
          {{ 'common.cancel' | translate }}
        </button>
        <button 
          mat-flat-button 
          color="primary" 
          class="btn-submit" 
          [disabled]="!selectedFile || isUploading"
          (click)="submitProofAndMarkDone()"
          type="button"
        >
          <i-tabler name="circle-check" class="icon-16 mr-1" *ngIf="!isUploading"></i-tabler>
          <span *ngIf="!isUploading">{{ 'taskAccountability.taskDetails.attachProof' | translate }} &amp; {{ 'common.status.done' | translate }}</span>
          <span *ngIf="isUploading">{{ 'taskAccountability.taskDetails.uploadingProof' | translate }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .attach-proof-dialog-container {
      padding: 20px 24px;
      min-width: 420px;
      max-width: 480px;
      box-sizing: border-box;
      background: #ffffff;
      border-radius: 16px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;

      .header-title-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .icon-circle {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: rgba(99, 102, 241, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .dialog-title {
        margin: 0;
        font-size: 16.5px;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.3;
      }

      .dialog-subtitle {
        margin: 2px 0 0 0;
        font-size: 12.5px;
        color: #64748b;
        font-weight: 500;
        max-width: 320px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .close-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s, color 0.2s;

        &:hover:not([disabled]) {
          background-color: #f1f5f9;
          color: #0f172a;
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      }
    }

    .dialog-body {
      margin-bottom: 12px;

      .instruction-text {
        font-size: 13.5px;
        color: #475569;
        line-height: 1.45;
        margin: 0 0 14px 0;
      }
    }

    /* Dropzone */
    .proof-dropzone {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 24px 16px;
      text-align: center;
      background: #f8fafc;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      &:hover {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.03);
      }

      &.drag-over {
        border-color: #4f46e5;
        background: rgba(99, 102, 241, 0.08);
      }

      .dropzone-icon-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
      }

      .dropzone-primary-text {
        font-size: 13.5px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 4px 0;
      }

      .dropzone-secondary-text {
        font-size: 11.5px;
        color: #64748b;
        margin: 0;
        max-width: 320px;
      }
    }

    /* Selected File Preview Card */
    .selected-file-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #f8fafc;
      gap: 12px;

      .file-preview-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        flex: 1;
      }

      .file-thumbnail {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        object-fit: cover;
        border: 1px solid #e2e8f0;
        flex-shrink: 0;
      }

      .file-icon-box {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        background: rgba(99, 102, 241, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .file-details {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .file-name {
        font-size: 13.5px;
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-size {
        font-size: 12px;
        color: #64748b;
        margin-top: 2px;
      }

      .btn-remove-file {
        background: transparent;
        border: none;
        color: #ef4444;
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;

        &:hover:not([disabled]) {
          background-color: #fee2e2;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;

      .btn-cancel {
        color: #64748b;
        font-weight: 600;
        border-radius: 8px;
      }

      .btn-submit {
        background: #6366f1;
        color: #ffffff;
        font-weight: 600;
        border-radius: 8px;
        padding: 6px 18px;
        height: 38px;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);

        &:hover:not([disabled]) {
          background: #4f46e5;
        }

        &:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
        }
      }
    }
  `]
})
export class AttachProofDialogComponent {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isDragging = false;
  isUploading = false;

  private readonly ALLOWED_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'webp',
    'mp4', 'mov',
    'mp3', 'm4a', 'ogg', 'wav',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'
  ];
  private readonly MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
  private readonly MAX_GENERAL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  constructor(
    public dialogRef: MatDialogRef<AttachProofDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AttachProofDialogData,
    private service: TaskAccountabilityService,
    private notification: NotificationService,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.processFile(file);
    }
    event.target.value = '';
  }

  private processFile(file: File): void {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      const msg = validation.errorKey ? this.translate.instant(validation.errorKey) : validation.defaultMessage;
      this.notification.showErrorToast(msg || 'Invalid file');
      return;
    }

    this.selectedFile = file;
    if (file.type.startsWith('image/')) {
      this.previewUrl = URL.createObjectURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  removeSelectedFile(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.selectedFile = null;
    this.previewUrl = null;
  }

  validateFile(file: File): { valid: boolean; errorKey?: string; defaultMessage?: string } {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        errorKey: 'taskAccountability.taskDetails.unsupportedFileType',
        defaultMessage: 'Unsupported file type. Accepted types: jpg, jpeg, png, webp, mp4, mov, mp3, m4a, ogg, wav, pdf, doc, docx, xls, xlsx, csv'
      };
    }

    const isVideo = ['mp4', 'mov'].includes(ext) || file.type.startsWith('video/');
    if (isVideo && file.size > this.MAX_VIDEO_SIZE_BYTES) {
      return {
        valid: false,
        errorKey: 'taskAccountability.taskDetails.fileTooLargeVideo',
        defaultMessage: 'File is too large. Maximum size for video files is 25MB.'
      };
    }

    if (!isVideo && file.size > this.MAX_GENERAL_SIZE_BYTES) {
      return {
        valid: false,
        errorKey: 'taskAccountability.taskDetails.fileTooLargeGeneral',
        defaultMessage: 'File is too large. Maximum size is 10MB.'
      };
    }

    return { valid: true };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'photo';
    if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'm4a', 'ogg', 'wav'].includes(ext)) return 'music';
    if (ext === 'pdf') return 'file-type-pdf';
    if (['doc', 'docx'].includes(ext)) return 'file-type-doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'file-type-xls';
    return 'file';
  }

  submitProofAndMarkDone(): void {
    if (!this.selectedFile || this.isUploading) return;

    const file = this.selectedFile;
    const task = this.data.task;
    this.isUploading = true;

    this.service.uploadTaskAttachmentApi(task.id, file, null).subscribe({
      next: (res) => {
        const newAttachment: AttachmentItem = {
          id: (res?.id || `att-${Date.now()}`).toString(),
          name: res?.fileName || file.name,
          fileName: res?.fileName || file.name,
          size: res?.fileSizeFormatted || this.formatFileSize(file.size),
          fileSize: res?.fileSize || file.size,
          fileSizeFormatted: res?.fileSizeFormatted || this.formatFileSize(file.size),
          fileUrl: res?.fileUrl || '',
          fileType: res?.fileType || 'DOCUMENT',
          commentId: null,
          uploadedById: res?.uploadedById,
          uploadedByName: res?.uploadedByName || this.authService.currentUserValue?.name,
          uploadedAt: res?.uploadedAt || new Date().toISOString(),
          createdAt: res?.createdAt || new Date().toISOString()
        };

        if (!task.attachments) {
          task.attachments = [];
        }
        task.attachments.unshift(newAttachment);

        // Patch status to DONE
        this.service.patchTaskStatusApi(task.id, 'DONE').subscribe({
          next: () => {
            this.isUploading = false;
            this.removeSelectedFile();
            task.status = 'DONE';
            this.service.updateTaskStatus(task.id, 'DONE');
            this.service.triggerRefresh();
            this.notification.showSuccessToast(
              this.translate.instant('taskAccountability.taskDetails.proofAttached')
            );
            this.dialogRef.close({ success: true, newStatus: 'DONE' });
          },
          error: (err) => {
            this.isUploading = false;
            console.error('Error updating status after proof upload:', err);
            const msg = err?.error?.message || err?.message || 'Failed to update task status to Done';
            this.notification.showErrorToast(msg);
          }
        });
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Error uploading proof:', err);
        const msg = err?.error?.message || err?.message || 'Failed to upload proof';
        this.notification.showErrorToast(msg);
      }
    });
  }
}
