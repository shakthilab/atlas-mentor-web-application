import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskAccountabilityDashboardComponent } from './pages/task-accountability-dashboard/task-accountability-dashboard.component';
import { RoleTemplatesComponent } from './pages/role-templates/role-templates.component';
import { TemplateAssignmentComponent } from './pages/template-assignment/template-assignment.component';
import { WeeklyAccountabilityComponent } from './pages/weekly-accountability/weekly-accountability.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { TaskAccountabilityShellComponent } from './components/task-accountability-shell/task-accountability-shell.component';
import { WeeklyTemplatesComponent } from './pages/weekly-templates/weekly-templates.component';

const routes: Routes = [
  {
    path: '',
    component: TaskAccountabilityShellComponent,
    children: [
      { path: '', redirectTo: 'daily', pathMatch: 'full' },
      { path: 'daily', component: TaskAccountabilityDashboardComponent },
      { path: 'templates', component: RoleTemplatesComponent },
      { path: 'weekly-templates', component: WeeklyTemplatesComponent },
      { path: 'assignments', component: TemplateAssignmentComponent },
      { path: 'weekly', component: WeeklyAccountabilityComponent },
      { path: 'reports', component: ReportsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskAccountabilityRoutingModule { }