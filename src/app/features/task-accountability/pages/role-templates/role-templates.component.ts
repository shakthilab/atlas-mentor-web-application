import { Component, OnInit } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { RoleTemplate, TemplateMonth, TemplateDay, TemplateQuestion, EmployeeNode, TemplateTask } from '../../interfaces/accountability.interface';
import { Observable, forkJoin, switchMap } from 'rxjs';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-role-templates',
  templateUrl: './role-templates.component.html',
  styleUrls: ['./role-templates.component.scss']
})
export class RoleTemplatesComponent implements OnInit {
  templates$: Observable<RoleTemplate[]>;
  showModal = false;
  showPublishModal = false;
  showDeleteConfirmModal = false;
  editingTemplate: RoleTemplate | null = null;
  publishingTemplate: RoleTemplate | null = null;
  templateToDelete: RoleTemplate | null = null;

  isPublishing = false;
  isSaving = false;
  publishingTemplateId: string | null = null;

  // Redesigned template days state
  selectedDayIndex = 0;
  selectedDaysForDuplication = new Set<number>();
  multiSelectMode = false;
  branchesList: any[] = [];
  isSidebarOpen = false;
  showAddForm = false;
  showDescField = false;
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskPriority = 'MEDIUM';
  newTaskProofRequired = false;
  editingTaskId: string | null = null;
  editingTaskTitle = '';
  editingTaskDescription = '';
  editingTaskPriority = 'MEDIUM';
  editingTaskProofRequired = false;
  get pastDayTooltip(): string {
    return this.t('taskAccountability.templates.cantAddPastDay');
  }
  toastMessage = '';
  showDuplicateDayModal = false;
  // Keyed by "month-year-dayNumber" rather than a same-month array index, so a selection can
  // span the currently-viewed month and any other month reachable via duplicateTargetMonthName.
  selectedTargetDaysForDuplication = new Set<string>();
  duplicateTargetMonthName = '';
  isDuplicatingDayBatch = false;
  // Non-empty while the target-day picker modal (shared with the whole-day duplicate flow) is
  // being used to duplicate one or more specific tasks instead of an entire day's task list.
  duplicateTasksContext: TemplateTask[] = [];
  isDuplicatingTaskBatch = false;
  isDuplicatingSingleTask = false;
  // Lets the user check off several tasks in the sidebar task list and duplicate all of them
  // to other days/months in one go, instead of repeating the single-task flow per task.
  // Checkboxes are always visible on each task row - no separate "select mode" toggle.
  selectedTaskIndexesForDuplication = new Set<number>();
  monthsList: string[] = (() => {
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const list: string[] = [];
    const date = new Date();
    let m = date.getMonth();
    let y = date.getFullYear();
    for (let i = 0; i < 12; i++) {
      list.push(`${names[m]} ${y}`);
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
    return list;
  })();

  // Task Drawer State
  selectedEditingTask: TemplateTask | null = null;
  selectedEditingTaskDay: TemplateDay | null = null;
  selectedEditingTaskMonthName = '';
  showTaskDrawer = false;
  newCommentText = '';
  newAttachmentName = '';

  taskResponseTypes = [
    { value: 'NUMERIC', label: 'Number', icon: 'hash' },
    { value: 'TEXT', label: 'Text', icon: 'align-left' },
    { value: 'COMMENT', label: 'Long Answer', icon: 'message-2' },
    { value: 'YES_NO', label: 'Yes / No', icon: 'toggle-left' },
    { value: 'FILE', label: 'Upload File', icon: 'upload' },
    { value: 'CHECKLIST', label: 'Checklist', icon: 'check' },
    { value: 'APPROVAL', label: 'Date', icon: 'calendar' },
    { value: 'DROPDOWN', label: 'Dropdown', icon: 'list' },
    { value: 'RATING', label: 'Multiple Choice', icon: 'list-check' }
  ];

  // Publish form options
  selectedEmployeeId = '';
  selectedYear = 2026;
  employeesList: Array<{ id: string; name: string; role: string; branchId: string }> = [];

  availableRoles: string[] = [];
  rolesApiList: any[] = [];

  taskTypes = [
    { value: 'CHECKLIST', label: 'Checklist' },
    { value: 'NUMERIC', label: 'Numeric' },
    { value: 'TEXT', label: 'Text' },
    { value: 'FILE', label: 'File Upload' },
    { value: 'DROPDOWN', label: 'Dropdown' },
    { value: 'RATING', label: 'Rating' },
    { value: 'YES_NO', label: 'Yes/No' },
    { value: 'APPROVAL', label: 'Approval/Review' }
  ];

  priorities = ['LOW', 'MEDIUM', 'HIGH'];

  constructor(
    private service: TaskAccountabilityService,
    private masterDataService: MasterDataService,
    private translate: TranslateService
  ) {
    this.templates$ = this.service.templates$;
  }

  private t(key: string, params?: object): string {
    return this.translate.instant(key, params);
  }

  getTemplateStatusLabel(temp: RoleTemplate): string {
    const status = ((temp as any).status || (temp.active ? 'ACTIVE' : 'DRAFT')).toUpperCase();
    if (status === 'ACTIVE') return this.t('common.active');
    if (status === 'DRAFT') return this.t('taskAccountability.templates.draft');
    if (status === 'INACTIVE') return this.t('common.inactive');
    return status;
  }

  ngOnInit(): void {
    // Retrieve list of all employees to populate publish assignment dropdown
    this.service.branches$.subscribe(branches => {
      const emps: Array<{ id: string; name: string; role: string; branchId: string }> = [];
      branches.forEach(b => {
        b.roles.forEach(r => {
          r.employees.forEach(e => {
            if (!emps.find(x => x.id === e.id)) {
              emps.push({
                id: e.id,
                name: e.name,
                role: e.role,
                branchId: b.id
              });
            }
          });
        });
      });
      this.employeesList = emps;
    });

    // Fetch role templates from API
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.service.getRoleTemplatesApi().subscribe();
  }

  loadDropdownData(): void {
    // Load available roles from Master Data API
    this.masterDataService.getRoles().subscribe(res => {
      if (res && res.success && res.data) {
        this.rolesApiList = res.data;
        this.availableRoles = res.data.map(r => r.name);
      }
    });

    // Load branches from Master Data API
    this.masterDataService.getBranches().subscribe(res => {
      if (res && res.success && res.data) {
        this.branchesList = res.data;
      }
    });
  }

  openNewTemplateModal(): void {
    this.loadDropdownData();
    this.selectedDayIndex = 0;
    this.selectedDaysForDuplication.clear();
    this.multiSelectMode = false;
    this.isSidebarOpen = false;

    const currentMonthName = this.monthsList[0];

    this.editingTemplate = {
      id: '',
      name: '',
      role: '',
      branch: 'All Branches',
      branchId: null,
      branchName: null,
      status: 'DRAFT',
      active: false,
      createdAt: new Date().toISOString().split('T')[0],
      months: [
        {
          id: `tm-${Date.now()}-1`,
          name: currentMonthName,
          days: []
        }
      ],
      tasks: [],
      rawDays: []
    };

    this.adjustDaysForMonth(currentMonthName);
    this.showModal = true;
  }

  openEditTemplateModal(template: RoleTemplate): void {
    this.loadDropdownData();
    this.selectedDayIndex = 0;
    this.selectedDaysForDuplication.clear();
    this.multiSelectMode = false;
    this.isSidebarOpen = false;

    // Deep clone to avoid mutating directly
    const clone = JSON.parse(JSON.stringify(template));

    // Ensure template has default branch
    if (!clone.branch) {
      clone.branch = 'All Branches';
    }

    const currentMonthName = this.monthsList[0];

    // Ensure hierarchical properties exist
    if (!clone.months || clone.months.length === 0) {
      // Migrate legacy tasks
      clone.months = [
        {
          id: `tm-${Date.now()}-1`,
          name: currentMonthName,
          days: [
            {
              id: `td-${Date.now()}-1`,
              name: 'Day 1',
              isWeekly: false,
              tasks: clone.tasks || []
            }
          ]
        }
      ];
    }

    if (!clone.rawDays) {
      clone.rawDays = [];
    }

    this.editingTemplate = clone;
    if (clone.months && clone.months[0]) {
      this.adjustDaysForMonth(clone.months[0].name);
    }
    this.showModal = true;
  }

  getMonthAbbreviation(): string {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return '';
    const name = this.editingTemplate.months[0].name || '';
    const firstWord = name.split(' ')[0] || '';
    return firstWord.substring(0, 3).toUpperCase();
  }

  isSaturday(dayIdx: number): boolean {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return false;
    const val = this.editingTemplate.months[0].name || '';
    const parts = val.split(' ');
    const monthName = parts[0];
    const year = parts[1] ? parseInt(parts[1], 10) : new Date().getFullYear();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = months.indexOf(monthName);
    if (monthIndex === -1) return false;
    const date = new Date(year, monthIndex, dayIdx + 1);
    return date.getDay() === 6; // 6 is Saturday
  }

  getMonthStartOffset(): number {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return 0;
    const val = this.editingTemplate.months[0].name || '';
    const parts = val.split(' ');
    const monthName = parts[0];
    const year = parts[1] ? parseInt(parts[1], 10) : new Date().getFullYear();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = months.indexOf(monthName);
    if (monthIndex === -1) return 0;
    const date = new Date(year, monthIndex, 1);
    return date.getDay();
  }

  getStartOffsetArray(): number[] {
    const offset = this.getMonthStartOffset();
    return Array(offset).fill(0);
  }

  get roleOptions(): Array<{ label: string; value: string }> {
    if (!this.rolesApiList) return [];
    return this.rolesApiList
      .filter((r: any) => r.name.toUpperCase() !== 'ADMIN')
      .map((r: any) => ({
        label: r.displayName || r.name,
        value: r.name
      }));
  }

  get branchOptions(): Array<{ label: string; value: string }> {
    const opts = [{ label: 'All Branches', value: 'All Branches' }];
    if (this.branchesList) {
      this.branchesList.forEach(b => {
        opts.push({ label: b.name, value: b.name });
      });
    }
    return opts;
  }

  get selectedMonthName(): string {
    if (this.editingTemplate && this.editingTemplate.months && this.editingTemplate.months.length > 0) {
      return this.editingTemplate.months[0].name;
    }
    return '';
  }

  set selectedMonthName(val: string) {
    if (this.editingTemplate && this.editingTemplate.months && this.editingTemplate.months.length > 0) {
      this.editingTemplate.months[0].name = val;
      this.adjustDaysForMonth(val);
    }
  }

  adjustDaysForMonth(monthNameWithYear: string): void {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return;
    this.editingTemplate.months[0].name = monthNameWithYear;
    this.editingTemplate.months[0].days = this.resolveDaysForMonth(this.editingTemplate.rawDays || [], monthNameWithYear);
  }

  /**
   * Builds the day list for one calendar month from the template's raw backend days
   * (which can include several rows sharing a dayNumber - one recurring, others scoped to
   * a specific month). For each day 1..N of the target month: an exact (dayNumber, month,
   * year) match wins; otherwise the recurring (month/year both null) row is used as the
   * baseline; otherwise it's a brand-new, not-yet-saved day. This is what keeps e.g.
   * August's Day 22 and September's Day 22 independent once either has been edited.
   *
   * @param forceScoped When true, every returned day is stamped with the viewed month/year
   *   regardless of whether its tasks actually came from a scoped or a recurring row. Used
   *   for the "duplicate to" target-day picker: duplicating into a day always creates
   *   month-specific content for that target, even if it currently only shows the shared
   *   recurring baseline - it must never silently extend the recurring row itself.
   */
  private resolveDaysForMonth(rawDays: any[], monthNameWithYear: string, forceScoped: boolean = false): TemplateDay[] {
    const parts = monthNameWithYear.split(' ');
    const monthName = parts[0];
    const year = parts[1] ? parseInt(parts[1], 10) : new Date().getFullYear();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthNumber = months.indexOf(monthName) + 1; // 1-12
    const daysInMonth = this.getDaysInMonth(monthName, year);

    const days: TemplateDay[] = [];
    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
      const scoped = rawDays.find(d => d.dayNumber === dayNumber && d.month === monthNumber && d.year === year);
      const recurring = rawDays.find(d => d.dayNumber === dayNumber && (d.month === null || d.month === undefined) && (d.year === null || d.year === undefined));
      const source = scoped || recurring;

      const tasks: TemplateTask[] = (source?.tasks || []).map((t: any) => ({
        id: t.id.toString(),
        name: t.title,
        description: t.description || '',
        type: 'CHECKLIST',
        priority: t.priority ? t.priority : 'MEDIUM',
        proofRequired: false,
        required: true,
        active: true
      }));

      days.push({
        id: source ? `td-${source.id}` : `td-new-${monthNumber}-${year}-${dayNumber}`,
        name: source?.isWeeklyCheckpoint ? 'Weekly Accountability' : `Day ${dayNumber}`,
        isWeekly: source?.isWeeklyCheckpoint || false,
        dayNumber,
        // A brand-new (never-saved) day defaults to being scoped to the month currently
        // being viewed, so anything added to it saves as month-specific, not recurring.
        month: forceScoped ? monthNumber : (scoped ? scoped.month : (recurring ? null : monthNumber)),
        year: forceScoped ? year : (scoped ? scoped.year : (recurring ? null : year)),
        tasks
      });
    }
    return days;
  }

  /**
   * Re-fetches the template after a task/day mutation and rebuilds the currently-viewed
   * month's day list from the fresh `rawDays`, instead of blindly overwriting
   * `editingTemplate.months` with whatever single month the server response defaulted to.
   */
  private refreshEditingTemplateDaysFromServer(templateId: string | number): void {
    this.service.getRoleTemplateByIdApi(templateId).subscribe(updatedTemplate => {
      if (updatedTemplate && this.editingTemplate) {
        const currentMonthName = this.editingTemplate.months?.[0]?.name || this.monthsList[0];
        this.editingTemplate.rawDays = updatedTemplate.rawDays || [];
        this.adjustDaysForMonth(currentMonthName);
      }
    });
  }

  populateDemoTasksForSeniorCounsellor(template: RoleTemplate | null): void {
    // Disabled dummy tasks injection
    return;
  }

  getDaysInMonth(monthName: string, year: number): number {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = months.indexOf(monthName);
    if (monthIndex === -1) return 30; // fallback
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTemplate = null;
    this.isSidebarOpen = false;
  }

  // Publish Handlers
  openPublishModal(template: RoleTemplate): void {
    this.publishingTemplate = template;
    this.selectedEmployeeId = '';
    this.selectedYear = 2026;
    this.showPublishModal = true;
  }

  closePublishModal(): void {
    this.showPublishModal = false;
    this.publishingTemplate = null;
  }

  publishTemplate(): void {
    if (!this.publishingTemplate || !this.selectedEmployeeId) return;

    const emp = this.employeesList.find(e => e.id === this.selectedEmployeeId);
    if (!emp) return;

    // Use the first month configured in template.months as the target monthName, or fallback to 'July'
    const monthName = (this.publishingTemplate.months && this.publishingTemplate.months.length > 0)
      ? this.publishingTemplate.months[0].name
      : 'July';

    this.service.publishTemplate(
      this.publishingTemplate.id,
      this.publishingTemplate.role,
      emp.branchId,
      [emp.id],
      monthName,
      this.selectedYear
    );

    this.closePublishModal();
    alert(this.t('taskAccountability.templates.toast.publishedToWorkspace'));
  }

  // Month actions
  addMonth(): void {
    if (this.editingTemplate) {
      if (!this.editingTemplate.months) {
        this.editingTemplate.months = [];
      }
      this.editingTemplate.months.push({
        id: `tm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: `Month ${this.editingTemplate.months.length + 1}`,
        days: []
      });
    }
  }

  removeMonth(mIndex: number): void {
    if (this.editingTemplate && this.editingTemplate.months) {
      this.editingTemplate.months.splice(mIndex, 1);
    }
  }

  // Day actions
  addDay(month: TemplateMonth): void {
    month.days.push({
      id: `td-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `Day ${month.days.length + 1}`,
      isWeekly: false,
      tasks: []
    });
  }

  removeDay(month: TemplateMonth, dIndex: number): void {
    month.days.splice(dIndex, 1);
  }

  // Task actions
  addTaskToDay(day: TemplateDay, month: TemplateMonth): void {
    const newTask: TemplateTask = {
      id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: 'New Task',
      description: '',
      type: 'CHECKLIST',
      priority: 'MEDIUM',
      required: true,
      active: true,
      comments: [],
      attachments: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          text: 'Task created',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      status: 'Active',
      dueTime: '6:00 PM',
      employeeInstructions: '',
      expectedOutput: ''
    };
    day.tasks.push(newTask);
  }

  removeTaskFromDay(day: TemplateDay, tIndex: number): void {
    if (!day || tIndex < 0 || tIndex >= day.tasks.length) return;
    const deletedTask = day.tasks[tIndex];

    if (this.selectedEditingTask && this.selectedEditingTask.id === deletedTask.id) {
      this.closeTaskDrawer();
    }

    const templateId = this.editingTemplate?.id;
    const dayNumber = this.selectedDayIndex + 1;

    // Immediately remove locally for responsive UI update
    day.tasks.splice(tIndex, 1);

    if (templateId && templateId !== '' && !templateId.startsWith('temp-') && deletedTask && deletedTask.id && !deletedTask.id.startsWith('t-')) {
      this.service.deleteTaskApi(templateId, dayNumber, deletedTask.id).subscribe({
        next: () => {
          this.showToast(this.t('taskAccountability.templates.toast.taskDeleted'));
          // Call GET API to update UI with latest server state
          this.refreshEditingTemplateDaysFromServer(templateId);
          this.service.getRoleTemplatesApi().subscribe();
        },
        error: (err) => {
          console.error('Failed to delete task via API:', err);
          this.showToast(this.t('taskAccountability.templates.toast.taskDeleteFailed'));
        }
      });
    } else {
      this.showToast(this.t('taskAccountability.templates.toast.taskDeleted'));
    }
  }

  openTaskDrawer(task: TemplateTask, day: TemplateDay, monthName: string): void {
    this.selectedEditingTask = task;
    this.selectedEditingTaskDay = day;
    this.selectedEditingTaskMonthName = monthName;

    // Initialize properties if they don't exist
    if (!task.comments) task.comments = [];
    if (!task.attachments) task.attachments = [];
    if (!task.activities) {
      task.activities = [
        {
          id: `act-${Date.now()}`,
          text: 'Task created',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    }
    if (!task.status) task.status = task.active ? 'Active' : 'Inactive';
    if (!task.dueTime) task.dueTime = '6:00 PM';
    if (!task.employeeInstructions) task.employeeInstructions = '';
    if (!task.expectedOutput) task.expectedOutput = '';

    this.newCommentText = '';
    this.newAttachmentName = '';
    this.showTaskDrawer = true;
  }

  closeTaskDrawer(): void {
    this.showTaskDrawer = false;
    this.selectedEditingTask = null;
    this.selectedEditingTaskDay = null;
  }

  getTaskTypeLabel(value: string): string {
    const found = this.taskResponseTypes.find(t => t.value === value);
    return found ? found.label : value;
  }

  getTaskIconName(value: string): string {
    const found = this.taskResponseTypes.find(t => t.value === value);
    return found ? found.icon : 'check';
  }

  getWorkflowStepsForRole(role: string): string[] {
    const cleanRole = role ? role.trim() : '';
    switch (cleanRole) {
      case 'Senior Counsellor':
        return ['Employee', 'Manager', 'Admin'];
      case 'Junior Counsellor':
        return ['Employee', 'Senior Counsellor', 'Manager', 'Admin'];
      case 'Manager':
      case 'Branch Partner':
      case 'Administrative Assistant':
        return ['Employee', 'Admin'];
      default:
        return ['Employee', 'Admin'];
    }
  }

  addCommentToTask(): void {
    if (!this.selectedEditingTask || !this.newCommentText.trim()) return;
    const comment = {
      id: `c-${Date.now()}`,
      authorName: 'Admin User',
      authorRole: 'Administrator',
      text: this.newCommentText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.selectedEditingTask.comments = this.selectedEditingTask.comments || [];
    this.selectedEditingTask.comments.push(comment);

    this.selectedEditingTask.activities = this.selectedEditingTask.activities || [];
    this.selectedEditingTask.activities.push({
      id: `act-${Date.now()}`,
      text: `Added comment: "${comment.text.substring(0, 20)}..."`,
      timestamp: comment.timestamp
    });

    this.newCommentText = '';
  }

  addAttachmentToTask(): void {
    if (!this.selectedEditingTask || !this.newAttachmentName.trim()) return;
    const attachment = {
      id: `att-${Date.now()}`,
      name: this.newAttachmentName.trim(),
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`
    };
    this.selectedEditingTask.attachments = this.selectedEditingTask.attachments || [];
    this.selectedEditingTask.attachments.push(attachment);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.selectedEditingTask.activities = this.selectedEditingTask.activities || [];
    this.selectedEditingTask.activities.push({
      id: `act-${Date.now()}`,
      text: `Uploaded attachment: ${attachment.name}`,
      timestamp: now
    });

    this.newAttachmentName = '';
  }

  removeAttachmentFromTask(index: number): void {
    if (!this.selectedEditingTask || !this.selectedEditingTask.attachments) return;
    const name = this.selectedEditingTask.attachments[index].name;
    this.selectedEditingTask.attachments.splice(index, 1);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.selectedEditingTask.activities = this.selectedEditingTask.activities || [];
    this.selectedEditingTask.activities.push({
      id: `act-${Date.now()}`,
      text: `Removed attachment: ${name}`,
      timestamp: now
    });
  }

  updateTaskPriority(p: any): void {
    if (!this.selectedEditingTask) return;
    const old = this.selectedEditingTask.priority;
    if (old === p) return;
    this.selectedEditingTask.priority = p;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.selectedEditingTask.activities = this.selectedEditingTask.activities || [];
    this.selectedEditingTask.activities.push({
      id: `act-${Date.now()}`,
      text: `Priority updated from ${old} to ${p}`,
      timestamp: now
    });
  }

  updateTaskRequired(req: boolean): void {
    if (!this.selectedEditingTask) return;
    this.selectedEditingTask.required = req;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.selectedEditingTask.activities = this.selectedEditingTask.activities || [];
    this.selectedEditingTask.activities.push({
      id: `act-${Date.now()}`,
      text: `Required setting changed to ${req ? 'Required' : 'Optional'}`,
      timestamp: now
    });
  }

  updateTaskStatus(status: string): void {
    if (!this.selectedEditingTask) return;
    const old = this.selectedEditingTask.status || 'Active';
    if (old === status) return;
    this.selectedEditingTask.status = status;
    this.selectedEditingTask.active = (status === 'Active');

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.selectedEditingTask.activities = this.selectedEditingTask.activities || [];
    this.selectedEditingTask.activities.push({
      id: `act-${Date.now()}`,
      text: `Status updated from ${old} to ${status}`,
      timestamp: now
    });
  }

  updateTaskResponseType(type: any): void {
    if (!this.selectedEditingTask) return;
    const old = this.selectedEditingTask.type;
    if (old === type) return;
    this.selectedEditingTask.type = type;

    // Reset target value if type changes to non-numeric
    if (type !== 'NUMERIC') {
      delete this.selectedEditingTask.targetValue;
    } else {
      this.selectedEditingTask.targetValue = '100';
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.selectedEditingTask.activities = this.selectedEditingTask.activities || [];
    this.selectedEditingTask.activities.push({
      id: `act-${Date.now()}`,
      text: `Employee Response type updated from ${this.getTaskTypeLabel(old)} to ${this.getTaskTypeLabel(type)}`,
      timestamp: now
    });
  }

  // Reordering helpers
  moveMonth(mIndex: number, direction: 'up' | 'down'): void {
    if (!this.editingTemplate || !this.editingTemplate.months) return;
    const months = this.editingTemplate.months;
    const targetIndex = direction === 'up' ? mIndex - 1 : mIndex + 1;
    if (targetIndex >= 0 && targetIndex < months.length) {
      const temp = months[mIndex];
      months[mIndex] = months[targetIndex];
      months[targetIndex] = temp;
    }
  }

  moveDay(month: TemplateMonth, dIndex: number, direction: 'up' | 'down'): void {
    const days = month.days;
    const targetIndex = direction === 'up' ? dIndex - 1 : dIndex + 1;
    if (targetIndex >= 0 && targetIndex < days.length) {
      const temp = days[dIndex];
      days[dIndex] = days[targetIndex];
      days[targetIndex] = temp;
    }
  }

  moveTask(day: TemplateDay, tIndex: number, direction: 'up' | 'down'): void {
    const tasks = day.tasks;
    const targetIndex = direction === 'up' ? tIndex - 1 : tIndex + 1;
    if (targetIndex >= 0 && targetIndex < tasks.length) {
      const temp = tasks[tIndex];
      tasks[tIndex] = tasks[targetIndex];
      tasks[targetIndex] = temp;
    }
  }

  // Grid config & summary helpers
  getConfiguredDaysCount(): number {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return 0;
    return this.editingTemplate.months[0].days.filter(d => d.tasks && d.tasks.length > 0).length;
  }

  getDaysCount(): number {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return 0;
    return this.editingTemplate.months[0].days.length;
  }

  getTotalTasksCount(): number {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return 0;
    return this.editingTemplate.months[0].days.reduce((acc, d) => acc + (d.tasks ? d.tasks.length : 0), 0);
  }

  getDaysList(): TemplateDay[] {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return [];
    return this.editingTemplate.months[0].days;
  }

  getSelectedDay(): TemplateDay | null {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return null;
    const days = this.editingTemplate.months[0].days;
    if (this.selectedDayIndex >= 0 && this.selectedDayIndex < days.length) {
      return days[this.selectedDayIndex];
    }
    return null;
  }

  isTemplateUnsaved(): boolean {
    const id = this.editingTemplate?.id;
    return !id || id === '' || id.startsWith('temp-');
  }

  isPastDay(idx: number): boolean {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) {
      return false;
    }
    const monthStr = this.editingTemplate.months[0].name;
    if (!monthStr) return false;

    const parts = monthStr.trim().split(' ');
    if (parts.length < 2) return false;

    const monthName = parts[0];
    const year = parseInt(parts[1], 10);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = monthNames.indexOf(monthName);
    if (monthIndex === -1 || isNaN(year)) return false;

    return this.isPastDateForMonthYear(idx + 1, monthIndex + 1, year);
  }

  /** month is 1-12. Generalized so any (day, month, year) can be checked against today - not just a day within the template's single currently-open month. */
  private isPastDateForMonthYear(dayNumber: number, month: number, year: number): boolean {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    if (year < currentYear) return true;
    if (year > currentYear) return false;
    if (month < currentMonth) return true;
    if (month > currentMonth) return false;
    return dayNumber < currentDay;
  }

  toggleMultiSelectMode(): void {
    this.multiSelectMode = !this.multiSelectMode;
    this.selectedDaysForDuplication.clear();
  }

  addTemplateDays(count: number): void {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return;
    const days = this.editingTemplate.months[0].days;
    const startNum = days.length + 1;
    for (let i = 0; i < count; i++) {
      days.push({
        id: `td-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: `Day ${startNum + i}`,
        isWeekly: false,
        tasks: []
      });
    }
  }

  removeTemplateDay(idx: number, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return;
    const days = this.editingTemplate.months[0].days;
    const templateId = this.editingTemplate.id;
    const isSaved = templateId && templateId !== '' && !templateId.startsWith('temp-');

    if (isSaved) {
      if (idx >= 0 && idx < days.length) {
        const day = days[idx];
        this.service.deleteDayTasksApi(templateId, day.dayNumber || (idx + 1), day.month, day.year).subscribe({
          next: () => {
            this.showToast(this.t('taskAccountability.templates.toast.tasksDeleted', { defaultValue: 'Tasks cleared successfully' }));
            this.refreshEditingTemplateDaysFromServer(templateId);
            this.service.getRoleTemplatesApi().subscribe();
          },
          error: (err) => {
            console.error('Failed to delete day tasks via API:', err);
            this.refreshEditingTemplateDaysFromServer(templateId);
          }
        });
      }
    } else {
      if (idx >= 0 && idx < days.length) {
        days[idx].tasks = [];
      }
      this.showToast(this.t('taskAccountability.templates.toast.tasksDeleted', { defaultValue: 'Tasks cleared successfully' }));
    }

    this.selectedDaysForDuplication.delete(idx);
  }

  onDayCardClick(idx: number, event: MouseEvent): void {
    if (this.isPastDay(idx)) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    if (event.shiftKey || this.multiSelectMode) {
      this.multiSelectMode = true;
      if (this.selectedDaysForDuplication.has(idx)) {
        this.selectedDaysForDuplication.delete(idx);
      } else {
        this.selectedDaysForDuplication.add(idx);
      }
    } else {
      this.selectedDayIndex = idx;
      this.isSidebarOpen = true;
      this.showAddForm = false;
      this.showDescField = false;
      this.newTaskTitle = '';
      this.newTaskDescription = '';
      this.newTaskPriority = 'MEDIUM';
      this.selectedTaskIndexesForDuplication.clear();
    }
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
    this.selectedTaskIndexesForDuplication.clear();
  }

  isTaskSelected(tIdx: number): boolean {
    return this.selectedTaskIndexesForDuplication.has(tIdx);
  }

  toggleTaskSelection(tIdx: number): void {
    if (this.selectedTaskIndexesForDuplication.has(tIdx)) {
      this.selectedTaskIndexesForDuplication.delete(tIdx);
    } else {
      this.selectedTaskIndexesForDuplication.add(tIdx);
    }
  }

  toggleAddForm(show: boolean): void {
    if (show && this.isPastDay(this.selectedDayIndex)) {
      return;
    }
    this.showAddForm = show;
    if (show) {
      this.newTaskTitle = '';
      this.newTaskPriority = 'MEDIUM';
      this.newTaskDescription = '';
      this.showDescField = false;
      setTimeout(() => {
        const bodyEl = document.querySelector('.modal-sidebar-panel .sidebar-body');
        if (bodyEl) {
          bodyEl.scrollTo({ top: bodyEl.scrollHeight, behavior: 'smooth' });
        }
      }, 50);
    }
  }

  quickAddTask(day: TemplateDay): void {
    if (!this.newTaskTitle.trim()) return;

    if (this.isPastDay(this.selectedDayIndex)) {
      return;
    }

    const title = this.newTaskTitle.trim();
    const description = this.newTaskDescription.trim();
    const priority = this.newTaskPriority || 'MEDIUM';
    const proofRequired = false;
    const dayNumber = this.selectedDayIndex + 1;
    const taskPayload = { title, description, priority, proofRequired };

    const executeAddTaskApi = (tempId: string | number) => {
      this.service.addTaskApi(tempId, dayNumber, taskPayload, day.month, day.year).subscribe({
        next: () => {
          this.showToast(this.t('taskAccountability.templates.toast.taskAdded'));
          // Call GET API to update UI with latest server data
          this.refreshEditingTemplateDaysFromServer(tempId);
          this.service.getRoleTemplatesApi().subscribe();
        },
        error: (err) => {
          console.error('Task API call failed:', err);
          // Fallback to local state if backend endpoint fails
          const newTask: TemplateTask = {
            id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: title,
            description,
            type: 'CHECKLIST',
            priority: priority as any,
            required: true,
            proofRequired: false,
            active: true,
            comments: [],
            attachments: [],
            activities: [{ id: `act-${Date.now()}`, text: 'Task created', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
            status: 'Active',
            dueTime: '6:00 PM',
            employeeInstructions: '',
            expectedOutput: ''
          };
          day.tasks.push(newTask);
          this.showToast(this.t('taskAccountability.templates.toast.taskAddedLocally'));
        }
      });
    };

    const templateId = this.editingTemplate?.id;

    if (templateId && templateId !== '' && !templateId.startsWith('temp-')) {
      // Template already exists in backend DB
      executeAddTaskApi(templateId);
    } else if (this.editingTemplate && this.editingTemplate.name && this.editingTemplate.name.trim()) {
      // Template is new/unsaved, but has a name. Create template in DB first!
      const selectedRole = this.rolesApiList.find(r => r.name === this.editingTemplate?.role);
      const selectedBranch = this.branchesList.find(b => b.name === this.editingTemplate?.branch);

      const createPayload = {
        name: this.editingTemplate.name.trim(),
        description: this.editingTemplate.name.trim(),
        roleId: selectedRole ? selectedRole.id : (this.editingTemplate?.roleId != null ? Number(this.editingTemplate.roleId) : null),
        branchId: selectedBranch ? selectedBranch.id : (this.editingTemplate?.branchId != null ? Number(this.editingTemplate.branchId) : null),
        days: []
      };

      this.service.createRoleTemplateApi(createPayload).subscribe({
        next: (res) => {
          const realId = res?.data?.id ? res.data.id.toString() : null;
          if (realId && this.editingTemplate) {
            this.editingTemplate.id = realId;
            executeAddTaskApi(realId);
          } else {
            // Fallback to local state
            const newTask: TemplateTask = {
              id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: title,
              description,
              type: 'CHECKLIST',
              priority: priority as any,
              required: true,
              proofRequired,
              active: true,
              comments: [],
              attachments: [],
              activities: [{ id: `act-${Date.now()}`, text: 'Task created', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
              status: 'Active',
              dueTime: '6:00 PM',
              employeeInstructions: '',
              expectedOutput: ''
            };
            day.tasks.push(newTask);
          }
        },
        error: (err) => {
          console.error('Failed to create template before adding task:', err);
          // Fallback to local state
          const newTask: TemplateTask = {
            id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: title,
            description,
            type: 'CHECKLIST',
            priority: priority as any,
            required: true,
            proofRequired,
            active: true,
            comments: [],
            attachments: [],
            activities: [{ id: `act-${Date.now()}`, text: 'Task created', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
            status: 'Active',
            dueTime: '6:00 PM',
            employeeInstructions: '',
            expectedOutput: ''
          };
          day.tasks.push(newTask);
        }
      });
    } else {
      // Template has no name specified yet
      this.showToast(this.t('taskAccountability.templates.toast.enterNameFirst'));
      const newTask: TemplateTask = {
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: title,
        description,
        type: 'CHECKLIST',
        priority: priority as any,
        required: true,
        proofRequired,
        active: true,
        comments: [],
        attachments: [],
        activities: [{ id: `act-${Date.now()}`, text: 'Task created', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
        status: 'Active',
        dueTime: '6:00 PM',
        employeeInstructions: '',
        expectedOutput: ''
      };
      day.tasks.push(newTask);
    }

    // Clear fields but keep form open for subsequent entries
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskProofRequired = false;
    this.showDescField = false;
  }

  openDuplicateDayModal(): void {
    const day = this.getSelectedDay();
    if (!day || day.tasks.length === 0) {
      this.showToast(this.t('taskAccountability.templates.toast.noTasksToDuplicateDay'));
      return;
    }
    this.selectedTargetDaysForDuplication.clear();
    this.isDuplicatingDayBatch = false;
    // Default the target-month picker to whichever month is currently open, so same-month
    // duplication (the common case) needs no extra step.
    this.duplicateTargetMonthName = this.selectedMonthName;
    this.showDuplicateDayModal = true;
  }

  openBulkDuplicateDaysModal(): void {
    if (this.selectedDaysForDuplication.size === 0) return;
    this.selectedTargetDaysForDuplication.clear();
    this.isDuplicatingDayBatch = false;
    this.duplicateTargetMonthName = this.selectedMonthName;
    this.showDuplicateDayModal = true;
  }

  closeDuplicateDayModal(): void {
    this.showDuplicateDayModal = false;
    this.selectedTargetDaysForDuplication.clear();
    this.duplicateTasksContext = [];
  }

  /**
   * Opens the same target-day picker modal as openDuplicateDayModal(), but scoped to one or
   * more specific tasks rather than the whole day - getDuplicateTargetDaysList()/
   * toggleTargetDaySelection()/etc. are all reused as-is since they only care about the
   * target month/day, not what's being copied onto it.
   */
  openDuplicateTasksModal(tasks: TemplateTask[]): void {
    if (this.isPastDay(this.selectedDayIndex) || tasks.length === 0) return;
    this.duplicateTasksContext = tasks;
    this.selectedTargetDaysForDuplication.clear();
    this.isDuplicatingTaskBatch = false;
    this.duplicateTargetMonthName = this.selectedMonthName;
    this.showDuplicateDayModal = true;
  }

  // Used by the "Duplicate N tasks" button once the user has checked off tasks in the
  // sidebar list (one checked task is a valid case too - the modal just shows a singular title).
  openDuplicateSelectedTasksModal(): void {
    const day = this.getSelectedDay();
    if (!day || this.selectedTaskIndexesForDuplication.size === 0) return;
    const tasks = Array.from(this.selectedTaskIndexesForDuplication)
      .sort((a, b) => a - b)
      .map(idx => day.tasks[idx])
      .filter((t): t is TemplateTask => !!t);
    this.selectedTaskIndexesForDuplication.clear();
    this.openDuplicateTasksModal(tasks);
  }

  /**
   * Target days for the currently-browsed month in the duplicate dialog's picker. Unlike
   * the main calendar's getDaysList(), every day here is forced month-scoped (see
   * resolveDaysForMonth's forceScoped) since duplicating always writes month-specific
   * content for whichever day is picked.
   */
  getDuplicateTargetDaysList(): TemplateDay[] {
    if (!this.editingTemplate) return [];
    return this.resolveDaysForMonth(this.editingTemplate.rawDays || [], this.duplicateTargetMonthName, true);
  }

  duplicateTargetKey(day: TemplateDay): string {
    return `${day.month}-${day.year}-${day.dayNumber}`;
  }

  isDuplicateTargetSelf(day: TemplateDay): boolean {
    if (day.dayNumber == null) return false;
    if (this.multiSelectMode) {
      return this.duplicateTargetMonthName === this.selectedMonthName && this.selectedDaysForDuplication.has(day.dayNumber - 1);
    }
    return this.duplicateTargetMonthName === this.selectedMonthName && day.dayNumber === this.selectedDayIndex + 1;
  }

  isDuplicateTargetPast(day: TemplateDay): boolean {
    if (day.dayNumber == null || day.month == null || day.year == null) return false;
    return this.isPastDateForMonthYear(day.dayNumber, day.month, day.year);
  }

  toggleTargetDaySelection(day: TemplateDay): void {
    if (this.isDuplicateTargetSelf(day) || this.isDuplicateTargetPast(day)) return;
    const key = this.duplicateTargetKey(day);
    if (this.selectedTargetDaysForDuplication.has(key)) {
      this.selectedTargetDaysForDuplication.delete(key);
    } else {
      this.selectedTargetDaysForDuplication.add(key);
    }
  }

  // Selects every valid day in the currently-browsed target month only; switch months and
  // call again to add more - selections across months accumulate until the dialog closes.
  selectAllValidTargetDays(): void {
    this.getDuplicateTargetDaysList().forEach(day => {
      if (!this.isDuplicateTargetSelf(day) && !this.isDuplicateTargetPast(day)) {
        this.selectedTargetDaysForDuplication.add(this.duplicateTargetKey(day));
      }
    });
  }

  deselectAllTargetDays(): void {
    this.selectedTargetDaysForDuplication.clear();
  }

  confirmDuplicateDayToSelected(): void {
    // Guards the same class of Safari double-click-dispatch risk as duplicatingTemplateIds
    // above: closing the dialog below removes this button from the DOM, but that happens
    // after this synchronous handler returns, so a same-tick second dispatch needs its own
    // explicit check here rather than relying on the *ngIf alone.
    if (this.isDuplicatingDayBatch) return;

    const sourceDays: TemplateDay[] = [];
    if (this.multiSelectMode) {
      const days = this.getDaysList();
      this.selectedDaysForDuplication.forEach(idx => {
        if (idx >= 0 && idx < days.length) {
          sourceDays.push(days[idx]);
        }
      });
    } else {
      const singleDay = this.getSelectedDay();
      if (singleDay) {
        sourceDays.push(singleDay);
      }
    }

    const validSourceDays = sourceDays.filter(d => d.tasks && d.tasks.length > 0);
    if (validSourceDays.length === 0) {
      this.showToast(this.t('taskAccountability.templates.toast.noTasksToDuplicateDay'));
      this.closeDuplicateDayModal();
      this.selectedDaysForDuplication.clear();
      this.multiSelectMode = false;
      return;
    }

    if (this.selectedTargetDaysForDuplication.size === 0) {
      this.showToast(this.t('taskAccountability.templates.toast.selectTargetDay'));
      return;
    }

    this.isDuplicatingDayBatch = true;

    const templateId = this.editingTemplate?.id;
    const isSaved = templateId && templateId !== '' && !templateId.startsWith('temp-');
    const currentMonthDays = this.getDaysList();
    // Compared by which month name is browsed, not by the day objects' own month/year -
    // those can be null on a currentMonthDays entry still backed by a recurring row, even
    // though it's genuinely "the currently open month" for duplication purposes.
    const targetMonthIsOpenMonth = this.duplicateTargetMonthName === this.selectedMonthName;

    const targets = Array.from(this.selectedTargetDaysForDuplication).map(key => {
      const [monthStr, yearStr, dayStr] = key.split('-');
      return { month: parseInt(monthStr, 10), year: parseInt(yearStr, 10), dayNumber: parseInt(dayStr, 10) };
    });

    let countCopied = 0;

    targets.forEach(target => {
      countCopied++;

      // Instant local feedback for a target that lands in the month currently open in the
      // main editor; other months only update once refreshEditingTemplateDaysFromServer
      // refetches below (or, for an unsaved draft, never - see the isSaved branch).
      const isInOpenMonth = targetMonthIsOpenMonth && target.dayNumber >= 1 && target.dayNumber <= currentMonthDays.length;
      if (isInOpenMonth) {
        const targetDay = currentMonthDays[target.dayNumber - 1];
        validSourceDays.forEach(sourceDay => {
          sourceDay.tasks.forEach(t => {
            const clonedTask: TemplateTask = JSON.parse(JSON.stringify(t));
            clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            targetDay.tasks.push(clonedTask);
          });
        });
      }
    });

    if (isSaved) {
      // One atomic bulk call per source day instead of one addTaskApi per task per target day:
      // the first target supplies the URL's own day, every other target rides along in `targetDays`.
      const apiCalls = validSourceDays.map(sourceDay => {
        const taskPayloads = sourceDay.tasks.map(t => ({
          title: t.name,
          description: t.description || '',
          priority: t.priority || 'MEDIUM',
          proofRequired: false
        }));
        const [primaryTarget, ...restTargets] = targets;
        return this.service.addTasksBulkApi(
          templateId,
          primaryTarget.dayNumber,
          taskPayloads,
          primaryTarget.month,
          primaryTarget.year,
          restTargets
        );
      });

      forkJoin(apiCalls).subscribe({
        next: () => {
          this.refreshEditingTemplateDaysFromServer(templateId);
          this.service.getRoleTemplatesApi().subscribe();
        },
        error: (err) => {
          console.error('Failed to bulk-duplicate tasks to selected days:', err);
          this.refreshEditingTemplateDaysFromServer(templateId);
        }
      });
    }

    this.showToast(this.t('taskAccountability.templates.toast.tasksDuplicatedToDays', { count: countCopied }));
    this.closeDuplicateDayModal();
    this.selectedDaysForDuplication.clear();
    this.multiSelectMode = false;
  }

  // Bound to the target-day picker's confirm button, which is shared between the whole-day
  // duplicate flow and the single/multi-task duplicate flow - dispatch to whichever one is active.
  confirmDuplicateSelection(): void {
    if (this.duplicateTasksContext.length > 0) {
      this.confirmDuplicateTaskToSelected();
    } else {
      this.confirmDuplicateDayToSelected();
    }
  }

  confirmDuplicateTaskToSelected(): void {
    if (this.isDuplicatingTaskBatch) return;

    const tasks = this.duplicateTasksContext;
    const sourceDay = this.getSelectedDay();
    if (!tasks.length || !sourceDay) {
      this.closeDuplicateDayModal();
      return;
    }

    if (this.selectedTargetDaysForDuplication.size === 0) {
      this.showToast(this.t('taskAccountability.templates.toast.selectTargetDay'));
      return;
    }

    this.isDuplicatingTaskBatch = true;

    const templateId = this.editingTemplate?.id;
    const isSaved = templateId && templateId !== '' && !templateId.startsWith('temp-');
    const currentMonthDays = this.getDaysList();
    const targetMonthIsOpenMonth = this.duplicateTargetMonthName === this.selectedMonthName;

    const targets = Array.from(this.selectedTargetDaysForDuplication).map(key => {
      const [monthStr, yearStr, dayStr] = key.split('-');
      return { month: parseInt(monthStr, 10), year: parseInt(yearStr, 10), dayNumber: parseInt(dayStr, 10) };
    });

    targets.forEach(target => {
      // Same instant local feedback as confirmDuplicateDayToSelected(): only the currently
      // open month's view can be updated in place, other months pick up the change once
      // refreshEditingTemplateDaysFromServer refetches below.
      const isInOpenMonth = targetMonthIsOpenMonth && target.dayNumber >= 1 && target.dayNumber <= currentMonthDays.length;
      if (isInOpenMonth) {
        const targetDay = currentMonthDays[target.dayNumber - 1];
        tasks.forEach(task => {
          const clonedTask: TemplateTask = JSON.parse(JSON.stringify(task));
          clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          targetDay.tasks.push(clonedTask);
        });
      }
    });

    if (isSaved) {
      // Same bulk endpoint the whole-day flow uses: the first selected target supplies the
      // URL's own day, the rest ride along in `targetDays`, so every selected task lands on
      // every selected day in one atomic call.
      const taskPayloads = tasks.map(t => ({
        title: t.name,
        description: t.description || '',
        priority: t.priority || 'MEDIUM',
        proofRequired: false
      }));
      const [primaryTarget, ...restTargets] = targets;

      this.service.addTasksBulkApi(
        templateId,
        primaryTarget.dayNumber,
        taskPayloads,
        primaryTarget.month,
        primaryTarget.year,
        restTargets
      ).subscribe({
        next: () => {
          this.refreshEditingTemplateDaysFromServer(templateId);
          this.service.getRoleTemplatesApi().subscribe();
        },
        error: (err) => {
          console.error('Failed to duplicate tasks to selected days:', err);
          this.refreshEditingTemplateDaysFromServer(templateId);
        }
      });
    }

    this.showToast(this.t('taskAccountability.templates.toast.taskDuplicatedToDaysMulti', { taskCount: tasks.length, dayCount: targets.length }));
    this.closeDuplicateDayModal();
  }

  duplicateDayTasks(sourceDay: TemplateDay, targetDay: TemplateDay): void {
    if (!sourceDay || !targetDay) return;
    const targetIdx = this.editingTemplate?.months?.[0]?.days.indexOf(targetDay);
    if (targetIdx !== undefined && targetIdx !== -1 && this.isPastDay(targetIdx)) {
      return;
    }
    sourceDay.tasks.forEach(t => {
      const clonedTask = JSON.parse(JSON.stringify(t));
      clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      targetDay.tasks.push(clonedTask);
    });
    this.showToast(this.t('taskAccountability.templates.toast.tasksDuplicatedToDay', { day: targetDay.name }));
  }

  duplicateSingleTask(task: TemplateTask, targetDay: TemplateDay): void {
    if (!task || !targetDay) return;
    const targetIdx = this.editingTemplate?.months?.[0]?.days.indexOf(targetDay);
    if (targetIdx !== undefined && targetIdx !== -1 && this.isPastDay(targetIdx)) {
      return;
    }
    const clonedTask = JSON.parse(JSON.stringify(task));
    clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    targetDay.tasks.push(clonedTask);
    this.showToast(this.t('taskAccountability.templates.toast.taskCopiedTo', { day: targetDay.name }));
  }

  openTaskDetails(task: TemplateTask, day: TemplateDay): void {
    // Disabled slider drawer on task click
  }

  startEditingTask(task: TemplateTask, index: number): void {
    if (this.isPastDay(this.selectedDayIndex)) return;
    this.editingTaskId = task.id || `task-${index}`;
    this.editingTaskTitle = task.name || '';
    this.editingTaskDescription = task.description || '';
    this.editingTaskPriority = task.priority || 'MEDIUM';
    this.editingTaskProofRequired = false;
    setTimeout(() => {
      const editingEl = document.querySelector('.sidebar-task-card.is-editing');
      if (editingEl) {
        editingEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  }

  cancelTaskEdit(): void {
    this.editingTaskId = null;
    this.editingTaskTitle = '';
    this.editingTaskDescription = '';
    this.editingTaskPriority = 'MEDIUM';
    this.editingTaskProofRequired = false;
  }

  saveTaskEdit(task: TemplateTask, day: TemplateDay): void {
    if (!this.editingTaskTitle.trim()) return;

    task.name = this.editingTaskTitle.trim();
    task.description = this.editingTaskDescription.trim();
    task.priority = this.editingTaskPriority as any;
    task.proofRequired = false;

    if (!this.isTemplateUnsaved() && this.editingTemplate?.id && task.id && !task.id.startsWith('t-') && !task.id.startsWith('temp-')) {
      const templateId = this.editingTemplate.id;
      const dayNumber = this.selectedDayIndex + 1;
      const taskPayload = {
        title: task.name,
        description: task.description || '',
        priority: task.priority || 'MEDIUM',
        proofRequired: false
      };

      this.service.updateTaskApi(templateId, dayNumber, task.id, taskPayload).subscribe({
        next: () => {
          this.showToast(this.t('taskAccountability.templates.toast.taskUpdated', { defaultValue: 'Task updated' }));
        },
        error: (err) => {
          console.error('Failed to update task via API:', err);
          this.showToast(this.t('taskAccountability.templates.toast.taskUpdated', { defaultValue: 'Task updated' }));
        }
      });
    } else {
      this.showToast(this.t('taskAccountability.templates.toast.taskUpdated', { defaultValue: 'Task updated' }));
    }

    this.cancelTaskEdit();
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = '';
      }
    }, 3000);
  }

  /**
   * Target list for the "Duplicate to..." menu (bulk multi-select flow) - excludes every day
   * currently selected as a source. Without this, picking a selected day as its own target
   * made duplicateSelectedDaysTo() below push a clone of sourceDay.tasks onto that same array
   * while iterating it: forEach caches the array length once at the start, so it still visits
   * exactly the original N entries and appends N clones - an N-task day silently became 2N
   * tasks (e.g. 10 -> 20) with no error and no distinguishable duplicate-vs-original marker.
   */
  getDuplicateToTargetDaysList(): TemplateDay[] {
    const days = this.getDaysList();
    return days.filter((_, idx) => !this.selectedDaysForDuplication.has(idx));
  }

  duplicateSelectedDaysTo(targetDay: TemplateDay): void {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return;
    const days = this.editingTemplate.months[0].days;
    const templateId = this.editingTemplate.id;
    const isSaved = templateId && templateId !== '' && !templateId.startsWith('temp-');

    if (isSaved) {
      const apiCalls: Observable<any>[] = [];
      this.selectedDaysForDuplication.forEach(idx => {
        if (idx >= 0 && idx < days.length) {
          const sourceDay = days[idx];
          if (sourceDay === targetDay) return;
          if (sourceDay.id && !sourceDay.id.startsWith('td-new-')) {
            const sourceDayId = sourceDay.id.replace('td-', '');
            apiCalls.push(
              this.service.duplicateDayTasksApi(templateId, sourceDayId, {
                mode: 'SINGLE_DAY',
                targetDayNumber: targetDay.dayNumber
              })
            );
          }
        }
      });

      if (apiCalls.length > 0) {
        forkJoin(apiCalls).subscribe({
          next: () => {
            this.showToast(this.t('taskAccountability.templates.toast.tasksDuplicatedToDay', { day: targetDay.name }));
            this.refreshEditingTemplateDaysFromServer(templateId);
            this.service.getRoleTemplatesApi().subscribe();
          },
          error: (err) => {
            console.error('Failed to duplicate days via API:', err);
            this.refreshEditingTemplateDaysFromServer(templateId);
          }
        });
      }
    } else {
      this.selectedDaysForDuplication.forEach(idx => {
        if (idx >= 0 && idx < days.length) {
          const sourceDay = days[idx];
          if (sourceDay === targetDay) return;
          sourceDay.tasks.forEach(t => {
            const clonedTask = JSON.parse(JSON.stringify(t));
            clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            targetDay.tasks.push(clonedTask);
          });
        }
      });
      this.showToast(this.t('taskAccountability.templates.toast.tasksDuplicatedToDay', { day: targetDay.name }));
    }

    this.selectedDaysForDuplication.clear();
    this.multiSelectMode = false;
  }

  deleteSelectedDays(): void {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return;
    const days = this.editingTemplate.months[0].days;
    const templateId = this.editingTemplate.id;
    const isSaved = templateId && templateId !== '' && !templateId.startsWith('temp-');

    if (isSaved) {
      const apiCalls: Observable<any>[] = [];
      this.selectedDaysForDuplication.forEach(idx => {
        if (idx >= 0 && idx < days.length) {
          const day = days[idx];
          apiCalls.push(this.service.deleteDayTasksApi(templateId, day.dayNumber || (idx + 1), day.month, day.year));
        }
      });

      if (apiCalls.length > 0) {
        forkJoin(apiCalls).subscribe({
          next: () => {
            this.showToast(this.t('taskAccountability.templates.toast.tasksDeleted', { defaultValue: 'Tasks cleared successfully' }));
            this.refreshEditingTemplateDaysFromServer(templateId);
            this.service.getRoleTemplatesApi().subscribe();
          },
          error: (err) => {
            console.error('Failed to delete day tasks via API:', err);
            this.refreshEditingTemplateDaysFromServer(templateId);
          }
        });
      }
    } else {
      this.selectedDaysForDuplication.forEach(idx => {
        if (idx >= 0 && idx < days.length) {
          days[idx].tasks = [];
        }
      });
      this.showToast(this.t('taskAccountability.templates.toast.tasksDeleted', { defaultValue: 'Tasks cleared successfully' }));
    }

    this.selectedDaysForDuplication.clear();
    this.multiSelectMode = false;
  }

  // Selected Day tasks helpers
  addTaskToSelectedDay(): void {
    const day = this.getSelectedDay();
    const month = this.editingTemplate?.months?.[0];
    if (day && month) {
      this.addTaskToDay(day, month);
    }
  }

  removeTaskFromSelectedDay(tIdx: number): void {
    const day = this.getSelectedDay();
    if (day) {
      this.removeTaskFromDay(day, tIdx);
    }
  }

  /**
   * Duplicates a single task on the current template day.
   * If the template is saved to the server, it invokes the addTaskApi to persist it.
   * Otherwise, it creates the template or falls back to cloning the task in local state.
   * Accidental double-triggering is prevented by the isDuplicatingSingleTask guard.
   * 
   * @param task The task item template to duplicate
   * @param tIdx The index of the task in the list
   */
  duplicateTask(task: TemplateTask, tIdx: number): void {
    // Guards against a double-fire from a rapid double-click submitting two API calls
    // for the same task before the first one's response comes back.
    if (this.isDuplicatingSingleTask) {
      return;
    }
    this.isDuplicatingSingleTask = true;

    if (this.isPastDay(this.selectedDayIndex)) {
      this.isDuplicatingSingleTask = false;
      return;
    }

    const day = this.getSelectedDay();
    if (!day) {
      this.isDuplicatingSingleTask = false;
      return;
    }

    const title = task.name;
    const description = task.description || '';
    const priority = task.priority || 'MEDIUM';
    const dayNumber = this.selectedDayIndex + 1;
    const taskPayload = { title, description, priority };

    const executeDuplicateTaskApi = (tempId: string | number) => {
      this.service.addTaskApi(tempId, dayNumber, taskPayload, day.month, day.year).subscribe({
        next: () => {
          this.showToast(this.t('taskAccountability.templates.toast.taskAdded'));
          // Call GET API to update UI with latest server data
          this.refreshEditingTemplateDaysFromServer(tempId);
          this.service.getRoleTemplatesApi().subscribe();
          setTimeout(() => {
            this.isDuplicatingSingleTask = false;
          }, 300);
        },
        error: (err) => {
          console.error('Task API call failed:', err);
          // Fallback to local state if backend endpoint fails
          const clonedTask: TemplateTask = JSON.parse(JSON.stringify(task));
          clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          clonedTask.activities = [{ id: `act-${Date.now()}`, text: 'Task duplicated', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
          day.tasks.push(clonedTask);
          this.showToast(this.t('taskAccountability.templates.toast.taskAddedLocally'));
          setTimeout(() => {
            this.isDuplicatingSingleTask = false;
          }, 300);
        }
      });
    };

    const templateId = this.editingTemplate?.id;

    if (templateId && templateId !== '' && !templateId.startsWith('temp-')) {
      // Template already exists in backend DB
      executeDuplicateTaskApi(templateId);
    } else if (this.editingTemplate && this.editingTemplate.name && this.editingTemplate.name.trim()) {
      // Template is new/unsaved, but has a name. Create template in DB first!
      const selectedRole = this.rolesApiList.find(r => r.name === this.editingTemplate?.role);
      const selectedBranch = this.branchesList.find(b => b.name === this.editingTemplate?.branch);

      const createPayload = {
        name: this.editingTemplate.name.trim(),
        description: this.editingTemplate.name.trim(),
        roleId: selectedRole ? selectedRole.id : (this.editingTemplate?.roleId != null ? Number(this.editingTemplate.roleId) : null),
        branchId: selectedBranch ? selectedBranch.id : (this.editingTemplate?.branchId != null ? Number(this.editingTemplate.branchId) : null),
        days: []
      };

      this.service.createRoleTemplateApi(createPayload).subscribe({
        next: (res) => {
          const realId = res?.data?.id ? res.data.id.toString() : null;
          if (realId && this.editingTemplate) {
            this.editingTemplate.id = realId;
            executeDuplicateTaskApi(realId);
          } else {
            // Fallback to local state
            const clonedTask: TemplateTask = JSON.parse(JSON.stringify(task));
            clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            clonedTask.activities = [{ id: `act-${Date.now()}`, text: 'Task duplicated', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
            day.tasks.push(clonedTask);
            this.showToast(this.t('taskAccountability.templates.toast.taskAddedLocally'));
            setTimeout(() => {
              this.isDuplicatingSingleTask = false;
            }, 300);
          }
        },
        error: (err) => {
          console.error('Failed to create template before duplicating task:', err);
          // Fallback to local state
          const clonedTask: TemplateTask = JSON.parse(JSON.stringify(task));
          clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          clonedTask.activities = [{ id: `act-${Date.now()}`, text: 'Task duplicated', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
          day.tasks.push(clonedTask);
          this.showToast(this.t('taskAccountability.templates.toast.taskAddedLocally'));
          setTimeout(() => {
            this.isDuplicatingSingleTask = false;
          }, 300);
        }
      });
    } else {
      // Fallback/Local state
      const clonedTask: TemplateTask = JSON.parse(JSON.stringify(task));
      clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      clonedTask.activities = [{ id: `act-${Date.now()}`, text: 'Task duplicated', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
      day.tasks.push(clonedTask);
      this.showToast(this.t('taskAccountability.templates.toast.taskAddedLocally'));
      setTimeout(() => {
        this.isDuplicatingSingleTask = false;
      }, 300);
    }
  }

  moveTaskInSelectedDay(tIdx: number, direction: 'up' | 'down'): void {
    const day = this.getSelectedDay();
    if (day) {
      this.moveTask(day, tIdx, direction);
    }
  }

  openTaskDrawerForSelectedDay(task: TemplateTask): void {
    const day = this.getSelectedDay();
    const month = this.editingTemplate?.months?.[0];
    if (day && month) {
      this.openTaskDrawer(task, day, month.name);
    }
  }

  // Helper methods for status & branch chip
  getBranchDisplayName(template: RoleTemplate): string {
    if (!template) return 'All Branches';
    if (template.branchId === null || template.branchId === undefined) {
      if (!template.branchName && (!template.branch || template.branch === 'All Branches')) {
        return 'All Branches';
      }
    }
    if (template.branchName) return template.branchName;
    if (template.branch && template.branch !== 'All Branches') return template.branch;
    return 'All Branches';
  }

  getRoleDisplayName(template: RoleTemplate): string {
    if (!template) return 'Role';
    if (template.roleDisplayName) return template.roleDisplayName;
    if (template.roleName) {
      return template.roleName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    if (template.role) {
      if (template.role.includes('_')) {
        return template.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
      return template.role;
    }
    return 'Role';
  }

  getTemplateTasksCount(template: RoleTemplate): number {
    if (!template) return 0;
    // rawDays (when present) is the whole template's flat day list across every month, so
    // this counts every task the template has anywhere - not just whichever single month
    // `template.months[0]` happens to currently represent.
    if (template.rawDays && template.rawDays.length > 0) {
      return template.rawDays.reduce((acc: number, d: any) => acc + (d.tasks ? d.tasks.length : 0), 0);
    }
    if (template.months && template.months.length > 0) {
      return template.months.reduce((acc, m) => {
        return acc + (m.days ? m.days.reduce((dAcc, d) => dAcc + (d.tasks ? d.tasks.length : 0), 0) : 0);
      }, 0);
    }
    return template.tasks ? template.tasks.length : 0;
  }

  canPublish(template: RoleTemplate | null): boolean {
    if (!template) return false;
    if (!template.name || !template.name.trim()) return false;
    if (!template.role || !template.role.trim() || template.role === 'Select Role') return false;
    return this.getTemplateTasksCount(template) >= 1;
  }

  // Backend day ids loaded via mapResponseToTemplate are `td-<numericId>`; a day that only
  // exists client-side (new day, cloned day, etc. - never round-tripped from the server) is
  // `td-<timestamp>-<random>`. Both start with `td-`, so the extra `-<random>` suffix is what
  // tells them apart - only a bare numeric remainder is a real backend id.
  private parseServerDayId(id: string): number | undefined {
    const match = /^td-(\d+)$/.exec(id);
    return match ? Number(match[1]) : undefined;
  }

  // Backend task ids loaded via mapResponseToTemplate are the bare numeric id as a string; a
  // task that only exists client-side is `t-<timestamp>-<random>`.
  private parseServerTaskId(id: string): number | undefined {
    return /^\d+$/.test(id) ? Number(id) : undefined;
  }

  publishRoleTemplate(template: RoleTemplate): void {
    if (!this.canPublish(template) || this.isPublishing || this.isSaving) return;

    this.isPublishing = true;
    this.publishingTemplateId = template.id || null;

    const selectedRole = this.rolesApiList.find(r => r.name === template.role);
    const selectedBranch = this.branchesList.find(b => b.name === template.branch);

    const payload = {
      name: template.name,
      description: template.name,
      roleId: selectedRole ? selectedRole.id : (template.roleId != null ? Number(template.roleId) : null),
      branchId: selectedBranch ? selectedBranch.id : (template.branchId != null ? Number(template.branchId) : null),
      days: (template.months?.[0]?.days || []).map((d, index) => {
        const dayId = this.parseServerDayId(d.id);
        return {
          ...(dayId !== undefined ? { id: dayId } : {}),
          dayNumber: index + 1,
          isWeeklyCheckpoint: d.isWeekly || false,
          month: d.month ?? null,
          year: d.year ?? null,
          // Preserving each task's real id (when it has one) tells the backend this is the
          // same task being re-saved, not a new one - without it, syncDay() deletes every
          // existing task on the day and recreates them all fresh, which fails outright once
          // any of those tasks has already been instantiated into a real employee task (FK).
          tasks: (d.tasks || []).map((t, tIndex) => {
            const taskId = this.parseServerTaskId(t.id);
            return {
              ...(taskId !== undefined ? { id: taskId } : {}),
              title: t.name,
              description: t.description || '',
              priority: t.priority ? t.priority.toUpperCase() : 'MEDIUM',
              proofRequired: false,
              displayOrder: tIndex
            };
          })
        };
      })
    };

    if (this.showModal) {
      // Combined Save & Publish flow from within the modal
      const isExisting = template.id && !template.id.startsWith('temp-');
      const save$ = isExisting
        ? this.service.updateRoleTemplateApi(template.id, payload)
        : this.service.createRoleTemplateApi(payload);

      save$.pipe(
        switchMap((res) => {
          const targetId = isExisting ? template.id : (res?.data?.id || null);
          if (!targetId) {
            throw new Error('Could not resolve template ID after saving');
          }
          return this.service.publishRoleTemplateApi(targetId);
        })
      ).subscribe({
        next: () => {
          this.isPublishing = false;
          this.publishingTemplateId = null;
          this.showToast(this.t('taskAccountability.templates.toast.templatePublished', { name: template.name }));
          this.loadTemplates();
          this.closeModal();
        },
        error: (error) => {
          this.isPublishing = false;
          this.publishingTemplateId = null;
          console.error('Failed to save and publish template:', error);
          this.showToast(this.t('taskAccountability.templates.toast.publishFailed'));
        }
      });
    } else {
      // Direct Publish flow from template card menu
      if (template.id && !template.id.startsWith('temp-')) {
        this.service.publishRoleTemplateApi(template.id).subscribe({
          next: () => {
            this.isPublishing = false;
            this.publishingTemplateId = null;
            this.showToast(this.t('taskAccountability.templates.toast.templatePublished', { name: template.name }));
            this.loadTemplates();
          },
          error: (error) => {
            this.isPublishing = false;
            this.publishingTemplateId = null;
            console.error('Failed to publish template:', error);
            this.showToast(this.t('taskAccountability.templates.toast.publishFailed'));
          }
        });
      } else {
        this.isPublishing = false;
        this.publishingTemplateId = null;
      }
    }
  }

  // Footer Actions
  saveTemplateDraft(): void {
    if (this.editingTemplate) {
      this.editingTemplate.status = 'DRAFT';
      this.editingTemplate.active = false;
      this.saveTemplate();
    }
  }

  publishTemplateFromModal(): void {
    if (!this.editingTemplate || !this.canPublish(this.editingTemplate) || this.isPublishing || this.isSaving) return;
    this.publishRoleTemplate(this.editingTemplate);
  }

  // Save actions
  saveTemplate(): void {
    if (!this.editingTemplate || !this.editingTemplate.name || this.isSaving || this.isPublishing) return;

    if (!this.editingTemplate.status) {
      this.editingTemplate.status = 'DRAFT';
      this.editingTemplate.active = false;
    }

    const selectedRole = this.rolesApiList.find(r => r.name === this.editingTemplate?.role);
    const selectedBranch = this.branchesList.find(b => b.name === this.editingTemplate?.branch);

    const payload = {
      name: this.editingTemplate.name,
      description: this.editingTemplate.name,
      roleId: selectedRole ? selectedRole.id : (this.editingTemplate?.roleId != null ? Number(this.editingTemplate.roleId) : null),
      branchId: selectedBranch ? selectedBranch.id : (this.editingTemplate?.branchId != null ? Number(this.editingTemplate.branchId) : null),
      days: (this.editingTemplate.months?.[0]?.days || []).map((d, index) => {
        const dayId = this.parseServerDayId(d.id);
        return {
          ...(dayId !== undefined ? { id: dayId } : {}),
          dayNumber: index + 1,
          isWeeklyCheckpoint: d.isWeekly || false,
          month: d.month ?? null,
          year: d.year ?? null,
          // See publishRoleTemplate() for why preserving each task's real id matters here.
          tasks: (d.tasks || []).map((t, tIndex) => {
            const taskId = this.parseServerTaskId(t.id);
            return {
              ...(taskId !== undefined ? { id: taskId } : {}),
              title: t.name,
              description: t.description || '',
              priority: t.priority ? t.priority.toUpperCase() : 'MEDIUM',
              proofRequired: false,
              displayOrder: tIndex
            };
          })
        };
      })
    };

    this.isSaving = true;
    if (this.editingTemplate.id && !this.editingTemplate.id.startsWith('temp-')) {
      this.service.updateRoleTemplateApi(this.editingTemplate.id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.showToast(this.t('taskAccountability.templates.toast.templateSaved'));
          this.loadTemplates();
          this.closeModal();
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Failed to update template:', error);
          this.showToast(this.t('taskAccountability.templates.toast.templateSaveFailed'));
        }
      });
    } else {
      this.service.createRoleTemplateApi(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.showToast(this.t('taskAccountability.templates.toast.templateCreated'));
          this.loadTemplates();
          this.closeModal();
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Failed to create template:', error);
          this.showToast(this.t('taskAccountability.templates.toast.templateCreateFailed'));
        }
      });
    }
  }

  // Guards against a second /duplicate request firing while the first is still in flight -
  // seen on Safari, where a click on a button containing nested icon/text elements can
  // dispatch two click events for one tap. The backend's own name-uniqueness constraint
  // would reject a genuine second duplicate attempt outright, so this isn't about masking a
  // real backend bug; it's that a same-tick double dispatch can otherwise reach the network
  // layer twice before Angular's change detection even has a chance to reflect state back.
  duplicatingTemplateIds = new Set<string>();

  duplicateTemplate(template: RoleTemplate): void {
    if (!template) return;
    if (template.id && !template.id.startsWith('temp-')) {
      if (this.duplicatingTemplateIds.has(template.id)) return;
      this.duplicatingTemplateIds.add(template.id);
      this.service.duplicateRoleTemplateApi(template.id).subscribe({
        next: () => {
          this.duplicatingTemplateIds.delete(template.id);
          this.showToast(this.t('taskAccountability.templates.toast.templateDuplicated', { name: template.name }));
          this.service.getRoleTemplatesApi().subscribe();
        },
        error: (err) => {
          this.duplicatingTemplateIds.delete(template.id);
          console.error('Failed to duplicate template via API:', err);
          this.showToast(this.t('taskAccountability.templates.toast.templateDuplicateFailed'));
        }
      });
    } else {
      this.service.duplicateTemplate(template);
      this.showToast(this.t('taskAccountability.templates.toast.templateDuplicatedLocally', { name: template.name }));
    }
  }

  // Opens the in-app delete-confirm modal below instead of the browser's native confirm() -
  // that dialog blocks all page script until answered, which freezes anything driving the
  // page programmatically (an embedded view, a future E2E suite) and looks nothing like the
  // rest of this feature's confirmations.
  requestDeleteTemplate(template: RoleTemplate): void {
    this.templateToDelete = template;
    this.showDeleteConfirmModal = true;
  }

  cancelDeleteTemplate(): void {
    this.showDeleteConfirmModal = false;
    this.templateToDelete = null;
  }

  confirmDeleteTemplate(): void {
    if (!this.templateToDelete) return;
    const id = this.templateToDelete.id;
    this.showDeleteConfirmModal = false;
    this.templateToDelete = null;
    this.deleteTemplate(id);
  }

  private deleteTemplate(id: string): void {
    if (id.startsWith('temp-')) {
      this.service.deleteTemplate(id);
    } else {
      this.service.deleteRoleTemplateApi(id).subscribe({
        next: () => {
          this.showToast(this.t('taskAccountability.templates.toast.templateDeleted'));
          // Re-fetch templates list via GET API to update UI
          this.service.getRoleTemplatesApi().subscribe();
        },
        error: () => this.showToast(this.t('taskAccountability.templates.toast.templateDeleteFailed'))
      });
    }
  }

  toggleActive(template: RoleTemplate): void {
    if (!template) return;
    const isCurrentlyActive = template.status === 'ACTIVE' || template.active;
    const targetStatus: 'ACTIVE' | 'INACTIVE' = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';

    if (template.id && !template.id.startsWith('temp-')) {
      this.service.updateTemplateStatusApi(template.id, targetStatus).subscribe({
        next: () => {
          this.showToast(targetStatus === 'ACTIVE' ? this.t('taskAccountability.templates.toast.templateActivated') : this.t('taskAccountability.templates.toast.templateDeactivated'));
          this.service.getRoleTemplatesApi().subscribe();
        },
        error: (err) => {
          console.error('Failed to update template status via API:', err);
          this.showToast(this.t('taskAccountability.templates.toast.statusUpdateFailed'));
        }
      });
    } else {
      this.service.toggleTemplateActive(template.id);
      this.showToast(this.t('taskAccountability.templates.toast.statusChangedTo', { status: this.getTemplateStatusLabel({ status: targetStatus } as any) }));
    }
  }
}
