import { Routes } from '@angular/router';
import { CompanyDashboardComponent } from './dashboard/company-dashboard.component';
import { LeadsComponent } from '../../shared/components/leads/leads.component';
import { StudentsComponent } from '../../shared/components/students/students.component';
import { PaymentsComponent } from '../../shared/components/payments/payments.component';
import { ResourcesComponent } from '../../shared/components/resources/resources.component';

export const companyRoutes: Routes = [
  { path: '', component: CompanyDashboardComponent },
  { path: 'leads', component: LeadsComponent, data: { title: 'Leads' } },
  { path: 'students', component: StudentsComponent, data: { title: 'Students' } },
  { path: 'payments', component: PaymentsComponent, data: { title: 'Payments' } },
  { path: 'resources', component: ResourcesComponent, data: { title: 'Resources' } },
];
