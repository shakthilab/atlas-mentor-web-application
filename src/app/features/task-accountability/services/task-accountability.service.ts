import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BranchNode, RoleNode, EmployeeNode, YearNode, MonthNode, DayNode, TaskItem, RoleTemplate, TemplateAssignment, TemplateMonth, TemplateDay } from '../interfaces/accountability.interface';
import { MOCK_BRANCHES } from '../models/mock-data';

@Injectable({
  providedIn: 'root'
})
export class TaskAccountabilityService {
  private branchesSubject = new BehaviorSubject<BranchNode[]>(JSON.parse(JSON.stringify(MOCK_BRANCHES)));
  public branches$: Observable<BranchNode[]> = this.branchesSubject.asObservable();

  // Show Create Drawer state
  private showCreateDrawerSubject = new BehaviorSubject<boolean>(false);
  public showCreateDrawer$: Observable<boolean> = this.showCreateDrawerSubject.asObservable();

  public toggleCreateDrawer(show: boolean): void {
    this.showCreateDrawerSubject.next(show);
  }

  // Templates Configuration State
  private templatesSubject = new BehaviorSubject<RoleTemplate[]>([
    {
      id: 'temp-1',
      name: 'Senior Counsellor Template',
      role: 'Senior Counsellor',
      active: true,
      createdAt: '2026-04-01',
      tasks: [
        { id: 'tt-1', name: 'Call New Leads', description: 'Call fresh operational leads from dashboard', type: 'NUMERIC', priority: 'High', targetValue: '150', required: true, active: true },
        { id: 'tt-2', name: 'Follow-up Calls', description: 'Follow up on webinar warm leads', type: 'NUMERIC', priority: 'Medium', targetValue: '25', required: true, active: true },
        { id: 'tt-3', name: 'Student Counselling', description: 'Counselling sessions overseas europe/russia', type: 'NUMERIC', priority: 'High', targetValue: '8', required: true, active: true },
        { id: 'tt-4', name: 'CRM Update', description: 'Clean duplicates and logs', type: 'CHECKLIST', priority: 'Low', required: true, active: true },
        { id: 'tt-5', name: 'Upload Daily Report', description: 'Upload daily EOD pdf sheet', type: 'FILE', priority: 'High', required: true, active: true },
        { id: 'tt-6', name: 'Daily Summary', description: 'Type brief executive notes', type: 'TEXT', priority: 'Medium', required: false, active: true }
      ]
    }
  ]);
  public templates$: Observable<RoleTemplate[]> = this.templatesSubject.asObservable();

  // Template Assignments State
  private assignmentsSubject = new BehaviorSubject<TemplateAssignment[]>([
    {
      id: 'assign-1',
      templateId: 'temp-1',
      templateName: 'Senior Counsellor Template',
      assignType: 'role',
      targetName: 'Senior Counsellors',
      effectiveDate: '2026-04-01',
      active: true
    }
  ]);
  public assignments$: Observable<TemplateAssignment[]> = this.assignmentsSubject.asObservable();

  // Active Selections
  private selectedBranchSubject = new BehaviorSubject<BranchNode | null>(null);
  public selectedBranch$: Observable<BranchNode | null> = this.selectedBranchSubject.asObservable();

  private selectedRoleSubject = new BehaviorSubject<RoleNode | null>(null);
  public selectedRole$: Observable<RoleNode | null> = this.selectedRoleSubject.asObservable();

  private selectedEmployeeSubject = new BehaviorSubject<EmployeeNode | null>(null);
  public selectedEmployee$: Observable<EmployeeNode | null> = this.selectedEmployeeSubject.asObservable();

  private selectedYearSubject = new BehaviorSubject<YearNode | null>(null);
  public selectedYear$: Observable<YearNode | null> = this.selectedYearSubject.asObservable();

  private selectedMonthSubject = new BehaviorSubject<MonthNode | null>(null);
  public selectedMonth$: Observable<MonthNode | null> = this.selectedMonthSubject.asObservable();

  private selectedDaySubject = new BehaviorSubject<DayNode | null>(null);
  public selectedDay$: Observable<DayNode | null> = this.selectedDaySubject.asObservable();

  private selectedTaskSubject = new BehaviorSubject<TaskItem | null>(null);
  public selectedTask$: Observable<TaskItem | null> = this.selectedTaskSubject.asObservable();

  constructor() {
    // Set initial selection to Rohith Krishnan -> 2026 -> April -> Day 2 (as seen in screenshots)
    const branches = this.branchesSubject.value;
    const chennai = branches.find(b => b.id === 'b-chennai');
    if (chennai) {
      this.selectedBranchSubject.next(chennai);
      const srCounsellor = chennai.roles.find(r => r.id === 'r-chennai-sr-counsellors');
      if (srCounsellor) {
        this.selectedRoleSubject.next(srCounsellor);
        const rohith = srCounsellor.employees.find(e => e.id === 'emp-rohith');
        if (rohith) {
          this.selectedEmployeeSubject.next(rohith);
          const y2026 = rohith.years.find(y => y.yearNumber === 2026);
          if (y2026) {
            this.selectedYearSubject.next(y2026);
            const april = y2026.months.find(m => m.name === 'April');
            if (april) {
              this.selectedMonthSubject.next(april);
              const day2 = april.days.find(d => d.name === 'Day 2');
              if (day2) {
                this.selectedDaySubject.next(day2);
              }
            }
          }
        }
      }
    }
  }

  public selectBranch(branch: BranchNode | null): void {
    this.selectedBranchSubject.next(branch);
  }

  public selectRole(role: RoleNode | null): void {
    this.selectedRoleSubject.next(role);
  }

  public selectEmployee(employee: EmployeeNode | null): void {
    this.selectedEmployeeSubject.next(employee);
  }

  public selectYear(year: YearNode | null): void {
    this.selectedYearSubject.next(year);
  }

  public selectMonth(month: MonthNode | null): void {
    this.selectedMonthSubject.next(month);
  }

  public selectDay(day: DayNode | null): void {
    this.selectedDaySubject.next(day);
    // Clear selected task when changing day
    this.selectedTaskSubject.next(null);
  }

  public selectTask(task: TaskItem | null): void {
    this.selectedTaskSubject.next(task);
  }

  // State modification methods
  public addComment(taskId: string, text: string): void {
    const day = this.selectedDaySubject.value;
    if (!day || !day.tasks) return;

    const task = day.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newComment = {
      id: `c-${Date.now()}`,
      authorName: 'Priya Nair', // Current logged-in user simulation
      authorRole: 'Branch Manager',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    task.comments.push(newComment);
    
    // Log activity
    task.activities.push({
      id: `act-${Date.now()}`,
      text: `Priya Nair added a comment`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.selectedDaySubject.next({ ...day });
    this.selectedTaskSubject.next({ ...task });
  }

  public updateTaskStatus(taskId: string, status: TaskItem['status']): void {
    const day = this.selectedDaySubject.value;
    if (!day || !day.tasks) return;

    const task = day.tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    task.status = status;

    // Log activity
    task.activities.push({
      id: `act-${Date.now()}`,
      text: `Status updated from ${oldStatus} to ${status}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.selectedDaySubject.next({ ...day });
    this.selectedTaskSubject.next({ ...task });
    this.recalculateCompletionRates();
  }

  public rateTask(taskId: string, rating: TaskItem['rating']): void {
    const day = this.selectedDaySubject.value;
    if (!day || !day.tasks) return;

    const task = day.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.rating = rating;

    // Log activity
    task.activities.push({
      id: `act-${Date.now()}`,
      text: `Performance rating set to ${rating}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.selectedDaySubject.next({ ...day });
    this.selectedTaskSubject.next({ ...task });
  }

  public addTask(taskName: string, type: TaskItem['type'], priority: TaskItem['priority']): void {
    const day = this.selectedDaySubject.value;
    if (!day) return;

    if (!day.tasks) {
      day.tasks = [];
    }

    const newTask: TaskItem = {
      id: `T-${day.tasks.length + 101}`,
      name: taskName,
      type,
      priority,
      status: 'Employee',
      actualValue: type === 'NUMERIC' ? '0/100' : '—',
      comment: '',
      description: `Custom ${type.toLowerCase()} task added dynamically.`,
      targetValue: type === 'NUMERIC' ? '100' : 'Complete',
      achievementRate: 0,
      assignedTo: this.selectedEmployeeSubject.value?.name || 'Unassigned',
      assignedBy: 'Priya Nair',
      dueTime: '6:00 PM',
      comments: [],
      attachments: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          text: 'Task created',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    day.tasks.push(newTask);
    this.selectedDaySubject.next({ ...day });
    this.recalculateCompletionRates();
  }

  public addAdHocTask(
    name: string,
    description: string,
    priority: TaskItem['priority'],
    type: TaskItem['type'],
    assignedTo: string,
    dueTime: string
  ): void {
    const day = this.selectedDaySubject.value;
    if (!day) return;

    if (!day.tasks) {
      day.tasks = [];
    }

    const newTask: TaskItem = {
      id: `T-${day.tasks.length + 101}`,
      name,
      type,
      priority,
      status: 'Employee',
      actualValue: type === 'NUMERIC' ? '0/100' : '—',
      comment: '',
      description: description || `Ad-hoc ${type.toLowerCase()} task.`,
      targetValue: type === 'NUMERIC' ? '100' : 'Complete',
      achievementRate: 0,
      assignedTo: assignedTo || this.selectedEmployeeSubject.value?.name || 'Unassigned',
      assignedBy: 'Priya Nair',
      dueTime: dueTime || '6:00 PM',
      comments: [],
      attachments: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          text: `Ad-hoc Task created and assigned to ${assignedTo}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    day.tasks.push(newTask);
    this.selectedDaySubject.next({ ...day });
    this.recalculateCompletionRates();
  }

  public setDayStatus(status: string): void {
    const day = this.selectedDaySubject.value;
    if (!day) return;

    day.status = status;
    this.selectedDaySubject.next({ ...day });
  }

  private recalculateCompletionRates(): void {
    const day = this.selectedDaySubject.value;
    if (!day || !day.tasks || day.tasks.length === 0) return;

    // A task is completed if status is Completed, Counsellor Approved, Manager Review, Manager Feedback, Verified, or Closed
    const completedTasksCount = day.tasks.filter(t => 
      ['Completed', 'Counsellor Approved', 'Manager Review', 'Manager Feedback', 'Verified', 'Closed'].includes(t.status)
    ).length;

    day.completionRate = Math.round((completedTasksCount / day.tasks.length) * 100);
    this.selectedDaySubject.next({ ...day });

    // Update branches subject to trigger changes in tree percentages
    this.branchesSubject.next([...this.branchesSubject.value]);
  }

  // Templates CRUD
  public addTemplate(template: RoleTemplate): void {
    const list = this.templatesSubject.value;
    list.push(template);
    this.templatesSubject.next([...list]);
  }

  public updateTemplate(updated: RoleTemplate): void {
    const list = this.templatesSubject.value;
    const idx = list.findIndex(t => t.id === updated.id);
    if (idx !== -1) {
      list[idx] = updated;
      this.templatesSubject.next([...list]);
    }
  }

  public deleteTemplate(id: string): void {
    const list = this.templatesSubject.value.filter(t => t.id !== id);
    this.templatesSubject.next([...list]);
  }

  public duplicateTemplate(template: RoleTemplate): void {
    const copy = JSON.parse(JSON.stringify(template));
    copy.id = `temp-${Date.now()}`;
    copy.name = `${copy.name} (Copy)`;
    copy.createdAt = new Date().toISOString().split('T')[0];
    this.addTemplate(copy);
  }

  public toggleTemplateActive(id: string): void {
    const list = this.templatesSubject.value;
    const template = list.find(t => t.id === id);
    if (template) {
      template.active = !template.active;
      this.templatesSubject.next([...list]);
    }
  }

  // Assignments CRUD
  public addAssignment(assignment: TemplateAssignment): void {
    const list = this.assignmentsSubject.value;
    list.push(assignment);
    this.assignmentsSubject.next([...list]);
  }

  public deleteAssignment(id: string): void {
    const list = this.assignmentsSubject.value.filter(a => a.id !== id);
    this.assignmentsSubject.next([...list]);
  }

  // Publish Template programmatically generates Days/Weekly Accountability and tasks for employees
  public publishTemplate(
    templateId: string,
    role: string,
    branchId: string,
    employeeIds: string[],
    monthName: string,
    yearNumber: number
  ): void {
    const branches = this.branchesSubject.value;
    const template = this.templatesSubject.value.find(t => t.id === templateId);
    if (!template) return;

    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;

    let roleNode = branch.roles.find(r => r.name === role);
    if (!roleNode) {
      roleNode = {
        id: `r-${branch.id}-${role.toLowerCase().replace(/\s+/g, '-')}`,
        name: role,
        count: 0,
        employees: [],
        expanded: true
      };
      branch.roles.push(roleNode);
    }

    employeeIds.forEach(empId => {
      let employee = roleNode?.employees.find(e => e.id === empId);
      if (!employee) {
        let existingEmp: EmployeeNode | undefined;
        for (const b of branches) {
          for (const r of b.roles) {
            const found = r.employees.find(e => e.id === empId);
            if (found) {
              existingEmp = found;
              break;
            }
          }
          if (existingEmp) break;
        }

        employee = {
          id: empId,
          name: existingEmp ? existingEmp.name : empId.replace('emp-', '').replace('-', ' '),
          role: role,
          completionRate: 0,
          initials: existingEmp ? existingEmp.initials : empId.substring(4, 6).toUpperCase(),
          streak: 0,
          expanded: true,
          years: []
        };
        roleNode?.employees.push(employee);
      }

      let yearNode = employee.years.find(y => y.yearNumber === yearNumber);
      if (!yearNode) {
        yearNode = {
          id: `y-${employee.id}-${yearNumber}`,
          yearNumber,
          expanded: true,
          months: []
        };
        employee.years.push(yearNode);
      }

      let monthNode = yearNode.months.find(m => m.name === monthName);
      if (!monthNode) {
        monthNode = {
          id: `m-${employee.id}-${yearNumber}-${monthName.toLowerCase()}`,
          name: monthName,
          isLive: true,
          expanded: true,
          days: []
        };
        yearNode.months.push(monthNode);
      }

      if (template.months && template.months.length > 0) {
        const tMonth = template.months[0];
        monthNode.days = tMonth.days.map((tDay, index) => {
          const dayId = `d-${employee?.id}-${index + 1}`;
          const tasks: TaskItem[] = tDay.tasks.map((tTask, tIdx) => ({
            id: `T-${dayId}-${tIdx + 1}`,
            name: tTask.name,
            type: tTask.type,
            priority: tTask.priority,
            status: 'Employee',
            actualValue: tTask.type === 'NUMERIC' ? `0/${tTask.targetValue || '100'}` : '—',
            comment: '',
            description: tTask.description,
            targetValue: tTask.targetValue || 'Complete',
            achievementRate: 0,
            assignedTo: employee?.name || 'Unassigned',
            assignedBy: 'System Manager',
            dueTime: '6:00 PM',
            comments: [],
            attachments: [],
            activities: [
              {
                id: `act-${Date.now()}-${tIdx}`,
                text: 'Task generated from template',
                timestamp: '09:00 AM'
              }
            ]
          }));

          return {
            id: dayId,
            name: tDay.name,
            dateLabel: `${monthName.substring(0, 3)} ${(index + 1).toString().padStart(2, '0')}, ${yearNumber}`,
            completionRate: 0,
            progressRate: 0,
            status: 'Employee',
            isWeekly: tDay.isWeekly,
            tasks: tDay.isWeekly ? [] : tasks
          };
        });
      } else {
        const daysList: DayNode[] = [];
        for (let d = 1; d <= 30; d++) {
          const dayId = `d-${employee.id}-${d}`;
          const isWeekly = d % 7 === 0;

          const tasks: TaskItem[] = isWeekly ? [] : template.tasks.map((tTask, tIdx) => ({
            id: `T-${dayId}-${tIdx + 1}`,
            name: tTask.name,
            type: tTask.type,
            priority: tTask.priority,
            status: 'Employee',
            actualValue: tTask.type === 'NUMERIC' ? `0/${tTask.targetValue || '100'}` : '—',
            comment: '',
            description: tTask.description,
            targetValue: tTask.targetValue || 'Complete',
            achievementRate: 0,
            assignedTo: employee?.name || 'Unassigned',
            assignedBy: 'System Manager',
            dueTime: '6:00 PM',
            comments: [],
            attachments: [],
            activities: [
              {
                id: `act-${Date.now()}-${tIdx}`,
                text: 'Task generated from template',
                timestamp: '09:00 AM'
              }
            ]
          }));

          daysList.push({
            id: dayId,
            name: isWeekly ? 'Weekly Accountability' : `Day ${d}`,
            dateLabel: `${monthName.substring(0, 3)} ${d.toString().padStart(2, '0')}, ${yearNumber}`,
            completionRate: 0,
            progressRate: 0,
            status: 'Employee',
            isWeekly,
            tasks
          });
        }
        monthNode.days = daysList;
      }
    });

    branch.count = branch.roles.reduce((acc, r) => acc + r.employees.length, 0);
    branch.roles.forEach(r => {
      r.count = r.employees.length;
    });

    this.branchesSubject.next([...branches]);
  }
}
