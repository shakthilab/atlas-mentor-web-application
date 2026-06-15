import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { adminRoutes } from './admin.routes';

@NgModule({
  declarations: [],
  imports: [
    SharedModule,
    RouterModule.forChild(adminRoutes),
    TranslateModule
  ],
})
export class AdminModule {}
