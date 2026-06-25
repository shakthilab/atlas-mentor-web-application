import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { User, LoginRequest, ApiLoginResponse, UserRole } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'educrm-token';
  private readonly USER_KEY = 'educrm-user';

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private readonly roleRouteMap: Record<string, string> = {
    ADMIN: '/admin',
    STUDENT: '/student',
    EMPLOYEE: '/employee',
    SENIOR_COUNSELLOR: '/employee',
    JUNIOR_COUNSELLOR: '/employee',
    MANAGER: '/manager',
    BRANCH_PARTNER: '/branch-partner',
    COMPANY: '/company',
    REFERRAL: '/referral',
    ADMINISTRATIVE_ASSISTANT: '/manager',
  };

  constructor(private http: HttpClient, private router: Router) {
    // Clear any stale "undefined"/"null" string tokens from bad previous sessions
    const storedToken = localStorage.getItem('accessToken') || localStorage.getItem(this.TOKEN_KEY);
    if (storedToken === 'undefined' || storedToken === 'null') {
      this.clearSession();
    }

    const stored = localStorage.getItem(this.USER_KEY);
    const user: User | null = stored ? JSON.parse(stored) : null;
    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  register(payload: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/students/register`, payload);
  }

  saveTokens(token: string, refreshToken: string): void {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .post<ApiLoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        map((res) => {
          const d = res.data;
          const user: User = {
            id: String(d.userId),
            name: d.name,
            email: d.email,
            role: d.role,
            status: 'ACTIVE', // successful login always means active
            isEmployee: d.employee,
            token: d.token,
          };
          this.saveTokens(d.token, d.refreshToken);
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        })
      );
  }

  refreshToken(): Observable<{ token: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<any>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      map((res) => {
        const d = res.data || res;
        const newTokens = {
          token: d.token,
          refreshToken: d.refreshToken
        };
        this.saveTokens(newTokens.token, newTokens.refreshToken);

        const stored = localStorage.getItem(this.USER_KEY);
        if (stored) {
          try {
            const user = JSON.parse(stored);
            user.token = newTokens.token;
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            this.currentUserSubject.next(user);
          } catch (e) {
            console.error('Error syncing refreshed token in user object', e);
          }
        }

        return newTokens;
      })
    );
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(password: string, token: string): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { password, token });
  }

  resendVerification(email: string): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/auth/resend-verification`, { email });
  }

  verifyEmail(token: string): Observable<unknown> {
    return this.http.get(`${environment.apiUrl}/auth/verify-email`, { params: { token } });
  }

  logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken })
        .subscribe({
          next: () => console.log('Session revoked successfully'),
          error: (err) => console.error('Failed to revoke session on server', err)
        });
    }
    this.clearSession();
    this.navigateToLogin();
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  handleSecurityThreat(): void {
    this.clearSession();
    this.navigateToLogin();
  }

  navigateToLogin(): void {
    const currentUrl = this.router.url;
    const queryParams = (currentUrl && !currentUrl.includes('/auth/')) ? { returnUrl: currentUrl } : {};

    this.router.navigate(['/auth/login'], { queryParams }).then(
      (navigated) => {
        if (!navigated) {
          const paramsString = queryParams.returnUrl ? `?returnUrl=${encodeURIComponent(queryParams.returnUrl)}` : '';
          window.location.href = `/auth/login${paramsString}`;
        }
      },
      (error) => {
        console.error('Navigation to login failed, falling back to window redirect:', error);
        const paramsString = queryParams.returnUrl ? `?returnUrl=${encodeURIComponent(queryParams.returnUrl)}` : '';
        window.location.href = `/auth/login${paramsString}`;
      }
    ).catch(() => {
      const paramsString = queryParams.returnUrl ? `?returnUrl=${encodeURIComponent(queryParams.returnUrl)}` : '';
      window.location.href = `/auth/login${paramsString}`;
    });
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken') || localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const user = this.currentUserValue;
    return !!user && user.status === 'ACTIVE';
  }

  redirectByRole(): void {
    const user = this.currentUserValue;
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }
    const route = this.roleRouteMap[user.role as string] ?? '/auth/login';
    this.router.navigate([route]);
  }

  getRoleRoute(role: UserRole): string {
    return this.roleRouteMap[role] ?? '/auth/login';
  }
}
