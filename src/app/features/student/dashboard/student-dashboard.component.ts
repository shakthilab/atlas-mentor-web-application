import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  template: `
    <div class="row">
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
export class StudentDashboardComponent implements OnInit {
  public greeting = '';
  public userName = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name || 'User';
    }
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good morning';
    else if (hour < 17) this.greeting = 'Good afternoon';
    else this.greeting = 'Good evening';
  }
}
