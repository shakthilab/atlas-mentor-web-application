import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

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
            <mat-card-title>{{ greeting }}, {{ userName }}!</mat-card-title>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class EmployeeDashboardComponent implements OnInit {
  public greeting = '';
  public userName = '';
  public isCounsellor = false;

  private static readonly COUNSELLOR_ROLES = ['SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name || 'User';
      const role = (user.role || '').toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      this.isCounsellor = (role === 'JUNIOR COUNSELLOR' || role === 'SENIOR COUNSELLOR');
    }
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good morning';
    else if (hour < 17) this.greeting = 'Good afternoon';
    else this.greeting = 'Good evening';
  }
}
