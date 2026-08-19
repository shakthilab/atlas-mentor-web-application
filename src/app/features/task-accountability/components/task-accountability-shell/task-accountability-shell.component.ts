import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
export class TaskAccountabilityShellComponent implements OnInit, AfterViewInit, OnDestroy {
  isAdminOrManager = false;
  isAdminTreeRole = false;
  isTreeVisible = false;
  /** Branch Partner, Manager and Admin are the roles that can act on the approval workflow. */
  canReviewApprovals = false;
  private routerSubscription: Subscription = Subscription.EMPTY;

  @ViewChild('workspaceNav') workspaceNav?: ElementRef<HTMLElement>;

  constructor(
    private authService: AuthService,
    private service: TaskAccountabilityService,
    private router: Router
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isTreeVisible = false; // Auto-close sidebar on screen navigation/employee selection
      this.checkAndResetSelections();
      this.scrollActiveTabIntoView();
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.isAdminOrManager = user.role === 'ADMIN' || user.role === 'MANAGER';
      this.isAdminTreeRole = this.service.isAdminTreeRole(user.role);
      const role = (user.role || '').toUpperCase().trim();
      this.canReviewApprovals = ['ADMIN', 'MANAGER', 'BRANCH_PARTNER', 'ADMINISTRATIVE_ASSISTANT'].includes(role);
    }
    this.checkAndResetSelections();
  }

  ngAfterViewInit(): void {
    // Ensure the active tab (e.g. deep-linked route) is visible within the
    // horizontally-scrollable tab bar on smaller screens on first render.
    this.scrollActiveTabIntoView();
  }

  /** Keeps the currently active nav tab scrolled into view inside the (mobile) horizontal-scroll tab bar. */
  private scrollActiveTabIntoView(): void {
    setTimeout(() => {
      const nav = this.workspaceNav?.nativeElement;
      if (!nav) return;
      const activeTab = nav.querySelector<HTMLElement>('.nav-tab.active');
      activeTab?.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
  }

  private checkAndResetSelections(): void {
    const currentUrl = this.router.url;
    const isBaseRoute = currentUrl === '/admin/task-accountability' ||
                        currentUrl === '/admin/task-accountability/' ||
                        currentUrl === '/employee/task-accountability' ||
                        currentUrl === '/employee/task-accountability/' ||
                        currentUrl === '/manager/task-accountability' ||
                        currentUrl === '/manager/task-accountability/' ||
                        currentUrl === '/branch-partner/task-accountability' ||
                        currentUrl === '/branch-partner/task-accountability/';
    if (isBaseRoute) {
      this.service.resetSelections();
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  toggleTree(): void {
    this.isTreeVisible = !this.isTreeVisible;
  }
}