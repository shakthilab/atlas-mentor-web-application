import { Component, Input } from '@angular/core';
import { NavItem } from './nav-item';
import { Router } from '@angular/router';
import { NavService } from '../../../../core/services/nav.service';

@Component({
  selector: 'app-nav-item',
  templateUrl: './nav-item.component.html',
  styleUrls: [],
})
export class AppNavItemComponent {
  @Input() item: NavItem | any;
  @Input() depth: any;

  constructor(public navService: NavService, public router: Router) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  isItemActive(route: string): boolean {
    if (!route) return false;

    // For main dashboards, require exact match to prevent false positives for sub-pages
    const exactRoutes = ['/employee', '/admin', '/manager', '/student'];
    if (exactRoutes.includes(route)) {
      return this.router.isActive(route, true);
    }

    // For other routes (e.g., /employee/task-accountability), match if the current path starts with the route
    const currentPath = this.router.url.split('?')[0];
    return currentPath.startsWith(route);
  }

  onItemSelected(item: NavItem) {
    if (!item.children || !item.children.length) {
      this.router.navigate([item.route]);
    }
 
    // scroll
    document.querySelector('.page-wrapper')?.scroll({
      top: 0,
      left: 0,
    });
  }
}
