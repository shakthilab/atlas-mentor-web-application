import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';
import { NgxEchartsModule } from 'ngx-echarts';
import { AdminDashboardComponent, AnimatedNumberDirective } from '../features/admin/dashboard/admin-dashboard.component';
import { PartnerDashboardComponent } from './components/partner-dashboard/partner-dashboard.component';
import { ComingSoonComponent } from './components/coming-soon/coming-soon.component';
import { SettingsComponent } from './components/settings/settings.component';
import { LeadsComponent } from './components/leads/leads.component';
import { StudentsComponent } from './components/students/students.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';
import { NotificationDialogComponent } from './components/notification-dialog/notification-dialog.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { BranchesComponent } from './components/branches/branches.component';
import { ReferralsComponent } from './components/referrals/referrals.component';
import { CompaniesComponent } from './components/companies/companies.component';
import { ResourcesComponent } from './components/resources/resources.component';
import { HierarchyComponent } from './components/hierarchy/hierarchy.component';
import { HierarchyAssignDialogComponent } from './components/hierarchy/hierarchy-assign-dialog/hierarchy-assign-dialog.component';

@NgModule({
  declarations: [
    ComingSoonComponent,
    SettingsComponent,
    LeadsComponent,
    StudentsComponent,
    EmployeesComponent,
    NotificationToastComponent,
    NotificationDialogComponent,
    TasksComponent,
    PaymentsComponent,
    BranchesComponent,
    ReferralsComponent,
    CompaniesComponent,
    ResourcesComponent,
    HierarchyComponent,
    HierarchyAssignDialogComponent,
    AdminDashboardComponent,
    AnimatedNumberDirective,
    PartnerDashboardComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule.pick(TablerIcons),
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
  ],
  exports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    ComingSoonComponent,
    SettingsComponent,
    LeadsComponent,
    StudentsComponent,
    EmployeesComponent,
    NotificationToastComponent,
    NotificationDialogComponent,
    TasksComponent,
    PaymentsComponent,
    BranchesComponent,
    ReferralsComponent,
    CompaniesComponent,
    ResourcesComponent,
    HierarchyComponent,
    HierarchyAssignDialogComponent,
    AdminDashboardComponent,
    AnimatedNumberDirective,
    PartnerDashboardComponent,
    NgxEchartsModule,
  ],
})
export class SharedModule {}
