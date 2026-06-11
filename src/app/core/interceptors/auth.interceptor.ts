import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { SessionTimeoutDialogComponent } from '../../shared/components/session-timeout-dialog/session-timeout-dialog.component';

const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/verify-email',
  '/api/auth/reset-password',
  '/api/students/register',
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private sessionDialogOpen = false;

  constructor(private authService: AuthService, private dialog: MatDialog) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isPublic = PUBLIC_ENDPOINTS.some((url) => req.url.includes(url));
    if (isPublic) return next.handle(req);

    const token = this.authService.getToken();
    if (token && token !== 'undefined' && token !== 'null') {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const isSessionTimeout =
          error.status === 401 &&
          (error.error?.error === 'Session timeout' ||
            error.error?.message?.toLowerCase().includes('expired') ||
            error.error?.message?.toLowerCase().includes('token'));

        if (isSessionTimeout && !this.sessionDialogOpen) {
          this.sessionDialogOpen = true;
          // Clear local session immediately
          this.authService.clearSession();

          const dialogRef = this.dialog.open(SessionTimeoutDialogComponent, {
            width: '380px',
            disableClose: true,
            panelClass: 'session-timeout-dialog-panel',
          });

          dialogRef.afterClosed().subscribe(() => {
            this.sessionDialogOpen = false;
            this.authService.navigateToLogin();
          });
        }

        return throwError(() => error);
      })
    );
  }
}
