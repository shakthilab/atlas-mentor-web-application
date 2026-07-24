import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { BranchNode, RoleNode, EmployeeNode, YearNode, MonthNode, DayNode } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

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

  isAllExpanded = true;

  private subs = new Subscription();

  constructor(private service: TaskAccountabilityService, private router: Router) {}

  ngOnInit(): void {
    this.subs.add(
      this.service.branches$.subscribe(b => {
        this.allBranches = b;
        this.filterTree();
      })
    );
    this.subs.add(
      this.service.selectedBranch$.subscribe(b => this.selectedBranch = b)
    );
    this.subs.add(
      this.service.selectedRole$.subscribe(r => this.selectedRole = r)
    );
    this.subs.add(
      this.service.selectedEmployee$.subscribe(e => this.selectedEmployee = e)
    );
    this.subs.add(
      this.service.selectedYear$.subscribe(y => this.selectedYear = y)
    );
    this.subs.add(
      this.service.selectedMonth$.subscribe(m => this.selectedMonth = m)
    );
    this.subs.add(
      this.service.selectedDay$.subscribe(d => this.selectedDay = d)
    );
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

  toggleExpand(node: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    node.expanded = !node.expanded;
  }

  expandAll(): void {
    this.isAllExpanded = !this.isAllExpanded;
    this.branches.forEach(b => {
      b.expanded = this.isAllExpanded;
      b.roles.forEach(r => {
        r.expanded = this.isAllExpanded;
        r.employees.forEach(e => {
          e.expanded = this.isAllExpanded;
          e.years.forEach(y => {
            y.expanded = this.isAllExpanded;
            y.months.forEach(m => {
              m.expanded = this.isAllExpanded;
            });
          });
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

    if (day.isWeekly) {
      this.router.navigate(['/admin/task-accountability/weekly']);
    } else {
      this.router.navigate(['/admin/task-accountability/daily']);
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
