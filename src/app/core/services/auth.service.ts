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
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    if (storedToken === 'undefined' || storedToken === 'null') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
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
          localStorage.setItem(this.TOKEN_KEY, d.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        })
      );
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(password: string, token: string): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { password, token });
  }

  logout(): void {
    this.clearSession();
    this.navigateToLogin();
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']).then(
      (navigated) => {
        if (!navigated) {
          window.location.href = '/auth/login';
        }
      },
      (error) => {
        console.error('Navigation to login failed, falling back to window redirect:', error);
        window.location.href = '/auth/login';
      }
    ).catch(() => {
      window.location.href = '/auth/login';
    });
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
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
