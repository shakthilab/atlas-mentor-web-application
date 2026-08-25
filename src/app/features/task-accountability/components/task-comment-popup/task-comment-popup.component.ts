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
          <h3>{{ 'taskAccountability.taskTable.commentPopupTitle' | translate }}</h3>
          <p class="subtitle">{{ task.name }}</p>
        </div>
        <button class="close-btn" mat-dialog-close type="button" [attr.aria-label]="'common.close' | translate">
          <i-tabler name="x" class="icon-18"></i-tabler>
        </button>
      </div>

      <div class="popup-body">
        <div class="comment-loading" *ngIf="loading">
          {{ 'taskAccountability.taskTable.loadingComments' | translate }}
        </div>

        <div class="empty-comments" *ngIf="!loading && comments.length === 0">
          <i-tabler name="message-circle-2" class="icon-28"></i-tabler>
          <p>{{ 'taskAccountability.taskTable.noComments' | translate }}</p>
        </div>

        <div class="comment-list" *ngIf="!loading && comments.length > 0">
          <div class="comment-item" *ngFor="let comment of comments">
            <div class="comment-avatar">{{ getInitial(comment.authorName) }}</div>
            <div class="comment-content">
              <div class="comment-meta">
                <span class="comment-author">{{ comment.authorName }}</span>
                <span class="comment-time">{{ formatTimestamp(comment.createdAtDate) }}</span>
                <span class="edited-tag" *ngIf="comment.edited">{{ 'taskAccountability.taskTable.editedTag' | translate }}</span>
              </div>

              <ng-container *ngIf="editingCommentId !== comment.id; else editMode">
                <p class="comment-text-body">{{ comment.text }}</p>
                <button class="edit-comment-btn" *ngIf="isMyComment(comment)" (click)="startEdit(comment)" type="button">
                  <i-tabler name="pencil" class="icon-12"></i-tabler>
                  {{ 'taskAccountability.taskTable.editComment' | translate }}
                </button>
              </ng-container>

              <ng-template #editMode>
                <textarea
                  class="edit-comment-textarea"
                  [(ngModel)]="editingText"
                  rows="2"
                  cdkFocusInitial
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
        ></textarea>
        <button
          class="btn-add-comment"
          [disabled]="!newCommentText.trim() || submitting"
          (click)="submitComment()"
          type="button"
        >
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
    }
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px 20px 12px;
      border-bottom: 1px solid #f1f5f9;

      .header-titles {
        h3 {
          margin: 0 0 2px 0;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }
        .subtitle {
          margin: 0;
          font-size: 12.5px;
          color: #64748b;
        }
      }

      .close-btn {
        background: transparent;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        &:hover { background-color: #f1f5f9; color: #0f172a; }
      }
    }

    .popup-body {
      padding: 12px 20px;
      max-height: 360px;
      overflow-y: auto;
    }

    .comment-loading,
    .empty-comments {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 28px 12px;
      color: #94a3b8;
      font-size: 13px;

      .icon-28 { width: 28px; height: 28px; }
      p { margin: 0; }
    }

    .comment-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .comment-item {
      display: flex;
      gap: 10px;
    }

    .comment-avatar {
      flex-shrink: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12.5px;
      font-weight: 700;
    }

    .comment-content {
      flex: 1;
      min-width: 0;
    }

    .comment-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 3px;

      .comment-author {
        font-size: 13px;
        font-weight: 700;
        color: #0f172a;
      }
      .comment-time {
        font-size: 11px;
        color: #94a3b8;
      }
      .edited-tag {
        font-size: 10.5px;
        color: #94a3b8;
        font-style: italic;
      }
    }

    .comment-text-body {
      margin: 0;
      font-size: 13px;
      color: #334155;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .edit-comment-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
      background: transparent;
      border: none;
      color: #2563eb;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      &:hover { text-decoration: underline; }
    }

    .edit-comment-textarea,
    .new-comment-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 10px;
      font-family: inherit;
      font-size: 13px;
      color: #0f172a;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      outline: none;
      resize: vertical;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
      }
      &::placeholder { color: #94a3b8; }
    }

    .edit-comment-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 6px;

      .btn-text {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        padding: 4px 8px;
        &:hover { color: #0f172a; }
      }
      .btn-save {
        background-color: #2D2E32;
        color: #ffffff;
        border: none;
        padding: 5px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        &:hover:not(:disabled) { background-color: #1d1e21; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
    }

    .popup-footer {
      padding: 14px 20px 18px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn-add-comment {
      align-self: flex-end;
      background-color: #2D2E32;
      color: #ffffff;
      border: none;
      padding: 7px 16px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      &:hover:not(:disabled) { background-color: #1d1e21; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
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
