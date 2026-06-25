import { Routes } from '@angular/router';
import { EmployeeDashboardComponent } from './dashboard/employee-dashboard.component';
import { ComingSoonComponent } from '../../shared/components/coming-soon/coming-soon.component';
import { SettingsComponent } from '../../shared/components/settings/settings.component';
import { LeadsComponent } from '../../shared/components/leads/leads.component';
import { StudentsComponent } from '../../shared/components/students/students.component';
import { TasksComponent } from '../../shared/components/tasks/tasks.component';
import { ResourcesComponent } from '../../shared/components/resources/resources.component';

export const employeeRoutes: Routes = [
  { path: '', component: EmployeeDashboardComponent },
  { path: 'tasks', component: TasksComponent, data: { title: 'Tasks' } },
  { path: 'leads', component: LeadsComponent, data: { title: 'Leads' } },
  { path: 'students', component: StudentsComponent, data: { title: 'Students' } },
  { path: 'resources', component: ResourcesComponent, data: { title: 'Resources' } },
  { path: 'settings', component: SettingsComponent, data: { title: 'Settings' } },
];
