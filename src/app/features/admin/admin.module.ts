import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { adminRoutes } from './admin.routes';

@NgModule({
  declarations: [AdminDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(adminRoutes), TranslateModule],
})
export class AdminModule {}
