import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { BranchNode, RoleNode, EmployeeNode, YearNode, MonthNode, DayNode, TaskItem } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';

import { MatDialog } from '@angular/material/dialog';
import { SendBackReasonDialogComponent } from '../../components/send-back-reason-dialog/send-back-reason-dialog.component';

export interface WeeklyStripDay {
  dayName: string;
  dayNumber: number;
  dateStr: string;
  formattedLabel: string;
  taskCountText: string;
  hasDot: boolean;
  isActive: boolean;
  isToday: boolean;
}

export interface CalendarDayCell {
  dayNumber: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-task-accountability-dashboard',
  templateUrl: './task-accountability-dashboard.component.html',
  styleUrls: ['./task-accountability-dashboard.component.scss']
})
export class TaskAccountabilityDashboardComponent implements OnInit, OnDestroy {
  // Active Selections
  branch: BranchNode | null = null;
  role: RoleNode | null = null;
  employee: EmployeeNode | null = null;
  year: YearNode | null = null;
  month: MonthNode | null = null;
  day: DayNode | null = null;
  selectedTask: TaskItem | null = null;

  isIndividualContributor = false;
  myDaysList: any[] = [];
  selectedMyDayDate: string = '2026-08-11';

  // Non-approval user screen properties
  weekDaysList: WeeklyStripDay[] = [];
  selectedDateFormattedTitle = 'Tuesday, 11 August';
  selectedWeekRangeLabel = '10 Aug – 16 Aug 2026';
  selectedDateButtonLabel = '11 Aug 2026';
  userSubtitleMeta = 'Sandhya D · Junior Counsellor · Bengaluru — Indiranagar';
  private currentWeekCenterDate = new Date(2026, 7, 11); // Aug 11, 2026

  // Calendar Dropdown Popover Properties
  isDatePickerOpen = false;
  pickerYear = 2026;
  pickerMonth = 7; // August (0-indexed)
  pickerMonthLabel = 'August 2026';
  calendarGridDays: CalendarDayCell[] = [];

  private subs = new Subscription();

  constructor(
    private service: TaskAccountabilityService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isDatePickerOpen) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.date-picker-relative-container')) {
      this.isDatePickerOpen = false;
    }
  }

  toggleDatePicker(event: MouseEvent): void {
    event.stopPropagation();
    this.isDatePickerOpen = !this.isDatePickerOpen;
    if (this.isDatePickerOpen) {
      const parts = this.selectedMyDayDate.split('-');
      if (parts.length === 3) {
        this.pickerYear = parseInt(parts[0]);
        this.pickerMonth = parseInt(parts[1]) - 1;
      }
      this.buildCalendarGrid();
    }
  }

  prevPickerMonth(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.pickerMonth--;
    if (this.pickerMonth < 0) {
      this.pickerMonth = 11;
      this.pickerYear--;
    }
    this.buildCalendarGrid();
  }

  nextPickerMonth(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.pickerMonth++;
    if (this.pickerMonth > 11) {
      this.pickerMonth = 0;
      this.pickerYear++;
    }
    this.buildCalendarGrid();
  }

  buildCalendarGrid(): void {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.pickerMonthLabel = `${monthNames[this.pickerMonth]} ${this.pickerYear}`;

    const firstDay = new Date(this.pickerYear, this.pickerMonth, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 is Sun
    const daysInMonth = new Date(this.pickerYear, this.pickerMonth + 1, 0).getDate();
    const prevMonthDays = new Date(this.pickerYear, this.pickerMonth, 0).getDate();

    this.calendarGridDays = [];

    // 1. Trailing days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthDays - i;
      const prevM = this.pickerMonth === 0 ? 11 : this.pickerMonth - 1;
      const prevY = this.pickerMonth === 0 ? this.pickerYear - 1 : this.pickerYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;

      this.calendarGridDays.push({
        dayNumber: pDay,
        dateStr,
        isCurrentMonth: false,
        isSelected: dateStr === this.selectedMyDayDate,
        isToday: false
      });
    }

    // 2. Days in current month
    const todayStr = '2026-08-11';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this.pickerYear}-${String(this.pickerMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      this.calendarGridDays.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isSelected: dateStr === this.selectedMyDayDate,
        isToday: dateStr === todayStr
      });
    }

    // 3. Leading days for next month (fill up to 42 cells = 6 full rows)
    const totalCells = this.calendarGridDays.length;
    const remainingCells = 42 - totalCells;
    for (let n = 1; n <= remainingCells; n++) {
      const nextM = this.pickerMonth === 11 ? 0 : this.pickerMonth + 1;
      const nextY = this.pickerMonth === 11 ? this.pickerYear + 1 : this.pickerYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;

      this.calendarGridDays.push({
        dayNumber: n,
        dateStr,
        isCurrentMonth: false,
        isSelected: dateStr === this.selectedMyDayDate,
        isToday: false
      });
    }
  }

  selectCalendarDate(cell: CalendarDayCell, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedMyDayDate = cell.dateStr;
    const parts = cell.dateStr.split('-');
    if (parts.length === 3) {
      this.currentWeekCenterDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    this.isDatePickerOpen = false;
    this.fetchMyDayDetail(cell.dateStr);
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    const userRole = user?.role || '';
    this.isIndividualContributor = !this.service.isAdminTreeRole(userRole);

    this.generateWeeklyStrip(this.selectedMyDayDate);

    if (this.isIndividualContributor) {
      this.loadMyWorkspaceInitialData();
    }

    this.subs.add(
      this.service.selectedBranch$.subscribe(b => {
        this.branch = b;
        this.generateWeeklyStrip(this.selectedMyDayDate);
      })
    );
    this.subs.add(
      this.service.selectedRole$.subscribe(r => this.role = r)
    );
    this.subs.add(
      this.service.selectedEmployee$.subscribe(e => {
        this.employee = e;
        this.generateWeeklyStrip(this.selectedMyDayDate);
        this.loadDayDetailAndTasks();
      })
    );
    this.subs.add(
      this.service.selectedYear$.subscribe(y => this.year = y)
    );
    this.subs.add(
      this.service.selectedMonth$.subscribe(m => this.month = m)
    );
    this.subs.add(
      this.service.selectedDay$.subscribe(d => {
        const isNewDay = !this.day || (d && this.day.id !== d.id);
        this.day = d;
        if (isNewDay && d) {
          this.loadDayDetailAndTasks();
        }
      })
    );
    this.subs.add(
      this.service.selectedTask$.subscribe(t => this.selectedTask = t)
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get tasksPlannedCount(): number {
    return this.day?.tasks?.length || 0;
  }

  get tasksCompletedCount(): number {
    if (!this.day || !this.day.tasks) return 0;
    return this.day.tasks.filter(t => ['DONE', 'COMPLETED', 'VERIFIED'].includes(t.status?.toUpperCase())).length;
  }

  get tasksOverdueCount(): number {
    if (!this.day || !this.day.tasks) return 0;
    return this.day.tasks.filter(t => t.status?.toUpperCase() === 'OVERDUE').length;
  }

  get completionPercentage(): number {
    if (this.tasksPlannedCount === 0) return 0;
    return Math.round((this.tasksCompletedCount / this.tasksPlannedCount) * 100);
  }

  shiftWeek(offsetDays: number): void {
    const parts = this.selectedMyDayDate.split('-');
    let y = 2026, m = 7, d = 10;
    if (parts.length === 3) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
    }
    const target = new Date(y, m, d + offsetDays);
    const isoStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    this.fetchMyDayDetail(isoStr);
  }

  selectStripDay(card: WeeklyStripDay): void {
    this.selectedMyDayDate = card.dateStr;
    this.generateWeeklyStrip(card.dateStr);
    this.fetchMyDayDetail(card.dateStr);
  }

  generateWeeklyStrip(targetDateStr?: string): void {
    const activeDateStr = targetDateStr || this.selectedMyDayDate || '2026-08-11';
    this.selectedMyDayDate = activeDateStr;

    // Safely parse activeDateStr into YYYY, MM (0-indexed), DD
    const parts = activeDateStr.split('-');
    let targetYear = 2026;
    let targetMonth = 7; // Aug (0-indexed)
    let targetDayNum = 10;

    if (parts.length === 3) {
      targetYear = parseInt(parts[0], 10);
      targetMonth = parseInt(parts[1], 10) - 1;
      targetDayNum = parseInt(parts[2], 10);
    }

    const d = new Date(targetYear, targetMonth, targetDayNum);

    // Format Top Heading Title (e.g. "Monday, August 10" or "Tuesday, August 11")
    const weekdayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = d.toLocaleDateString('en-US', { month: 'long' });
    this.selectedDateFormattedTitle = `${weekdayName}, ${monthName} ${d.getDate()}`;

    // Format Date Picker Button Label (e.g. "10 Aug 2026" or "11 Aug 2026")
    const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
    this.selectedDateButtonLabel = `${d.getDate()} ${monthShort} ${d.getFullYear()}`;

    // Calculate Week Range (Monday to Sunday)
    const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon...
    const distToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(d);
    monday.setDate(d.getDate() + distToMon);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatShortMonth = (date: Date) => date.toLocaleDateString('en-US', { month: 'short' });
    this.selectedWeekRangeLabel = `${monday.getDate()} ${formatShortMonth(monday)} – ${sunday.getDate()} ${formatShortMonth(sunday)} ${sunday.getFullYear()}`;

    // Build 7-Day Strip
    const daysShort = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    this.weekDaysList = [];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);

      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const isoStr = `${yyyy}-${mm}-${dd}`;

      const isSelected = isoStr === activeDateStr;

      // Find matching day in myDaysList if available
      const matchInApi = this.myDaysList.find(item => item.date === isoStr);
      let countText = 'No plan';
      let hasDot = false;

      if (matchInApi) {
        const total = matchInApi.totalTasks ?? matchInApi.taskCount ?? (matchInApi.tasks ? matchInApi.tasks.length : 0);
        const done = matchInApi.completedTasks ?? matchInApi.doneCount ?? (matchInApi.tasks ? matchInApi.tasks.filter((t: any) => ['DONE', 'COMPLETED', 'VERIFIED'].includes(t.status?.toUpperCase())).length : 0);
        if (total > 0) {
          countText = `${done}/${total} tasks`;
          hasDot = done > 0;
        } else {
          countText = 'No plan';
          hasDot = false;
        }
      } else {
        if (cur.getDate() === 10) {
          countText = '1/3 tasks';
          hasDot = true;
        } else if (cur.getDate() === 11) {
          countText = '1/4 tasks';
          hasDot = true;
        } else {
          countText = 'No plan';
          hasDot = false;
        }
      }

      this.weekDaysList.push({
        dayName: daysShort[i],
        dayNumber: cur.getDate(),
        dateStr: isoStr,
        formattedLabel: `${cur.getDate()} ${formatShortMonth(cur)} ${cur.getFullYear()}`,
        taskCountText: countText,
        hasDot,
        isActive: isSelected,
        isToday: isoStr === '2026-08-11'
      });
    }

    const user = this.authService.currentUserValue;
    const name = this.employee?.name || user?.name || 'Sandhya D';
    const rawRole = (this.employee as any)?.roleName || this.employee?.role || user?.roleName || user?.role || 'Junior Counsellor';
    const role = this.authService.formatRoleName(rawRole);
    this.userSubtitleMeta = `${name} · ${role}`;
  }

  loadMyWorkspaceInitialData(): void {
    const todayStr = '2026-08-11';
    this.selectedMyDayDate = todayStr;

    // Load /api/my/years
    this.service.getMyYearsApi().subscribe({
      next: (resYears) => {
        const years = resYears?.data || [];
        const currentYear = years.length > 0 ? (years[0].year || years[0].yearNumber || 2026) : new Date().getFullYear();

        // Load /api/my/years/{year}/months
        this.service.getMyMonthsApi(currentYear).subscribe({
          next: (resMonths) => {
            const months = resMonths?.data || [];
            const currentMonth = months.length > 0 ? (months[0].month || months[0].monthValue || (new Date().getMonth() + 1)) : (new Date().getMonth() + 1);

            // Load /api/my/years/{year}/months/{month}/days
            this.service.getMyDaysApi(currentYear, currentMonth).subscribe({
              next: (resDays) => {
                this.myDaysList = resDays?.data || [];
                const foundToday = this.myDaysList.find(d => d.date === todayStr);
                if (foundToday) {
                  this.selectedMyDayDate = todayStr;
                } else if (this.myDaysList.length > 0) {
                  this.selectedMyDayDate = this.myDaysList[0].date || todayStr;
                } else {
                  this.selectedMyDayDate = todayStr;
                }
                this.generateWeeklyStrip(this.selectedMyDayDate);
                this.fetchMyDayDetail(this.selectedMyDayDate);
              },
              error: () => this.fetchMyDayDetail(todayStr)
            });
          },
          error: () => this.fetchMyDayDetail(todayStr)
        });
      },
      error: () => this.fetchMyDayDetail(todayStr)
    });
  }

  fetchMyDayDetail(dateStr: string): void {
    this.selectedMyDayDate = dateStr;
    this.generateWeeklyStrip(dateStr);

    this.service.getMyDayDetailApi(dateStr).subscribe({
      next: (res) => this.handleDayDetailResponse(res),
      error: (err) => this.handleDayDetailError(err)
    });
  }

  loadDayDetailAndTasks(): void {
    if (this.isIndividualContributor) {
      const dateStr = this.selectedMyDayDate || new Date().toISOString().split('T')[0];
      this.fetchMyDayDetail(dateStr);
      return;
    }

    if (!this.employee || !this.day) return;

    const employeeId = this.employee.id;
    let dateStr = (this.day as any).rawDate || (this.day.dateLabel && this.day.dateLabel.includes('-') ? this.day.dateLabel : null);
    
    if (!dateStr) {
      const yearNum = this.year ? this.year.yearNumber : 2026;
      const dayNum = String(this.day.id.replace(/\D/g, '') || 1).padStart(2, '0');
      dateStr = `${yearNum}-08-${dayNum}`;
    }

    this.service.getDayDetailApi(employeeId, dateStr).subscribe({
      next: (res) => this.handleDayDetailResponse(res),
      error: (err) => this.handleDayDetailError(err)
    });
  }

  private handleDayDetailResponse(res: any): void {
    if (res && res.data) {
      const d = res.data;
      const user = this.authService.currentUserValue;

      if (!this.employee) {
        this.employee = {
          id: d.employeeId ? String(d.employeeId) : 'me',
          name: d.employeeName || user?.name || 'My Workspace',
          role: user?.role || 'Employee',
          completionRate: d.monthlyCompletionPct || 0,
          years: []
        };
      }

      let exactDateLabel = d.dateLabel;
      if (d.date) {
        const dt = new Date(d.date + 'T00:00:00');
        if (!isNaN(dt.getTime())) {
          exactDateLabel = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }
      if (!exactDateLabel) {
        exactDateLabel = `Day ${d.dayNumber || 1}`;
      }

      if (!this.day) {
        this.day = {
          id: `d-${d.dayWorkspaceId || d.dayNumber || 1}`,
          name: exactDateLabel,
          dateLabel: exactDateLabel,
          rawDate: d.date,
          completionRate: d.dailyCompletionPct || 0,
          progressRate: d.dailyCompletionPct || 0,
          status: d.approvalStage || 'EMPLOYEE',
          nextActionRole: d.nextActionRole ?? null,
          canCurrentUserAct: d.canCurrentUserAct ?? false,
          approvalStage: d.approvalStage,
          tasks: []
        };
      } else {
        this.day.completionRate = d.dailyCompletionPct || 0;
        this.day.progressRate = d.dailyCompletionPct || 0;
        this.day.status = d.approvalStage || this.day.status;
        this.day.nextActionRole = d.nextActionRole ?? null;
        this.day.canCurrentUserAct = d.canCurrentUserAct ?? false;
        this.day.approvalStage = d.approvalStage;
        this.day.dateLabel = exactDateLabel;
        this.day.name = exactDateLabel;
        if (d.date) {
          this.day.rawDate = d.date;
        }
      }
      (this.day as any).rawDayWorkspaceId = d.dayWorkspaceId || d.id || this.day.id.replace('d-', '');

      if (this.day) {
        const rawTasks = d.tasks || [];
        if (rawTasks.length > 0) {
          this.day.tasks = rawTasks.map((t: any) => ({
            id: t.id.toString(),
            displayId: t.displayId || `TASK-${t.id}`,
            name: t.title || t.name,
            description: t.description || t.title || '',
            type: t.type || 'CHECKLIST',
            priority: t.priority ? t.priority : 'MEDIUM',
            status: t.status || 'TODO',
            latestCommentPreview: t.latestCommentPreview || null,
            comment: t.latestCommentPreview || t.comment || '',
            actualValue: t.actualValue || '1/1',
            targetValue: t.targetValue || '1',
            achievementRate: t.achievementRate || 100,
            assignedTo: d.employeeName || this.employee?.name || 'Employee',
            assignedBy: t.assignedBy || 'Manager',
            dueTime: t.dueTime || '11:59 PM',
            comments: t.latestCommentPreview ? [
              {
                id: `c-prev-${t.id}`,
                authorName: 'User',
                authorRole: 'Commenter',
                text: t.latestCommentPreview,
                timestamp: 'Latest'
              }
            ] : [],
            attachments: [],
            activities: []
          }));
        } else {
          this.day.tasks = [];
        }
        this.service.notifyDayUpdated(this.day);
      }
    }
  }

  getFormattedRoleName(roleStr?: string): string {
    return this.authService.formatRoleName(roleStr);
  }

  private handleDayDetailError(err: any): void {
    console.log('Day detail API error, setting tasks to empty array', err);
    if (this.day) {
      this.day.tasks = [];
      this.service.notifyDayUpdated(this.day);
    }
  }

  getFallbackDemoTasksForDay(): TaskItem[] {
    const empName = this.employee?.name || 'Rohith Krishnan';
    return [
      {
        id: `t-demo-1`,
        displayId: 'TASK-101',
        name: 'Call New Leads',
        type: 'NUMERIC',
        priority: 'High',
        status: 'Manager Review',
        actualValue: '150/150 calls',
        targetValue: '150 calls',
        achievementRate: 100,
        comment: 'Reached daily lead calling quota from CRM pipeline.',
        description: 'Call fresh operational leads from dashboard and log responses.',
        assignedTo: empName,
        assignedBy: 'Priya Nair',
        dueTime: '11:59 PM',
        comments: [],
        attachments: [],
        activities: []
      },
      {
        id: `t-demo-2`,
        displayId: 'TASK-102',
        name: 'Follow-up Calls (Warm Leads)',
        type: 'NUMERIC',
        priority: 'Medium',
        status: 'Completed',
        actualValue: '25/25 follow-ups',
        targetValue: '25 follow-ups',
        achievementRate: 100,
        comment: 'All warm leads from last week contacted.',
        description: 'Follow up with warm leads who showed interest during weekend webinar.',
        assignedTo: empName,
        assignedBy: 'Priya Nair',
        dueTime: '5:30 PM',
        comments: [],
        attachments: [],
        activities: []
      },
      {
        id: `t-demo-3`,
        displayId: 'TASK-103',
        name: 'Application Document Verification',
        type: 'CHECKLIST',
        priority: 'High',
        status: 'Employee',
        actualValue: '1/1',
        targetValue: '1',
        achievementRate: 100,
        comment: 'Transcripts and SOPs verified.',
        description: 'Verify student visa documentation, academic transcripts, and financial proof.',
        assignedTo: empName,
        assignedBy: 'Priya Nair',
        dueTime: '4:00 PM',
        comments: [],
        attachments: [],
        activities: []
      }
    ];
  }

  get canShowSubmitDayButton(): boolean {
    if (!this.employee) return false;

    const roleName = (this.employee.role || (this.role ? this.role.name : '') || '').toLowerCase().trim();
    
    // For Admin -> do NOT show Submit Day button
    if (roleName === 'admin' || roleName === 'administrator' || (roleName.includes('admin') && !roleName.includes('administrative assistant'))) {
      return false;
    }

    const allowedRoles = [
      'senior counsellor',
      'junior counsellor',
      'counsellor',
      'video editor',
      'web developer',
      'branch manager',
      'manager',
      'administrative assistant'
    ];

    return allowedRoles.some(r => roleName.includes(r));
  }

  get isAllTasksCompleted(): boolean {
    if (!this.day || !this.day.tasks || this.day.tasks.length === 0) {
      return false;
    }
    return this.day.tasks.every(t => {
      if (!t.status) return false;
      const s = t.status.toUpperCase().trim();
      return s === 'DONE' || s === 'COMPLETED' || s === 'VERIFIED';
    });
  }

  // Dashboard Header Actions
  submitDay(): void {
    if (!this.isAllTasksCompleted) return;
    if (!this.employee || !this.day) return;
    const dateStr = this.day.dateLabel && this.day.dateLabel.includes('-') ? this.day.dateLabel : new Date().toISOString().split('T')[0];
    
    if (this.employee.id && !this.employee.id.startsWith('emp-')) {
      this.service.submitEmployeeDayApi(this.employee.id, dateStr).subscribe({
        next: (res) => {
          if (this.day) this.day.status = 'COMPLETED';
        },
        error: () => {
          if (this.day) this.day.status = 'Counsellor Approved';
        }
      });
    } else {
      this.day.status = 'Counsellor Approved';
    }
  }

  formatRole(role?: string | null): string {
    if (!role) return '';
    const map: Record<string, string> = {
      BRANCH_PARTNER: 'Branch Partner',
      MANAGER: 'Manager',
      ADMIN: 'Admin'
    };
    return map[role] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Whole Day Approval (hasTaskIds: false) or Per-Task Approval (hasTaskIds: true)
  approveDayAction(taskIds?: Array<string | number>, comment?: string): void {
    if (!this.day || !this.day.canCurrentUserAct) return;
    const dayWorkspaceId = (this.day as any).rawDayWorkspaceId || this.day.id.replace('d-', '');

    this.service.approveDayApi(dayWorkspaceId, 'APPROVE', comment, taskIds).subscribe({
      next: (res) => {
        console.log(taskIds && taskIds.length > 0 ? 'Resubmitted tasks approved:' : 'Whole day approved:', res);
        this.loadDayDetailAndTasks();
      },
      error: (err) => {
        console.error('Error approving day/tasks:', err);
        const errorMsg = err?.error?.message || 'Action failed or permissions changed. Please refresh.';
        alert(errorMsg);
        this.loadDayDetailAndTasks();
      }
    });
  }

  sendBackDayAction(taskIds?: Array<string | number>, comment?: string): void {
    if (!this.day || !this.day.canCurrentUserAct) return;

    let targetTaskIds = taskIds;
    if (!targetTaskIds || targetTaskIds.length === 0) {
      if (this.day && this.day.tasks && this.day.tasks.length > 0) {
        targetTaskIds = this.day.tasks
          .map(t => typeof t.id === 'number' ? t.id : parseInt(String(t.id).replace(/\D/g, ''), 10))
          .filter(id => !isNaN(id));
      }
    }

    if (comment !== undefined && comment !== null && comment.trim() !== '') {
      this.executeSendBack(targetTaskIds, comment.trim());
      return;
    }

    const title = 'Send Back Day Submission';
    const description = 'Please provide a feedback reason for sending back tasks for rework.';

    const dialogRef = this.dialog.open(SendBackReasonDialogComponent, {
      width: '460px',
      data: {
        title,
        description,
        placeholder: 'Enter feedback reason...'
      }
    });

    dialogRef.afterClosed().subscribe(reason => {
      if (reason && typeof reason === 'string' && reason.trim()) {
        this.executeSendBack(targetTaskIds, reason.trim());
      }
    });
  }

  private executeSendBack(taskIds: Array<string | number> | undefined, comment: string): void {
    if (!this.day) return;
    const dayWorkspaceId = (this.day as any).rawDayWorkspaceId || this.day.id.replace('d-', '');

    this.service.approveDayApi(dayWorkspaceId, 'SEND_BACK', comment, taskIds).subscribe({
      next: (res) => {
        console.log(taskIds && taskIds.length > 0 ? 'Tasks sent back successfully:' : 'Whole day sent back successfully:', res);
        this.loadDayDetailAndTasks();
      },
      error: (err) => {
        console.error('Error sending back day/tasks:', err);
        const errorMsg = err?.error?.message || 'Action failed or permissions changed. Please refresh.';
        alert(errorMsg);
        this.loadDayDetailAndTasks();
      }
    });
  }

  markDayComplete(): void {
    if (!this.day) return;
    const dayWorkspaceId = this.day.id.replace('d-', '');
    if (dayWorkspaceId && !isNaN(Number(dayWorkspaceId))) {
      this.service.approveDayApi(dayWorkspaceId, 'APPROVE', 'Verified by Admin').subscribe({
        next: () => {
          if (this.day) this.day.status = 'ADMIN_VERIFIED';
        },
        error: () => {
          if (this.day) this.day.status = 'Verified';
        }
      });
    } else {
      this.day.status = 'Verified';
    }
  }

  // Calculation helpers
  get completedTasksCount(): number {
    if (!this.day || !this.day.tasks) return 0;
    return this.day.tasks.filter(t => 
      ['Completed', 'Counsellor Approved', 'Manager Review', 'Manager Feedback', 'Verified', 'Closed'].includes(t.status)
    ).length;
  }

  get totalTasksCount(): number {
    if (!this.day || !this.day.tasks) return 0;
    return this.day.tasks.length;
  }

  getProgressColor(percentage: number): string {
    if (percentage < 25) {
      return '#ef4444'; // Red
    } else if (percentage > 60) {
      return '#22c55e'; // Green
    } else {
      return '#f97316'; // Orange
    }
  }

  getInitials(name?: string, fallbackInitials?: string): string {
    if (fallbackInitials) return fallbackInitials;
    if (!name) return 'EE';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getAvatarBgColor(empId?: string): string {
    if (empId === 'emp-rohith') return '#22c55e';
    return '#3b82f6';
  }

  getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }
}
