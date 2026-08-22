import { Component, OnInit } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { RoleTemplate, TemplateMonth, TemplateDay, TemplateQuestion, EmployeeNode, TemplateTask } from '../../interfaces/accountability.interface';
import { Observable } from 'rxjs';
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
  editingTemplate: RoleTemplate | null = null;
  publishingTemplate: RoleTemplate | null = null;

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
  get pastDayTooltip(): string {
    return this.t('taskAccountability.templates.cantAddPastDay');
  }
  toastMessage = '';
  showDuplicateDayModal = false;
  selectedTargetDaysForDuplication = new Set<number>();
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

  // Inline Task Edit State
  editingTaskId: string | null = null;
  editingTaskTitle = '';
  editingTaskDescription = '';
  editingTaskPriority = 'MEDIUM';

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
      tasks: []
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
    const parts = monthNameWithYear.split(' ');
    const monthName = parts[0];
    const year = parts[1] ? parseInt(parts[1], 10) : new Date().getFullYear();

    const targetDaysCount = this.getDaysInMonth(monthName, year);
    const days = this.editingTemplate.months[0].days;
    const currentDaysCount = days.length;

    if (currentDaysCount < targetDaysCount) {
      const diff = targetDaysCount - currentDaysCount;
      for (let i = 0; i < diff; i++) {
        const startNum = currentDaysCount + 1 + i;
        days.push({
          id: `td-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: `Day ${startNum}`,
          isWeekly: false,
          tasks: []
        });
      }
    }
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
          this.service.getRoleTemplateByIdApi(templateId).subscribe(updatedTemplate => {
            if (updatedTemplate && this.editingTemplate) {
              const currentMonthName = this.editingTemplate.months?.[0]?.name || this.monthsList[0];
              this.editingTemplate.months = updatedTemplate.months;
              if (this.editingTemplate.months?.[0]) {
                this.editingTemplate.months[0].name = currentMonthName;
              }
            }
          });
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

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const dayNumber = idx + 1;

    if (year < currentYear) {
      return true;
    } else if (year > currentYear) {
      return false;
    } else {
      if (monthIndex < currentMonth) {
        return true;
      } else if (monthIndex > currentMonth) {
        return false;
      } else {
        return dayNumber < currentDay;
      }
    }
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
    days.splice(idx, 1);

    // Adjust day names contiguously
    days.forEach((d, i) => {
      d.name = `Day ${i + 1}`;
    });

    // Adjust selection index
    if (this.selectedDayIndex >= days.length) {
      this.selectedDayIndex = Math.max(0, days.length - 1);
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
    }
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
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
    const dayNumber = this.selectedDayIndex + 1;
    const taskPayload = { title, description, priority };

    const executeAddTaskApi = (tempId: string | number) => {
      this.service.addTaskApi(tempId, dayNumber, taskPayload).subscribe({
        next: () => {
          this.showToast(this.t('taskAccountability.templates.toast.taskAdded'));
          // Call GET API to update UI with latest server data
          this.service.getRoleTemplateByIdApi(tempId).subscribe(updatedTemplate => {
            if (updatedTemplate && this.editingTemplate) {
              const currentMonthName = this.editingTemplate.months?.[0]?.name || this.monthsList[0];
              this.editingTemplate.months = updatedTemplate.months;
              if (this.editingTemplate.months?.[0]) {
                this.editingTemplate.months[0].name = currentMonthName;
              }
            }
          });
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
        roleId: selectedRole ? selectedRole.id : null,
        branchId: selectedBranch ? selectedBranch.id : null,
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
    this.showDescField = false;
  }

  openDuplicateDayModal(): void {
    const day = this.getSelectedDay();
    if (!day || day.tasks.length === 0) {
      this.showToast(this.t('taskAccountability.templates.toast.noTasksToDuplicateDay'));
      return;
    }
    this.selectedTargetDaysForDuplication.clear();
    this.showDuplicateDayModal = true;
  }

  closeDuplicateDayModal(): void {
    this.showDuplicateDayModal = false;
    this.selectedTargetDaysForDuplication.clear();
  }

  toggleTargetDaySelection(idx: number): void {
    if (idx === this.selectedDayIndex || this.isPastDay(idx)) return;
    if (this.selectedTargetDaysForDuplication.has(idx)) {
      this.selectedTargetDaysForDuplication.delete(idx);
    } else {
      this.selectedTargetDaysForDuplication.add(idx);
    }
  }

  selectAllValidTargetDays(): void {
    const days = this.getDaysList();
    days.forEach((_, idx) => {
      if (idx !== this.selectedDayIndex && !this.isPastDay(idx)) {
        this.selectedTargetDaysForDuplication.add(idx);
      }
    });
  }

  deselectAllTargetDays(): void {
    this.selectedTargetDaysForDuplication.clear();
  }

  confirmDuplicateDayToSelected(): void {
    const sourceDay = this.getSelectedDay();
    if (!sourceDay || sourceDay.tasks.length === 0) {
      this.showToast(this.t('taskAccountability.templates.toast.noTasksToDuplicateDay'));
      this.closeDuplicateDayModal();
      return;
    }

    if (this.selectedTargetDaysForDuplication.size === 0) {
      this.showToast(this.t('taskAccountability.templates.toast.selectTargetDay'));
      return;
    }

    const days = this.getDaysList();
    const templateId = this.editingTemplate?.id;
    const isSaved = templateId && templateId !== '' && !templateId.startsWith('temp-');

    const targetIndices = Array.from(this.selectedTargetDaysForDuplication);
    let countCopied = 0;

    targetIndices.forEach(targetIdx => {
      if (targetIdx >= 0 && targetIdx < days.length && !this.isPastDay(targetIdx)) {
        const targetDay = days[targetIdx];
        sourceDay.tasks.forEach(t => {
          const clonedTask: TemplateTask = JSON.parse(JSON.stringify(t));
          clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          targetDay.tasks.push(clonedTask);
        });
        countCopied++;

        if (isSaved) {
          const dayNumber = targetIdx + 1;
          sourceDay.tasks.forEach(t => {
            const payload = { title: t.name, description: t.description || '', priority: t.priority || 'MEDIUM' };
            this.service.addTaskApi(templateId, dayNumber, payload).subscribe();
          });
        }
      }
    });

    if (isSaved) {
      setTimeout(() => {
        this.service.getRoleTemplateByIdApi(templateId).subscribe(updatedTemplate => {
          if (updatedTemplate && this.editingTemplate) {
            const currentMonthName = this.editingTemplate.months?.[0]?.name || this.monthsList[0];
            this.editingTemplate.months = updatedTemplate.months;
            if (this.editingTemplate.months?.[0]) {
              this.editingTemplate.months[0].name = currentMonthName;
            }
          }
        });
        this.service.getRoleTemplatesApi().subscribe();
      }, 300);
    }

    this.showToast(this.t('taskAccountability.templates.toast.tasksDuplicatedToDays', { count: countCopied }));
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

  duplicateTaskToSameDay(task: TemplateTask, day: TemplateDay): void {
    if (!task || !day) return;
    if (this.isPastDay(this.selectedDayIndex)) {
      return;
    }

    if (this.isTemplateUnsaved()) {
      const clonedTask: TemplateTask = JSON.parse(JSON.stringify(task));
      clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      day.tasks.push(clonedTask);
      this.showToast(this.t('taskAccountability.templates.toast.taskDuplicated'));
      return;
    }

    const templateId = this.editingTemplate!.id;
    const dayNumber = this.selectedDayIndex + 1;
    const taskPayload = {
      title: task.name,
      description: task.description || '',
      priority: task.priority || 'MEDIUM'
    };

    this.service.addTaskApi(templateId, dayNumber, taskPayload).subscribe({
      next: () => {
        this.showToast(this.t('taskAccountability.templates.toast.taskDuplicated'));
        this.service.getRoleTemplateByIdApi(templateId).subscribe(updatedTemplate => {
          if (updatedTemplate && this.editingTemplate) {
            const currentMonthName = this.editingTemplate.months?.[0]?.name || this.monthsList[0];
            this.editingTemplate.months = updatedTemplate.months;
            if (this.editingTemplate.months?.[0]) {
              this.editingTemplate.months[0].name = currentMonthName;
            }
          }
        });
        this.service.getRoleTemplatesApi().subscribe();
      },
      error: (err) => {
        console.error('Failed to duplicate task via API, performing local duplicate:', err);
        const clonedTask: TemplateTask = JSON.parse(JSON.stringify(task));
        clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        day.tasks.push(clonedTask);
        this.showToast(this.t('taskAccountability.templates.toast.taskDuplicated'));
      }
    });
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
  }

  saveTaskEdit(task: TemplateTask, day: TemplateDay): void {
    if (!this.editingTaskTitle.trim()) return;

    task.name = this.editingTaskTitle.trim();
    task.description = this.editingTaskDescription.trim();
    task.priority = this.editingTaskPriority as any;

    if (!this.isTemplateUnsaved() && this.editingTemplate?.id && task.id && !task.id.startsWith('t-') && !task.id.startsWith('temp-')) {
      const templateId = this.editingTemplate.id;
      const dayNumber = this.selectedDayIndex + 1;
      const taskPayload = {
        title: task.name,
        description: task.description || '',
        priority: task.priority || 'MEDIUM'
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

  duplicateSelectedDaysTo(targetDay: TemplateDay): void {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return;
    const days = this.editingTemplate.months[0].days;
    this.selectedDaysForDuplication.forEach(idx => {
      if (idx >= 0 && idx < days.length) {
        const sourceDay = days[idx];
        sourceDay.tasks.forEach(t => {
          const clonedTask = JSON.parse(JSON.stringify(t));
          clonedTask.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          targetDay.tasks.push(clonedTask);
        });
      }
    });
    this.selectedDaysForDuplication.clear();
    this.multiSelectMode = false;
  }

  deleteSelectedDays(): void {
    if (!this.editingTemplate || !this.editingTemplate.months || this.editingTemplate.months.length === 0) return;
    const days = this.editingTemplate.months[0].days;
    const filteredDays = days.filter((_, idx) => !this.selectedDaysForDuplication.has(idx));

    filteredDays.forEach((d, i) => {
      d.name = `Day ${i + 1}`;
    });

    this.editingTemplate.months[0].days = filteredDays;
    this.selectedDaysForDuplication.clear();
    this.multiSelectMode = false;
    this.selectedDayIndex = 0;
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

  publishRoleTemplate(template: RoleTemplate): void {
    if (!this.canPublish(template)) return;

    const selectedRole = this.rolesApiList.find(r => r.name === template.role);
    const selectedBranch = this.branchesList.find(b => b.name === template.branch);

    const payload = {
      name: template.name,
      description: template.name,
      roleId: selectedRole ? selectedRole.id : null,
      branchId: selectedBranch ? selectedBranch.id : null,
      days: (template.months?.[0]?.days || []).map((d, index) => ({
        dayNumber: index + 1,
        isWeeklyCheckpoint: d.isWeekly || false,
        tasks: (d.tasks || []).map((t, tIndex) => ({
          title: t.name,
          description: t.description || '',
          priority: t.priority ? t.priority.toUpperCase() : 'MEDIUM',
          displayOrder: tIndex
        }))
      }))
    };

    if (template.id && !template.id.startsWith('temp-')) {
      this.service.updateRoleTemplateApi(template.id, payload).subscribe({
        next: () => {
          this.service.publishRoleTemplateApi(template.id).subscribe({
            next: () => {
              this.showToast(this.t('taskAccountability.templates.toast.templatePublished', { name: template.name }));
              this.closeModal();
            },
            error: () => {
              this.showToast(this.t('taskAccountability.templates.toast.publishFailed'));
            }
          });
        },
        error: () => {
          this.showToast(this.t('taskAccountability.templates.toast.saveBeforePublishFailed'));
        }
      });
    } else {
      this.service.createRoleTemplateApi(payload).subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            const newId = res.data.id;
            this.service.publishRoleTemplateApi(newId).subscribe({
              next: () => {
                this.showToast(this.t('taskAccountability.templates.toast.templatePublished', { name: template.name }));
                this.closeModal();
              },
              error: () => {
                this.showToast(this.t('taskAccountability.templates.toast.publishFailed'));
              }
            });
          } else {
            this.showToast(this.t('taskAccountability.templates.toast.createBeforePublishFailed'));
          }
        },
        error: () => {
          this.showToast(this.t('taskAccountability.templates.toast.createBeforePublishFailed'));
        }
      });
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
    if (!this.editingTemplate || !this.canPublish(this.editingTemplate)) return;
    this.publishRoleTemplate(this.editingTemplate);
  }

  // Save actions
  saveTemplate(): void {
    if (!this.editingTemplate || !this.editingTemplate.name) return;

    if (!this.editingTemplate.status) {
      this.editingTemplate.status = 'DRAFT';
      this.editingTemplate.active = false;
    }

    const selectedRole = this.rolesApiList.find(r => r.name === this.editingTemplate?.role);
    const selectedBranch = this.branchesList.find(b => b.name === this.editingTemplate?.branch);

    const payload = {
      name: this.editingTemplate.name,
      description: this.editingTemplate.name,
      roleId: selectedRole ? selectedRole.id : null,
      branchId: selectedBranch ? selectedBranch.id : null,
      days: (this.editingTemplate.months?.[0]?.days || []).map((d, index) => ({
        dayNumber: index + 1,
        isWeeklyCheckpoint: d.isWeekly || false,
        tasks: (d.tasks || []).map((t, tIndex) => ({
          title: t.name,
          description: t.description || '',
          priority: t.priority ? t.priority.toUpperCase() : 'MEDIUM',
          displayOrder: tIndex
        }))
      }))
    };

    if (this.editingTemplate.id && !this.editingTemplate.id.startsWith('temp-')) {
      this.service.updateRoleTemplateApi(this.editingTemplate.id, payload).subscribe({
        next: () => {
          this.showToast(this.t('taskAccountability.templates.toast.templateSaved'));
          this.closeModal();
        },
        error: () => {
          this.showToast(this.t('taskAccountability.templates.toast.templateSaveFailed'));
        }
      });
    } else {
      this.service.createRoleTemplateApi(payload).subscribe({
        next: () => {
          this.showToast(this.t('taskAccountability.templates.toast.templateCreated'));
          this.closeModal();
        },
        error: () => {
          this.showToast(this.t('taskAccountability.templates.toast.templateCreateFailed'));
        }
      });
    }
  }

  duplicateTemplate(template: RoleTemplate): void {
    if (!template) return;
    if (template.id && !template.id.startsWith('temp-')) {
      this.service.duplicateRoleTemplateApi(template.id).subscribe({
        next: () => {
          this.showToast(this.t('taskAccountability.templates.toast.templateDuplicated', { name: template.name }));
          this.service.getRoleTemplatesApi().subscribe();
        },
        error: (err) => {
          console.error('Failed to duplicate template via API:', err);
          this.showToast(this.t('taskAccountability.templates.toast.templateDuplicateFailed'));
        }
      });
    } else {
      this.service.duplicateTemplate(template);
      this.showToast(this.t('taskAccountability.templates.toast.templateDuplicatedLocally', { name: template.name }));
    }
  }

  deleteTemplate(id: string): void {
    if (confirm(this.t('taskAccountability.templates.confirmDeleteTemplate'))) {
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
