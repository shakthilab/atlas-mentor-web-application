import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { VoiceRecorderService, VoiceRecordingResult } from '../../../../core/services/voice-recorder.service';
import { TaskItem } from '../../interfaces/accountability.interface';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';

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
  audioUrl?: string;
  audioDuration?: number;
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

                <!-- Three Dots Menu for Comment Owner -->
                <button
                  class="comment-menu-btn"
                  *ngIf="isMyComment(comment) && editingCommentId !== comment.id"
                  [matMenuTriggerFor]="popupCommentMenu"
                  type="button"
                  aria-label="Comment options"
                >
                  <i-tabler name="dots-vertical" class="icon-14"></i-tabler>
                </button>

                <mat-menu #popupCommentMenu="matMenu" class="comment-options-mat-menu">
                  <button mat-menu-item *ngIf="!comment.audioUrl" (click)="startEdit(comment)">
                    <i-tabler name="pencil" class="icon-16 mr-2"></i-tabler>
                    <span>{{ 'taskAccountability.taskTable.editComment' | translate }}</span>
                  </button>
                  <button mat-menu-item class="delete-menu-item" (click)="deleteComment(comment)">
                    <i-tabler name="trash" class="icon-16 mr-2 text-danger"></i-tabler>
                    <span class="text-danger">{{ 'common.delete' | translate }}</span>
                  </button>
                </mat-menu>
              </div>

              <ng-container *ngIf="editingCommentId !== comment.id; else editMode">
                <div class="comment-bubble" [class.has-voice]="!!comment.audioUrl">
                  <!-- Voice Note Player (if comment is voice recording) -->
                  <app-voice-note-player 
                    *ngIf="comment.audioUrl"
                    [audioUrl]="comment.audioUrl" 
                    [duration]="comment.audioDuration || 0"
                    [isMyMessage]="isMyComment(comment)"
                    [authorName]="comment.authorName"
                  ></app-voice-note-player>

                  <p class="comment-text-body" *ngIf="comment.text && !isPureVoiceNote(comment.text)">{{ comment.text }}</p>
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
        <!-- Normal Input State -->
        <div class="footer-input-container" *ngIf="!isVoiceRecording" (paste)="onCommentPaste($event)">
          <!-- Pending Media from Clipboard -->
          <div class="popup-pending-media" *ngIf="pendingCommentFile">
            <img [src]="pendingCommentPreviewUrl" *ngIf="pendingCommentPreviewUrl" class="popup-pending-img" />
            <span class="popup-pending-name">{{ pendingCommentFile.name }} ({{ (pendingCommentFile.size / 1024).toFixed(1) }} KB)</span>
            <button type="button" class="btn-remove-pending" (click)="cancelCommentFile()">
              <i-tabler name="x" class="icon-12"></i-tabler>
            </button>
          </div>

          <textarea
            class="new-comment-textarea"
            [(ngModel)]="newCommentText"
            rows="2"
            [placeholder]="'taskAccountability.taskTable.addCommentPlaceholder' | translate"
            (paste)="onCommentPaste($event)"
            (keydown.control.enter)="submitComment()"
            (keydown.meta.enter)="submitComment()"
          ></textarea>
          <div class="footer-actions-row">
            <!-- WhatsApp style Mic button -->
            <button
              class="btn-mic"
              (click)="startVoiceRecording()"
              [title]="'taskAccountability.taskTable.recordVoice' | translate"
              type="button"
            >
              <i-tabler name="microphone" class="icon-16"></i-tabler>
            </button>

            <!-- Send comment button -->
            <button
              class="btn-add-comment"
              [disabled]="(!newCommentText.trim() && !pendingCommentFile) || submitting"
              (click)="submitComment()"
              type="button"
            >
              <i-tabler name="send" class="icon-14"></i-tabler>
              {{ 'taskAccountability.taskTable.addComment' | translate }}
            </button>
          </div>
        </div>

        <!-- Voice Recording State (WhatsApp style) -->
        <div class="popup-recording-bar" *ngIf="isVoiceRecording">
          <button 
            class="btn-recording-trash" 
            type="button" 
            (click)="cancelVoiceRecording()" 
            [title]="'taskAccountability.taskTable.cancelRecording' | translate"
          >
            <i-tabler name="trash" class="icon-16"></i-tabler>
          </button>

          <div class="recording-meta">
            <span class="recording-pulse"></span>
            <span class="recording-time">{{ recordingDurationFormatted }}</span>
          </div>

          <div class="equalizer-bars">
            <span class="bar b1"></span>
            <span class="bar b2"></span>
            <span class="bar b3"></span>
            <span class="bar b4"></span>
            <span class="bar b5"></span>
            <span class="bar b6"></span>
          </div>

          <button 
            class="btn-send-voice" 
            type="button" 
            (click)="stopAndSendVoiceComment()" 
            [title]="'taskAccountability.taskTable.sendVoice' | translate"
          >
            <i-tabler name="send" class="icon-14 text-white"></i-tabler>
          </button>
        </div>
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

    .comment-menu-btn,
    .edit-comment-icon-btn {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      color: #94a3b8;
      cursor: pointer;
      padding: 2px 4px;
      margin: 0;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      opacity: 0.7;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.06) !important;
        color: #0f172a;
        opacity: 1;
      }
    }

    .comment-item:hover {
      .comment-menu-btn,
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

    .comment-bubble.has-voice {
      padding: 0;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
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
      padding: 14px 20px 18px;
      border-top: 1px solid #f1f5f9;
      background-color: #f8fafc;
      display: flex;
      flex-direction: column;
    }

    .footer-input-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .popup-pending-media {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 4px 8px;
      margin-bottom: 8px;

      .popup-pending-img {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        object-fit: cover;
      }

      .popup-pending-name {
        font-size: 11.5px;
        font-weight: 600;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }

      .btn-remove-pending {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 2px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          color: #dc2626;
          background-color: #fee2e2;
        }
      }
    }

    .new-comment-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 14px;
      font-size: 13.5px;
      font-family: inherit;
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

    .footer-actions-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .btn-mic {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: #ffffff;
      border: 1.5px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #475569;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background-color: #e0e7ff;
        border-color: #c7d2fe;
        color: #4f46e5;
        transform: scale(1.08);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .btn-add-comment {
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

    /* Popup Voice Recording Mode */
    .popup-recording-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%);
      border: 1.5px solid #fecdd3;
      border-radius: 12px;
      padding: 8px 12px;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08);
      animation: recFadeIn 0.25s ease-out;

      .btn-recording-trash {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: transparent;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #991b1b;
        transition: all 0.2s ease;

        &:hover {
          background-color: #fee2e2;
          color: #dc2626;
          transform: scale(1.1);
        }
      }

      .recording-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .recording-pulse {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #ef4444;
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          animation: recDotPulse 1.4s infinite;
        }

        .recording-time {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          font-weight: 700;
          color: #991b1b;
        }
      }

      .equalizer-bars {
        display: flex;
        align-items: center;
        gap: 3px;
        height: 18px;
        flex: 1;
        justify-content: center;

        .bar {
          width: 3px;
          border-radius: 3px;
          background-color: #f43f5e;
          animation: eqBar 1s ease-in-out infinite alternate;

          &.b1 { height: 6px; animation-delay: 0.1s; }
          &.b2 { height: 14px; animation-delay: 0.3s; }
          &.b3 { height: 8px; animation-delay: 0.15s; }
          &.b4 { height: 16px; animation-delay: 0.4s; }
          &.b5 { height: 10px; animation-delay: 0.2s; }
          &.b6 { height: 6px; animation-delay: 0.35s; }
        }
      }

      .btn-send-voice {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background-color: #2563eb;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background-color: #1d4ed8;
          transform: scale(1.08);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    @keyframes recFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes recDotPulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    @keyframes eqBar {
      0% { height: 4px; opacity: 0.6; }
      100% { height: 16px; opacity: 1; }
    }
  `]
})
export class TaskCommentPopupComponent implements OnInit, OnDestroy {
  task: TaskItem;
  comments: PopupComment[] = [];
  loading = false;
  newCommentText = '';
  submitting = false;
  editingCommentId: string | null = null;
  editingText = '';
  savingEdit = false;

  // Clipboard & Media upload state
  pendingCommentFile: File | null = null;
  pendingCommentPreviewUrl: string | null = null;

  // Allowed extensions and size limits
  private readonly ALLOWED_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'mp3', 'm4a', 'ogg', 'wav', 'webm',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'
  ];
  private readonly MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
  private readonly MAX_GENERAL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  // Voice recording state
  isVoiceRecording = false;
  recordingDurationSec = 0;
  recordingDurationFormatted = '0:00';

  private sub = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<TaskCommentPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskCommentPopupData,
    private service: TaskAccountabilityService,
    private authService: AuthService,
    private notification: NotificationService,
    private translate: TranslateService,
    private voiceRecorder: VoiceRecorderService,
    private dialog: MatDialog
  ) {
    this.task = data.task;
  }

  ngOnInit(): void {
    this.loadComments();

    this.sub.add(
      this.voiceRecorder.recordingDuration$.subscribe(sec => {
        this.recordingDurationSec = sec;
        this.recordingDurationFormatted = this.voiceRecorder.formatTime(sec);
      })
    );
  }

  ngOnDestroy(): void {
    this.voiceRecorder.cancelRecording();
    this.sub.unsubscribe();
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
    const rawContent = c.comment || c.text || '';
    const parsed = this.parseCommentPayload(rawContent);
    return {
      id: (c.id ?? '').toString(),
      authorName: c.commentedByName || c.authorName || 'User',
      commentedByUserId: c.commentedById != null ? String(c.commentedById) : null,
      text: parsed.text,
      audioUrl: parsed.audioUrl || c.audioUrl || undefined,
      audioDuration: parsed.audioDuration || c.audioDuration || undefined,
      createdAtDate: c.createdAt ? new Date(c.createdAt) : null,
      edited: !!c.edited
    };
  }

  public parseCommentPayload(raw: string): { text: string; audioUrl?: string; audioDuration?: number } {
    if (!raw) return { text: '' };

    if (raw.startsWith('[VOICE_NOTE:') && raw.includes(']')) {
      const headerEnd = raw.indexOf(']');
      const header = raw.substring(12, headerEnd);
      const durMatch = header.match(/duration=(\d+)/);
      const duration = durMatch ? parseInt(durMatch[1], 10) : 0;
      const audioUrl = raw.substring(headerEnd + 1);
      return { text: '', audioUrl, audioDuration: duration };
    }

    if (raw.startsWith('data:audio/')) {
      return { text: '', audioUrl: raw, audioDuration: 0 };
    }

    try {
      if (raw.startsWith('{') && raw.includes('"audioUrl"')) {
        const parsed = JSON.parse(raw);
        return {
          text: parsed.caption || '',
          audioUrl: parsed.audioUrl,
          audioDuration: parsed.duration || 0
        };
      }
    } catch (e) {}

    return { text: raw };
  }

  public isPureVoiceNote(text?: string): boolean {
    if (!text) return true;
    return text.startsWith('[VOICE_NOTE:') || text.startsWith('data:audio/');
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

  cancelCommentFile(): void {
    if (this.pendingCommentPreviewUrl) {
      URL.revokeObjectURL(this.pendingCommentPreviewUrl);
    }
    this.pendingCommentFile = null;
    this.pendingCommentPreviewUrl = null;
  }

  validateFile(file: File): { valid: boolean; errorKey?: string; defaultMessage?: string } {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        errorKey: 'taskAccountability.taskDetails.unsupportedFileType',
        defaultMessage: 'Unsupported file type.'
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

  onCommentPaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    // Check items first (preferred for screenshots and copied images)
    const items = clipboardData.items;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            this.handlePastedFile(file);
            return;
          }
        }
      }
    }

    // Fallback: check files array
    const files = clipboardData.files;
    if (files && files.length > 0) {
      event.preventDefault();
      this.handlePastedFile(files[0]);
      return;
    }
  }

  private handlePastedFile(file: File): void {
    let finalFile = file;
    // Standardize file name for screenshots / pasted clips without extensions
    if (!file.name || file.name === 'image.png' || file.name === 'blob' || !file.name.includes('.')) {
      let ext = 'png';
      if (file.type) {
        const sub = file.type.split('/')[1];
        if (sub) ext = sub.replace('jpeg', 'jpg');
      }
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
      finalFile = new File([file], `screenshot_${timestamp}.${ext}`, { type: file.type || 'image/png' });
    }

    const val = this.validateFile(finalFile);
    if (!val.valid) {
      const msg = val.errorKey ? this.translate.instant(val.errorKey) : val.defaultMessage;
      this.notification.showErrorToast(msg || 'Invalid file');
      return;
    }

    if (this.pendingCommentPreviewUrl) {
      URL.revokeObjectURL(this.pendingCommentPreviewUrl);
    }

    this.pendingCommentFile = finalFile;
    if (finalFile.type.startsWith('image/')) {
      this.pendingCommentPreviewUrl = URL.createObjectURL(finalFile);
    } else {
      this.pendingCommentPreviewUrl = null;
    }
  }

  submitComment(): void {
    const text = this.newCommentText.trim();
    if ((!text && !this.pendingCommentFile) || !this.task?.id || this.submitting) return;
    this.submitting = true;

    // Case 1: Pasted media file attached -> Two-step flow
    if (this.pendingCommentFile) {
      const fileToUpload = this.pendingCommentFile;
      const commentPayload = text || null;

      this.service.addTaskCommentApi(this.task.id, commentPayload).subscribe({
        next: (commentRes) => {
          const commentId = commentRes?.id || commentRes?.data?.id;
          if (!commentId) {
            this.submitting = false;
            this.cancelCommentFile();
            this.newCommentText = '';
            this.loadComments();
            this.service.triggerRefresh();
            return;
          }

          this.service.uploadTaskAttachmentApi(this.task.id, fileToUpload, commentId).subscribe({
            next: () => {
              this.submitting = false;
              this.cancelCommentFile();
              this.newCommentText = '';
              this.loadComments();
              this.service.triggerRefresh();
            },
            error: (uploadErr) => {
              this.submitting = false;
              console.error('Failed to upload pasted comment attachment:', uploadErr);
              const errMsg = uploadErr?.error?.message || this.translate.instant('common.errorOccurred');
              this.notification.showErrorToast(errMsg);
              this.loadComments();
            }
          });
        },
        error: (err) => {
          this.submitting = false;
          console.error('Failed to create comment record:', err);
          this.notification.showErrorToast(this.translate.instant('taskAccountability.taskTable.failedToAddComment'));
        }
      });
      return;
    }

    // Case 2: Plain text comment
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

  // --- Voice Recording in Popup Dialog ---

  async startVoiceRecording(): Promise<void> {
    try {
      await this.voiceRecorder.startRecording();
      this.isVoiceRecording = true;
    } catch (err: any) {
      this.isVoiceRecording = false;
      if (err?.message === 'PERMISSION_DENIED') {
        this.notification.showErrorToast(
          this.translate.instant('taskAccountability.taskTable.micAccessDenied')
        );
      } else {
        this.notification.showErrorToast(
          this.translate.instant('taskAccountability.taskTable.micNotSupported')
        );
      }
    }
  }

  cancelVoiceRecording(): void {
    this.voiceRecorder.cancelRecording();
    this.isVoiceRecording = false;
  }

  async stopAndSendVoiceComment(): Promise<void> {
    try {
      const result = await this.voiceRecorder.stopRecording();
      this.isVoiceRecording = false;
      if (!result || !this.task?.id) return;

      this.submitting = true;
      this.service.addTaskCommentApi(this.task.id, null).subscribe({
        next: (commentRes) => {
          const commentId = commentRes?.id || commentRes?.data?.id;
          if (!commentId) {
            this.submitting = false;
            this.loadComments();
            return;
          }

          this.service.uploadTaskAttachmentApi(this.task.id, result.blob, commentId, 'voice_note.webm').subscribe({
            next: () => {
              this.submitting = false;
              this.loadComments();
              this.service.triggerRefresh();
            },
            error: (uploadErr) => {
              // The old fallback crammed the raw base64 recording into the comment's
              // text - it always exceeded the server's 1000-char cap and left a blank
              // "empty message" comment behind either way. Delete that orphaned
              // comment instead and tell the user to retry the recording.
              console.error('Failed to upload voice recording multipart file in popup:', uploadErr);
              this.notification.showErrorToast(
                this.translate.instant('taskAccountability.taskTable.voiceUploadFailed')
              );
              this.service.deleteTaskCommentApi(this.task.id, commentId).subscribe({
                next: () => {
                  this.submitting = false;
                  this.loadComments();
                },
                error: (deleteErr) => {
                  console.error('Failed to clean up orphaned empty comment in popup:', deleteErr);
                  this.submitting = false;
                  this.loadComments();
                }
              });
            }
          });
        },
        error: (err) => {
          this.submitting = false;
          console.error('Failed to create voice note comment record:', err);
        }
      });
    } catch (err) {
      this.isVoiceRecording = false;
      this.submitting = false;
      console.error('Error stopping recording in popup:', err);
    }
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

  deleteComment(comment: PopupComment): void {
    if (!comment?.id || !this.task?.id) return;

    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        title: this.translate.instant('taskAccountability.taskTable.deleteCommentTitle') || 'Delete Comment?',
        message: this.translate.instant('taskAccountability.taskTable.deleteCommentConfirm') || 'Are you sure you want to delete this comment? This action cannot be undone.',
        confirmText: this.translate.instant('common.delete') || 'Delete',
        cancelText: this.translate.instant('common.cancel') || 'Cancel'
      },
      maxWidth: '400px',
      autoFocus: false
    });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.service.deleteTaskCommentApi(this.task.id, comment.id).subscribe({
          next: (res) => {
            this.notification.showSuccessToast(res?.message || this.translate.instant('taskAccountability.taskTable.commentDeleted') || 'Comment deleted successfully');
            this.loadComments();
            this.service.triggerRefresh();
          },
          error: (err) => {
            console.error('Failed to delete comment in popup:', err);
            const message = err?.error?.message || this.translate.instant('common.errorOccurred');
            this.notification.showErrorToast(message);
          }
        });
      }
    });
  }
}
