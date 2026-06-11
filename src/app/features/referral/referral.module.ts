import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { ReferralDashboardComponent } from './dashboard/referral-dashboard.component';
import { referralRoutes } from './referral.routes';

@NgModule({
  declarations: [ReferralDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(referralRoutes), TranslateModule],
})
export class ReferralModule {}
