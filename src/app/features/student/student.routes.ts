import { Routes } from '@angular/router';
import { StudentDashboardComponent } from './dashboard/student-dashboard.component';
import { ComingSoonComponent } from '../../shared/components/coming-soon/coming-soon.component';

export const studentRoutes: Routes = [
  { path: '', component: StudentDashboardComponent },
  { path: 'profile', component: ComingSoonComponent, data: { title: 'Profile' } },
  { path: 'documents', component: ComingSoonComponent, data: { title: 'Documents' } },
];
