import { Component } from '@angular/core';

@Component({
  selector: 'app-student-dashboard',
  template: `
    <div class="row">
      <div class="col-12">
        <mat-card class="cardWithShadow">
          <mat-card-content class="p-24">
            <mat-card-title>Student Dashboard</mat-card-title>
            <mat-card-subtitle>Welcome to your student portal</mat-card-subtitle>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class StudentDashboardComponent {}
