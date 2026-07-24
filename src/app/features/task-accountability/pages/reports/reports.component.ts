import { Component, OnInit } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { Router } from '@angular/router';
import { BranchNode, RoleNode, EmployeeNode, DayNode } from '../../interfaces/accountability.interface';

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

  constructor(private service: TaskAccountabilityService, private router: Router) {}

  ngOnInit(): void {
    this.service.branches$.subscribe(branches => {
      this.branchesList = branches.map(b => b.name);
      
      const emps: string[] = [];
      branches.forEach(b => {
        b.roles.forEach(r => {
          r.employees.forEach(e => {
            if (!emps.includes(e.name)) {
              emps.push(e.name);
            }
          });
        });
      });
      this.employeesList = emps;
    });

    this.updateTargetDefault();
  }

  onFilterTypeChange(): void {
    this.updateTargetDefault();
    this.recalculateRates();
  }

  updateTargetDefault(): void {
    if (this.filterType === 'branch') {
      this.selectedTarget = this.branchesList[0] || '';
    } else if (this.filterType === 'role') {
      this.selectedTarget = this.rolesList[0] || '';
    } else {
      this.selectedTarget = this.employeesList[0] || '';
    }
  }

  onTargetChange(): void {
    this.recalculateRates();
  }

  recalculateRates(): void {
    // Generate different progress rates based on filter choices for realism
    if (this.selectedTarget === 'Chennai' || this.selectedTarget === 'Rohith Krishnan') {
      this.dailyRate = 91;
      this.weeklyRate = 94;
      this.monthlyRate = 88;
    } else if (this.selectedTarget === 'Mumbai' || this.selectedTarget === 'Junior Counsellor') {
      this.dailyRate = 78;
      this.weeklyRate = 82;
      this.monthlyRate = 80;
    } else {
      this.dailyRate = 85;
      this.weeklyRate = 87;
      this.monthlyRate = 84;
    }
  }

  reviewItem(item: PendingReviewItem): void {
    // Locate employee node and select in service to sync pages
    this.service.branches$.subscribe(branches => {
      let foundBranch: BranchNode | null = null;
      let foundRole: RoleNode | null = null;
      let foundEmp: EmployeeNode | null = null;
      let foundDay: DayNode | null = null;

      for (const b of branches) {
        for (const r of b.roles) {
          const emp = r.employees.find(e => e.id === item.employeeId);
          if (emp) {
            foundBranch = b;
            foundRole = r;
            foundEmp = emp;
            
            // Search for day or create simulated node
            for (const y of emp.years) {
              for (const m of y.months) {
                const day = m.days.find(d => d.id === item.dayId);
                if (day) {
                  foundDay = day;
                } else if (item.isWeekly) {
                  // Fallback simulation for weekly node
                  foundDay = m.days.find(d => d.isWeekly) || null;
                }
              }
            }
            break;
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

        // Route to execution screen
        if (item.isWeekly) {
          this.router.navigate(['/admin/task-accountability/weekly']);
        } else {
          this.router.navigate(['/admin/task-accountability/daily']);
        }
      }
    }).unsubscribe();
  }
}
