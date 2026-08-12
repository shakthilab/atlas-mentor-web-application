import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { BranchNode, RoleNode, EmployeeNode, YearNode, MonthNode, DayNode } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-employee-tree',
  templateUrl: './employee-tree.component.html',
  styleUrls: ['./employee-tree.component.scss']
})
export class EmployeeTreeComponent implements OnInit, OnDestroy {
  branches: BranchNode[] = [];
  allBranches: BranchNode[] = [];
  searchQuery = '';
  
  selectedBranch: BranchNode | null = null;
  selectedRole: RoleNode | null = null;
  selectedEmployee: EmployeeNode | null = null;
  selectedYear: YearNode | null = null;
  selectedMonth: MonthNode | null = null;
  selectedDay: DayNode | null = null;

  isAllExpanded = false;

  private subs = new Subscription();

  constructor(
    private service: TaskAccountabilityService, 
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    const userRole = user?.role || '';

    // Only subscribe and fetch admin employee tree if user has an Admin Tree role
    if (this.service.isAdminTreeRole(userRole)) {
      // 1. Subscribe to local/mock tree state
      this.subs.add(
        this.service.branches$.subscribe(b => {
          this.allBranches = b;
          this.filterTree();
        })
      );
      this.subs.add(this.service.selectedBranch$.subscribe(b => this.selectedBranch = b));
      this.subs.add(this.service.selectedRole$.subscribe(r => this.selectedRole = r));
      this.subs.add(this.service.selectedEmployee$.subscribe(e => this.selectedEmployee = e));
      this.subs.add(this.service.selectedYear$.subscribe(y => this.selectedYear = y));
      this.subs.add(this.service.selectedMonth$.subscribe(m => this.selectedMonth = m));
      this.subs.add(this.service.selectedDay$.subscribe(d => this.selectedDay = d));

      // 2. Fetch live Employee Tree API
      this.loadEmployeeTreeFromApi();
    }
  }

  loadEmployeeTreeFromApi(): void {
    if (this.allBranches && this.allBranches.length > 0) {
      return; // Already loaded, do not re-fetch
    }
    this.service.getEmployeeTreeApi().subscribe({
      next: (res) => {
        if (res && res.data && res.data.branches) {
          const apiBranches: BranchNode[] = res.data.branches.map((b: any) => ({
            id: `b-${b.branchId}`,
            name: b.branchName,
            count: b.employeeCount || 0,
            expanded: false,
            roles: (b.roles || []).map((r: any) => ({
              id: `r-${r.roleId}`,
              name: r.roleDisplayName || r.roleName,
              count: r.employeeCount || 0,
              expanded: false,
              employees: (r.employees || []).map((emp: any) => ({
                id: emp.employeeId.toString(),
                name: emp.fullName,
                role: r.roleDisplayName || r.roleName,
                completionRate: emp.completionPct || 0,
                years: [],
                expanded: false,
                initials: emp.fullName ? emp.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'EE'
              }))
            }))
          }));
          if (apiBranches.length > 0) {
            this.allBranches = apiBranches;
            this.service.setBranches(apiBranches);
            this.filterTree();
          }
        }
      },
      error: (err) => {
        console.log('Employee tree API error:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onSearchChange(): void {
    this.filterTree();
  }

  filterTree(): void {
    if (!this.searchQuery.trim()) {
      this.branches = JSON.parse(JSON.stringify(this.allBranches));
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    const filtered: BranchNode[] = [];

    this.allBranches.forEach(b => {
      const bClone = { ...b, roles: [] as RoleNode[], expanded: true };
      b.roles.forEach(r => {
        const rClone = { ...r, employees: [] as EmployeeNode[], expanded: true };
        r.employees.forEach(e => {
          if (e.name.toLowerCase().includes(query)) {
            const eClone = { ...e, expanded: true };
            rClone.employees.push(eClone);
          }
        });
        if (rClone.employees.length > 0) {
          bClone.roles.push(rClone);
        }
      });
      if (bClone.roles.length > 0) {
        filtered.push(bClone);
      }
    });

    this.branches = filtered;
  }

  toggleExpand(node: any, event?: Event, parentEmployee?: EmployeeNode, parentYear?: YearNode): void {
    if (event) {
      event.stopPropagation();
    }
    node.expanded = !node.expanded;

    // Dynamically load child nodes if node is expanded and children empty
    if (node.expanded) {
      if (node.completionRate !== undefined && (!node.years || node.years.length === 0)) {
        // Employee node expanded -> Load Years (collapsed)
        this.loadYearsForEmployee(node);
      } else if (node.yearNumber !== undefined && (!node.months || node.months.length === 0)) {
        // Year node expanded -> Load Months (collapsed)
        const emp = parentEmployee || (node as any).employeeRef || this.selectedEmployee;
        if (emp) {
          this.loadMonthsForYear(emp, node);
        }
      } else if ((node.monthValue !== undefined || node.days !== undefined) && (!node.days || node.days.length === 0)) {
        // Month node expanded -> Load Days
        const emp = parentEmployee || (node as any).employeeRef || this.selectedEmployee;
        const year = parentYear || (node as any).yearRef || this.selectedYear;
        if (emp && year) {
          const mVal = node.monthValue || 8;
          this.loadDaysForMonth(emp, year, node, mVal);
        }
      }
    }
  }

  loadYearsForEmployee(employee: EmployeeNode): void {
    this.service.getEmployeeYearsApi(employee.id).subscribe(res => {
      if (res && res.data && res.data.length > 0) {
        employee.years = res.data.map((y: any) => ({
          id: `y-${employee.id}-${y.year}`,
          yearNumber: y.year,
          expanded: false,
          months: [],
          employeeRef: employee
        }));
      }
    });
  }

  loadMonthsForYear(employee: EmployeeNode, year: YearNode): void {
    this.service.getEmployeeMonthsApi(employee.id, year.yearNumber).subscribe(res => {
      if (res && res.data && res.data.length > 0) {
        year.months = res.data.map((m: any) => ({
          id: `m-${employee.id}-${year.yearNumber}-${m.month}`,
          name: m.monthName || `Month ${m.month}`,
          expanded: false,
          days: [],
          monthValue: m.month,
          employeeRef: employee,
          yearRef: year
        }));
      }
    });
  }

  loadDaysForMonth(employee: EmployeeNode, year: YearNode, monthNode: MonthNode, monthNumber: number): void {
    this.service.getEmployeeDaysApi(employee.id, year.yearNumber, monthNumber).subscribe(res => {
      if (res && res.data && res.data.length > 0) {
        // Deduplicate items by date / dayWorkspaceId
        const uniqueDaysMap = new Map<string, any>();
        for (const item of res.data) {
          const key = item.date || item.dayWorkspaceId || item.dayNumber;
          if (!uniqueDaysMap.has(key)) {
            uniqueDaysMap.set(key, item);
          }
        }

        const sortedData = Array.from(uniqueDaysMap.values()).sort((a, b) => {
          if (a.date && b.date) return a.date.localeCompare(b.date);
          return (a.dayNumber || 0) - (b.dayNumber || 0);
        });

        monthNode.days = sortedData.map((d: any) => {
          let label = d.dateLabel;
          if (d.date) {
            const dt = new Date(d.date + 'T00:00:00');
            if (!isNaN(dt.getTime())) {
              label = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
          }
          if (!label) {
            label = d.isWeeklyCheckpointDay ? 'Weekly Accountability' : `Day ${d.dayNumber || 1}`;
          }

          return {
            id: `d-${d.dayWorkspaceId || d.id}`,
            name: label,
            dateLabel: label,
            rawDate: d.date,
            completionRate: d.completionPct || d.dailyCompletionPct || 0,
            progressRate: d.completionPct || d.dailyCompletionPct || 0,
            status: d.approvalStage || 'EMPLOYEE',
            isWeekly: d.isWeeklyCheckpointDay || false
          };
        });
      }
    });
  }

  onSelectEmployee(employee: EmployeeNode, role: RoleNode, branch: BranchNode, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.service.selectBranch(branch);
    this.service.selectRole(role);
    this.service.selectEmployee(employee);

    this.toggleExpand(employee);
  }

  expandAll(): void {
    this.isAllExpanded = !this.isAllExpanded;
    this.branches.forEach(b => {
      b.expanded = this.isAllExpanded;
      b.roles.forEach(r => {
        r.expanded = this.isAllExpanded;
        r.employees.forEach(e => {
          e.expanded = this.isAllExpanded;
          if (e.years) {
            e.years.forEach(y => {
              y.expanded = this.isAllExpanded;
              if (y.months) {
                y.months.forEach(m => {
                  m.expanded = this.isAllExpanded;
                });
              }
            });
          }
        });
      });
    });
  }

  onSelectDay(day: DayNode, month: MonthNode, year: YearNode, employee: EmployeeNode, role: RoleNode, branch: BranchNode): void {
    this.service.selectBranch(branch);
    this.service.selectRole(role);
    this.service.selectEmployee(employee);
    this.service.selectYear(year);
    this.service.selectMonth(month);
    this.service.selectDay(day);

    const user = this.authService.currentUserValue;
    const rolePrefix = user ? this.authService.getRoleRoute(user.role as any) : '/admin';

    if (day.isWeekly) {
      this.router.navigate([`${rolePrefix}/task-accountability/weekly`]);
    } else {
      this.router.navigate([`${rolePrefix}/task-accountability/daily`]);
    }
  }

  getDayStatusColor(day: DayNode): string {
    if (day.id === 'd-rohith-1') return '#3b82f6'; // blue
    if (day.id === 'd-rohith-2') return '#22c55e'; // green
    if (day.id === 'd-rohith-3') return '#22c55e'; // green
    if (day.id === 'd-rohith-4') return '#22c55e'; // green
    if (day.id === 'd-rohith-5') return '#22c55e'; // green
    if (day.id === 'd-rohith-6') return '#22c55e'; // green
    if (day.id === 'd-rohith-7') return '#f97316'; // orange
    if (day.id === 'd-rohith-8') return '#3b82f6'; // blue
    if (day.completionRate === 0) return '#cbd5e1'; // gray
    return '#22c55e';
  }
}
