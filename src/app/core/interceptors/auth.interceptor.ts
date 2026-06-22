import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { SessionTimeoutDialogComponent } from '../../shared/components/session-timeout-dialog/session-timeout-dialog.component';

const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/verify-email',
  '/api/auth/reset-password',
  '/api/students/register',
  '/api/auth/refresh',
  '/api/auth/logout',
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private sessionDialogOpen = false;
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService, private dialog: MatDialog) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isPublic = PUBLIC_ENDPOINTS.some((url) => req.url.includes(url));
    if (isPublic) return next.handle(req);

    const token = this.authService.getToken();
    let authReq = req;
    if (token && token !== 'undefined' && token !== 'null') {
      authReq = this.addTokenHeader(req, token);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        const isAuthError =
          error.status === 401 ||
          (error.status === 403 && (
            error.error?.message?.toLowerCase().includes('signature') ||
            error.error?.message?.toLowerCase().includes('token') ||
            error.error?.message?.toLowerCase().includes('expired') ||
            error.error?.error?.toLowerCase().includes('signature') ||
            error.error?.error?.toLowerCase().includes('token')
          ));

        if (isAuthError) {
          return this.handle401Error(authReq, next, error);
        }
        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler, originalError: HttpErrorResponse): Observable<HttpEvent<unknown>> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.triggerSessionTimeout();
      return throwError(() => originalError);
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((res) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(res.token);
          return next.handle(this.addTokenHeader(request, res.token));
        }),
        catchError((refreshError) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next('failed');
          this.triggerSessionTimeout();
          return throwError(() => refreshError);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap((token) => {
          if (token === 'failed') {
            return throwError(() => new HttpErrorResponse({
              error: 'Session expired',
              status: 401,
              statusText: 'Unauthorized'
            }));
          }
          return next.handle(this.addTokenHeader(request, token!));
        })
      );
    }
  }

  private triggerSessionTimeout(): void {
    if (!this.sessionDialogOpen) {
      this.sessionDialogOpen = true;
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
  }
}
