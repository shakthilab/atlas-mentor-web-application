import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-student-dashboard',
  template: `
    <div class="row">
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
export class StudentDashboardComponent implements OnInit {
  public greeting = '';

  constructor(private authService: AuthService, private translate: TranslateService) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    const userName = user?.name || this.translate.instant('common.user');
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? this.translate.instant('common.timeOfDay.morning')
      : hour < 17 ? this.translate.instant('common.timeOfDay.afternoon')
      : this.translate.instant('common.timeOfDay.evening');
    this.greeting = this.translate.instant('common.greetingWithName', { timeOfDay, name: userName });
  }
}
