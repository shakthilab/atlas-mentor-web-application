import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../shared/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';
import { StudentDashboardComponent } from './dashboard/student-dashboard.component';
import { studentRoutes } from './student.routes';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [StudentDashboardComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(studentRoutes),
    MaterialModule,
    TranslateModule,
    TablerIconsModule.pick(TablerIcons),
    SharedModule,
  ],
})
export class StudentModule {}
