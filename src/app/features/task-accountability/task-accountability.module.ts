import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { TaskAccountabilityRoutingModule } from './task-accountability-routing.module';
import { DropdownModule } from 'primeng/dropdown';

// Pages
import { TaskAccountabilityDashboardComponent } from './pages/task-accountability-dashboard/task-accountability-dashboard.component';
import { RoleTemplatesComponent } from './pages/role-templates/role-templates.component';
import { TemplateAssignmentComponent } from './pages/template-assignment/template-assignment.component';
import { WeeklyAccountabilityComponent } from './pages/weekly-accountability/weekly-accountability.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { WeeklyTemplatesComponent } from './pages/weekly-templates/weekly-templates.component';
import { WeeklyTemplateEditDialogComponent } from './pages/weekly-templates/weekly-template-edit-dialog.component';

// Components
import { EmployeeTreeComponent } from './components/employee-tree/employee-tree.component';
import { WorkflowProgressComponent } from './components/workflow-progress/workflow-progress.component';
import { TaskTableComponent } from './components/task-table/task-table.component';
import { TaskDetailsDrawerComponent } from './components/task-details-drawer/task-details-drawer.component';
import { TaskAccountabilityShellComponent } from './components/task-accountability-shell/task-accountability-shell.component';
import { TaskCreateDrawerComponent } from './components/task-create-drawer/task-create-drawer.component';
import { SendBackReasonDialogComponent } from './components/send-back-reason-dialog/send-back-reason-dialog.component';

@NgModule({
  declarations: [
    TaskAccountabilityDashboardComponent,
    RoleTemplatesComponent,
    TemplateAssignmentComponent,
    WeeklyAccountabilityComponent,
    ReportsComponent,
    EmployeeTreeComponent,
    WorkflowProgressComponent,
    TaskTableComponent,
    TaskDetailsDrawerComponent,
    TaskAccountabilityShellComponent,
    TaskCreateDrawerComponent,
    SendBackReasonDialogComponent,
    WeeklyTemplatesComponent,
    WeeklyTemplateEditDialogComponent
  ],
  imports: [
    SharedModule,
    TaskAccountabilityRoutingModule,
    DropdownModule
  ]
})
export class TaskAccountabilityModule { }