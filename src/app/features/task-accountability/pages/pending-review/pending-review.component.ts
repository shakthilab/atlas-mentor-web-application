import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BranchNode, DayNode, EmployeeNode, PendingApproval } from '../../interfaces/accountability.interface';
import { TranslateService } from '@ngx-translate/core';

interface StageBadge {
  textKey: string;
  cssClass: string;
}

interface PendingReviewRow extends PendingApproval {
  badge: StageBadge;
}

const STAGE_BADGES: Record<string, StageBadge> = {
  COMPLETED: { textKey: 'taskAccountability.pendingReview.awaitingBranchPartner', cssClass: 'badge-neutral' },
  PARTNER_REVIEW: { textKey: 'taskAccountability.pendingReview.branchPartnerApproved', cssClass: 'badge-approved' },
  MANAGER_REVIEW: { textKey: 'taskAccountability.pendingReview.managerApproved', cssClass: 'badge-approved' },
  ADMIN_VERIFIED: { textKey: 'taskAccountability.pendingReview.fullyApproved', cssClass: 'badge-approved' }
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
    private router: Router,
    private translate: TranslateService
  ) {}

  getBadgeText(item: PendingReviewRow): string {
    return item.badge.textKey.startsWith('taskAccountability.')
      ? this.translate.instant(item.badge.textKey)
      : item.badge.textKey;
  }

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
            || { textKey: this.formatStage(item.approvalStage), cssClass: 'badge-neutral' }
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
    if (!stage) return this.translate.instant('taskAccountability.pendingReview.pending');
    return stage.toString().toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const dt = new Date(dateStr + 'T00:00:00');
    if (isNaN(dt.getTime())) return dateStr;
    return dt.toLocaleDateString(this.translate.currentLang || 'en', { weekday: 'short', month: 'short', day: 'numeric' });
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
