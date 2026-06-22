import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { ComingSoonComponent } from '../../shared/components/coming-soon/coming-soon.component';
import { SettingsComponent } from '../../shared/components/settings/settings.component';
import { LeadsComponent } from '../../shared/components/leads/leads.component';
import { StudentsComponent } from '../../shared/components/students/students.component';
import { EmployeesComponent } from '../../shared/components/employees/employees.component';
import { TasksComponent } from '../../shared/components/tasks/tasks.component';
import { PaymentsComponent } from '../../shared/components/payments/payments.component';
import { BranchesComponent } from '../../shared/components/branches/branches.component';
import { ReferralsComponent } from '../../shared/components/referrals/referrals.component';
import { CompaniesComponent } from '../../shared/components/companies/companies.component';
import { ResourcesComponent } from '../../shared/components/resources/resources.component';
import { HierarchyComponent } from '../../shared/components/hierarchy/hierarchy.component';
import { TasksV2Component } from '../../shared/components/tasks-v2/tasks-v2.component';


export const adminRoutes: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: 'leads', component: LeadsComponent, data: { title: 'Leads' } },
  { path: 'students', component: StudentsComponent, data: { title: 'Students' } },
  { path: 'tasks', component: TasksComponent, data: { title: 'Tasks' } },
  { path: 'tasks-v2', component: TasksV2Component, data: { title: 'Tasks V2' } },
  { path: 'payments', component: PaymentsComponent, data: { title: 'Payments' } },
  { path: 'employees', component: EmployeesComponent, data: { title: 'Employees' } },
  { path: 'hierarchy', component: HierarchyComponent, data: { title: 'Hierarchy' } },
  { path: 'branches', component: BranchesComponent, data: { title: 'Branches' } },
  { path: 'referrals', component: ReferralsComponent, data: { title: 'Referrals' } },
  { path: 'companies', component: CompaniesComponent, data: { title: 'Companies' } },
  { path: 'resources', component: ResourcesComponent, data: { title: 'Resources' } },
  { path: 'documents', component: ComingSoonComponent, data: { title: 'Documents' } },
  { path: 'settings', component: SettingsComponent, data: { title: 'Settings' } },
];
