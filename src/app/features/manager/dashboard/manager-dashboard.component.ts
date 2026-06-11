import { Component } from '@angular/core';

@Component({
  selector: 'app-manager-dashboard',
  template: `
    <div class="row">
      <div class="col-12">
        <mat-card class="cardWithShadow">
          <mat-card-content class="p-24">
            <mat-card-title>Manager Dashboard</mat-card-title>
            <mat-card-subtitle>Team overview and management</mat-card-subtitle>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class ManagerDashboardComponent {}
