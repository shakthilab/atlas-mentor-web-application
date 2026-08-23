import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { catchError, tap, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BranchNode, RoleNode, EmployeeNode, YearNode, MonthNode, DayNode, TaskItem, RoleTemplate, TemplateAssignment, TemplateMonth, TemplateDay } from '../interfaces/accountability.interface';
import { MOCK_BRANCHES } from '../models/mock-data';

@Injectable({
  providedIn: 'root'
})
export class TaskAccountabilityService {
  private branchesSubject = new BehaviorSubject<BranchNode[]>([]);
  public branches$: Observable<BranchNode[]> = this.branchesSubject.asObservable();
  private cachedStatuses$: Observable<any> | null = null;

  public setBranches(branches: BranchNode[]): void {
    this.branchesSubject.next(branches);
  }

  // Show Create Drawer state
  private showCreateDrawerSubject = new BehaviorSubject<boolean>(false);
  public showCreateDrawer$: Observable<boolean> = this.showCreateDrawerSubject.asObservable();

  public toggleCreateDrawer(show: boolean): void {
    this.showCreateDrawerSubject.next(show);
  }

  // Templates Configuration State
  private templatesSubject = new BehaviorSubject<RoleTemplate[]>([]);
  public templates$: Observable<RoleTemplate[]> = this.templatesSubject.asObservable();

  // Template Assignments State
  private assignmentsSubject = new BehaviorSubject<TemplateAssignment[]>([]);
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

  public get selectedDayValue(): DayNode | null {
    return this.selectedDaySubject.value;
  }

  private selectedTaskSubject = new BehaviorSubject<TaskItem | null>(null);
  public selectedTask$: Observable<TaskItem | null> = this.selectedTaskSubject.asObservable();

  private refreshRequestedSubject = new Subject<void>();
  public refreshRequested$: Observable<void> = this.refreshRequestedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initial workspace starts with no employee selected (shows welcome greeting view)
  }

  public triggerRefresh(): void {
    this.refreshRequestedSubject.next();
  }

  public selectBranch(branch: BranchNode | null): void {
    this.selectedBranchSubject.next(branch);
  }

  public selectRole(role: RoleNode | null): void {
    this.selectedRoleSubject.next(role);
  }

  public resetSelections(): void {
    this.selectedBranchSubject.next(null);
    this.selectedRoleSubject.next(null);
    this.selectedEmployeeSubject.next(null);
    this.selectedYearSubject.next(null);
    this.selectedMonthSubject.next(null);
    this.selectedDaySubject.next(null);
    this.selectedTaskSubject.next(null);
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
    const prevDay = this.selectedDaySubject.value;
    if (!prevDay || !day || prevDay.id !== day.id) {
      this.selectedTaskSubject.next(null);
    }
    this.selectedDaySubject.next(day);
  }

  public notifyDayUpdated(day: DayNode): void {
    this.selectedDaySubject.next(day);
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
    const currentSelected = this.selectedTaskSubject.value;
    if (currentSelected && currentSelected.id === taskId) {
      this.selectedTaskSubject.next({ ...task });
    }
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

    const currentBranches = this.branchesSubject.value;
    if (currentBranches && currentBranches.length > 0) {
      this.branchesSubject.next([...currentBranches]);
    }
  }

  // Templates CRUD
  public addTemplate(template: RoleTemplate): void {
    const list = this.templatesSubject.value;
    if (!template.status) {
      template.status = 'DRAFT';
      template.active = false;
    }
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

  public publishRoleTemplateApi(id: string | number): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/role-templates/${id}/publish`, {}).pipe(
      tap(() => {
        this.setTemplateStatusLocal(id.toString(), 'ACTIVE');
      }),
      catchError(() => {
        // Fallback local update if backend API endpoint is not active during local development
        this.setTemplateStatusLocal(id.toString(), 'ACTIVE');
        return of({ success: true, status: 'ACTIVE' });
      })
    );
  }

  public setTemplateStatusLocal(id: string, status: string): void {
    const list = this.templatesSubject.value;
    const template = list.find(t => t.id === id);
    if (template) {
      template.status = status;
      template.active = (status === 'ACTIVE');
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
    copy.status = 'DRAFT';
    copy.active = false;
    copy.createdAt = new Date().toISOString().split('T')[0];
    this.addTemplate(copy);
  }

  public toggleTemplateActive(id: string): void {
    const list = this.templatesSubject.value;
    const template = list.find(t => t.id === id);
    if (template) {
      const newStatus = template.status === 'ACTIVE' || template.active ? 'DRAFT' : 'ACTIVE';
      template.status = newStatus;
      template.active = (newStatus === 'ACTIVE');
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

  public getRoleTemplatesApi(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/role-templates`).pipe(
      tap(res => {
        if (res && res.success && res.data) {
          const mapped = res.data.map((item: any) => this.mapResponseToTemplate(item));
          this.templatesSubject.next(mapped);
        }
      }),
      catchError(err => {
        console.error('Error fetching role templates', err);
        return of(null);
      })
    );
  }

  public getRoleTemplateByIdApi(id: string | number): Observable<RoleTemplate | null> {
    return this.http.get<any>(`${environment.apiUrl}/role-templates/${id}`).pipe(
      map(res => {
        if (res && res.success && res.data) {
          return this.mapResponseToTemplate(res.data);
        }
        return null;
      }),
      catchError(err => {
        console.error('Error fetching role template by ID', err);
        return of(null);
      })
    );
  }

  public createRoleTemplateApi(request: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/role-templates`, request).pipe(
      tap(() => this.getRoleTemplatesApi().subscribe())
    );
  }

  public updateRoleTemplateApi(id: string | number, request: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/role-templates/${id}`, request).pipe(
      tap(() => this.getRoleTemplatesApi().subscribe())
    );
  }

  public deleteRoleTemplateApi(id: string | number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/role-templates/${id}/hard`).pipe(
      tap(() => this.getRoleTemplatesApi().subscribe())
    );
  }

  private getDemoTasksForDay(dayNumber: number): Array<any> {
    return [];
  }

  private mapResponseToTemplate(res: any): RoleTemplate {
    const isSeniorCounsellor = (res.roleName === 'SENIOR_COUNSELLOR' || res.roleDisplayName === 'Senior Counsellor' || res.role === 'Senior Counsellor' || (res.name && res.name.includes('Senior Counsellor')));
    const isAllBranches = (!res.branchId && !res.branchName) || res.branchName === 'All Branches' || res.branch === 'All Branches';

    const rawDays = res.days || [];
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const defaultMonthName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    return {
      id: res.id.toString(),
      name: res.name,
      role: res.roleName || res.roleDisplayName || res.role,
      roleId: res.roleId,
      roleName: res.roleName,
      roleDisplayName: res.roleDisplayName,
      branch: res.branchName || 'All Branches',
      branchId: res.branchId,
      branchName: res.branchName,
      status: res.status || (res.active ? 'ACTIVE' : 'DRAFT'),
      active: res.status === 'ACTIVE' || res.active === true,
      createdAt: res.createdAt ? res.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      updatedAt: res.updatedAt ? res.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
      // Placeholder for the currently-viewed month - role-templates.component rebuilds this
      // from `rawDays` for whichever month is actually selected (see resolveDaysForMonth).
      // A raw 1:1 pass-through is kept here only so a template that's never had its edit
      // modal opened (e.g. list-card view) still has something to iterate.
      months: [
        {
          id: `tm-${res.id}-1`,
          name: defaultMonthName,
          days: rawDays.map((d: any) => ({
            id: `td-${d.id}`,
            name: d.isWeeklyCheckpoint ? 'Weekly Accountability' : `Day ${d.dayNumber}`,
            isWeekly: d.isWeeklyCheckpoint || false,
            dayNumber: d.dayNumber,
            month: d.month ?? null,
            year: d.year ?? null,
            tasks: (d.tasks || []).map((t: any) => ({
              id: t.id.toString(),
              name: t.title,
              description: t.description || '',
              type: 'CHECKLIST',
              priority: t.priority ? t.priority : 'MEDIUM',
              required: true,
              active: true
            }))
          }))
        }
      ],
      tasks: [],
      rawDays
    };
  }
  public addTaskApi(templateId: string | number, dayNumber: number, task: { title: string; description: string; priority: string }, month?: number | null, year?: number | null): Observable<any> {
    let url = `${environment.apiUrl}/role-templates/${templateId}/days/${dayNumber}/tasks`;
    if (month != null && year != null) {
      url += `?month=${month}&year=${year}`;
    }
    return this.http.post<any>(url, task);
  }

  public updateTaskApi(templateId: string | number, dayNumber: number, taskId: string | number, task: { title: string; description: string; priority: string }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/role-templates/${templateId}/days/${dayNumber}/tasks/${taskId}`, task);
  }

  public deleteTaskApi(templateId: string | number, dayNumber: number, taskId: string | number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/role-templates/${templateId}/days/${dayNumber}/tasks/${taskId}`);
  }

  public updateTemplateStatusApi(id: string | number, status: 'ACTIVE' | 'INACTIVE'): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/role-templates/${id}/status`, { status });
  }

  public duplicateRoleTemplateApi(id: string | number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/role-templates/${id}/duplicate`, {});
  }

  // --- Part A: Employee Tree API Endpoints ---
  public getEmployeeTreeApi(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/employee-tree`);
  }

  public getEmployeeYearsApi(employeeId: string | number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/employees/${employeeId}/years`);
  }

  public getEmployeeMonthsApi(employeeId: string | number, year: number | string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/employees/${employeeId}/years/${year}/months`);
  }

  public getEmployeeDaysApi(employeeId: string | number, year: number | string, month: number | string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/employees/${employeeId}/years/${year}/months/${month}/days`);
  }

  // --- Part B: Day Detail API Endpoint ---
  public getDayDetailApi(employeeId: string | number, date: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/employees/${employeeId}/days/${date}`);
  }

  // --- Part C: Task Detail Drawer API Endpoints ---
  public getTaskDetailApi(taskId: string | number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/tasks/${taskId}`);
  }

  public getTaskCommentsApi(taskId: string | number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/tasks/${taskId}/comments`);
  }

  public addTaskCommentApi(taskId: string | number, comment: string, parentCommentId?: number | string | null): Observable<any> {
    const body: any = { comment };
    if (parentCommentId !== undefined && parentCommentId !== null) {
      body.parentCommentId = parentCommentId;
    }
    return this.http.post<any>(`${environment.apiUrl}/tasks/${taskId}/comments`, body);
  }

  public getTaskAttachmentsApi(taskId: string | number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/tasks/${taskId}/attachments`);
  }

  public addTaskAttachmentApi(taskId: string | number, payload: { fileName: string; fileUrl: string; fileSize: number; commentId?: number | string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/tasks/${taskId}/attachments`, payload);
  }

  public getTaskActivityApi(taskId: string | number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/tasks/${taskId}/activity`);
  }

  // --- Part D: Employee Actions API Endpoints ---
  public getStatusesApi(): Observable<any> {
    if (!this.cachedStatuses$) {
      this.cachedStatuses$ = this.http.get<any>(`${environment.apiUrl}/tasks/statuses`).pipe(
        shareReplay(1)
      );
    }
    return this.cachedStatuses$;
  }

  public resubmitTaskApi(taskId: string | number, comment?: string): Observable<any> {
    const body: any = {};
    if (comment && comment.trim()) {
      body.comment = comment.trim();
    }
    return this.http.post<any>(`${environment.apiUrl}/tasks/${taskId}/resubmit`, body);
  }

  public patchTaskStatusApi(taskId: string | number, status: 'TODO' | 'IN_PROGRESS' | 'DONE' | string): Observable<any> {
    const day = this.selectedDaySubject.value;
    const currentTask = day?.tasks?.find(t => String(t.id) === String(taskId));
    if (currentTask && (currentTask.status === 'REFLECT' || currentTask.status === 'REJECTED')) {
      return this.resubmitTaskApi(taskId);
    }
    return this.http.patch<any>(`${environment.apiUrl}/tasks/${taskId}/status`, { status });
  }

  public patchTaskPriorityApi(taskId: string | number, priority: string): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/tasks/${taskId}/priority`, { priority });
  }

  public submitEmployeeDayApi(employeeId: string | number, date: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/employees/${employeeId}/days/${date}/submit`, {});
  }

  // --- Part E: Three-Stage Approval Workflow API Endpoints ---
  public getPendingApprovalsApi(stage?: string): Observable<any> {
    const url = stage ? `${environment.apiUrl}/approvals/pending?stage=${stage}` : `${environment.apiUrl}/approvals/pending`;
    return this.http.get<any>(url);
  }

  public approveDayApi(
    dayWorkspaceId: string | number, 
    action: 'APPROVE' | 'SEND_BACK', 
    comment?: string, 
    flaggedTaskIds?: Array<number | string>
  ): Observable<any> {
    const body: any = { action };
    if (comment && comment.trim()) {
      body.comment = comment.trim();
    }
    if (flaggedTaskIds && flaggedTaskIds.length > 0) {
      const numericIds = flaggedTaskIds
        .map(id => typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10))
        .filter(id => !isNaN(id));
      body.taskIds = numericIds.length > 0 ? numericIds : flaggedTaskIds;
    }
    return this.http.post<any>(`${environment.apiUrl}/days/${dayWorkspaceId}/approve`, body);
  }

  public getDayApprovalsTrailApi(dayWorkspaceId: string | number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/days/${dayWorkspaceId}/approvals`);
  }

  // --- Part F: Role Scoping & Individual Contributor (/api/my/...) Endpoints ---
  public isAdminTreeRole(roleStr?: string | null): boolean {
    if (!roleStr) return false;
    const r = roleStr.toUpperCase().trim();
    return ['ADMIN', 'ADMINISTRATIVE_ASSISTANT', 'MANAGER', 'BRANCH_PARTNER'].includes(r);
  }

  public getMyYearsApi(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/my/years`);
  }

  public getMyMonthsApi(year: number | string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/my/years/${year}/months`);
  }

  public getMyDaysApi(year: number | string, month: number | string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/my/years/${year}/months/${month}/days`);
  }

  public getMyDayDetailApi(date: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/my/days/${date}`);
  }

  // --- Weekly Accountability APIs ---

  // Employee Check-in (Part 1)
  public getMyWeeklyTemplate(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/weekly-accountability/my-template`);
  }

  public getMyWeeklyResponses(checkpointDate: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/weekly-accountability/responses`, {
      params: { checkpointDate }
    });
  }

  public submitMyWeeklyResponses(payload: { checkpointDate: string; answers: { questionId: number; answerText: string }[] }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/weekly-accountability/responses`, payload);
  }

  // Reviewer (Part 2)
  public getEmployeeWeeklyResponses(employeeId: string | number, checkpointDate: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/weekly-accountability/responses`, {
      params: { employeeId: String(employeeId), checkpointDate }
    });
  }

  // Admin Weekly Templates Management (Part 3)
  public getWeeklyTemplates(roleId?: number | string | null, status?: string | null): Observable<any> {
    const params: any = {};
    if (roleId) params.roleId = String(roleId);
    if (status) params.status = status;
    return this.http.get<any>(`${environment.apiUrl}/weekly-accountability-templates`, { params });
  }

  public getWeeklyTemplate(id: number | string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/weekly-accountability-templates/${id}`);
  }

  public createWeeklyTemplate(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/weekly-accountability-templates`, payload);
  }

  public updateWeeklyTemplate(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/weekly-accountability-templates/${id}`, payload);
  }

  public publishWeeklyTemplate(id: number | string): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/weekly-accountability-templates/${id}/publish`, {});
  }

  public deleteWeeklyTemplate(id: number | string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/weekly-accountability-templates/${id}`);
  }

  public duplicateWeeklyTemplateApi(id: number | string, payload: { newTemplateName: string; newCycleMonth: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/weekly-accountability-templates/${id}/duplicate`, payload);
  }

  public updateWeeklyTemplateStatus(id: number | string, status: 'ACTIVE' | 'INACTIVE'): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/weekly-accountability-templates/${id}/status`, { status });
  }
}
