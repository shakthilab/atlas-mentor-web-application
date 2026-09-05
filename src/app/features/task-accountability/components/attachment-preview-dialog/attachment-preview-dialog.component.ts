import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AttachmentItem } from '../../interfaces/accountability.interface';

export interface AttachmentPreviewDialogData {
  attachment?: AttachmentItem | null;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  uploadedByName?: string;
}

@Component({
  selector: 'app-attachment-preview-dialog',
  standalone: false,
  template: `
    <div class="attachment-dialog-container">
      <!-- Header Bar -->
      <div class="preview-header-bar">
        <div class="preview-file-meta">
          <i-tabler [name]="getIcon()" class="preview-icon"></i-tabler>
          <div class="preview-title-group">
            <span class="preview-filename" [title]="getFileName()">{{ getFileName() }}</span>
            <span class="preview-filesize" *ngIf="getFileSize()">{{ getFileSize() }}</span>
          </div>
        </div>

        <div class="preview-actions">
          <!-- Download Button -->
          <a 
            [href]="getFileUrl()" 
            [download]="getFileName()" 
            target="_blank" 
            class="btn-preview-action download-btn" 
            title="Download"
          >
            <i-tabler name="download" class="icon-18"></i-tabler>
          </a>

          <!-- Close (X) Button -->
          <button 
            class="btn-preview-action close-modal-btn" 
            mat-dialog-close
            type="button" 
            title="Close"
          >
            <i-tabler name="x" class="icon-20"></i-tabler>
          </button>
        </div>
      </div>

      <!-- Media Content Body -->
      <div class="preview-body">
        <!-- Image Preview -->
        <div class="media-viewport image-viewport" *ngIf="isImage()">
          <img [src]="getFileUrl()" [alt]="getFileName()" />
        </div>

        <!-- Video Preview -->
        <div class="media-viewport video-viewport" *ngIf="isVideo()">
          <video [src]="getFileUrl()" controls autoplay></video>
        </div>

        <!-- Audio Preview -->
        <div class="media-viewport audio-viewport" *ngIf="isAudio()">
          <app-voice-note-player 
            [audioUrl]="getFileUrl()" 
            [duration]="0" 
            [authorName]="data.uploadedByName || ''"
          ></app-voice-note-player>
        </div>

        <!-- Document / PDF Preview -->
        <div class="media-viewport doc-viewport" *ngIf="isDocument()">
          <div class="doc-preview-card">
            <div class="doc-preview-icon-circle">
              <i-tabler [name]="getIcon()" class="icon-48"></i-tabler>
            </div>
            <h3>{{ getFileName() }}</h3>
            <p *ngIf="getFileSize()">{{ getFileSize() }}</p>
            <a [href]="getFileUrl()" target="_blank" download class="btn-download-large">
              <i-tabler name="download" class="icon-18"></i-tabler>
              Download File
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .attachment-dialog-container {
      display: flex;
      flex-direction: column;
      background: #0f172a;
      border-radius: 16px;
      overflow: hidden;
      max-width: 90vw;
      max-height: 90vh;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }

    .preview-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: #1e293b;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      gap: 16px;
      flex-shrink: 0;

      .preview-file-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        flex: 1;

        .preview-icon {
          width: 22px;
          height: 22px;
          color: #38bdf8;
          flex-shrink: 0;
        }

        .preview-title-group {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;

          .preview-filename {
            font-size: 13.5px;
            font-weight: 600;
            color: #f8fafc;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .preview-filesize {
            font-size: 11px;
            color: #94a3b8;
          }
        }
      }

      .preview-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;

        .btn-preview-action {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            transform: scale(1.06);
          }

          &.close-modal-btn {
            background: rgba(239, 68, 68, 0.85);
            border-color: #ef4444;
            color: #ffffff;

            &:hover {
              background: #dc2626;
              border-color: #dc2626;
              transform: scale(1.1);
            }
          }
        }
      }
    }

    .preview-body {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #020617;
      overflow: auto;
      max-height: calc(90vh - 65px);
      padding: 16px;

      .media-viewport {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;

        &.image-viewport img {
          max-width: 100%;
          max-height: calc(88vh - 100px);
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }

        &.video-viewport video {
          max-width: 100%;
          max-height: calc(88vh - 100px);
          border-radius: 8px;
          outline: none;
        }

        &.audio-viewport {
          padding: 24px;
          background: #0f172a;
          border-radius: 12px;
        }

        &.doc-viewport {
          padding: 32px 48px;

          .doc-preview-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            background: #1e293b;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 32px;
            color: #f8fafc;
            gap: 12px;
            max-width: 400px;

            .doc-preview-icon-circle {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: rgba(56, 189, 248, 0.15);
              color: #38bdf8;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 8px;
            }

            h3 {
              margin: 0;
              font-size: 16px;
              font-weight: 600;
              word-break: break-all;
            }

            p {
              margin: 0;
              font-size: 13px;
              color: #94a3b8;
            }

            .btn-download-large {
              margin-top: 12px;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: #2563eb;
              color: #ffffff;
              text-decoration: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-size: 13.5px;
              font-weight: 600;
              transition: background 0.15s;

              &:hover {
                background: #1d4ed8;
              }
            }
          }
        }
      }
    }
  `]
})
export class AttachmentPreviewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AttachmentPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AttachmentPreviewDialogData
  ) {}

  getFileUrl(): string {
    return this.data?.fileUrl || this.data?.attachment?.fileUrl || '';
  }

  getFileName(): string {
    return this.data?.fileName || this.data?.attachment?.fileName || this.data?.attachment?.name || 'Attachment';
  }

  getFileSize(): string {
    return this.data?.fileSize || this.data?.attachment?.fileSizeFormatted || this.data?.attachment?.size || '';
  }

  isImage(): boolean {
    if (this.data?.fileType === 'IMAGE') return true;
    if (this.data?.fileType === 'VIDEO' || this.data?.fileType === 'AUDIO' || this.data?.fileType === 'DOCUMENT') return false;
    const url = (this.getFileUrl() + ' ' + this.getFileName()).toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
  }

  isVideo(): boolean {
    if (this.data?.fileType === 'VIDEO') return true;
    if (this.data?.fileType === 'AUDIO' || this.data?.fileType === 'IMAGE' || this.data?.fileType === 'DOCUMENT') return false;
    const url = (this.getFileUrl() + ' ' + this.getFileName()).toLowerCase();
    return /\.(mp4|mov|m4v|avi|mkv)$/i.test(url);
  }

  isAudio(): boolean {
    if (this.data?.fileType === 'AUDIO') return true;
    if (this.data?.fileType === 'VIDEO' || this.data?.fileType === 'IMAGE' || this.data?.fileType === 'DOCUMENT') return false;
    const url = (this.getFileUrl() + ' ' + this.getFileName()).toLowerCase();
    return /\.(mp3|m4a|wav|ogg|webm|aac|flac)$/i.test(url);
  }

  isDocument(): boolean {
    return !this.isImage() && !this.isVideo() && !this.isAudio();
  }

  getIcon(): string {
    if (this.isAudio()) return 'volume';
    if (this.isVideo()) return 'video';
    if (this.isImage()) return 'photo';

    const name = this.getFileName().toLowerCase();
    if (name.endsWith('.pdf')) return 'file-type-pdf';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'file-type-doc';
    if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) return 'file-spreadsheet';
    return 'file-text';
  }
}
