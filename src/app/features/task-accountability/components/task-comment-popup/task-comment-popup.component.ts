import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TaskItem } from '../../interfaces/accountability.interface';

export interface TaskCommentPopupData {
  task: TaskItem;
}

interface PopupComment {
  id: string;
  authorName: string;
  commentedByUserId: string | null;
  text: string;
  createdAtDate: Date | null;
  edited: boolean;
}

@Component({
  selector: 'app-task-comment-popup',
  standalone: false,
  template: `
    <div class="comment-popup-container">
      <div class="popup-header">
        <div class="header-titles">
          <div class="title-container">
            <i-tabler name="message-circle-2" class="title-icon"></i-tabler>
            <h3>{{ 'taskAccountability.taskTable.commentPopupTitle' | translate }}</h3>
          </div>
          <p class="subtitle" [title]="task.name">{{ task.name }}</p>
        </div>
        <button class="close-btn" mat-dialog-close type="button" [attr.aria-label]="'common.close' | translate">
          <i-tabler name="x" class="icon-18"></i-tabler>
        </button>
      </div>

      <div class="popup-body">
        <div class="comment-loading" *ngIf="loading">
          <div class="spinner"></div>
          <span>{{ 'taskAccountability.taskTable.loadingComments' | translate }}</span>
        </div>

        <div class="empty-comments" *ngIf="!loading && comments.length === 0">
          <i-tabler name="message-circle-2" class="icon-32 pulse-icon"></i-tabler>
          <p>{{ 'taskAccountability.taskTable.noComments' | translate }}</p>
        </div>

        <div class="comment-list" *ngIf="!loading && comments.length > 0">
          <div class="comment-item" [class.my-comment]="isMyComment(comment)" *ngFor="let comment of comments">
            <div class="comment-avatar" [ngStyle]="getAvatarStyle(comment.authorName)">
              {{ getInitial(comment.authorName) }}
            </div>
            <div class="comment-content">
              <div class="comment-meta">
                <span class="comment-author">{{ comment.authorName }}</span>
                <span class="comment-time">{{ formatTimestamp(comment.createdAtDate) }}</span>
                <span class="edited-tag" *ngIf="comment.edited">{{ 'taskAccountability.taskTable.editedTag' | translate }}</span>
                <button class="edit-comment-icon-btn" *ngIf="isMyComment(comment) && editingCommentId !== comment.id" (click)="startEdit(comment)" type="button" [attr.aria-label]="'taskAccountability.taskTable.editComment' | translate">
                  <i-tabler name="pencil" class="icon-12"></i-tabler>
                </button>
              </div>

              <ng-container *ngIf="editingCommentId !== comment.id; else editMode">
                <div class="comment-bubble">
                  <p class="comment-text-body">{{ comment.text }}</p>
                </div>
              </ng-container>

              <ng-template #editMode>
                <div class="edit-mode-container">
                  <textarea
                    class="edit-comment-textarea"
                    [(ngModel)]="editingText"
                    rows="2"
                    cdkFocusInitial
                    (keydown.control.enter)="saveEdit(comment)"
                    (keydown.meta.enter)="saveEdit(comment)"
                    (keydown.escape)="cancelEdit()"
                  ></textarea>
                  <div class="edit-comment-actions">
                    <button class="btn-text" (click)="cancelEdit()" type="button">{{ 'common.cancel' | translate }}</button>
                    <button
                      class="btn-save"
                      [disabled]="!editingText.trim() || savingEdit"
                      (click)="saveEdit(comment)"
                      type="button"
                    >
                      {{ 'taskAccountability.taskTable.saveComment' | translate }}
                    </button>
                  </div>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

      <div class="popup-footer">
        <textarea
          class="new-comment-textarea"
          [(ngModel)]="newCommentText"
          rows="2"
          [placeholder]="'taskAccountability.taskTable.addCommentPlaceholder' | translate"
          (keydown.control.enter)="submitComment()"
          (keydown.meta.enter)="submitComment()"
        ></textarea>
        <button
          class="btn-add-comment"
          [disabled]="!newCommentText.trim() || submitting"
          (click)="submitComment()"
          type="button"
        >
          <i-tabler name="send" class="icon-14"></i-tabler>
          {{ 'taskAccountability.taskTable.addComment' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .comment-popup-container {
      width: 480px;
      max-width: 90vw;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      border-radius: 16px;
      overflow: hidden;
      background-color: #ffffff;
    }
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 18px 24px;
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
      border-bottom: 1px solid #f1f5f9;

      .header-titles {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;

        .title-container {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;

          .title-icon {
            width: 20px;
            height: 20px;
            color: #2563eb;
          }

          h3 {
            margin: 0;
            font-size: 17px;
            font-weight: 700;
            letter-spacing: -0.3px;
          }
        }

        .subtitle {
          margin: 0;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 380px;
        }
      }

      .close-btn {
        background: #f1f5f9;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 6px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        &:hover {
          background-color: #e2e8f0;
          color: #0f172a;
          transform: rotate(90deg);
        }
      }
    }

    .popup-body {
      padding: 20px 24px;
      max-height: 380px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    }

    .comment-loading,
    .empty-comments {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px 16px;
      color: #94a3b8;
      font-size: 13.5px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1.5px dashed #e2e8f0;

      .icon-28 {
        width: 28px;
        height: 28px;
      }
      .icon-32 {
        width: 32px;
        height: 32px;
      }
      
      .spinner {
        width: 24px;
        height: 24px;
        border: 3px solid rgba(37, 99, 235, 0.1);
        border-left-color: #2563eb;
        border-radius: 50%;
        animation: spin-anim 0.8s linear infinite;
      }
      
      .pulse-icon {
        color: #64748b;
        animation: pulse-anim 2s infinite ease-in-out;
      }
      
      p {
        margin: 0;
        font-weight: 500;
      }
    }

    @keyframes spin-anim {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse-anim {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }

    .comment-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .comment-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 8px;
      margin: -8px;
      border-radius: 12px;
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: #f8fafc;
      }
    }

    .comment-avatar {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13.5px;
      font-weight: 700;
      border: 1.5px solid transparent;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.05);
      }
    }

    .comment-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .comment-meta {
      display: flex;
      align-items: baseline;
      gap: 8px;

      .comment-author {
        font-size: 13.5px;
        font-weight: 600;
        color: #1e293b;
      }
      
      .comment-time {
        font-size: 11px;
        color: #94a3b8;
      }

      .edited-tag {
        font-size: 10px;
        color: #94a3b8;
        background: #f1f5f9;
        padding: 1px 4px;
        border-radius: 4px;
      }
    }

    .comment-bubble {
      display: inline-block;
      max-width: 100%;
    }

    .comment-text-body {
      margin: 0;
      font-size: 13.5px;
      color: #334155;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      background: #f1f5f9;
      padding: 10px 14px;
      border-radius: 0 12px 12px 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    }

    /* Highlight user's own comments */
    .comment-item.my-comment {
      .comment-text-body {
        background-color: #eff6ff;
        border-color: #dbeafe;
        color: #1e3a8a;
      }
      
      .comment-author::after {
        content: 'You';
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        color: #2563eb;
        background: #dbeafe;
        padding: 1px 5px;
        border-radius: 4px;
        margin-left: 6px;
        display: inline-block;
        vertical-align: middle;
      }
    }

    .edit-comment-icon-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 3px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      opacity: 0.4;
      
      &:hover {
        background-color: #e2e8f0;
        color: #0f172a;
        opacity: 1;
      }
    }

    .comment-item:hover {
      .edit-comment-icon-btn {
        opacity: 1;
        color: #64748b;
      }
    }

    .edit-mode-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      margin-top: 6px;
    }

    .edit-comment-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      font-family: inherit;
      font-size: 13px;
      color: #0f172a;
      background-color: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      outline: none;
      resize: vertical;
      transition: all 0.2s ease;

      &:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }
    }

    .edit-comment-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;

      .btn-text {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 6px;
        transition: all 0.2s ease;
        &:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }
      }
      
      .btn-save {
        background-color: #0f172a;
        color: #ffffff;
        border: none;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover:not(:disabled) {
          background-color: #1e293b;
          transform: translateY(-1px);
        }
        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }
    }

    .popup-footer {
      padding: 16px 24px 20px;
      border-top: 1px solid #f1f5f9;
      background-color: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .new-comment-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 12px 14px;
      font-family: inherit;
      font-size: 13.5px;
      color: #0f172a;
      background-color: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      outline: none;
      resize: none;
      transition: all 0.2s ease;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02);

      &:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12), inset 0 1px 2px rgba(0, 0, 0, 0.02);
      }
      
      &::placeholder {
        color: #94a3b8;
      }
    }

    .btn-add-comment {
      align-self: flex-end;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 4px rgba(15, 23, 42, 0.15);
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(15, 23, 42, 0.2);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        box-shadow: none;
      }
    }
  `]
})
export class TaskCommentPopupComponent implements OnInit {
  task: TaskItem;
  comments: PopupComment[] = [];
  loading = false;
  newCommentText = '';
  submitting = false;
  editingCommentId: string | null = null;
  editingText = '';
  savingEdit = false;

  constructor(
    public dialogRef: MatDialogRef<TaskCommentPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskCommentPopupData,
    private service: TaskAccountabilityService,
    private authService: AuthService,
    private notification: NotificationService,
    private translate: TranslateService
  ) {
    this.task = data.task;
  }

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    if (!this.task?.id) return;
    this.loading = true;
    this.service.getTaskCommentsApi(this.task.id).subscribe({
      next: (res) => {
        const raw = res?.data || [];
        this.comments = raw
          .map((c: any) => this.mapComment(c))
          .sort((a: PopupComment, b: PopupComment) => (a.createdAtDate?.getTime() || 0) - (b.createdAtDate?.getTime() || 0));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load comments:', err);
        this.notification.showErrorToast(this.translate.instant('taskAccountability.taskTable.failedToLoadComments'));
      }
    });
  }

  private mapComment(c: any): PopupComment {
    return {
      id: (c.id ?? '').toString(),
      authorName: c.commentedByName || c.authorName || 'User',
      commentedByUserId: c.commentedById != null ? String(c.commentedById) : null,
      text: c.comment || c.text || '',
      createdAtDate: c.createdAt ? new Date(c.createdAt) : null,
      edited: !!c.edited
    };
  }

  getInitial(name: string): string {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  getAvatarStyle(name: string): { [key: string]: string } {
    const hash = this.hashCode(name);
    const colors = [
      { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }, // Blue
      { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' }, // Green
      { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' }, // Orange
      { bg: '#faf5ff', text: '#6b21a8', border: '#f3e8ff' }, // Purple
      { bg: '#fff1f2', text: '#be123c', border: '#ffe4e6' }, // Rose
      { bg: '#f0fdfa', text: '#0f766e', border: '#ccfbf1' }, // Teal
    ];
    const index = Math.abs(hash) % colors.length;
    const selected = colors[index];
    return {
      'background-color': selected.bg,
      'color': selected.text,
      'border-color': selected.border
    };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  formatTimestamp(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleString(this.translate.currentLang || 'en', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isMyComment(comment: PopupComment): boolean {
    const user: any = this.authService.currentUserValue;
    if (!user || !comment.commentedByUserId) return false;
    const currentUserId = user.userId || user.id;
    if (currentUserId == null) return false;
    return String(comment.commentedByUserId) === String(currentUserId);
  }

  submitComment(): void {
    const text = this.newCommentText.trim();
    if (!text || !this.task?.id || this.submitting) return;
    this.submitting = true;
    this.service.addTaskCommentApi(this.task.id, text).subscribe({
      next: () => {
        this.newCommentText = '';
        this.submitting = false;
        this.loadComments();
        this.service.triggerRefresh();
      },
      error: (err) => {
        this.submitting = false;
        console.error('Failed to add comment:', err);
        this.notification.showErrorToast(this.translate.instant('taskAccountability.taskTable.failedToAddComment'));
      }
    });
  }

  startEdit(comment: PopupComment): void {
    this.editingCommentId = comment.id;
    this.editingText = comment.text;
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editingText = '';
  }

  saveEdit(comment: PopupComment): void {
    const text = this.editingText.trim();
    if (!text || this.savingEdit || !this.task?.id) return;
    this.savingEdit = true;
    this.service.updateTaskCommentApi(this.task.id, comment.id, text).subscribe({
      next: () => {
        this.savingEdit = false;
        this.editingCommentId = null;
        this.editingText = '';
        this.loadComments();
        this.service.triggerRefresh();
      },
      error: (err) => {
        this.savingEdit = false;
        console.error('Failed to update comment:', err);
        const message = err?.error?.message || this.translate.instant('taskAccountability.taskTable.failedToUpdateComment');
        this.notification.showErrorToast(message);
      }
    });
  }
}
