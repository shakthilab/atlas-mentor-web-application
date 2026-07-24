import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { Subscription } from 'rxjs';
import { EmployeeNode } from '../../interfaces/accountability.interface';

@Component({
  selector: 'app-task-create-drawer',
  templateUrl: './task-create-drawer.component.html',
  styleUrls: ['./task-create-drawer.component.scss']
})
export class TaskCreateDrawerComponent implements OnInit, OnDestroy {
  isOpen = false;
  private subs = new Subscription();

  // Form Fields
  taskName = '';
  description = '';
  taskType: 'NUMERIC' | 'CHECKLIST' | 'FILE' | 'COMMENT' | 'APPROVAL' | 'TEXT' | 'DROPDOWN' | 'RATING' | 'YES_NO' = 'CHECKLIST';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Medium';
  targetValue = '';
  selectedRole = '';
  selectedEmployeeId = '';
  dueDate = '';
  recurring = false;
  approvalRequired = true;
  validationRules = 'None';
  commentsEnabled = true;
  attachmentsEnabled = true;

  // Option lists
  availableRoles = [
    'Senior Counsellor',
    'Junior Counsellor',
    'Video Editor',
    'Web Developer',
    'Administrative Assistant'
  ];

  taskTypes = [
    { value: 'NUMERIC', label: 'Numeric' },
    { value: 'CHECKLIST', label: 'Checklist' },
    { value: 'TEXT', label: 'Text' },
    { value: 'FILE', label: 'File Upload' },
    { value: 'DROPDOWN', label: 'Dropdown' },
    { value: 'RATING', label: 'Rating' },
    { value: 'YES_NO', label: 'Yes/No' },
    { value: 'APPROVAL', label: 'Approval/Review' }
  ];

  priorities = ['Low', 'Medium', 'High', 'Urgent'];
  employees: EmployeeNode[] = [];

  constructor(private service: TaskAccountabilityService) {}

  ngOnInit(): void {
    this.subs.add(
      this.service.showCreateDrawer$.subscribe(open => {
        this.isOpen = open;
      })
    );

    // Retrieve list of all employees to populate assignment dropdown
    this.subs.add(
      this.service.branches$.subscribe(branches => {
        const empList: EmployeeNode[] = [];
        branches.forEach(b => {
          b.roles.forEach(r => {
            r.employees.forEach(e => {
              if (!empList.find(x => x.id === e.id)) {
                empList.push(e);
              }
            });
          });
        });
        this.employees = empList;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  closeDrawer(): void {
    this.service.toggleCreateDrawer(false);
  }

  saveTask(): void {
    if (!this.taskName.trim()) return;

    // Get assigned employee name
    const emp = this.employees.find(e => e.id === this.selectedEmployeeId);
    const assignedName = emp ? emp.name : 'Unassigned';

    this.service.addAdHocTask(
      this.taskName,
      this.description,
      this.priority,
      this.taskType,
      assignedName,
      this.dueDate ? new Date(this.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '6:00 PM'
    );

    // Reset form fields
    this.taskName = '';
    this.description = '';
    this.taskType = 'CHECKLIST';
    this.priority = 'Medium';
    this.targetValue = '';
    this.selectedRole = '';
    this.selectedEmployeeId = '';
    this.dueDate = '';
    this.recurring = false;
    this.approvalRequired = true;
    this.validationRules = 'None';
    this.commentsEnabled = true;
    this.attachmentsEnabled = true;

    this.closeDrawer();
  }
}
