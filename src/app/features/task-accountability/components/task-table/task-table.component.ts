import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TaskItem, DayNode } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';

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
    private authService: AuthService
  ) {}

  get isReviewerRole(): boolean {
    const user = this.authService.currentUserValue;
    if (!user || !user.role) return false;
    const r = user.role.toUpperCase().trim();
    return ['ADMIN', 'MANAGER', 'BRANCH_PARTNER', 'ADMINISTRATIVE_ASSISTANT'].includes(r);
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

  changeTaskStatus(task: TaskItem, newStatus: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (task.status === newStatus) return;

    if (this.isReflectTask(task)) {
      this.resubmitTask(task, event);
      return;
    }

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

  formatStatusLabel(status?: string, task?: TaskItem): string {
    if (!status) return 'To Do';
    const s = status.toUpperCase().trim();
    if (s === 'TODO' || s === 'TO Do' || s === 'NOT_STARTED') return 'To Do';
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return 'In Progress';
    if (s === 'DONE' || s === 'COMPLETED') return 'Done';
    if (s === 'REFLECT' || s === 'SEND_BACK' || s === 'REJECTED') return 'Reflect';
    if (s === 'VERIFIED' || s === 'APPROVED') return 'Verified';
    if (s === 'CLOSED') return 'Closed';
    if (s === 'OVERDUE') return 'Overdue';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  selectTask(task: TaskItem): void {
    this.service.selectTask(task);
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

  private applySortingAndGrouping(): void {
    if (!this.day || !this.day.tasks) {
      this.tasks = [];
      this.taskGroups = [];
      return;
    }

    let temp = [...this.day.tasks];

    // Priority sorting
    if (this.currentSort === 'priority') {
      const priorityWeight: Record<string, number> = { 
        'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1,
        'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 
      };
      temp.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    }

    // Status sorting
    const getStatusWeight = (status: string): number => {
      if (!status) return 99;
      const s = status.toUpperCase().trim();
      if (s === 'TODO' || s === 'TO DO' || s === 'NOT_STARTED') return 1;
      if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return 2;
      if (s === 'EMPLOYEE') return 3;
      if (s === 'COMPLETED' || s === 'DONE') return 4;
      if (s === 'COUNSELLOR APPROVED' || s === 'BRANCH APPROVED') return 5;
      if (s === 'MANAGER REVIEW' || s === 'SUBMITTED' || s === 'COUNSELLOR REVIEW') return 6;
      if (s === 'MANAGER FEEDBACK' || s === 'REJECTED' || s === 'RETURNED') return 7;
      if (s === 'VERIFIED' || s === 'APPROVED') return 8;
      if (s === 'CLOSED') return 9;
      return 50;
    };

    temp.sort((a, b) => getStatusWeight(a.status) - getStatusWeight(b.status));

    // Overdue Task Rollover: keep carried-over tasks pinned to the top regardless of the
    // active sort/group mode, so a task that's been outstanding for days never gets buried
    // under today's fresh ones. Array#sort is stable, so this only reorders across the
    // carriedOver boundary - each side keeps the priority/status order already applied above.
    temp.sort((a, b) => (b.carriedOver ? 1 : 0) - (a.carriedOver ? 1 : 0));

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
      this.taskGroups = Array.from(groupsMap.entries()).map(([statusName, tasks]) => ({
        statusName,
        statusClass: this.getStatusColorClass(statusName),
        count: tasks.length,
        tasks
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
    if (!raw) return 'Overdue';
    const d = new Date(raw + 'T00:00:00');
    if (isNaN(d.getTime())) return 'Overdue';
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `Overdue since ${label}`;
  }

  getFormattedDisplayId(task: TaskItem): string {
    if (!task) return '';
    const id = task.displayId || task.id;
    if (!id) return '';
    if (id.toLowerCase().startsWith('task -')) return id;
    if (id.toLowerCase().startsWith('task-')) return `Task - ${id.substring(5)}`;
    return `Task - ${id}`;
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
