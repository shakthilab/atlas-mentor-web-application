import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { BranchNode, RoleNode, EmployeeNode, YearNode, MonthNode, DayNode, TaskItem } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-task-accountability-dashboard',
  templateUrl: './task-accountability-dashboard.component.html',
  styleUrls: ['./task-accountability-dashboard.component.scss']
})
export class TaskAccountabilityDashboardComponent implements OnInit, OnDestroy {
  // Active Selections
  branch: BranchNode | null = null;
  role: RoleNode | null = null;
  employee: EmployeeNode | null = null;
  year: YearNode | null = null;
  month: MonthNode | null = null;
  day: DayNode | null = null;
  selectedTask: TaskItem | null = null;

  private subs = new Subscription();

  constructor(private service: TaskAccountabilityService) {}

  ngOnInit(): void {
    this.subs.add(
      this.service.selectedBranch$.subscribe(b => this.branch = b)
    );
    this.subs.add(
      this.service.selectedRole$.subscribe(r => this.role = r)
    );
    this.subs.add(
      this.service.selectedEmployee$.subscribe(e => this.employee = e)
    );
    this.subs.add(
      this.service.selectedYear$.subscribe(y => this.year = y)
    );
    this.subs.add(
      this.service.selectedMonth$.subscribe(m => this.month = m)
    );
    this.subs.add(
      this.service.selectedDay$.subscribe(d => this.day = d)
    );
    this.subs.add(
      this.service.selectedTask$.subscribe(t => this.selectedTask = t)
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // Dashboard Header Actions
  submitDay(): void {
    if (!this.day) return;
    this.service.setDayStatus('Counsellor Approved');
  }

  markDayComplete(): void {
    if (!this.day) return;
    this.service.setDayStatus('Verified');
  }

  // Calculation helpers
  get completedTasksCount(): number {
    if (!this.day || !this.day.tasks) return 0;
    return this.day.tasks.filter(t => 
      ['Completed', 'Counsellor Approved', 'Manager Review', 'Manager Feedback', 'Verified', 'Closed'].includes(t.status)
    ).length;
  }

  get totalTasksCount(): number {
    if (!this.day || !this.day.tasks) return 0;
    return this.day.tasks.length;
  }
}
