import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { DayNode, EmployeeNode } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-workflow-progress',
  templateUrl: './workflow-progress.component.html',
  styleUrls: ['./workflow-progress.component.scss']
})
export class WorkflowProgressComponent implements OnInit, OnDestroy {
  day: DayNode | null = null;
  employee: EmployeeNode | null = null;
  
  steps = [
    { label: 'Employee', value: 'Employee' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Counsellor Approved', value: 'Counsellor Approved' },
    { label: 'Manager Review', value: 'Manager Review' },
    { label: 'Manager Feedback', value: 'Manager Feedback' },
    { label: 'Verified', value: 'Verified' }
  ];

  private sub = new Subscription();

  constructor(private service: TaskAccountabilityService) {}

  ngOnInit(): void {
    this.sub.add(
      this.service.selectedDay$.subscribe(d => this.day = d)
    );
    this.sub.add(
      this.service.selectedEmployee$.subscribe(emp => {
        this.employee = emp;
        if (emp) {
          this.updateStepsForRole(emp.role);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  updateStepsForRole(roleName: string): void {
    if (roleName === 'Junior Counsellor') {
      this.steps = [
        { label: 'Employee', value: 'Employee' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Senior Review', value: 'Counsellor Approved' },
        { label: 'Manager Review', value: 'Manager Review' },
        { label: 'Admin Review', value: 'Manager Feedback' },
        { label: 'Verified', value: 'Verified' }
      ];
    } else if (roleName === 'Senior Counsellor' || roleName === 'Video Editor' || roleName === 'Web Developer') {
      this.steps = [
        { label: 'Employee', value: 'Employee' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Manager Review', value: 'Manager Review' },
        { label: 'Admin Review', value: 'Manager Feedback' },
        { label: 'Verified', value: 'Verified' }
      ];
    } else if (roleName === 'Manager') {
      this.steps = [
        { label: 'Employee', value: 'Employee' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Admin Review', value: 'Manager Review' },
        { label: 'Verified', value: 'Verified' }
      ];
    } else { // Administrative Assistant, etc.
      this.steps = [
        { label: 'Employee', value: 'Employee' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Admin Review', value: 'Manager Review' },
        { label: 'Verified', value: 'Verified' }
      ];
    }
  }

  getStepIndex(status: string): number {
    return this.steps.findIndex(s => s.value === status);
  }

  get currentStepIndex(): number {
    if (!this.day) return 0;
    const idx = this.getStepIndex(this.day.status);
    return idx === -1 ? 0 : idx;
  }

  getStepClass(index: number): string {
    const activeIdx = this.currentStepIndex;
    if (index < activeIdx) {
      return 'step-completed';
    } else if (index === activeIdx) {
      return 'step-active';
    } else {
      return 'step-pending';
    }
  }

  changeStatus(status: string): void {
    this.service.setDayStatus(status);
  }
}
