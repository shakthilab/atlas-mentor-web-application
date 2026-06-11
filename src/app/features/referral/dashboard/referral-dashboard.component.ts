import { Component } from '@angular/core';

@Component({
  selector: 'app-referral-dashboard',
  template: `
    <div class="row">
      <div class="col-12">
        <mat-card class="cardWithShadow">
          <mat-card-content class="p-24">
            <mat-card-title>Referral Dashboard</mat-card-title>
            <mat-card-subtitle>Your referral activity overview</mat-card-subtitle>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class ReferralDashboardComponent {}
