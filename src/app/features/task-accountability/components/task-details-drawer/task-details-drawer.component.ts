import { Component, OnInit, OnDestroy, HostListener, Renderer2, ElementRef, ViewChild } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { TaskItem } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

import { MatDialog } from '@angular/material/dialog';
import { SendBackReasonDialogComponent } from '../send-back-reason-dialog/send-back-reason-dialog.component';

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
    private renderer: Renderer2,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  loadStatuses(): void {
    this.service.getStatusesApi().subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          this.statusesList = data.map((item: any) => {
            if (typeof item === 'string') {
              return { value: item, label: this.formatStatusLabel(item) };
            }
            return {
              value: item.value || item.status || item.name || item,
              label: item.label || item.name || this.formatStatusLabel(item.value || item.status || item)
            };
          });
        }
      },
      error: (err) => {
        console.warn('Could not load status list from API in drawer, using defaults:', err);
      }
    });
  }

  formatStatusLabel(status?: string): string {
    if (!status) return 'To Do';
    const s = status.toUpperCase().trim();
    if (s === 'TODO' || s === 'TO DO' || s === 'NOT_STARTED') return 'To Do';
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return 'In Progress';
    if (s === 'DONE' || s === 'COMPLETED') return 'Done';
    if (s === 'VERIFIED' || s === 'APPROVED') return 'Verified';
    if (s === 'CLOSED') return 'Closed';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  get canCurrentUserAct(): boolean {
    const currentDay = this.service.selectedDayValue;
    if (currentDay && typeof (currentDay as any).canCurrentUserAct === 'boolean') {
      return (currentDay as any).canCurrentUserAct;
    }
    return true;
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
    if (!user || !user.role) return 'REVIEW';

    const role = user.role.toUpperCase().trim();
    switch (role) {
      case 'ADMIN':
        return 'ADMIN REVIEW';
      case 'MANAGER':
        return 'MANAGER REVIEW';
      case 'BRANCH_PARTNER':
        return 'BRANCH PARTNER REVIEW';
      case 'ADMINISTRATIVE_ASSISTANT':
        return 'ADMINISTRATIVE ASSISTANT REVIEW';
      default:
        return 'REVIEW';
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
          if (t.id && !t.id.startsWith('demo-') && !t.id.startsWith('tt-')) {
            this.loadRealTaskDetails(t.id);
          }
        } else {
          this.task = null;
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
          this.task.assignedTo = res.data.assigneeName || this.task.assignedTo;
          this.task.createdByName = res.data.createdByName || this.task.createdByName;
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

  loadComments(taskId: string | number): void {
    this.service.getTaskCommentsApi(taskId).subscribe({
      next: (res) => {
        if (res && res.data && this.task) {
          const rawComments = res.data || [];
          this.task.comments = rawComments.map((c: any) => ({
            id: c.id.toString(),
            authorName: c.commentedByName || c.authorName || 'User',
            authorRole: c.commentedByRole || c.authorRole || '',
            commentedByUserId: c.commentedByUserId || c.userId || null,
            text: c.comment || c.text || '',
            createdAtRaw: c.createdAt || c.timestamp || null,
            createdAtDate: c.createdAt ? new Date(c.createdAt) : new Date(),
            timestamp: c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
          }));

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
            name: att.fileName,
            size: att.fileSizeFormatted || `${Math.round((att.fileSize || 0) / 1024)} KB`,
            fileUrl: att.fileUrl,
            uploadedByName: att.uploadedByName,
            uploadedAt: att.uploadedAt
          }));
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
    this.sub.unsubscribe();
  }

  setReplyTo(comment: any): void {
    this.replyingToComment = comment;
  }

  cancelReply(): void {
    this.replyingToComment = null;
  }

  submitComment(): void {
    if (!this.task || !this.newCommentText.trim()) return;
    const text = this.newCommentText.trim();
    const parentId = this.replyingToComment ? this.replyingToComment.id : null;

    if (this.task.id && !this.task.id.startsWith('demo-') && !this.task.id.startsWith('tt-')) {
      this.service.addTaskCommentApi(this.task.id, text, parentId).subscribe(() => {
        this.newCommentText = '';
        this.replyingToComment = null;
        if (this.task) {
          this.loadComments(this.task.id);
          this.loadActivityLogs(this.task.id);
        }
        this.service.triggerRefresh();
      });
    } else {
      this.service.addComment(this.task.id, text);
      this.newCommentText = '';
      this.replyingToComment = null;
      this.service.triggerRefresh();
    }
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
    return currentStepLower.includes('verified') || 
           statusLower === 'verified' || 
           statusLower === 'closed';
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
        }
      });
    }
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
    this.renderer.setStyle(document.body, 'cursor', 'ew-resize');
    this.renderer.setStyle(document.body, 'userSelect', 'none');
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
      this.renderer.setStyle(document.body, 'cursor', 'default');
      this.renderer.setStyle(document.body, 'userSelect', 'auto');
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
    if (s === 'CLOSED') return 'status-closed';
    return 'status-todo';
  }

  getFormattedDisplayId(task: TaskItem | null): string {
    if (!task) return 'Task';
    const id = task.displayId || task.id;
    if (!id) return 'Task';
    if (id.toLowerCase().startsWith('task -')) return id;
    if (id.toLowerCase().startsWith('task-')) return `Task - ${id.substring(5)}`;
    return `Task - ${id}`;
  }
}
