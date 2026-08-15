import { HttpErrorResponse, HttpEvent, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor cross-tab refresh coordination', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let refreshCallCount: number;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('accessToken', 'expired-access-token');
    localStorage.setItem('refreshToken', 'stale-refresh-token');

    refreshCallCount = 0;

    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken', 'refreshToken', 'clearSession', 'navigateToLogin', 'handleSecurityThreat'
    ]);
    authServiceSpy.getToken.and.returnValue('expired-access-token');
    // Mirrors the real AuthService.refreshToken(): persists new tokens to localStorage on success.
    authServiceSpy.refreshToken.and.callFake(() => {
      refreshCallCount++;
      return of({ token: 'new-access-token', refreshToken: 'new-refresh-token' }).pipe(
        delay(30),
        tap((res) => {
          localStorage.setItem('accessToken', res.token);
          localStorage.setItem('refreshToken', res.refreshToken);
        })
      );
    });

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['showErrorToast', 'showWarningToast']);
  });

  afterEach(() => localStorage.clear());

  function makeInterceptor(): AuthInterceptor {
    return new AuthInterceptor(authServiceSpy, dialogSpy, notificationSpy);
  }

  /** Fails with 401 until the retried request carries the freshly-issued access token. */
  function makeHandler(): HttpHandler {
    return {
      handle: (req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
        if (req.headers.get('Authorization') === 'Bearer new-access-token') {
          return of(new HttpResponse({ status: 200, body: {} }));
        }
        return throwError(() => new HttpErrorResponse({ status: 401, url: req.url }));
      }
    };
  }

  it('serializes /api/auth/refresh across independent interceptor instances (simulating two browser tabs)', (done) => {
    // Two separate instances == two tabs: each has its own isRefreshing flag/BehaviorSubject,
    // but they share the same localStorage and the same real navigator.locks implementation.
    const interceptorA = makeInterceptor();
    const interceptorB = makeInterceptor();
    const handler = makeHandler();

    const reqA = new HttpRequest('GET', '/api/students');
    const reqB = new HttpRequest('GET', '/api/tasks');

    let doneA = false;
    let doneB = false;
    const finishIfBothDone = () => {
      if (doneA && doneB) {
        // The whole point of the fix: only one real network refresh should fire,
        // even though both tabs raced to refresh the same stale token.
        expect(refreshCallCount).toBe(1);
        expect(localStorage.getItem('accessToken')).toBe('new-access-token');
        done();
      }
    };

    interceptorA.intercept(reqA, handler).subscribe({
      next: () => { doneA = true; finishIfBothDone(); },
      error: (err) => done.fail(err)
    });

    interceptorB.intercept(reqB, handler).subscribe({
      next: () => { doneB = true; finishIfBothDone(); },
      error: (err) => done.fail(err)
    });
  });
});
