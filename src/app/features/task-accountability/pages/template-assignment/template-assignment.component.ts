import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { RoleTemplate, TemplateAssignment, BranchNode } from '../../interfaces/accountability.interface';
import { Observable, Subscription } from 'rxjs';
import { TableColumn } from '../../../../shared/components/data-table/data-table.models';

@Component({
  selector: 'app-template-assignment',
  templateUrl: './template-assignment.component.html',
  styleUrls: ['./template-assignment.component.scss']
})
export class TemplateAssignmentComponent implements OnInit, OnDestroy {
  templates$: Observable<RoleTemplate[]>;
  assignments$: Observable<TemplateAssignment[]>;
  branches: BranchNode[] = [];

  assignmentsColumns: TableColumn<TemplateAssignment>[] = [
    { key: 'templateName', header: 'Template', type: 'custom', exportValueFn: r => r.templateName },
    { key: 'targetName', header: 'Assigned To', type: 'custom', exportValueFn: r => r.targetName },
    { key: 'assignType', header: 'Type', type: 'custom', exportValueFn: r => r.assignType },
    { key: 'effectiveDate', header: 'Effective Date', type: 'custom', exportValueFn: r => r.effectiveDate },
    { key: 'status', header: 'Status', type: 'custom', exportValueFn: () => 'Active' },
    { key: 'actions', header: 'Actions', type: 'actions', align: 'right' },
  ];

  // Dropdown options
  rolesList: string[] = ['Senior Counsellor', 'Junior Counsellor', 'Video Editor', 'Web Developer', 'Administrative Assistant'];
  branchesList: string[] = ['Chennai', 'Mumbai', 'Bangalore'];
  employeesList: string[] = ['Rohith Krishnan', 'Sandhya Ramesh', 'Priya Nair', 'Vijay Kumar'];

  // Form State
  selectedTemplateId = '';
  assignType: 'role' | 'branch' | 'employee' = 'role';
  targetName = '';
  effectiveDate = new Date().toISOString().split('T')[0];

  private sub = new Subscription();

  constructor(private service: TaskAccountabilityService) {
    this.templates$ = this.service.templates$;
    this.assignments$ = this.service.assignments$;
  }

  ngOnInit(): void {
    this.sub.add(
      this.service.branches$.subscribe(branches => {
        this.branches = branches;
        this.branchesList = branches.map(b => b.name);
        
        // Flatten employees
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
        if (emps.length > 0) {
          this.employeesList = emps;
        }
      })
    );

    // Initial form defaults
    this.templates$.subscribe(temps => {
      if (temps.length > 0 && !this.selectedTemplateId) {
        this.selectedTemplateId = temps[0].id;
      }
    });
    this.updateTargetDefault();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onTypeChange(): void {
    this.updateTargetDefault();
  }

  updateTargetDefault(): void {
    if (this.assignType === 'role') {
      this.targetName = this.rolesList[0] || '';
    } else if (this.assignType === 'branch') {
      this.targetName = this.branchesList[0] || '';
    } else {
      this.targetName = this.employeesList[0] || '';
    }
  }

  assignTemplate(): void {
    if (!this.selectedTemplateId || !this.targetName || !this.effectiveDate) return;

    this.templates$.subscribe(temps => {
      const template = temps.find(t => t.id === this.selectedTemplateId);
      if (template) {
        const newAssignment: TemplateAssignment = {
          id: `assign-${Date.now()}`,
          templateId: this.selectedTemplateId,
          templateName: template.name,
          assignType: this.assignType,
          targetName: this.targetName,
          effectiveDate: this.effectiveDate,
          active: true
        };
        this.service.addAssignment(newAssignment);
      }
    }).unsubscribe();
  }

  removeAssignment(id: string): void {
    if (confirm('Are you sure you want to remove this assignment?')) {
      this.service.deleteAssignment(id);
    }
  }
}
