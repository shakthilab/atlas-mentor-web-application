import { Routes } from '@angular/router';
import { BranchPartnerDashboardComponent } from './dashboard/branch-partner-dashboard.component';
import { ComingSoonComponent } from '../../shared/components/coming-soon/coming-soon.component';
import { SettingsComponent } from '../../shared/components/settings/settings.component';
import { LeadsComponent } from '../../shared/components/leads/leads.component';
import { StudentsComponent } from '../../shared/components/students/students.component';
import { EmployeesComponent } from '../../shared/components/employees/employees.component';
import { TasksComponent } from '../../shared/components/tasks/tasks.component';
import { HierarchyComponent } from '../../shared/components/hierarchy/hierarchy.component';
import { ReferralsComponent } from '../../shared/components/referrals/referrals.component';
import { CompaniesComponent } from '../../shared/components/companies/companies.component';
import { ResourcesComponent } from '../../shared/components/resources/resources.component';
import { BranchesComponent } from '../../shared/components/branches/branches.component';

export const branchPartnerRoutes: Routes = [
  { path: '', component: BranchPartnerDashboardComponent },
  { path: 'tasks', component: TasksComponent, data: { title: 'Tasks' } },
  { path: 'leads', component: LeadsComponent, data: { title: 'Leads' } },
  { path: 'students', component: StudentsComponent, data: { title: 'Students' } },
  { path: 'employees', component: EmployeesComponent, data: { title: 'Employees' } },
  { path: 'hierarchy', component: HierarchyComponent, data: { title: 'Hierarchy' } },
  { path: 'referrals', component: ReferralsComponent, data: { title: 'Referrals' } },
  { path: 'companies', component: CompaniesComponent, data: { title: 'Companies' } },
  { path: 'resources', component: ResourcesComponent, data: { title: 'Resources' } },
  { path: 'branches', component: BranchesComponent, data: { title: 'Branches' } },
  { path: 'documents', component: ComingSoonComponent, data: { title: 'Documents' } },
  { path: 'settings', component: SettingsComponent, data: { title: 'Settings' } },
];
