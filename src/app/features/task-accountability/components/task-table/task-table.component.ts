import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TaskItem, DayNode } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { TaskCommentPopupComponent } from '../task-comment-popup/task-comment-popup.component';
import { AttachProofDialogComponent } from '../attach-proof-dialog/attach-proof-dialog.component';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-task-table',
  templateUrl: './task-table.component.html',
  styleUrls: ['./task-table.component.scss']
})
export class TaskTableComponent implements OnInit, OnDestroy {
  day: DayNode | null = null;
  tasks: TaskItem[] = [];
  selectedTask: TaskItem | null = null;

  // Inline Add Task Form State
  showAddForm = false;
  newTaskName = '';
  newTaskType: TaskItem['type'] = 'NUMERIC';
  newTaskPriority: TaskItem['priority'] = 'Medium';

  // Filters & Sorting State
  currentSort: 'priority' | 'default' = 'default';
  currentGroup: 'status' | 'default' = 'default';

  // Bulk Delete / Multi-select State
  isDeleteMode = false;
  selectedTaskIds = new Set<string | number>();
  isDeleting = false;

  // Statuses List from API
  statusesList: { value: string; label: string }[] = [
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'DONE', label: 'Done' },
    { value: 'REFLECT', label: 'Reflect' }
  ];

  private subs = new Subscription();

  constructor(
    private service: TaskAccountabilityService,
    private authService: AuthService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {}

  get isReviewerRole(): boolean {
    const user = this.authService.currentUserValue;
    if (!user || !user.role) return false;
    const r = user.role.toUpperCase().trim();
    return ['ADMIN', 'MANAGER', 'BRANCH_PARTNER', 'ADMINISTRATIVE_ASSISTANT'].includes(r);
  }

  get canDeleteTasks(): boolean {
    return this.isReviewerRole;
  }

  get canResubmitTask(): boolean {
    return !this.isReviewerRole;
  }

  ngOnInit(): void {
    this.loadStatuses();

    this.subs.add(
      this.service.selectedDay$.subscribe(d => {
        this.day = d;
        this.tasks = d && d.tasks ? [...d.tasks] : [];
        this.applySortingAndGrouping();
      })
    );
    this.subs.add(
      this.service.selectedTask$.subscribe(t => this.selectedTask = t)
    );
  }

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
            // Users should never manually set a task TO overdue — exclude it from picker
            .filter((s: { value: string; label: string }) => s.value?.toUpperCase() !== 'OVERDUE');
        }
      },
      error: (err) => {
        console.warn('Could not load status list from API, using defaults:', err);
      }
    });
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

  isReflectTask(task: TaskItem): boolean {
    if (!task || !task.status) return false;
    const s = task.status.toUpperCase().trim();
    return s === 'REFLECT' || s === 'REJECTED';
  }

  resubmitTask(task: TaskItem, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!task || !task.id) return;

    this.service.resubmitTaskApi(task.id).subscribe({
      next: (res) => {
        const updatedStatus = res?.data?.status || 'DONE';
        task.status = updatedStatus;
        task.reflectState = 'RESUBMITTED';
        this.service.updateTaskStatus(task.id, updatedStatus);
        this.applySortingAndGrouping();
        this.service.triggerRefresh();
      },
      error: (err) => {
        console.error('Error resubmitting task:', err);
      }
    });
  }

  hasProofAttachment(task?: TaskItem | null): boolean {
    if (!task || !task.attachments) return false;
    return task.attachments.some(a => !a.commentId);
  }

  changeTaskStatus(task: TaskItem, newStatus: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (task.status === newStatus) return;

    if (this.isReflectTask(task)) {
      this.resubmitTask(task, event);
      return;
    }

    if (newStatus === 'DONE' && !this.hasProofAttachment(task)) {
      this.openAttachProofDialog(task);
      return;
    }

    const prevStatus = task.status;

    // Optimistically update
    task.status = newStatus;
    this.service.updateTaskStatus(task.id, newStatus);
    this.applySortingAndGrouping();

    // Call API endpoint
    this.service.patchTaskStatusApi(task.id, newStatus).subscribe({
      next: (res) => {
        console.log('Task status patched successfully:', res);
        this.service.triggerRefresh();
      },
      error: (err) => {
        console.error('Error patching task status via API:', err);
        const errorMessage = err?.error?.message || err?.message || this.translate.instant('common.errorOccurred');
        this.notification.showErrorToast(errorMessage);
        // Revert optimistic update
        task.status = prevStatus;
        this.service.updateTaskStatus(task.id, prevStatus);
        this.applySortingAndGrouping();
      }
    });
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
        this.applySortingAndGrouping();
      }
    });
  }

  changePriority(task: TaskItem, newPriority: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (task.priority === newPriority) return;

    // Optimistically update
    task.priority = newPriority as TaskItem['priority'];
    this.service.triggerRefresh();

    this.service.patchTaskPriorityApi(task.id, newPriority).subscribe({
      next: () => {
        this.service.triggerRefresh();
      },
      error: (err) => {
        console.error('Error patching task priority:', err);
      }
    });
  }

  /**
   * Maps a raw backend status code to a translated display label. Backend statuses are
   * fixed English enum values (TODO, IN_PROGRESS, ...) that are never localized server-side,
   * so the mapping to a translation key happens here on the frontend.
   */
  formatStatusLabel(status?: string, task?: TaskItem): string {
    if (!status) return this.translate.instant('common.status.todo');
    const s = status.toUpperCase().trim();
    if (s === 'TODO' || s === 'TO Do' || s === 'NOT_STARTED') return this.translate.instant('common.status.todo');
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return this.translate.instant('common.status.inProgress');
    if (s === 'DONE' || s === 'COMPLETED') return this.translate.instant('common.status.done');
    if (s === 'REFLECT' || s === 'SEND_BACK' || s === 'REJECTED') return this.translate.instant('common.status.reflect');
    if (s === 'VERIFIED' || s === 'APPROVED') return this.translate.instant('common.status.verified');
    if (s === 'CLOSED') return this.translate.instant('common.status.closed');
    if (s === 'OVERDUE') return this.translate.instant('common.status.overdue');
    // Unknown/custom status codes: fall back to a readable version of the raw code
    // rather than a translation key, since there's no key for an arbitrary backend value.
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  /** Same idea as formatStatusLabel(), for the priority enum (URGENT/HIGH/MEDIUM/LOW). */
  getPriorityLabel(priority?: string): string {
    if (!priority) return this.translate.instant('common.priority.medium');
    const p = priority.toUpperCase().trim();
    if (p === 'URGENT') return this.translate.instant('common.priority.urgent');
    if (p === 'HIGH') return this.translate.instant('common.priority.high');
    if (p === 'MEDIUM') return this.translate.instant('common.priority.medium');
    if (p === 'LOW') return this.translate.instant('common.priority.low');
    return priority;
  }

  getFlaggedByText(task: TaskItem): string {
    const name = task.reflectFlaggedByName || this.translate.instant('taskAccountability.taskTable.reviewer');
    const reason = task.reflectComment || task.comment || this.translate.instant('taskAccountability.taskTable.needsRework');
    return this.translate.instant('taskAccountability.taskTable.flaggedBy', { name, reason });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  selectTask(task: TaskItem): void {
    this.service.selectTask(task);
  }

  getCommentPreview(task: TaskItem): string | null {
    if (task.latestCommentPreview) return task.latestCommentPreview;
    if (task.comment && task.comment !== '—') return task.comment;
    return null;
  }

  openCommentPopup(task: TaskItem, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.dialog.open(TaskCommentPopupComponent, {
      data: { task },
      width: '480px',
      maxWidth: '90vw',
      panelClass: 'comment-popup-dialog-panel'
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    // Reset fields
    this.newTaskName = '';
    this.newTaskType = 'NUMERIC';
    this.newTaskPriority = 'Medium';
  }

  submitNewTask(): void {
    if (!this.newTaskName.trim()) return;
    this.service.addTask(this.newTaskName.trim(), this.newTaskType, this.newTaskPriority);
    this.toggleAddForm();
  }

  taskGroups: { statusName: string; statusClass: string; count: number; tasks: TaskItem[] }[] = [];

  // Sorting and Grouping
  toggleSortByPriority(): void {
    this.currentSort = this.currentSort === 'priority' ? 'default' : 'priority';
    this.applySortingAndGrouping();
  }

  toggleGroupByStatus(): void {
    this.currentGroup = this.currentGroup === 'status' ? 'default' : 'status';
    this.applySortingAndGrouping();
  }

  // --- Bulk Delete & Multi-select Handlers ---
  toggleDeleteMode(): void {
    this.isDeleteMode = !this.isDeleteMode;
    if (!this.isDeleteMode) {
      this.selectedTaskIds.clear();
    }
  }

  toggleTaskSelection(task: TaskItem, event?: Event | MouseEvent): void {
    if (event) event.stopPropagation();
    const id = task.id;
    if (this.selectedTaskIds.has(id)) {
      this.selectedTaskIds.delete(id);
    } else {
      this.selectedTaskIds.add(id);
    }
  }

  isTaskSelected(task: TaskItem): boolean {
    return this.selectedTaskIds.has(task.id);
  }

  isAllSelected(): boolean {
    if (!this.tasks || this.tasks.length === 0) return false;
    return this.tasks.every(t => this.selectedTaskIds.has(t.id));
  }

  isSomeSelected(): boolean {
    if (!this.tasks || this.tasks.length === 0) return false;
    const count = this.tasks.filter(t => this.selectedTaskIds.has(t.id)).length;
    return count > 0 && count < this.tasks.length;
  }

  toggleSelectAll(event: any): void {
    const checked = event?.target?.checked;
    if (checked) {
      this.tasks.forEach(t => this.selectedTaskIds.add(t.id));
    } else {
      this.selectedTaskIds.clear();
    }
  }

  confirmBulkDelete(): void {
    if (this.selectedTaskIds.size === 0 || this.isDeleting) return;
    const count = this.selectedTaskIds.size;
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        title: this.translate.instant('taskAccountability.taskTable.bulkDeleteTitle', { count }) || `Delete ${count} Tasks?`,
        message: this.translate.instant('taskAccountability.taskTable.bulkDeleteConfirm', { count }) || `Are you sure you want to delete the selected ${count} task(s)? This action cannot be undone.`,
        confirmText: this.translate.instant('common.delete') || 'Delete',
        cancelText: this.translate.instant('common.cancel') || 'Cancel'
      },
      maxWidth: '420px',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.executeBulkDelete();
      }
    });
  }

  executeBulkDelete(): void {
    const ids = Array.from(this.selectedTaskIds);
    this.isDeleting = true;
    this.service.bulkDeleteTasksApi(ids).subscribe({
      next: (res) => {
        this.isDeleting = false;
        this.notification.showSuccessToast(
          res?.message || this.translate.instant('taskAccountability.taskTable.tasksDeletedSuccess') || 'Selected tasks deleted successfully'
        );
        this.selectedTaskIds.clear();
        this.isDeleteMode = false;
        this.service.triggerRefresh();
      },
      error: (err) => {
        this.isDeleting = false;
        console.error('Error deleting tasks:', err);
        const msg = err?.error?.message || err?.message || 'Failed to delete selected tasks';
        this.notification.showErrorToast(msg);
      }
    });
  }

  private getPriorityWeight(priority?: string): number {
    if (!priority) return 2;
    const p = priority.toUpperCase().trim();
    if (p === 'URGENT') return 4;
    if (p === 'HIGH') return 3;
    if (p === 'MEDIUM') return 2;
    if (p === 'LOW') return 1;
    return 2;
  }

  private isTaskDone(task: TaskItem): boolean {
    const s = (task.status || '').toUpperCase().trim();
    return s === 'DONE' || s === 'COMPLETED' || s === 'VERIFIED' || s === 'APPROVED' || s === 'CLOSED';
  }

  private isTaskOverdueOrCarriedOver(task: TaskItem): boolean {
    if (this.isTaskDone(task)) return false;
    if (task.carriedOver) return true;
    if (task.dueDate) {
      const due = new Date(task.dueDate + (task.dueDate.includes('T') ? '' : 'T23:59:59'));
      const now = new Date();
      if (!isNaN(due.getTime()) && now.getTime() > due.getTime()) {
        return true;
      }
    }
    return false;
  }

  private getStatusRank(task: TaskItem): number {
    if (!task) return 99;
    const s = (task.status || '').toUpperCase().trim();

    // 4. Done tasks always last
    if (this.isTaskDone(task)) return 4;

    // 1. Overdue TODO / carried over tasks first
    if (this.isTaskOverdueOrCarriedOver(task)) return 1;

    // 1b. Standard TODO / Not Started / Needs Rework
    if (s === 'TODO' || s === 'TO DO' || s === 'NOT_STARTED' || s === 'REFLECT' || s === 'SEND_BACK' || s === 'MANAGER FEEDBACK' || s === 'ACTION NEEDED') {
      return 1;
    }

    // 2. In progress tasks
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS' || s === 'EMPLOYEE') {
      return 2;
    }

    // 3. Awaiting review / submitted
    if (s === 'MANAGER REVIEW' || s === 'SUBMITTED' || s === 'COUNSELLOR REVIEW' || s === 'COUNSELLOR APPROVED' || s === 'BRANCH APPROVED') {
      return 3;
    }

    return 1;
  }

  private applySortingAndGrouping(): void {
    if (!this.day || !this.day.tasks) {
      this.tasks = [];
      this.taskGroups = [];
      return;
    }

    let temp = [...this.day.tasks];

    if (this.currentSort === 'priority') {
      // Explicit Sort by Priority:
      // 1. High -> Medium -> Low priority
      // 2. Overdue Todo -> Todo -> In Progress -> Done
      temp.sort((a, b) => {
        const priorityDiff = this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return this.getStatusRank(a) - this.getStatusRank(b);
      });
    } else {
      // Default Sort Order:
      // 1. Status: Overdue Todo first, then In Progress, Done last
      // 2. Priority: High priority first, Medium second, Low below
      temp.sort((a, b) => {
        const statusDiff = this.getStatusRank(a) - this.getStatusRank(b);
        if (statusDiff !== 0) return statusDiff;
        return this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
      });
    }

    this.tasks = temp;

    if (this.currentGroup === 'status') {
      const groupsMap = new Map<string, TaskItem[]>();
      for (const t of temp) {
        const st = t.status || 'TODO';
        if (!groupsMap.has(st)) {
          groupsMap.set(st, []);
        }
        groupsMap.get(st)!.push(t);
      }

      // Sort group headers in the status order: TODO -> IN_PROGRESS -> REVIEW -> DONE
      const sortedEntries = Array.from(groupsMap.entries()).sort(([statusA, tasksA], [statusB, tasksB]) => {
        const rankA = tasksA.length > 0 ? this.getStatusRank(tasksA[0]) : 50;
        const rankB = tasksB.length > 0 ? this.getStatusRank(tasksB[0]) : 50;
        return rankA - rankB;
      });

      this.taskGroups = sortedEntries.map(([statusName, tasks]) => ({
        statusName,
        statusClass: this.getStatusColorClass(statusName),
        count: tasks.length,
        tasks: tasks.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
      }));
    } else {
      this.taskGroups = [];
    }
  }

  openAddWordDrawer(): void {
    this.service.toggleCreateDrawer(true);
  }

  // Styles helpers
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
    if (s === 'REJECTED' || s === 'RETURNED' || s === 'REFLECT' || s === 'SEND_BACK' || s === 'MANAGER FEEDBACK' || s === 'ACTION NEEDED') return 'status-feedback';
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return 'status-in-progress';
    if (s === 'TODO' || s === 'TO DO' || s === 'NOT_STARTED') return 'status-todo';
    if (s === 'OVERDUE') return 'status-overdue';
    if (s === 'CLOSED') return 'status-closed';
    return 'status-todo';
  }

  /**
   * Origin label for a carried-over task, e.g. "Overdue since Aug 16" - built from the task's
   * real dueDate (falling back to originalWorkDate), never today's date, so it reads as "this
   * has been outstanding since X" rather than restating today.
   */
  getCarriedOverBadgeLabel(task: TaskItem): string {
    const raw = task.dueDate || task.originalWorkDate;
    if (!raw) return this.translate.instant('common.status.overdue');
    const d = new Date(raw + 'T00:00:00');
    if (isNaN(d.getTime())) return this.translate.instant('common.status.overdue');
    const label = d.toLocaleDateString(this.translate.currentLang || 'en', { month: 'short', day: 'numeric' });
    return this.translate.instant('taskAccountability.taskTable.overdueSince', { date: label });
  }

  getFormattedDisplayId(task: TaskItem): string {
    if (!task) return '';
    const id = task.displayId || task.id;
    if (!id) return '';
    if (id.toLowerCase().startsWith('task -')) return id;
    const rawId = id.toLowerCase().startsWith('task-') ? id.substring(5) : id;
    return this.translate.instant('taskAccountability.taskTable.taskIdPrefix', { id: rawId });
  }

  getRawDisplayId(task: TaskItem): string {
    if (!task) return '';
    let id = task.displayId || task.id;
    if (!id) return '';
    if (id.toLowerCase().startsWith('task -')) {
      id = id.substring(6).trim();
    } else if (id.toLowerCase().startsWith('task-')) {
      id = id.substring(5).trim();
    }
    return id;
  }

  getTaskTypeIcon(type: string): string {
    switch (type) {
      case 'NUMERIC': return 'hash';
      case 'CHECKLIST': return 'check';
      case 'FILE': return 'upload';
      case 'COMMENT': return 'message-2';
      case 'TEXT': return 'align-left';
      case 'DROPDOWN': return 'list';
      case 'RATING': return 'star';
      case 'YES_NO': return 'toggle-left';
      case 'APPROVAL': return 'rosette-discount-check';
      default: return 'check';
    }
  }

  getAchievementPercentage(task: TaskItem): number {
    if (task.type !== 'NUMERIC' || !task.actualValue) return 100;
    // Extract actual and target
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

  getNumericActual(value: string): string {
    return value.split('/')[0] || value;
  }

  getNumericTarget(value: string): string {
    const parts = value.split('/');
    if (parts.length === 2) {
      const targetParts = parts[1].trim().split(' ');
      return `/ ${targetParts[0]}`;
    }
    return '';
  }

  getNumericUnit(taskName: string): string {
    const name = taskName.toLowerCase();
    if (name.includes('call')) return 'calls';
    if (name.includes('counselling') || name.includes('session')) return 'sessions';
    if (name.includes('convert') || name.includes('enrolment')) return 'conversions';
    return 'units';
  }
}
