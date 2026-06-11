import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { CompanyDashboardComponent } from './dashboard/company-dashboard.component';
import { companyRoutes } from './company.routes';

@NgModule({
  declarations: [CompanyDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(companyRoutes), TranslateModule],
})
export class CompanyModule {}
