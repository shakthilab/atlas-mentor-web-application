import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';

import { TaskAccountabilityService } from '../../services/task-accountability.service';

@Component({
  selector: 'app-task-accountability-shell',
  templateUrl: './task-accountability-shell.component.html',
  styleUrls: ['./task-accountability-shell.component.scss']
})
export class TaskAccountabilityShellComponent implements OnInit, OnDestroy {
  isAdminOrManager = false;
  isAdminTreeRole = false;
  isTreeVisible = false;
  private routerSubscription: Subscription = Subscription.EMPTY;

  constructor(
    private authService: AuthService,
    private service: TaskAccountabilityService,
    private router: Router
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isTreeVisible = false; // Auto-close sidebar on screen navigation/employee selection
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.isAdminOrManager = user.role === 'ADMIN' || user.role === 'MANAGER';
      this.isAdminTreeRole = this.service.isAdminTreeRole(user.role);
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  toggleTree(): void {
    this.isTreeVisible = !this.isTreeVisible;
  }
}