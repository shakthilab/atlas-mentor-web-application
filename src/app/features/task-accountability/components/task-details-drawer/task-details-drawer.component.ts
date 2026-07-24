import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { TaskItem } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-task-details-drawer',
  templateUrl: './task-details-drawer.component.html',
  styleUrls: ['./task-details-drawer.component.scss']
})
export class TaskDetailsDrawerComponent implements OnInit, OnDestroy {
  task: TaskItem | null = null;
  newCommentText = '';

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

  private sub = new Subscription();

  constructor(
    private service: TaskAccountabilityService,
    private elRef: ElementRef
  ) {}

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

  ngOnInit(): void {
    this.sub.add(
      this.service.selectedTask$.subscribe(t => {
        this.task = t;
        this.newCommentText = '';
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  closeDrawer(): void {
    this.service.selectTask(null);
  }

  submitComment(): void {
    if (!this.task || !this.newCommentText.trim()) return;
    this.service.addComment(this.task.id, this.newCommentText.trim());
    this.newCommentText = '';
  }

  // Manager Actions
  approveTask(): void {
    if (!this.task) return;
    this.service.updateTaskStatus(this.task.id, 'Verified');
  }

  rejectTask(): void {
    if (!this.task) return;
    this.service.updateTaskStatus(this.task.id, 'Manager Feedback');
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
    if (task.type !== 'NUMERIC') return 100;
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
}
