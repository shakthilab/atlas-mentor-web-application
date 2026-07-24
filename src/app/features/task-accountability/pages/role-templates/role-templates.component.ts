import { Component, OnInit } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { RoleTemplate, TemplateMonth, TemplateDay, TemplateQuestion, EmployeeNode, TemplateTask } from '../../interfaces/accountability.interface';
import { Observable } from 'rxjs';

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

  availableRoles = [
    'Senior Counsellor',
    'Junior Counsellor',
    'Video Editor',
    'Web Developer',
    'Administrative Assistant'
  ];

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

  priorities = ['Low', 'Medium', 'High', 'Urgent'];

  constructor(private service: TaskAccountabilityService) {
    this.templates$ = this.service.templates$;
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
  }

  openNewTemplateModal(): void {
    this.editingTemplate = {
      id: '',
      name: '',
      role: 'Senior Counsellor',
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
      months: [
        {
          id: `tm-${Date.now()}-1`,
          name: 'July',
          days: [
            {
              id: `td-${Date.now()}-1`,
              name: 'Day 1',
              isWeekly: false,
              tasks: []
            }
          ]
        }
      ],
      tasks: []
    };
    this.showModal = true;
  }

  openEditTemplateModal(template: RoleTemplate): void {
    // Deep clone to avoid mutating directly
    const clone = JSON.parse(JSON.stringify(template));
    
    // Ensure hierarchical properties exist
    if (!clone.months || clone.months.length === 0) {
      // Migrate legacy tasks
      clone.months = [
        {
          id: `tm-${Date.now()}-1`,
          name: 'Month 1',
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
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTemplate = null;
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
    alert('Success: Role template has been published to employee workspace!');
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
      priority: 'Medium',
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
    this.openTaskDrawer(newTask, day, month.name);
  }

  removeTaskFromDay(day: TemplateDay, tIndex: number): void {
    const deletedTask = day.tasks[tIndex];
    if (this.selectedEditingTask && this.selectedEditingTask.id === deletedTask.id) {
      this.closeTaskDrawer();
    }
    day.tasks.splice(tIndex, 1);
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

  // Save actions
  saveTemplate(): void {
    if (!this.editingTemplate || !this.editingTemplate.name) return;

    if (this.editingTemplate.id) {
      this.service.updateTemplate(this.editingTemplate);
    } else {
      this.editingTemplate.id = `temp-${Date.now()}`;
      this.service.addTemplate(this.editingTemplate);
    }
    this.closeModal();
  }

  duplicateTemplate(template: RoleTemplate): void {
    this.service.duplicateTemplate(template);
  }

  deleteTemplate(id: string): void {
    if (confirm('Are you sure you want to delete this template?')) {
      this.service.deleteTemplate(id);
    }
  }

  toggleActive(template: RoleTemplate): void {
    this.service.toggleTemplateActive(template.id);
  }
}
