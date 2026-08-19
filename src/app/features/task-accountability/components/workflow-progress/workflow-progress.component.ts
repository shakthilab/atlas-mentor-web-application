import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { DayNode, EmployeeNode, ApprovalTrailItem } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';

interface WorkflowStepDef {
  label: string;
  value: string;
  /** Branch Partner review is no longer mandatory - flagged so the template can label it. */
  optional?: boolean;
}

// Stages the day can be sitting at once Manager has already acted - at this point
// `approvalStage` alone can no longer tell us whether Branch Partner reviewed the day
// or was skipped, so the approval trail has to be consulted.
const STAGES_PAST_MANAGER = ['MANAGER_REVIEW', 'ADMIN_VERIFIED', 'APPROVED', 'CLOSED', 'VERIFIED'];

@Component({
  selector: 'app-workflow-progress',
  templateUrl: './workflow-progress.component.html',
  styleUrls: ['./workflow-progress.component.scss']
})
export class WorkflowProgressComponent implements OnInit, OnDestroy {
  day: DayNode | null = null;
  employee: EmployeeNode | null = null;

  steps: WorkflowStepDef[] = [
    { label: 'Employee', value: 'COMPLETED' },
    { label: 'Branch Partner', value: 'PARTNER_REVIEW', optional: true },
    { label: 'Manager Review', value: 'MANAGER_REVIEW' },
    { label: 'Admin Review', value: 'ADMIN_VERIFIED' }
  ];

  // Approval-trail lookup used only to resolve the Branch Partner step once the day
  // has already moved past Manager - see branchPartnerState().
  private trail: ApprovalTrailItem[] = [];
  private trailChecked = false;
  private trailFetchedForDayId: string | null = null;

  private sub = new Subscription();

  constructor(private service: TaskAccountabilityService) {}

  ngOnInit(): void {
    this.sub.add(
      this.service.selectedDay$.subscribe(d => {
        this.day = d;
        this.maybeFetchApprovalTrail();
      })
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
    // Branch Partner is now optional, so it needs its own "skipped" outcome rather than
    // just completed/active/pending - handle it separately from the rest of the bar.
    if (index === 1) {
      return this.branchPartnerStepClass;
    }

    const activeIdx = this.currentStepIndex;
    if (index < activeIdx) {
      return 'step-completed';
    } else if (index === activeIdx) {
      return 'step-active';
    } else {
      return 'step-pending';
    }
  }

  /** Whether the Branch Partner step should render as skipped (distinct from completed/pending). */
  get isBranchPartnerSkipped(): boolean {
    return this.branchPartnerState === 'skipped';
  }

  private get branchPartnerStepClass(): string {
    switch (this.branchPartnerState) {
      case 'completed': return 'step-completed';
      case 'skipped': return 'step-skipped';
      case 'active': return 'step-active';
      default: return 'step-pending';
    }
  }

  /**
   * Resolves what actually happened at the (now optional) Branch Partner stage:
   * - 'not-reached': Employee hasn't submitted the day yet.
   * - 'active': day is sitting at COMPLETED - Branch Partner can still review, but Manager
   *   can also act directly at this point, so nothing is decided yet.
   * - 'completed': Branch Partner reviewed the day (stage is/was PARTNER_REVIEW).
   * - 'skipped': Manager (or Admin) acted without Branch Partner ever reviewing it.
   */
  private get branchPartnerState(): 'not-reached' | 'active' | 'completed' | 'skipped' {
    if (!this.day) return 'not-reached';
    const dayObj = this.day as any;
    const rawStage = (dayObj.approvalStage || dayObj.status || '').toString().toUpperCase().trim();

    if (rawStage === 'PARTNER_REVIEW') return 'completed';
    if (rawStage === 'COMPLETED') return 'active';

    if (STAGES_PAST_MANAGER.includes(rawStage)) {
      if (this.trailChecked) {
        return this.branchPartnerReviewedInTrail() ? 'completed' : 'skipped';
      }
      // Trail hasn't resolved yet - default to "completed" instead of flashing "skipped"
      // for a day that may well have gone through Branch Partner review.
      return 'completed';
    }

    return 'not-reached';
  }

  private branchPartnerReviewedInTrail(): boolean {
    // A PARTNER_REVIEW entry can only exist if the day actually rested at that stage,
    // which only happens once Branch Partner approves it - so its presence is proof
    // Branch Partner reviewed the day rather than Manager acting directly on COMPLETED.
    return this.trail.some(item => (item.stage || '').toString().toUpperCase().trim() === 'PARTNER_REVIEW');
  }

  private maybeFetchApprovalTrail(): void {
    if (!this.day) {
      this.trailChecked = false;
      this.trail = [];
      this.trailFetchedForDayId = null;
      return;
    }

    const dayObj = this.day as any;
    const rawStage = (dayObj.approvalStage || dayObj.status || '').toString().toUpperCase().trim();
    if (!STAGES_PAST_MANAGER.includes(rawStage)) {
      return;
    }

    if (this.trailFetchedForDayId === this.day.id) {
      return; // already fetched (or in flight) for this day
    }

    const dayWorkspaceId = dayObj.rawDayWorkspaceId || (this.day.id || '').toString().replace('d-', '');
    if (!dayWorkspaceId) return;

    this.trailFetchedForDayId = this.day.id;
    this.service.getDayApprovalsTrailApi(dayWorkspaceId).subscribe({
      next: (res) => {
        this.trail = Array.isArray(res) ? res : (res?.data || []);
        this.trailChecked = true;
      },
      error: () => {
        // Leave trailChecked false so we fall back to assuming "completed" rather than
        // risking a false "skipped" label off a failed request.
        this.trailFetchedForDayId = null;
      }
    });
  }

  changeStatus(status: string): void {
    this.service.setDayStatus(status);
  }
}
