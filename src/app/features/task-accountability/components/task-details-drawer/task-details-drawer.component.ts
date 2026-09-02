import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { TaskItem, CommentItem, AttachmentItem } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

import { MatDialog } from '@angular/material/dialog';
import { SendBackReasonDialogComponent } from '../send-back-reason-dialog/send-back-reason-dialog.component';
import { AttachmentPreviewDialogComponent, AttachmentPreviewDialogData } from '../attachment-preview-dialog/attachment-preview-dialog.component';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';
import { AttachProofDialogComponent } from '../attach-proof-dialog/attach-proof-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { VoiceRecorderService, VoiceRecordingResult } from '../../../../core/services/voice-recorder.service';

@Component({
  selector: 'app-task-details-drawer',
  templateUrl: './task-details-drawer.component.html',
  styleUrls: ['./task-details-drawer.component.scss']
})
export class TaskDetailsDrawerComponent implements OnInit, OnDestroy {
  @ViewChild('chatContainer') chatContainer?: ElementRef;

  task: TaskItem | null = null;
  newCommentText = '';
  activeTab: 'comments' | 'activity' = 'comments';

  editingCommentId: string | null = null;
  editingCommentText = '';
  savingCommentEdit = false;

  // Proof upload state
  pendingProofFile: File | null = null;
  pendingProofPreviewUrl: string | null = null;
  isUploadingProof = false;

  // Comment media attachment state
  pendingCommentFile: File | null = null;
  pendingCommentPreviewUrl: string | null = null;
  isUploadingCommentMedia = false;

  // Image lightbox preview
  lightboxImageUrl: string | null = null;

  // Voice Recording State (WhatsApp style)
  isVoiceRecording = false;
  recordingDurationSec = 0;
  recordingDurationFormatted = '0:00';

  // Resizing State
  width = 500; // default initial width in pixels
  isResizing = false;
  private startX = 0;
  private startWidth = 0;

  workflowSteps = [
    { label: 'Employee', value: 'Employee' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Counsellor Approved', value: 'Counsellor Approved' },
    { label: 'Manager Review', value: 'Manager Review' },
    { label: 'Manager Feedback', value: 'Manager Feedback' },
    { label: 'Verified', value: 'Verified' },
    { label: 'Closed', value: 'Closed' }
  ];

  statusesList: { value: string; label: string }[] = [
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'DONE', label: 'Done' },
    { value: 'REFLECT', label: 'Reflect' }
  ];

  private sub = new Subscription();

  constructor(
    private service: TaskAccountabilityService,
    private authService: AuthService,
    private elRef: ElementRef,
    private dialog: MatDialog,
    private translate: TranslateService,
    private notification: NotificationService,
    private voiceRecorder: VoiceRecorderService
  ) {}

  loadStatuses(): void {
    this.service.getStatusesApi().subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          this.statusesList = data
            .map((item: any) => {
              if (typeof item === 'string') {
                return { value: item, label: this.formatStatusLabel(item) };
              }
              return {
                value: item.value || item.status || item.name || item,
                label: item.label || item.name || this.formatStatusLabel(item.value || item.status || item)
              };
            })
            // Users should never manually set a task TO overdue — exclude it from the picker
            .filter((s: { value: string; label: string }) => s.value?.toUpperCase() !== 'OVERDUE');
        }
      },
      error: (err) => {
        console.warn('Could not load status list from API in drawer, using defaults:', err);
      }
    });
  }

  formatStatusLabel(status?: string): string {
    if (!status) return this.translate.instant('common.status.todo');
    const s = status.toUpperCase().trim();
    if (s === 'TODO' || s === 'TO DO' || s === 'NOT_STARTED') return this.translate.instant('common.status.todo');
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return this.translate.instant('common.status.inProgress');
    if (s === 'DONE' || s === 'COMPLETED') return this.translate.instant('common.status.done');
    if (s === 'VERIFIED' || s === 'APPROVED') return this.translate.instant('common.status.verified');
    if (s === 'CLOSED') return this.translate.instant('common.status.closed');
    if (s === 'REFLECT' || s === 'SEND_BACK' || s === 'REJECTED') return this.translate.instant('common.status.reflect');
    if (s === 'OVERDUE') return this.translate.instant('common.status.overdue');
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getPriorityLabel(priority?: string): string {
    if (!priority) return this.translate.instant('common.priority.medium');
    const p = priority.toUpperCase().trim();
    if (p === 'URGENT') return this.translate.instant('common.priority.urgent');
    if (p === 'HIGH') return this.translate.instant('common.priority.high');
    if (p === 'MEDIUM') return this.translate.instant('common.priority.medium');
    if (p === 'LOW') return this.translate.instant('common.priority.low');
    return priority;
  }

  get canCurrentUserAct(): boolean {
    const currentDay = this.service.selectedDayValue;
    if (currentDay && typeof (currentDay as any).canCurrentUserAct === 'boolean') {
      return (currentDay as any).canCurrentUserAct;
    }
    return true;
  }

  /**
   * Late-completion catch-up (ADMIN only): this task is DONE/COMPLETED but its day already
   * reached ADMIN_VERIFIED - the backend's one-time verifyEligibleTasks sweep already ran and
   * skipped it because it wasn't DONE yet at that moment, so it's stuck at DONE forever unless
   * verified individually (DayApprovalService#approveResubmittedTasks). canCurrentUserAct alone
   * is correctly false in this state (the day itself isn't awaiting review), so the Approve
   * button needs this separate escape hatch to ever become usable again.
   */
  get canCatchUpThisTask(): boolean {
    if (!this.task) return false;
    const user = this.authService.currentUserValue;
    const isAdmin = (user?.role || '').toString().toUpperCase().trim() === 'ADMIN';
    if (!isAdmin) return false;
    const currentDay = this.service.selectedDayValue;
    const stage = ((currentDay as any)?.approvalStage || currentDay?.status || '').toString().toUpperCase().trim();
    if (stage !== 'ADMIN_VERIFIED') return false;
    const s = (this.task.status || '').toString().toUpperCase().trim();
    return s === 'DONE' || s === 'COMPLETED';
  }

  get canShowReviewActions(): boolean {
    const user = this.authService.currentUserValue;
    if (!user || !user.role) return false;

    const role = user.role.toUpperCase().trim();
    const approvalRoles = [
      'ADMIN',
      'MANAGER',
      'BRANCH_PARTNER',
      'ADMINISTRATIVE_ASSISTANT'
    ];

    return approvalRoles.includes(role);
  }

  getReviewStageLabel(): string {
    const user = this.authService.currentUserValue;
    if (!user || !user.role) return this.translate.instant('taskAccountability.taskDetails.review');

    const role = user.role.toUpperCase().trim();
    switch (role) {
      case 'ADMIN':
        return this.translate.instant('taskAccountability.taskDetails.adminReview');
      case 'MANAGER':
        return this.translate.instant('taskAccountability.taskDetails.managerReview');
      case 'BRANCH_PARTNER':
        return this.translate.instant('taskAccountability.taskDetails.branchPartnerReview');
      case 'ADMINISTRATIVE_ASSISTANT':
        return this.translate.instant('taskAccountability.taskDetails.adminAssistantReview');
      default:
        return this.translate.instant('taskAccountability.taskDetails.review');
    }
  }

  getWorkflowStepIndex(status: string): number {
    return this.workflowSteps.findIndex(s => s.value === status);
  }

  isStepCompleted(stepValue: string): boolean {
    if (!this.task) return false;
    const currentIdx = this.getWorkflowStepIndex(this.task.status);
    const stepIdx = this.workflowSteps.findIndex(s => s.value === stepValue);
    return stepIdx <= currentIdx;
  }

  isStepBeforeCurrent(stepValue: string): boolean {
    if (!this.task) return false;
    const currentIdx = this.getWorkflowStepIndex(this.task.status);
    const stepIdx = this.workflowSteps.findIndex(s => s.value === stepValue);
    return stepIdx < currentIdx;
  }

  getStepClass(index: number): string {
    if (!this.task) return 'step-pending';
    const activeIdx = this.getWorkflowStepIndex(this.task.status);
    if (index < activeIdx) {
      return 'step-completed';
    } else if (index === activeIdx) {
      return 'step-active';
    } else {
      return 'step-pending';
    }
  }

  replyingToComment: any = null;

  displayTask: TaskItem | null = null;
  private closeTimer: any = null;

  ngOnInit(): void {
    this.loadStatuses();

    this.sub.add(
      this.voiceRecorder.recordingDuration$.subscribe(sec => {
        this.recordingDurationSec = sec;
        this.recordingDurationFormatted = this.voiceRecorder.formatTime(sec);
      })
    );

    this.sub.add(
      this.service.selectedTask$.subscribe(t => {
        if (t) {
          if (this.closeTimer) {
            clearTimeout(this.closeTimer);
            this.closeTimer = null;
          }
          this.task = t;
          this.displayTask = t;
          this.newCommentText = '';
          this.replyingToComment = null;
          if (this.isVoiceRecording) {
            this.cancelVoiceRecording();
          }
          if (t.id && !t.id.startsWith('demo-') && !t.id.startsWith('tt-')) {
            this.loadRealTaskDetails(t.id);
          }
        } else {
          this.task = null;
          if (this.isVoiceRecording) {
            this.cancelVoiceRecording();
          }
          // Keep displayTask populated during the 350ms slide-out animation
          this.closeTimer = setTimeout(() => {
            this.displayTask = null;
          }, 350);
        }
      })
    );
  }

  closeDrawer(): void {
    this.service.selectTask(null);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.dialog.openDialogs && this.dialog.openDialogs.length > 0) {
      return;
    }
    if (this.task) {
      event.preventDefault();
      this.closeDrawer();
    }
  }

  accessForbidden = false;
  accessForbiddenMessage = '';

  loadRealTaskDetails(taskId: string | number): void {
    this.accessForbidden = false;
    this.accessForbiddenMessage = '';

    // 1. Fetch Task Detail
    this.service.getTaskDetailApi(taskId).subscribe({
      next: (res) => {
        if (res && res.data && this.task) {
          this.task.displayId = res.data.displayId || this.task.displayId;
          this.task.name = res.data.title || this.task.name;
          this.task.description = res.data.description || this.task.description;
          this.task.status = res.data.status || this.task.status;
          this.task.priority = res.data.priority || this.task.priority;
          this.task.proofRequired = false;
          this.task.assignedTo = res.data.assigneeName || this.task.assignedTo;
          this.task.createdByName = res.data.createdByName || this.task.createdByName;
          // dueDate/completedAt (V23) - present on the full task detail response too; keep
          // whatever the day list already had (e.g. carriedOver) and just refresh these.
          this.task.dueDate = res.data.dueDate || this.task.dueDate;
          this.task.completedAt = res.data.completedAt ?? this.task.completedAt;
        }
      },
      error: (err) => {
        if (err.status === 403) {
          this.accessForbidden = true;
          this.accessForbiddenMessage = "You don't have access to view this task's details.";
        } else {
          console.log('Task detail API offline/error', err);
        }
      }
    });

    // 2. Fetch Nested Comments Tree
    this.loadComments(taskId);

    // 3. Fetch Attachments
    this.loadAttachments(taskId);

    // 4. Fetch Activity Logs
    this.loadActivityLogs(taskId);
  }

  scrollToBottom(): void {
    try {
      if (this.chatContainer && this.chatContainer.nativeElement) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  isMyComment(comment: any): boolean {
    if (!comment) return false;
    const user: any = this.authService.currentUserValue;
    if (!user) return false;

    const currentUserId = user.userId || user.id;
    if (comment.commentedByUserId && currentUserId) {
      return String(comment.commentedByUserId) === String(currentUserId);
    }

    if (comment.authorName && user.name) {
      const author = comment.authorName.toLowerCase().trim();
      const userName = user.name.toLowerCase().trim();
      if (author === userName) return true;
      if (userName.includes('admin') && author.includes('admin')) return true;
      if (userName.includes('manager') && author.includes('manager')) return true;
    }
    return false;
  }

  formatDateDivider(rawDate?: Date | string | null): string {
    if (!rawDate) return 'Today';
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'Today';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (targetDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (targetDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  get groupedComments(): { dateLabel: string; comments: any[] }[] {
    if (!this.displayTask || !this.displayTask.comments || this.displayTask.comments.length === 0) return [];

    const sorted = [...this.displayTask.comments].sort((a: any, b: any) => {
      const timeA = a.createdAtDate ? a.createdAtDate.getTime() : (a.id ? Number(a.id) || 0 : 0);
      const timeB = b.createdAtDate ? b.createdAtDate.getTime() : (b.id ? Number(b.id) || 0 : 0);
      return timeA - timeB;
    });

    const groups: { dateLabel: string; comments: any[] }[] = [];
    let currentGroup: { dateLabel: string; comments: any[] } | null = null;

    for (const c of sorted) {
      const label = this.formatDateDivider(c.createdAtRaw || c.createdAtDate);
      if (!currentGroup || currentGroup.dateLabel !== label) {
        currentGroup = { dateLabel: label, comments: [] };
        groups.push(currentGroup);
      }
      currentGroup.comments.push(c);
    }

    return groups;
  }

  // --- File Validation & Helpers ---
  private readonly ALLOWED_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'mp3', 'm4a', 'ogg', 'wav', 'webm', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'
  ];
  private readonly MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
  private readonly MAX_GENERAL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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

  isImageAttachment(att?: AttachmentItem | null): boolean {
    if (!att) return false;
    if (att.fileType === 'IMAGE') return true;
    if (att.fileType === 'VIDEO' || att.fileType === 'AUDIO' || att.fileType === 'DOCUMENT') return false;
    const url = (att.fileUrl || att.name || att.fileName || '').toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
  }

  isVideoAttachment(att?: AttachmentItem | null): boolean {
    if (!att) return false;
    if (att.fileType === 'VIDEO') return true;
    if (att.fileType === 'AUDIO' || att.fileType === 'IMAGE' || att.fileType === 'DOCUMENT') return false;
    const url = (att.fileUrl || att.name || att.fileName || '').toLowerCase();
    return /\.(mp4|mov|m4v|avi|mkv)$/i.test(url);
  }

  isAudioAttachment(att?: AttachmentItem | null): boolean {
    if (!att) return false;
    if (att.fileType === 'AUDIO') return true;
    if (att.fileType === 'VIDEO' || att.fileType === 'IMAGE' || att.fileType === 'DOCUMENT') return false;
    const url = (att.fileUrl || att.name || att.fileName || '').toLowerCase();
    return /\.(mp3|m4a|wav|ogg|webm|aac|flac)$/i.test(url) || !!(att as any).audioUrl;
  }

  isDocumentAttachment(att?: AttachmentItem | null): boolean {
    if (!att) return false;
    if (att.fileType === 'DOCUMENT') return true;
    if (att.fileType === 'AUDIO' || att.fileType === 'VIDEO' || att.fileType === 'IMAGE') return false;
    return !this.isImageAttachment(att) && !this.isVideoAttachment(att) && !this.isAudioAttachment(att);
  }

  getAttachmentIcon(att?: Partial<AttachmentItem> | { fileName?: string; name?: string; fileType?: string } | null): string {
    if (!att) return 'file-text';
    if (att.fileType === 'AUDIO') return 'volume';
    if (att.fileType === 'VIDEO') return 'video';
    if (att.fileType === 'IMAGE') return 'photo';

    const name = (att.fileName || att.name || '').toLowerCase();
    if (name.endsWith('.pdf')) return 'file-type-pdf';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'file-type-doc';
    if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) return 'file-spreadsheet';
    if (/\.(mp3|m4a|wav|ogg|webm|aac|flac)$/i.test(name)) return 'volume';
    if (/\.(mp4|mov|m4v|avi|mkv)$/i.test(name)) return 'video';
    if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)) return 'photo';
    return 'file-text';
  }

  openAttachmentPreview(att: AttachmentItem | string | null): void {
    if (!att) return;
    let dialogData: AttachmentPreviewDialogData;

    if (typeof att === 'string') {
      dialogData = {
        fileUrl: att,
        fileName: 'Preview',
        fileType: this.isImageAttachment({ fileUrl: att } as any) ? 'IMAGE' : (this.isVideoAttachment({ fileUrl: att } as any) ? 'VIDEO' : 'DOCUMENT')
      };
    } else {
      dialogData = {
        attachment: att,
        fileUrl: att.fileUrl,
        fileName: att.fileName || att.name,
        fileSize: att.fileSizeFormatted || att.size,
        fileType: att.fileType,
        uploadedByName: att.uploadedByName
      };
    }

    this.dialog.open(AttachmentPreviewDialogComponent, {
      data: dialogData,
      panelClass: 'attachment-preview-dialog-panel',
      backdropClass: 'attachment-preview-backdrop',
      maxWidth: '96vw',
      maxHeight: '96vh',
      autoFocus: false,
      hasBackdrop: true,
      disableClose: false
    });
  }

  closeAttachmentPreview(): void {
    this.lightboxImageUrl = null;
    this.dialog.closeAll();
  }

  openLightbox(imageUrl?: string): void {
    if (imageUrl) {
      this.openAttachmentPreview(imageUrl);
    }
  }

  closeLightbox(): void {
    this.closeAttachmentPreview();
  }

  // --- Proof of Work Handlers ---

  getProofAttachments(): AttachmentItem[] {
    return (this.displayTask?.attachments || []).filter(a => !a.commentId);
  }

  hasProofAttachment(task?: TaskItem | null): boolean {
    const target = task || this.displayTask;
    return (target?.attachments || []).some(a => !a.commentId);
  }

  onProofFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const val = this.validateFile(file);
    if (!val.valid) {
      const msg = val.errorKey ? this.translate.instant(val.errorKey) : val.defaultMessage;
      this.notification.showErrorToast(msg || 'Invalid file');
      event.target.value = '';
      return;
    }

    this.pendingProofFile = file;
    if (file.type.startsWith('image/')) {
      this.pendingProofPreviewUrl = URL.createObjectURL(file);
    } else {
      this.pendingProofPreviewUrl = null;
    }
    event.target.value = '';
  }

  cancelProofUpload(): void {
    if (this.pendingProofPreviewUrl) {
      URL.revokeObjectURL(this.pendingProofPreviewUrl);
    }
    this.pendingProofFile = null;
    this.pendingProofPreviewUrl = null;
  }

  uploadProof(): void {
    if (!this.task || !this.pendingProofFile || this.isUploadingProof) return;

    const file = this.pendingProofFile;
    this.isUploadingProof = true;

    this.service.uploadTaskAttachmentApi(this.task.id, file, null).subscribe({
      next: (res) => {
        this.isUploadingProof = false;
        this.cancelProofUpload();

        const newAttachment: AttachmentItem = {
          id: (res?.id || `att-${Date.now()}`).toString(),
          name: res?.fileName || file.name,
          fileName: res?.fileName || file.name,
          size: res?.fileSizeFormatted || `${Math.round(file.size / 1024)} KB`,
          fileSize: res?.fileSize || file.size,
          fileSizeFormatted: res?.fileSizeFormatted || `${Math.round(file.size / 1024)} KB`,
          fileUrl: res?.fileUrl || '',
          fileType: res?.fileType || 'DOCUMENT',
          commentId: null,
          uploadedById: res?.uploadedById,
          uploadedByName: res?.uploadedByName || this.authService.currentUserValue?.name,
          uploadedAt: res?.uploadedAt || new Date().toISOString(),
          createdAt: res?.createdAt || new Date().toISOString()
        };

        if (this.task) {
          if (!this.task.attachments) this.task.attachments = [];
          this.task.attachments.unshift(newAttachment);
          this.loadActivityLogs(this.task.id);
        }

        this.notification.showSuccessToast(
          this.translate.instant('taskAccountability.taskDetails.proofAttached')
        );
        this.service.triggerRefresh();
      },
      error: (err) => {
        this.isUploadingProof = false;
        console.error('Error uploading task proof:', err);
        const errorMessage = err?.error?.message || err?.message || this.translate.instant('common.errorOccurred');
        this.notification.showErrorToast(errorMessage);
      }
    });
  }

  // --- Comment Media Attachment Handlers ---

  onCommentFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const val = this.validateFile(file);
    if (!val.valid) {
      const msg = val.errorKey ? this.translate.instant(val.errorKey) : val.defaultMessage;
      this.notification.showErrorToast(msg || 'Invalid file');
      event.target.value = '';
      return;
    }

    this.pendingCommentFile = file;
    if (file.type.startsWith('image/')) {
      this.pendingCommentPreviewUrl = URL.createObjectURL(file);
    } else {
      this.pendingCommentPreviewUrl = null;
    }
    event.target.value = '';
  }

  cancelCommentFile(): void {
    if (this.pendingCommentPreviewUrl) {
      URL.revokeObjectURL(this.pendingCommentPreviewUrl);
    }
    this.pendingCommentFile = null;
    this.pendingCommentPreviewUrl = null;
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

  loadComments(taskId: string | number): void {
    this.service.getTaskCommentsApi(taskId).subscribe({
      next: (res) => {
        if (res && res.data && this.task) {
          const rawComments = res.data || [];
          this.task.comments = rawComments.map((c: any) => {
            const rawContent = c.comment || c.text || '';
            const parsed = this.parseCommentPayload(rawContent);
            return {
              id: c.id.toString(),
              authorName: c.commentedByName || c.authorName || 'User',
              authorRole: c.commentedByRole || c.authorRole || '',
              commentedByUserId: c.commentedById || c.commentedByUserId || c.userId || null,
              text: parsed.text,
              audioUrl: parsed.audioUrl || c.audioUrl || undefined,
              audioDuration: parsed.audioDuration || c.audioDuration || undefined,
              createdAtRaw: c.createdAt || c.timestamp || null,
              createdAtDate: c.createdAt ? new Date(c.createdAt) : new Date(),
              timestamp: c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
              edited: !!c.edited,
              attachment: undefined
            };
          });

          // Link any attachments with matching commentId
          this.linkAttachmentsToComments();

          // Sort chronologically (oldest at top, newest at bottom)
          this.task.comments.sort((a: any, b: any) => {
            const timeA = a.createdAtDate ? a.createdAtDate.getTime() : 0;
            const timeB = b.createdAtDate ? b.createdAtDate.getTime() : 0;
            return timeA - timeB;
          });

          setTimeout(() => this.scrollToBottom(), 100);
        }
      },
      error: (err) => {
        if (err.status === 403) {
          this.accessForbidden = true;
          this.accessForbiddenMessage = "You don't have access to view this task's comments.";
        } else {
          console.log('Comments API offline/error', err);
        }
      }
    });
  }

  loadAttachments(taskId: string | number): void {
    this.service.getTaskAttachmentsApi(taskId).subscribe({
      next: (res) => {
        if (res && res.data && this.task) {
          this.task.attachments = (res.data || []).map((att: any) => ({
            id: att.id.toString(),
            name: att.fileName || att.name,
            fileName: att.fileName || att.name,
            size: att.fileSizeFormatted || (att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : ''),
            fileSize: att.fileSize,
            fileSizeFormatted: att.fileSizeFormatted,
            fileUrl: att.fileUrl,
            fileType: att.fileType,
            commentId: att.commentId != null ? att.commentId.toString() : null,
            uploadedById: att.uploadedById,
            uploadedByName: att.uploadedByName,
            uploadedAt: att.uploadedAt,
            createdAt: att.createdAt
          }));

          this.linkAttachmentsToComments();
        }
      },
      error: (err) => {
        if (err.status === 403) {
          this.accessForbidden = true;
          this.accessForbiddenMessage = "You don't have access to view this task's attachments.";
        } else {
          console.log('Attachments API offline/error', err);
        }
      }
    });
  }

  private linkAttachmentsToComments(): void {
    if (!this.task?.comments || !this.task?.attachments) return;

    for (const comment of this.task.comments) {
      const match = this.task.attachments.find(a => a.commentId && a.commentId.toString() === comment.id.toString());
      if (match) {
        comment.attachment = match;
        if (match.fileType === 'AUDIO' && !comment.audioUrl) {
          comment.audioUrl = match.fileUrl;
        }
      }
    }
  }

  loadActivityLogs(taskId: string | number): void {
    this.service.getTaskActivityApi(taskId).subscribe({
      next: (res) => {
        if (res && res.data && this.task) {
          this.task.activities = (res.data || []).map((act: any) => ({
            id: (act.id || Math.random()).toString(),
            text: act.message || `${act.doneByName || 'User'} performed ${act.action}`,
            timestamp: act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            action: act.action,
            oldValue: act.oldValue,
            newValue: act.newValue,
            doneByName: act.doneByName
          }));
        }
      },
      error: (err) => console.log('Activity API offline/error', err)
    });
  }

  ngOnDestroy(): void {
    this.voiceRecorder.cancelRecording();
    this.sub.unsubscribe();
  }

  setReplyTo(comment: any): void {
    this.replyingToComment = comment;
  }

  cancelReply(): void {
    this.replyingToComment = null;
  }

  submitComment(): void {
    if (!this.task) return;
    const text = this.newCommentText.trim();
    const hasPendingFile = !!this.pendingCommentFile;

    if (!text && !hasPendingFile) return;

    const parentId = this.replyingToComment ? this.replyingToComment.id : null;
    const fileToUpload = this.pendingCommentFile;

    // Two-step flow if an attachment is queued
    if (hasPendingFile && fileToUpload) {
      this.isUploadingCommentMedia = true;
      const commentPayload = text || null;

      this.service.addTaskCommentApi(this.task.id, commentPayload, parentId).subscribe({
        next: (commentRes) => {
          const commentId = commentRes?.id || commentRes?.data?.id;
          if (!commentId) {
            this.isUploadingCommentMedia = false;
            this.cancelCommentFile();
            this.newCommentText = '';
            if (this.task) this.loadComments(this.task.id);
            return;
          }

          // Step 2: Upload file with commentId
          this.service.uploadTaskAttachmentApi(this.task!.id, fileToUpload, commentId).subscribe({
            next: (attRes) => {
              this.isUploadingCommentMedia = false;
              this.cancelCommentFile();
              this.newCommentText = '';
              this.replyingToComment = null;
              if (this.task) {
                this.loadComments(this.task.id);
                this.loadAttachments(this.task.id);
                this.loadActivityLogs(this.task.id);
              }
              this.service.triggerRefresh();
            },
            error: (err) => {
              this.isUploadingCommentMedia = false;
              console.error('Failed to upload comment attachment:', err);
              const errorMessage = err?.error?.message || err?.message || this.translate.instant('common.errorOccurred');
              this.notification.showErrorToast(errorMessage);
              this.cancelCommentFile();
              if (this.task) this.loadComments(this.task.id);
            }
          });
        },
        error: (err) => {
          this.isUploadingCommentMedia = false;
          console.error('Failed to post comment before media upload:', err);
          const errorMessage = err?.error?.message || err?.message || this.translate.instant('common.errorOccurred');
          this.notification.showErrorToast(errorMessage);
        }
      });
      return;
    }

    // Standard text comment flow
    if (this.task.id && !this.task.id.startsWith('demo-') && !this.task.id.startsWith('tt-')) {
      this.service.addTaskCommentApi(this.task.id, text, parentId).subscribe({
        next: () => {
          this.newCommentText = '';
          this.replyingToComment = null;
          if (this.task) {
            this.loadComments(this.task.id);
            this.loadActivityLogs(this.task.id);
          }
          this.service.triggerRefresh();
        },
        error: (err) => {
          console.error('Failed to post text comment:', err);
          const errorMessage = err?.error?.message || err?.message || this.translate.instant('common.errorOccurred');
          this.notification.showErrorToast(errorMessage);
        }
      });
    } else {
      this.service.addComment(this.task.id, text);
      this.newCommentText = '';
      this.replyingToComment = null;
      this.service.triggerRefresh();
    }
  }

  // --- Voice Recording & Audio Comment Handlers (Two-Step Multipart) ---

  async startVoiceRecording(): Promise<void> {
    try {
      await this.voiceRecorder.startRecording();
      this.isVoiceRecording = true;
    } catch (err: any) {
      this.isVoiceRecording = false;
      if (err?.message === 'PERMISSION_DENIED') {
        this.notification.showErrorToast(
          this.translate.instant('taskAccountability.taskDetails.micAccessDenied')
        );
      } else {
        this.notification.showErrorToast(
          this.translate.instant('taskAccountability.taskDetails.micNotSupported')
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
      if (!result || !this.task) return;

      const parentId = this.replyingToComment ? this.replyingToComment.id : null;

      if (this.task.id && !this.task.id.startsWith('demo-') && !this.task.id.startsWith('tt-')) {
        // Step 1: Create comment with null body
        this.service.addTaskCommentApi(this.task.id, null, parentId).subscribe({
          next: (commentRes) => {
            const commentId = commentRes?.id || commentRes?.data?.id;
            if (!commentId) {
              this.appendLocalVoiceComment(result);
              return;
            }

            // Step 2: Upload raw .webm file via multipart upload
            this.service.uploadTaskAttachmentApi(this.task!.id, result.blob, commentId, 'voice_note.webm').subscribe({
              next: () => {
                this.replyingToComment = null;
                if (this.task) {
                  this.loadComments(this.task.id);
                  this.loadAttachments(this.task.id);
                  this.loadActivityLogs(this.task.id);
                }
                this.service.triggerRefresh();
              },
              error: (uploadErr) => {
                // The old fallback crammed the raw base64 recording into the comment's
                // text - it always exceeded the server's 1000-char cap and left a
                // blank "empty message" comment behind either way. Delete that
                // orphaned comment instead and tell the user to retry the recording.
                console.error('Failed to upload voice recording multipart file:', uploadErr);
                this.notification.showErrorToast(
                  this.translate.instant('taskAccountability.taskDetails.voiceUploadFailed')
                );
                this.service.deleteTaskCommentApi(this.task!.id, commentId).subscribe({
                  next: () => {
                    if (this.task) this.loadComments(this.task.id);
                  },
                  error: (deleteErr) => {
                    console.error('Failed to clean up orphaned empty comment:', deleteErr);
                    if (this.task) this.loadComments(this.task.id);
                  }
                });
              }
            });
          },
          error: (err) => {
            console.error('Failed to create voice note comment record:', err);
            this.appendLocalVoiceComment(result);
          }
        });
      } else {
        this.appendLocalVoiceComment(result);
      }
    } catch (err) {
      this.isVoiceRecording = false;
      console.error('Error stopping voice recording:', err);
    }
  }

  private appendLocalVoiceComment(result: VoiceRecordingResult): void {
    if (!this.task) return;
    const user = this.authService.currentUserValue;
    const newComment: CommentItem = {
      id: `vc-${Date.now()}`,
      authorName: user?.name || 'You',
      authorRole: user?.role || 'User',
      text: '',
      audioUrl: result.dataUrl,
      audioDuration: result.duration,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAtDate: new Date(),
      commentedByUserId: user?.id || (user as any)?.userId || null
    };

    if (!this.task.comments) {
      this.task.comments = [];
    }
    this.task.comments.push(newComment);
    this.replyingToComment = null;
    this.service.triggerRefresh();
    setTimeout(() => this.scrollToBottom(), 100);
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

  trackByDateLabel(index: number, group: { dateLabel: string }): string {
    return group.dateLabel;
  }

  trackByCommentId(index: number, comment: any): string {
    return comment.id;
  }

  startEditComment(comment: any): void {
    this.editingCommentId = comment.id;
    this.editingCommentText = comment.text;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editingCommentText = '';
  }

  saveEditComment(comment: any): void {
    const text = this.editingCommentText.trim();
    if (!text || this.savingCommentEdit || !this.task?.id) return;

    this.savingCommentEdit = true;
    this.service.updateTaskCommentApi(this.task.id, comment.id, text).subscribe({
      next: () => {
        this.savingCommentEdit = false;
        this.editingCommentId = null;
        this.editingCommentText = '';
        if (this.task) this.loadComments(this.task.id);
        this.service.triggerRefresh();
      },
      error: (err) => {
        this.savingCommentEdit = false;
        console.error('Failed to update comment:', err);
        const message = err?.error?.message || this.translate.instant('taskAccountability.taskDetails.failedToUpdateComment');
        this.notification.showErrorToast(message);
      }
    });
  }

  deleteComment(comment: any): void {
    const taskId = this.task?.id || this.displayTask?.id;
    if (!comment?.id || !taskId) return;

    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        title: this.translate.instant('taskAccountability.taskDetails.deleteCommentTitle') || 'Delete Comment?',
        message: this.translate.instant('taskAccountability.taskDetails.deleteCommentConfirm') || 'Are you sure you want to delete this comment? This action cannot be undone.',
        confirmText: this.translate.instant('common.delete') || 'Delete',
        cancelText: this.translate.instant('common.cancel') || 'Cancel'
      },
      maxWidth: '400px',
      autoFocus: false
    });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.service.deleteTaskCommentApi(taskId, comment.id).subscribe({
          next: (res) => {
            this.notification.showSuccessToast(res?.message || this.translate.instant('taskAccountability.taskDetails.commentDeleted') || 'Comment deleted successfully');
            if (this.task?.id) {
              this.loadComments(this.task.id);
              this.loadActivityLogs(this.task.id);
            }
            this.service.triggerRefresh();
          },
          error: (err) => {
            console.error('Failed to delete comment:', err);
            const message = err?.error?.message || this.translate.instant('common.errorOccurred');
            this.notification.showErrorToast(message);
          }
        });
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.task) return;

    const payload = {
      fileName: file.name,
      fileUrl: `https://cdn.atlasmentor.com/uploads/${file.name}`,
      fileSize: file.size
    };

    if (this.task.id && !this.task.id.startsWith('demo-') && !this.task.id.startsWith('tt-')) {
      this.service.addTaskAttachmentApi(this.task.id, payload).subscribe(() => {
        if (this.task) {
          this.loadAttachments(this.task.id);
          this.loadActivityLogs(this.task.id);
        }
        this.service.triggerRefresh();
      });
    } else {
      const sizeStr = `${Math.round(file.size / 1024)} KB`;
      this.task.attachments.push({
        id: `att-${Date.now()}`,
        name: file.name,
        size: sizeStr
      });
      this.service.triggerRefresh();
    }
  }

  get isReviewerRole(): boolean {
    const user = this.authService.currentUserValue;
    if (!user || !user.role) return false;
    const r = user.role.toUpperCase().trim();
    return ['ADMIN', 'MANAGER', 'BRANCH_PARTNER', 'ADMINISTRATIVE_ASSISTANT'].includes(r);
  }

  isTaskStatusChangeDisabled(task?: TaskItem | null): boolean {
    if (!task) return false;
    const currentStepLower = (task.currentStep || '').toLowerCase();
    const statusLower = (task.status || '').toLowerCase();
    // OVERDUE tasks must always be changeable — never disable them
    if (statusLower === 'overdue') return false;
    return currentStepLower.includes('verified') || 
           statusLower === 'verified' || 
           statusLower === 'closed';
  }

  changePriority(task: TaskItem | null, newPriority: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const target = task || this.task;
    if (!target || target.priority === newPriority) return;

    // Optimistically update
    target.priority = newPriority as TaskItem['priority'];
    this.service.triggerRefresh();

    if (target.id && !target.id.startsWith('demo-') && !target.id.startsWith('tt-')) {
      this.service.patchTaskPriorityApi(target.id, newPriority).subscribe({
        next: () => {
          this.service.triggerRefresh();
        },
        error: (err) => {
          console.error('Error patching task priority from drawer:', err);
        }
      });
    }
  }

  get canResubmitTask(): boolean {
    return !this.isReviewerRole;
  }

  isReflectTask(task?: TaskItem | null): boolean {
    if (!task || !task.status) return false;
    const s = task.status.toUpperCase().trim();
    return s === 'REFLECT' || s === 'REJECTED';
  }

  resubmitTask(task?: TaskItem | null): void {
    const target = task || this.task;
    if (!target || !target.id) return;

    this.service.resubmitTaskApi(target.id).subscribe({
      next: (res) => {
        const updatedStatus = res?.data?.status || 'DONE';
        target.status = updatedStatus;
        target.reflectState = 'RESUBMITTED';
        this.service.updateTaskStatus(target.id, updatedStatus);
        if (target.id) {
          this.loadActivityLogs(target.id);
        }
        this.service.triggerRefresh();
      },
      error: (err) => {
        console.error('Error resubmitting task from drawer:', err);
      }
    });
  }

  changeTaskStatus(taskOrStatus: TaskItem | string, newStatusStr?: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    let targetTask: TaskItem | null = null;
    let newStatus = '';

    if (typeof taskOrStatus === 'object' && taskOrStatus !== null) {
      targetTask = taskOrStatus;
      newStatus = newStatusStr || '';
    } else if (typeof taskOrStatus === 'string') {
      targetTask = this.task;
      newStatus = taskOrStatus;
    }

    if (!targetTask || !newStatus || targetTask.status === newStatus) return;

    if (this.isReflectTask(targetTask)) {
      this.resubmitTask(targetTask);
      return;
    }

    if (newStatus === 'DONE' && !this.hasProofAttachment(targetTask)) {
      this.openAttachProofDialog(targetTask);
      return;
    }

    const prevStatus = targetTask.status;

    // Optimistically update
    targetTask.status = newStatus;
    this.service.updateTaskStatus(targetTask.id, newStatus);
    this.service.triggerRefresh();

    if (targetTask.id && !targetTask.id.startsWith('demo-') && !targetTask.id.startsWith('tt-')) {
      this.service.patchTaskStatusApi(targetTask.id, newStatus).subscribe({
        next: () => {
          if (targetTask) {
            this.loadActivityLogs(targetTask.id);
          }
          this.service.triggerRefresh();
        },
        error: (err) => {
          console.error('Error patching task status from drawer:', err);
          const errorMessage = err?.error?.message || err?.message || this.translate.instant('common.errorOccurred');
          this.notification.showErrorToast(errorMessage);
          // Revert optimistic update
          if (targetTask) {
            targetTask.status = prevStatus;
            this.service.updateTaskStatus(targetTask.id, prevStatus);
            this.service.triggerRefresh();
          }
        }
      });
    }
  }

  openAttachProofDialog(task: TaskItem): void {
    const dialogRef = this.dialog.open(AttachProofDialogComponent, {
      data: { task },
      panelClass: 'attach-proof-dialog-panel',
      autoFocus: false,
      hasBackdrop: true,
      disableClose: false,
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res && res.success) {
        if (this.task && this.task.id === task.id) {
          this.loadActivityLogs(this.task.id);
        }
      }
    });
  }

  // Manager Actions
  approveTask(): void {
    if (!this.task) return;
    const currentDay = this.service.selectedDayValue;
    const dayWorkspaceId = (currentDay as any)?.rawDayWorkspaceId || currentDay?.id?.replace('d-', '');

    if (dayWorkspaceId && !isNaN(Number(dayWorkspaceId))) {
      // Per-task resubmitted approval (hasTaskIds: true)
      this.service.approveDayApi(dayWorkspaceId, 'APPROVE', undefined, [this.task.id]).subscribe({
        next: (res) => {
          console.log('Per-task approval executed successfully:', res);
          if (this.task) {
            this.task.status = 'DONE';
            this.loadActivityLogs(this.task.id);
          }
          this.service.triggerRefresh();
        },
        error: (err) => {
          console.error('Per-task approval API error:', err);
          this.changeTaskStatus('DONE');
        }
      });
    } else {
      this.changeTaskStatus('DONE');
    }
  }

  rejectTask(): void {
    if (!this.task) return;
    const currentDay = this.service.selectedDayValue;
    const dayWorkspaceId = (currentDay as any)?.rawDayWorkspaceId || currentDay?.id?.replace('d-', '');
    const taskIdNum = parseInt(String(this.task.id).replace(/\D/g, ''), 10);
    const targetTaskId = isNaN(taskIdNum) ? this.task.id : taskIdNum;

    const dialogRef = this.dialog.open(SendBackReasonDialogComponent, {
      width: '460px',
      data: {
        title: 'Send Back Task',
        description: 'Please provide a feedback reason for sending back this task for rework.',
        placeholder: 'Enter feedback comment...'
      }
    });

    dialogRef.afterClosed().subscribe(reason => {
      if (reason && typeof reason === 'string' && reason.trim()) {
        const commentText = reason.trim();
        if (dayWorkspaceId && !isNaN(Number(dayWorkspaceId))) {
          this.service.approveDayApi(dayWorkspaceId, 'SEND_BACK', commentText, [targetTaskId]).subscribe({
            next: (res) => {
              console.log('Single task sent back successfully:', res);
              if (this.task) {
                this.task.status = 'REFLECT';
                this.task.reflectComment = commentText;
                this.task.reflectFlaggedByName = this.authService.currentUserValue?.name || 'Reviewer';
                this.service.updateTaskStatus(this.task.id, 'REFLECT');

                // The SEND_BACK call above already persists `commentText` as a task comment
                // server-side (DayApprovalService#sendBackTasks) - posting it again here via
                // addTaskCommentApi duplicated every send-back comment. Just refresh from what
                // the backend already saved.
                this.loadComments(this.task.id);
                this.loadActivityLogs(this.task.id);
              }
              this.service.triggerRefresh();
            },
            error: (err) => {
              console.error('Error sending back single task:', err);
              this.changeTaskStatus('REFLECT');
            }
          });
        } else {
          this.changeTaskStatus('REFLECT');
        }
      }
    });
  }

  returnTask(): void {
    if (!this.task) return;
    this.service.updateTaskStatus(this.task.id, 'Employee');
  }

  setRating(rating: 'Excellent' | 'Good' | 'Needs Improvement'): void {
    if (!this.task) return;
    this.service.rateTask(this.task.id, rating);
  }

  // Resizing Mouse Handlers
  onMouseDownResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    this.startX = event.clientX;
    this.startWidth = this.width;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMoveResize(event: MouseEvent): void {
    if (!this.isResizing) return;
    // We are resizing from left to right, so moving mouse to the left increases width
    const deltaX = this.startX - event.clientX;
    this.width = Math.max(350, Math.min(800, this.startWidth + deltaX));
  }

  @HostListener('document:mouseup')
  onMouseUpResize(): void {
    if (this.isResizing) {
      this.isResizing = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
  }

  // Helpers
  getAchievementPercentage(task: TaskItem): number {
    if (task.type !== 'NUMERIC' || !task.actualValue) return 100;
    const parts = task.actualValue.split('/');
    if (parts.length === 2) {
      const act = parseFloat(parts[0]);
      const target = parseFloat(parts[1]);
      if (!isNaN(act) && !isNaN(target) && target > 0) {
        return Math.min(100, Math.round((act / target) * 100));
      }
    }
    return 0;
  }

  getPriorityColorClass(priority: string): string {
    if (!priority) return 'priority-medium';
    const p = priority.toUpperCase().trim();
    if (p === 'URGENT') return 'priority-urgent';
    if (p === 'HIGH') return 'priority-high';
    if (p === 'MEDIUM') return 'priority-medium';
    if (p === 'LOW') return 'priority-low';
    return 'priority-medium';
  }

  getStatusColorClass(status: string): string {
    if (!status) return 'status-todo';
    const s = status.toUpperCase().trim();
    if (s === 'VERIFIED' || s === 'APPROVED') return 'status-verified';
    if (s === 'COMPLETED' || s === 'DONE') return 'status-completed';
    if (s === 'MANAGER REVIEW' || s === 'SUBMITTED' || s === 'COUNSELLOR REVIEW') return 'status-review';
    if (s === 'COUNSELLOR APPROVED' || s === 'BRANCH APPROVED') return 'status-approved';
    if (s === 'REJECTED' || s === 'RETURNED' || s === 'MANAGER FEEDBACK' || s === 'ACTION NEEDED') return 'status-feedback';
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return 'status-in-progress';
    if (s === 'TODO' || s === 'TO DO' || s === 'NOT_STARTED') return 'status-todo';
    if (s === 'OVERDUE') return 'status-overdue';
    if (s === 'CLOSED') return 'status-closed';
    return 'status-todo';
  }

  /** Origin label for a carried-over task, matching the task table's badge - e.g. "Overdue since Aug 16". */
  getCarriedOverBadgeLabel(task: TaskItem | null): string {
    if (!task) return this.translate.instant('common.status.overdue');
    const raw = task.dueDate || task.originalWorkDate;
    if (!raw) return this.translate.instant('common.status.overdue');
    const d = new Date(raw + 'T00:00:00');
    if (isNaN(d.getTime())) return this.translate.instant('common.status.overdue');
    const label = d.toLocaleDateString(this.translate.currentLang || 'en', { month: 'short', day: 'numeric' });
    return this.translate.instant('taskAccountability.taskTable.overdueSince', { date: label });
  }

  formatShortDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr.length <= 10 ? `${dateStr}T00:00:00` : dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(this.translate.currentLang || 'en', { month: 'short', day: 'numeric' });
  }

  getDaysOverdue(dueDateStr?: string | null): number {
    if (!dueDateStr) return 0;
    const due = new Date(`${dueDateStr}T00:00:00`);
    if (isNaN(due.getTime())) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86400000));
  }

  isTaskOverdue(task: TaskItem | null): boolean {
    if (!task || !task.dueDate || task.completedAt) return false;
    return this.getDaysOverdue(task.dueDate) > 0;
  }

  getOverdueDaysLabel(task: TaskItem | null): string {
    if (!task || !task.dueDate) return '';
    const days = this.getDaysOverdue(task.dueDate);
    if (days <= 0) return '';
    return this.translate.instant('taskAccountability.taskDetails.daysOverdueShort', { days });
  }

  getAvatarColorClass(name?: string): string {
    if (!name) return 'blue';
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['blue', 'green', 'rose', 'purple', 'amber', 'teal'];
    return colors[hash % colors.length];
  }

  /** Short "Aug 17" due date for the compact "SCHEDULE : Aug 17" label line. */
  getScheduleShortDate(task: TaskItem | null): string {
    if (!task || !task.dueDate) return '';
    return this.formatShortDate(task.dueDate);
  }

  /**
   * "Due: Aug 16" on its own row, or "Due: Aug 16 (2 days overdue)" while it's still open
   * past its due date - once completedAt is set the overdue count no longer applies (see
   * getCompletedLineText for that separate row instead).
   */
  getDueLineText(task: TaskItem | null): string {
    if (!task || !task.dueDate) return '';
    const dueLabel = this.formatShortDate(task.dueDate);
    if (!task.completedAt) {
      const daysOverdue = this.getDaysOverdue(task.dueDate);
      if (daysOverdue > 0) {
        return this.translate.instant('taskAccountability.taskDetails.dueLineOverdue', { date: dueLabel, days: daysOverdue });
      }
    }
    return this.translate.instant('taskAccountability.taskDetails.dueLine', { date: dueLabel });
  }

  /** "Completed: Aug 18" on its own row - only rendered once completedAt is actually set. */
  getCompletedLineText(task: TaskItem | null): string {
    if (!task || !task.completedAt) return '';
    return this.translate.instant('taskAccountability.taskDetails.completedLine', { date: this.formatShortDate(task.completedAt) });
  }

  get isCarriedOverTask(): boolean {
    return !!this.displayTask?.carriedOver;
  }

  getFormattedDisplayId(task: TaskItem | null): string {
    if (!task) return this.translate.instant('taskAccountability.taskTable.taskWord');
    const id = task.displayId || task.id;
    if (!id) return this.translate.instant('taskAccountability.taskTable.taskWord');
    if (id.toLowerCase().startsWith('task -')) return id;
    const rawId = id.toLowerCase().startsWith('task-') ? id.substring(5) : id;
    return this.translate.instant('taskAccountability.taskTable.taskIdPrefix', { id: rawId });
  }
}
