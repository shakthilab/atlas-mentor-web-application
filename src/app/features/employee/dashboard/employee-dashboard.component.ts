import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-employee-dashboard',
  template: `
    <!-- Counsellors get the full analytics dashboard, scoped to their own data by the API -->
    <app-admin-dashboard *ngIf="isCounsellor"></app-admin-dashboard>

    <!-- Everyone else (generic employee, video editor, web dev, etc.) keeps the simple greeting -->
    <div class="row" *ngIf="!isCounsellor">
      <div class="col-12">
        <mat-card class="cardWithShadow">
          <mat-card-content class="p-24">
            <mat-card-title>{{ greeting }}</mat-card-title>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class EmployeeDashboardComponent implements OnInit {
  public greeting = '';
  public isCounsellor = false;

  private static readonly COUNSELLOR_ROLES = ['SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'];

  constructor(private authService: AuthService, private translate: TranslateService) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    let userName = this.translate.instant('common.user');
    if (user) {
      userName = user.name || userName;
      const role = (user.role || '').toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      this.isCounsellor = (role === 'JUNIOR COUNSELLOR' || role === 'SENIOR COUNSELLOR');
    }
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? this.translate.instant('common.timeOfDay.morning')
      : hour < 17 ? this.translate.instant('common.timeOfDay.afternoon')
      : this.translate.instant('common.timeOfDay.evening');
    this.greeting = this.translate.instant('common.greetingWithName', { timeOfDay, name: userName });
  }
}
