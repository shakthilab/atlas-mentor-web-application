import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { BranchNode, RoleNode, EmployeeNode, YearNode, MonthNode, DayNode, TaskItem } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';

import { MatDialog } from '@angular/material/dialog';
import { SendBackReasonDialogComponent } from '../../components/send-back-reason-dialog/send-back-reason-dialog.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { TranslateService } from '@ngx-translate/core';

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
  isCurrentUserBranchPartner = false;
  myDaysList: any[] = [];
  selectedMyDayDate: string = '';

  // Non-approval user screen properties
  weekDaysList: WeeklyStripDay[] = [];
  selectedDateFormattedTitle = '';
  selectedWeekRangeLabel = '';
  selectedDateButtonLabel = '';
  userSubtitleMeta = '';
  private currentWeekCenterDate = new Date();

  // Calendar Dropdown Popover Properties
  isDatePickerOpen = false;
  pickerYear = new Date().getFullYear();
  pickerMonth = new Date().getMonth();
  pickerMonthLabel = '';
  calendarGridDays: CalendarDayCell[] = [];

  private subs = new Subscription();

  constructor(
    private service: TaskAccountabilityService,
    private authService: AuthService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private translate: TranslateService
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
    const monthLabelDate = new Date(this.pickerYear, this.pickerMonth, 1);
    const monthName = monthLabelDate.toLocaleDateString(this.translate.currentLang || 'en', { month: 'long' });
    this.pickerMonthLabel = `${monthName} ${this.pickerYear}`;

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
    const todayStr = this.getLocalDateString();
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
    const todayStr = this.getLocalDateString();
    this.selectedMyDayDate = todayStr;
    this.currentWeekCenterDate = new Date();
    this.pickerYear = this.currentWeekCenterDate.getFullYear();
    this.pickerMonth = this.currentWeekCenterDate.getMonth();

    const user = this.authService.currentUserValue;
    const userRole = user?.role || '';
    this.isIndividualContributor = !this.service.isAdminTreeRole(userRole);
    this.isCurrentUserBranchPartner = (userRole || '').toString().toUpperCase().trim() === 'BRANCH_PARTNER';

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
    this.subs.add(
      this.service.refreshRequested$.subscribe(() => {
        this.loadDayDetailAndTasks();
      })
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
    const activeDateStr = targetDateStr || this.selectedMyDayDate || this.getLocalDateString();
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
    const weekdayName = d.toLocaleDateString(this.translate.currentLang || 'en', { weekday: 'long' });
    const monthName = d.toLocaleDateString(this.translate.currentLang || 'en', { month: 'long' });
    this.selectedDateFormattedTitle = `${weekdayName}, ${monthName} ${d.getDate()}`;

    // Format Date Picker Button Label (e.g. "10 Aug 2026" or "11 Aug 2026")
    const monthShort = d.toLocaleDateString(this.translate.currentLang || 'en', { month: 'short' });
    this.selectedDateButtonLabel = `${d.getDate()} ${monthShort} ${d.getFullYear()}`;

    // Calculate Week Range (Monday to Sunday)
    const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon...
    const distToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(d);
    monday.setDate(d.getDate() + distToMon);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatShortMonth = (date: Date) => date.toLocaleDateString(this.translate.currentLang || 'en', { month: 'short' });
    this.selectedWeekRangeLabel = `${monday.getDate()} ${formatShortMonth(monday)} – ${sunday.getDate()} ${formatShortMonth(sunday)} ${sunday.getFullYear()}`;

    // Build 7-Day Strip
    const daysShortKeys = ['common.weekdaysShort.mon', 'common.weekdaysShort.tue', 'common.weekdaysShort.wed', 'common.weekdaysShort.thu', 'common.weekdaysShort.fri', 'common.weekdaysShort.sat', 'common.weekdaysShort.sun'];
    const daysShort = daysShortKeys.map(k => this.translate.instant(k).toUpperCase());
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
      let countText = this.translate.instant('taskAccountability.dashboard.noPlan');
      let hasDot = false;

      if (matchInApi) {
        const total = matchInApi.totalTasks ?? matchInApi.taskCount ?? (matchInApi.tasks ? matchInApi.tasks.length : 0);
        const done = matchInApi.completedTasks ?? matchInApi.doneCount ?? (matchInApi.tasks ? matchInApi.tasks.filter((t: any) => ['DONE', 'COMPLETED', 'VERIFIED'].includes(t.status?.toUpperCase())).length : 0);
        if (total > 0) {
          countText = this.translate.instant('taskAccountability.dashboard.doneOfTotalTasks', { done, total });
          hasDot = done > 0;
        } else {
          countText = this.translate.instant('taskAccountability.dashboard.noPlan');
          hasDot = false;
        }
      } else {
        if (cur.getDate() === 10) {
          countText = this.translate.instant('taskAccountability.dashboard.doneOfTotalTasks', { done: 1, total: 3 });
          hasDot = true;
        } else if (cur.getDate() === 11) {
          countText = this.translate.instant('taskAccountability.dashboard.doneOfTotalTasks', { done: 1, total: 4 });
          hasDot = true;
        } else {
          countText = this.translate.instant('taskAccountability.dashboard.noPlan');
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
        isToday: isoStr === this.getLocalDateString()
      });
    }

    const user = this.authService.currentUserValue;
    const name = this.employee?.name || user?.name || 'Sandhya D';
    const rawRole = (this.employee as any)?.roleName || this.employee?.role || user?.roleName || user?.role || 'Junior Counsellor';
    const role = this.authService.formatRoleName(rawRole);
    this.userSubtitleMeta = `${name} · ${role}`;
  }

  loadMyWorkspaceInitialData(): void {
    const todayStr = this.getLocalDateString();
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
          exactDateLabel = dt.toLocaleDateString(this.translate.currentLang || 'en', { month: 'short', day: 'numeric' });
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
            proofRequired: false,
            status: t.status || 'TODO',
            currentStep: t.currentStep || null,
            nextStep: t.nextStep || null,
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
            activities: [],
            reflectState: t.reflectState ?? null,
            reflectStage: t.reflectStage ?? null,
            reflectComment: t.reflectComment || t.comment || null,
            reflectFlaggedByName: t.reflectFlaggedByName || t.flaggedByName || null,
            // Overdue Task Rollover (V23) - carriedOver only ever comes back true when this
            // day is today (see EmployeeTreeService#getDayDetail); browsing a past day always
            // returns that day's own tasks only, so these fields are simply absent there.
            carriedOver: t.carriedOver === true,
            dueDate: t.dueDate || null,
            originalWorkDate: t.originalWorkDate || null,
            originalDayNumber: t.originalDayNumber ?? null,
            completedAt: t.completedAt || null
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
    // Submit Day's enablement must mirror the backend's own rule (DayWorkspaceService#submitDay
    // only ever evaluates findByDayWorkspaceId(workspace.getId()) - this day's own tasks).
    // Carried-over overdue tasks from earlier days are shown here for visibility only and must
    // never gate today's submission just because they're visually present on the same screen.
    const todaysOwnTasks = this.day.tasks.filter(t => !t.carriedOver);
    if (todaysOwnTasks.length === 0) {
      // Every visible task is carried-over (e.g. a rest day with no tasks of its own) - the
      // backend skips the completion check entirely for a day with zero own tasks.
      return true;
    }
    return todaysOwnTasks.every(t => {
      if (!t.status) return false;
      const s = t.status.toUpperCase().trim();
      return s === 'DONE' || s === 'COMPLETED' || s === 'VERIFIED';
    });
  }

  // Dashboard Header Actions
  submitDay(): void {
    if (!this.isAllTasksCompleted) return;
    if (!this.employee || !this.day) return;
    // Pre-existing bug (found during QA, unrelated to the optional-Branch-Partner change):
    // dateLabel is a display string like "Aug 14" and never contains a dash, so this always
    // fell through to today's date regardless of which day was actually selected. rawDate
    // (the real ISO date, already used everywhere else in this file - see loadDayDetailAndTasks)
    // is what should drive the submit target.
    const dateStr = (this.day as any).rawDate || (this.day.dateLabel && this.day.dateLabel.includes('-') ? this.day.dateLabel : this.getLocalDateString());

    if (this.employee.id && !this.employee.id.startsWith('emp-')) {
      this.service.submitEmployeeDayApi(this.employee.id, dateStr).subscribe({
        next: (res) => {
          this.loadDayDetailAndTasks();
        },
        error: (err) => {
          console.error('Error submitting day:', err);
          const errorMsg = err?.error?.message || 'Submission failed. Please try again.';
          alert(errorMsg);
          this.loadDayDetailAndTasks();
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

  /**
   * Tasks stuck at DONE/COMPLETED on a day whose approval pipeline has already fully closed
   * (ADMIN_VERIFIED). Backend's one-time verifyEligibleTasks sweep only runs the moment the
   * day itself reaches ADMIN_VERIFIED and skips whatever isn't DONE yet at that exact instant -
   * a task finished afterwards (e.g. resubmitted late, or simply completed after the fact)
   * is permanently stuck at DONE unless caught up individually
   * (DayApprovalService#approveResubmittedTasks now also handles this "late completion" case).
   */
  get strayDoneTasks(): TaskItem[] {
    if (!this.day || !this.day.tasks) return [];
    const stage = ((this.day as any).approvalStage || this.day.status || '').toString().toUpperCase().trim();
    if (stage !== 'ADMIN_VERIFIED') return [];
    return this.day.tasks.filter(t => {
      const s = (t.status || '').toString().toUpperCase().trim();
      return s === 'DONE' || s === 'COMPLETED';
    });
  }

  get strayDoneTaskIds(): Array<string | number> {
    return this.strayDoneTasks.map(t => t.id);
  }

  get isCurrentUserAdmin(): boolean {
    const user = this.authService.currentUserValue;
    return (user?.role || '').toString().toUpperCase().trim() === 'ADMIN';
  }

  /** Whether the header "Approve" button should offer the bulk late-completion catch-up instead of (or on top of) the normal whole-day approve. */
  get canCatchUpStrayTasks(): boolean {
    return this.isCurrentUserAdmin && this.strayDoneTasks.length > 0;
  }

  // Whole Day Approval (hasTaskIds: false) or Per-Task Approval (hasTaskIds: true)
  approveDayAction(taskIds?: Array<string | number>, comment?: string): void {
    if (!this.day) return;
    // Normal flow still requires canCurrentUserAct (the day itself awaiting this user's
    // review). The late-completion catch-up is the one exception: the day is already fully
    // approved (canCurrentUserAct is correctly false), but explicit taskIds were passed for
    // straggler tasks - the backend independently re-validates ADMIN-only + eligibility.
    const isCatchUp = !!taskIds && taskIds.length > 0;
    if (!this.day.canCurrentUserAct && !isCatchUp) return;
    const dayWorkspaceId = (this.day as any).rawDayWorkspaceId || this.day.id.replace('d-', '');

    this.service.approveDayApi(dayWorkspaceId, 'APPROVE', comment, taskIds).subscribe({
      next: (res) => {
        console.log(taskIds && taskIds.length > 0 ? 'Resubmitted tasks approved:' : 'Whole day approved:', res);
        this.loadDayDetailAndTasks();
      },
      error: (err) => this.handleApprovalActionError(err)
    });
  }

  sendBackDayAction(taskIds?: Array<string | number>, comment?: string): void {
    if (!this.day || !this.day.canCurrentUserAct) return;

    let targetTaskIds = taskIds;
    if (!targetTaskIds || targetTaskIds.length === 0) {
      if (this.day && this.day.tasks && this.day.tasks.length > 0) {
        // Backend's sendBackTasks now requires taskIds and validates every one of them
        // belongs to THIS day's own day_workspace (see DayApprovalService#sendBackTasks) -
        // a carried-over task's id belongs to an earlier day's workspace, so including it here
        // would 400 the whole bulk send-back. Carried-over tasks aren't part of this day's
        // submission anyway; only today's own tasks are eligible for this fallback.
        targetTaskIds = this.day.tasks
          .filter(t => !t.carriedOver)
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

        // approveDayApi's SEND_BACK already persists `comment` as a task comment for every
        // flagged task server-side (DayApprovalService#sendBackTasks) - the addTaskCommentApi
        // loop that used to run here duplicated it. loadDayDetailAndTasks() below picks up
        // what the backend already saved.
        this.loadDayDetailAndTasks();
      },
      error: (err) => this.handleApprovalActionError(err)
    });
  }

  /**
   * Approve/Send-back can 403 if the day moved past the stage this user could act on before
   * the request landed - most commonly a Branch Partner racing a Manager who acted first, or
   * a stale page. Surface a clear, specific message instead of a raw error and refresh so the
   * screen reflects the day's real current stage.
   */
  private handleApprovalActionError(err: any): void {
    console.error('Error on day approval action:', err);
    if (err?.status === 403) {
      const backendMsg = err?.error?.message;
      this.notificationService.showWarningToast(
        backendMsg || 'This day has already moved on to the next reviewer. Refreshing the latest status…',
        'Already Reviewed'
      );
    } else {
      const errorMsg = err?.error?.message || 'Action failed or permissions changed. Please refresh.';
      this.notificationService.showErrorToast(errorMsg, 'Action Failed');
    }
    this.loadDayDetailAndTasks();
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
    if (hour < 12) return this.translate.instant('common.timeOfDay.morning');
    if (hour < 17) return this.translate.instant('common.timeOfDay.afternoon');
    return this.translate.instant('common.timeOfDay.evening');
  }

  getLocalDateString(d: Date = new Date()): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
