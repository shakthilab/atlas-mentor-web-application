import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { ManagerDashboardComponent } from './dashboard/manager-dashboard.component';
import { managerRoutes } from './manager.routes';

@NgModule({
  declarations: [ManagerDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(managerRoutes), TranslateModule],
})
export class ManagerModule {}
