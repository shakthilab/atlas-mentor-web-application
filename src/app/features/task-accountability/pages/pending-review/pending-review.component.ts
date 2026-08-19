import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BranchNode, DayNode, EmployeeNode, PendingApproval } from '../../interfaces/accountability.interface';

interface StageBadge {
  text: string;
  cssClass: string;
}

interface PendingReviewRow extends PendingApproval {
  badge: StageBadge;
}

const STAGE_BADGES: Record<string, StageBadge> = {
  COMPLETED: { text: 'Awaiting Branch Partner (optional)', cssClass: 'badge-neutral' },
  PARTNER_REVIEW: { text: 'Branch Partner approved', cssClass: 'badge-approved' },
  MANAGER_REVIEW: { text: 'Manager approved', cssClass: 'badge-approved' },
  ADMIN_VERIFIED: { text: 'Fully approved', cssClass: 'badge-approved' }
};

@Component({
  selector: 'app-pending-review',
  templateUrl: './pending-review.component.html',
  styleUrls: ['./pending-review.component.scss']
})
export class PendingReviewComponent implements OnInit {
  rows: PendingReviewRow[] = [];
  isLoading = false;
  loadError = false;

  userRole = '';
  isManager = false;
  isBranchPartner = false;

  constructor(
    private service: TaskAccountabilityService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.userRole = (user?.role || '').toUpperCase().trim();
    this.isManager = this.userRole === 'MANAGER' || this.userRole === 'ADMINISTRATIVE_ASSISTANT';
    this.isBranchPartner = this.userRole === 'BRANCH_PARTNER';

    this.loadPending();
  }

  loadPending(): void {
    this.isLoading = true;
    this.loadError = false;

    this.service.getPendingApprovalsApi().subscribe({
      next: (res) => {
        const items: PendingApproval[] = Array.isArray(res) ? res : (res?.data || []);
        this.rows = items.map(item => ({
          ...item,
          badge: STAGE_BADGES[(item.approvalStage || '').toString().toUpperCase().trim()]
            || { text: this.formatStage(item.approvalStage), cssClass: 'badge-neutral' }
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading pending approvals:', err);
        this.rows = [];
        this.isLoading = false;
        this.loadError = true;
      }
    });
  }

  formatStage(stage?: string): string {
    if (!stage) return 'Pending';
    return stage.toString().toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const dt = new Date(dateStr + 'T00:00:00');
    if (isNaN(dt.getTime())) return dateStr;
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  openItem(item: PendingReviewRow): void {
    const branch: BranchNode = {
      id: `b-${item.branchId}`,
      name: item.branchName,
      count: 0,
      roles: []
    };

    const employee: EmployeeNode = {
      id: String(item.employeeId),
      name: item.employeeName,
      role: '',
      completionRate: item.dailyCompletionPct || 0,
      years: []
    };

    const day: DayNode = {
      id: `d-${item.dayWorkspaceId}`,
      name: item.workDate,
      dateLabel: item.workDate,
      rawDate: item.workDate,
      completionRate: item.dailyCompletionPct || 0,
      progressRate: item.dailyCompletionPct || 0,
      status: item.approvalStage,
      approvalStage: item.approvalStage
    };
    (day as any).rawDayWorkspaceId = item.dayWorkspaceId;

    this.service.selectBranch(branch);
    this.service.selectEmployee(employee);
    this.service.selectDay(day);

    const user = this.authService.currentUserValue;
    const rolePrefix = user ? this.authService.getRoleRoute(user.role as any) : '/manager';
    this.router.navigate([`${rolePrefix}/task-accountability/daily`]);
  }
}
