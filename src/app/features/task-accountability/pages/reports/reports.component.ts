import { Component, OnInit } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { BranchNode, RoleNode, EmployeeNode, DayNode } from '../../interfaces/accountability.interface';
import { TableColumn, TableFilterOption } from '../../../../shared/components/data-table/data-table.models';

interface PendingReviewItem {
  id: string;
  employeeName: string;
  employeeId: string;
  roleName: string;
  taskName: string;
  stage: string;
  submittedAt: string;
  isWeekly: boolean;
  dayId: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  filterType: 'branch' | 'role' | 'employee' = 'branch';
  selectedTarget = 'Chennai';

  // Dropdowns lists
  branchesList: string[] = [];
  rolesList: string[] = ['Senior Counsellor', 'Junior Counsellor', 'Video Editor', 'Web Developer', 'Administrative Assistant'];
  employeesList: string[] = [];

  // Metrics
  dailyRate = 91;
  weeklyRate = 94;
  monthlyRate = 88;

  pendingReviewsColumns: TableColumn<PendingReviewItem>[] = [
    { key: 'employeeName', header: 'Employee', type: 'custom', exportValueFn: r => r.employeeName },
    { key: 'roleName', header: 'Role', type: 'custom', exportValueFn: r => r.roleName },
    { key: 'taskName', header: 'Submitted Item', type: 'custom', exportValueFn: r => r.taskName },
    { key: 'stage', header: 'Status Stage', type: 'custom', exportValueFn: r => r.stage },
    { key: 'submittedAt', header: 'Submitted At', type: 'custom', exportValueFn: r => r.submittedAt },
    { key: 'actions', header: 'Actions', type: 'actions', align: 'right' },
  ];

  pendingReviewsFilters: Record<string, string> = {};

  get pendingReviewsFilterOptions(): TableFilterOption[] {
    const seen = new Map<string, string>();
    for (const row of this.pendingReviews) {
      const value = row.stage.toLowerCase();
      if (!seen.has(value)) seen.set(value, row.stage);
    }
    return [{ key: 'stage', label: 'Status Stage', options: Array.from(seen.entries()).map(([value, label]) => ({ value, label })) }];
  }

  get filteredPendingReviews(): PendingReviewItem[] {
    const stage = this.pendingReviewsFilters['stage'];
    return stage ? this.pendingReviews.filter(r => r.stage.toLowerCase() === stage) : this.pendingReviews;
  }

  // Pending Reviews
  pendingReviews: PendingReviewItem[] = [
    {
      id: 'pr-1',
      employeeName: 'Rohith Krishnan',
      employeeId: 'emp-rohith',
      roleName: 'Senior Counsellor',
      taskName: 'Call New Leads',
      stage: 'Manager Review',
      submittedAt: 'Today, 3:02 PM',
      isWeekly: false,
      dayId: 'd-rohith-2'
    },
    {
      id: 'pr-2',
      employeeName: 'Sandhya Ramesh',
      employeeId: 'emp-sandhya',
      roleName: 'Junior Counsellor',
      taskName: 'Follow-up Calls (Warm Leads)',
      stage: 'Senior Review',
      submittedAt: 'Today, 2:14 PM',
      isWeekly: false,
      dayId: 'd-sandhya-2'
    },
    {
      id: 'pr-3',
      employeeName: 'Rohith Krishnan',
      employeeId: 'emp-rohith',
      roleName: 'Senior Counsellor',
      taskName: 'Weekly Accountability (Apr 01 - Apr 07)',
      stage: 'Manager Review',
      submittedAt: 'Yesterday, 6:00 PM',
      isWeekly: true,
      dayId: 'd-rohith-weekly'
    }
  ];

  constructor(
    private service: TaskAccountabilityService, 
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.service.branches$.subscribe(branches => {
      this.branchesList = branches.map(b => b.name);
      
      const emps: string[] = [];
      branches.forEach(b => {
        b.roles.forEach(r => {
          r.employees.forEach(e => emps.push(e.name));
        });
      });
      this.employeesList = Array.from(new Set(emps));
    });
  }

  onFilterTypeChange(): void {
    if (this.filterType === 'branch') {
      this.selectedTarget = this.branchesList[0] || 'Chennai';
    } else if (this.filterType === 'role') {
      this.selectedTarget = 'Senior Counsellor';
    } else {
      this.selectedTarget = this.employeesList[0] || 'Rohith Krishnan';
    }
  }

  onTargetChange(): void {
    // Target change handler for report filtering
  }

  getStageBadgeClass(stage: string): string {
    if (stage.includes('Senior')) return 'badge-senior';
    if (stage.includes('Manager')) return 'badge-manager';
    return 'badge-default';
  }

  reviewItem(item: PendingReviewItem): void {
    // Find item details and set selections
    this.service.branches$.subscribe(branches => {
      let foundBranch: BranchNode | null = null;
      let foundRole: RoleNode | null = null;
      let foundEmp: EmployeeNode | null = null;
      let foundDay: DayNode | null = null;

      for (const b of branches) {
        for (const r of b.roles) {
          for (const e of r.employees) {
            if (e.id === item.employeeId || e.name === item.employeeName) {
              foundBranch = b;
              foundRole = r;
              foundEmp = e;

              // Search day
              for (const y of e.years) {
                for (const m of y.months) {
                  for (const d of m.days) {
                    if (d.id === item.dayId || d.isWeekly === item.isWeekly) {
                      foundDay = d;
                      break;
                    }
                  }
                }
              }
              break;
            }
          }
        }
      }

      if (foundBranch && foundRole && foundEmp) {
        this.service.selectBranch(foundBranch);
        this.service.selectRole(foundRole);
        this.service.selectEmployee(foundEmp);
        if (foundDay) {
          this.service.selectDay(foundDay);
        }

        const user = this.authService.currentUserValue;
        const rolePrefix = user ? this.authService.getRoleRoute(user.role as any) : '/admin';

        // Route to execution screen
        if (item.isWeekly) {
          this.router.navigate([`${rolePrefix}/task-accountability/weekly`]);
        } else {
          this.router.navigate([`${rolePrefix}/task-accountability/daily`]);
        }
      }
    }).unsubscribe();
  }
}
