import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, from, firstValueFrom } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { SessionTimeoutDialogComponent } from '../../shared/components/session-timeout-dialog/session-timeout-dialog.component';
import { NotificationService } from '../services/notification.service';

const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/verify-email',
  '/api/auth/reset-password',
  '/api/auth/resend-verification',
  '/api/students/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/mobile-country-codes',
  '/api/countries',
  '/api/universities',
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private sessionDialogOpen = false;
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Force withCredentials: true on every request (required for future cookie-based auth)
    let clonedReq = req.clone({ withCredentials: true });

    const isPublic = PUBLIC_ENDPOINTS.some((url) => clonedReq.url.includes(url));
    if (isPublic) return next.handle(clonedReq);

    const token = this.authService.getToken();
    if (token && token !== 'undefined' && token !== 'null') {
      clonedReq = this.addTokenHeader(clonedReq, token);
    }

    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Detect malformed/invalid JWT token error format
        const isMalformedToken =
          error.error?.error === 'Malformed JWT token' ||
          error.error?.error === 'Invalid JWT signature' ||
          (typeof error.error?.message === 'string' &&
            (error.error.message.includes('Invalid JWT format') ||
             error.error.message.includes('Token must contain exactly 2 period separators') ||
             error.error.message.includes('Token signature is invalid') ||
             error.error.message.includes('Invalid JWT signature')));

        if (isMalformedToken) {
          this.triggerSessionTimeout();
          return throwError(() => error);
        }

        // ── 401 Unauthorized ──────────────────────────────────────────────────
        if (error.status === 401) {
          const apiErrorCode = error.error?.code;

          if (apiErrorCode === 'INVALID_TOKEN_SIGNATURE') {
            // Security Threat: toast + silent hard logout
            this.notificationService.showErrorToast(
              'Security Alert: Invalid token signature detected.',
              'Security Alert'
            );
            this.authService.handleSecurityThreat();
            return throwError(() => error);
          } else {
            // Existing session expired logic (silent refresh / modal popup)
            return this.handle401Error(clonedReq, next, error);
          }
        }

        // ── 403 Forbidden ─────────────────────────────────────────────────────
        if (error.status === 403) {
          // Check for signature verification failure on 403 (fallback if backend not updated)
          const isSignatureError =
            error.error?.error === 'Invalid JWT signature' ||
            (typeof error.error?.message === 'string' && error.error.message.includes('Token signature is invalid'));

          if (isSignatureError) {
            this.triggerSessionTimeout();
            return throwError(() => error);
          }

          const warningMessage = error.error?.message || 'Access Denied';
          this.notificationService.showWarningToast(warningMessage, 'Access Denied');
          return throwError(() => error);
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

      return from(this.refreshAcrossTabs(refreshToken)).pipe(
        switchMap((accessToken) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(accessToken);
          return next.handle(this.addTokenHeader(request, accessToken));
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

  /**
   * Serializes /api/auth/refresh calls across every tab, not just this one.
   * The backend rotates refresh tokens and treats reuse of an already-rotated
   * token as theft (revoking every session for the user), so two tabs racing
   * to refresh with the same stale token would otherwise nuke the whole
   * session. If another tab already refreshed while we waited for the lock,
   * we reuse its result instead of sending a second, now-stale request.
   */
  private async refreshAcrossTabs(staleRefreshToken: string): Promise<string> {
    const doRefresh = () => firstValueFrom(this.authService.refreshToken()).then((res) => res.token);

    if (!('locks' in navigator)) {
      return doRefresh();
    }

    return (navigator as any).locks.request('auth-refresh-lock', async () => {
      const currentRefreshToken = localStorage.getItem('refreshToken');
      const currentAccessToken = localStorage.getItem('accessToken');
      if (currentRefreshToken !== staleRefreshToken && currentAccessToken) {
        return currentAccessToken;
      }
      return doRefresh();
    });
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
