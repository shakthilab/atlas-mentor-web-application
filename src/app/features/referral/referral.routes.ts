import { Routes } from '@angular/router';
import { ReferralDashboardComponent } from './dashboard/referral-dashboard.component';
import { LeadsComponent } from '../../shared/components/leads/leads.component';
import { StudentsComponent } from '../../shared/components/students/students.component';
import { PaymentsComponent } from '../../shared/components/payments/payments.component';
import { ResourcesComponent } from '../../shared/components/resources/resources.component';

export const referralRoutes: Routes = [
  { path: '', component: ReferralDashboardComponent },
  { path: 'leads', component: LeadsComponent, data: { title: 'Leads' } },
  { path: 'students', component: StudentsComponent, data: { title: 'Students' } },
  { path: 'payments', component: PaymentsComponent, data: { title: 'Payments' } },
  { path: 'resources', component: ResourcesComponent, data: { title: 'Resources' } },
];
