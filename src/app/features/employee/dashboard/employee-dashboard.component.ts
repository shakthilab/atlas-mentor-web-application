import { Component } from '@angular/core';

@Component({
  selector: 'app-employee-dashboard',
  template: `
    <div class="row">
      <div class="col-12">
        <mat-card class="cardWithShadow">
          <mat-card-content class="p-24">
            <mat-card-title>Employee Dashboard</mat-card-title>
            <mat-card-subtitle>Welcome to your workspace</mat-card-subtitle>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class EmployeeDashboardComponent {}
