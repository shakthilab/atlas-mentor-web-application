import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
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

  private subs = new Subscription();

  constructor(private service: TaskAccountabilityService) {}

  ngOnInit(): void {
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
      return;
    }

    let temp = [...this.day.tasks];

    // Priority sorting
    if (this.currentSort === 'priority') {
      const priorityWeight = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      temp.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    }

    // Status grouping / sorting
    if (this.currentGroup === 'status') {
      const statusWeight = {
        'Employee': 1,
        'Completed': 2,
        'Counsellor Approved': 3,
        'Manager Review': 4,
        'Manager Feedback': 5,
        'Verified': 6,
        'Closed': 7
      };
      temp.sort((a, b) => (statusWeight[a.status] || 0) - (statusWeight[b.status] || 0));
    }

    this.tasks = temp;
  }

  openAddWordDrawer(): void {
    this.service.toggleCreateDrawer(true);
  }

  // Styles helpers
  getPriorityColorClass(priority: string): string {
    switch (priority) {
      case 'Urgent': return 'priority-urgent';
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return '';
    }
  }

  getStatusColorClass(status: string): string {
    switch (status) {
      case 'Verified': return 'status-verified';
      case 'Completed': return 'status-completed';
      case 'Manager Review': return 'status-review';
      case 'Closed': return 'status-closed';
      case 'Counsellor Approved': return 'status-approved';
      default: return 'status-employee';
    }
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
      case 'APPROVAL': return 'discount-check';
      default: return 'check';
    }
  }

  getAchievementPercentage(task: TaskItem): number {
    if (task.type !== 'NUMERIC') return 100;
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
