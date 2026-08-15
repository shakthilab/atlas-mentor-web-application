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
    { label: 'Employee', value: 'COMPLETED' },
    { label: 'Branch Partner', value: 'PARTNER_REVIEW' },
    { label: 'Manager Review', value: 'MANAGER_REVIEW' },
    { label: 'Admin Review', value: 'ADMIN_VERIFIED' }
  ];

  private sub = new Subscription();

  constructor(private service: TaskAccountabilityService) {}

  ngOnInit(): void {
    this.sub.add(
      this.service.selectedDay$.subscribe(d => this.day = d)
    );
    this.sub.add(
      this.service.selectedEmployee$.subscribe(emp => this.employee = emp)
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get currentStepIndex(): number {
    if (!this.day) return 0;
    const dayObj = this.day as any;

    const nextRole = (dayObj.nextActionRole || '').toString().toUpperCase().trim();
    const stage = (dayObj.approvalStage || dayObj.currentStep || dayObj.status || '').toString().toUpperCase().trim();

    if ((stage === 'COMPLETED' || stage === 'APPROVED' || stage === 'CLOSED' || stage === 'VERIFIED') && !nextRole) {
      return 4;
    }

    if (nextRole === 'ADMIN') {
      return 3;
    }

    if (nextRole === 'MANAGER') {
      return 2;
    }

    if (nextRole === 'BRANCH_PARTNER') {
      return 1;
    }

    if (typeof dayObj.currentStepNumber === 'number' && dayObj.currentStepNumber >= 1) {
      return dayObj.currentStepNumber - 1;
    }

    if (stage === 'ADMIN_VERIFIED' || stage === 'ADMIN' || stage === 'VERIFIED') return 3;
    if (stage === 'MANAGER_REVIEW' || stage === 'BRANCH_MANAGER' || stage === 'MANAGER') return 2;
    if (stage === 'PARTNER_REVIEW' || stage === 'BRANCH_PARTNER' || stage === 'PARTNER') return 1;
    if (stage === 'EMPLOYEE' || stage === 'SUBMITTED' || stage === 'DRAFT') return 0;

    return 0;
  }

  getFormattedStatus(status?: string): string {
    if (!this.day) return 'Employee';
    const dayObj = this.day as any;

    const nextRole = (dayObj.nextActionRole || '').toString().toUpperCase().trim();
    const stage = (dayObj.approvalStage || dayObj.status || status || '').toString().toUpperCase().trim();

    if ((stage === 'COMPLETED' || stage === 'APPROVED' || stage === 'CLOSED' || stage === 'VERIFIED') && !nextRole) {
      return 'Completed';
    }

    if (nextRole === 'ADMIN') return 'Admin Review';
    if (nextRole === 'MANAGER') return 'Manager Review';
    if (nextRole === 'BRANCH_PARTNER') return 'Branch Partner Review';

    if (dayObj.currentStep) return dayObj.currentStep;

    if (stage === 'EMPLOYEE' || stage === 'SUBMITTED' || stage === 'DRAFT') return 'Employee';
    if (stage === 'PARTNER_REVIEW' || stage === 'BRANCH_PARTNER' || stage === 'PARTNER') return 'Branch Partner Review';
    if (stage === 'MANAGER_REVIEW' || stage === 'BRANCH_MANAGER' || stage === 'MANAGER') return 'Manager Review';
    if (stage === 'ADMIN_VERIFIED' || stage === 'ADMIN' || stage === 'VERIFIED') return 'Admin Review';
    if (stage === 'COMPLETED') return 'Completed';

    return stage.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
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
