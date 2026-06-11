import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.currentUserValue;

    // Step 1 — authentication + active status check
    if (!user || user.status !== 'ACTIVE') {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    // Step 2 — role authorization check
    const allowedRoles: string[] | undefined = route.data['roles'];
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user.role.toUpperCase();
      const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

      // Special employee fallback — grant access if isEmployee === true
      // and the route permits the EMPLOYEE role
      if (normalizedAllowed.includes('EMPLOYEE') && user.isEmployee) {
        return true;
      }

      if (!normalizedAllowed.includes(userRole)) {
        this.router.navigate(['/']);
        return false;
      }
    }

    return true;
  }
}
