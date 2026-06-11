import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { EmployeeDashboardComponent } from './dashboard/employee-dashboard.component';
import { employeeRoutes } from './employee.routes';

@NgModule({
  declarations: [EmployeeDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(employeeRoutes), TranslateModule],
})
export class EmployeeModule {}
