import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { BranchPartnerDashboardComponent } from './dashboard/branch-partner-dashboard.component';
import { branchPartnerRoutes } from './branch-partner.routes';

@NgModule({
  declarations: [BranchPartnerDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(branchPartnerRoutes), TranslateModule],
})
export class BranchPartnerModule {}
