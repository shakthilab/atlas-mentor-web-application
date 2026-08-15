import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class AppSideLoginComponent {
  mode: 'login' | 'forgot-password' | 'reset-password' = 'login';
  form: FormGroup;
  forgotForm: FormGroup;
  resetForm: FormGroup;
  loading = false;
  error = '';
  successMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;
  token = '';
  greeting = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
  ) {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    this.form = this.fb.group({
      email: [rememberedEmail || '', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [!!rememberedEmail]
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Determine the mode based on the current route path
    const path = this.route.snapshot.url[0]?.path;
    if (path === 'forgot-password') {
      this.mode = 'forgot-password';
    } else if (path === 'reset-password') {
      this.mode = 'reset-password';
      this.token = this.route.snapshot.queryParams['token'] || '';
    }

    // Already logged in — redirect (only for login mode)
    if (this.mode === 'login' && this.authService.isAuthenticated()) {
      this.authService.redirectByRole();
    }

    this.greeting = this.getGreeting();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
  get forgotEmail() { return this.forgotForm.get('email')!; }
  get resetPasswordInput() { return this.resetForm.get('password')!; }
  get confirmPasswordInput() { return this.resetForm.get('confirmPassword')!; }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmControl = control.get('confirmPassword');
    if (!confirmControl) return null;
    const confirm = confirmControl.value;
    if (password && confirm && password !== confirm) {
      confirmControl.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmControl.hasError('passwordMismatch')) {
        confirmControl.setErrors(null);
      }
      return null;
    }
  }

  getResetPasswordStrength(): number {
    const val = this.resetPasswordInput?.value || '';
    if (!val) return 0;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  }

  getResetStrengthClass(): string {
    const score = this.getResetPasswordStrength();
    if (score <= 1) return 'weak';
    if (score === 2) return 'fair';
    if (score === 3) return 'good';
    return 'strong';
  }

  getResetStrengthLabel(): string {
    const score = this.getResetPasswordStrength();
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong';
  }

  onSubmit(): void {
    this.error = '';
    this.successMessage = '';

    if (this.mode === 'login') {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
      this.loading = true;
      this.authService.login(this.form.value).subscribe({
        next: () => {
          if (this.form.value.rememberMe) {
            localStorage.setItem('rememberedEmail', this.form.value.email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          this.notificationService.showSuccessToast('Successfully signed in.', 'Welcome Back');
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.handleError(err);
          if (this.error === 'Please verify your email before logging in') {
            this.notificationService.showUnverifiedEmailPopup(
              'Please verify your email before logging in. If you did not receive the email, you can request a new verification link.',
              'Verification Required',
              'Dismiss'
            ).subscribe((res) => {
              if (res === 'resend') {
                this.loading = true;
                this.authService.resendVerification(this.form.value.email).subscribe({
                  next: () => {
                    this.loading = false;
                    this.notificationService.showSuccessPopup(
                      'A new verification link has been sent to your email address. Please check your inbox.',
                      'Verification Email Sent',
                      'OK'
                    );
                  },
                  error: (resendErr) => {
                    this.loading = false;
                    const resendErrorMsg = resendErr?.error?.message || 'Failed to resend verification link.';
                    this.notificationService.showErrorToast(resendErrorMsg, 'Error');
                  }
                });
              }
            });
          } else {
            this.notificationService.showErrorToast(this.error, 'Login Failed');
          }
        },
      });
    } else if (this.mode === 'forgot-password') {
      if (this.forgotForm.invalid) {
        this.forgotForm.markAllAsTouched();
        return;
      }
      this.loading = true;
      this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
        next: () => {
          const msg = 'A password reset link has been sent to your email address.';
          this.successMessage = msg;
          this.loading = false;
          this.notificationService.showSuccessPopup(
            'We sent a reset link to your email. Please check your inbox.',
            'Recovery Email Sent',
            'Back to Login'
          ).subscribe(() => {
            this.router.navigate(['/auth/login']);
          });
        },
        error: (err) => {
          this.handleError(err);
          this.notificationService.showErrorToast(this.error, 'Request Failed');
        },
      });
    } else if (this.mode === 'reset-password') {
      if (this.resetForm.invalid) {
        this.resetForm.markAllAsTouched();
        return;
      }
      if (!this.token) {
        this.error = 'Invalid or missing password reset token.';
        this.notificationService.showErrorToast(this.error, 'Invalid Token');
        return;
      }
      this.loading = true;
      this.authService.resetPassword(this.resetForm.value.password, this.token).subscribe({
        next: () => {
          const msg = 'Your password has been successfully reset.';
          this.successMessage = msg;
          this.loading = false;
          this.notificationService.showSuccessPopup(
            'Your account password has been updated. You can now log in.',
            'Password Reset Complete',
            'Proceed to Login',
            'check'
          ).subscribe(() => {
            this.router.navigate(['/auth/login']);
          });
        },
        error: (err) => {
          this.handleError(err);
        },
      });
    }
  }

  private handleError(err: any): void {
    this.loading = false;
    if (err?.status === 429) {
      this.error = err?.error?.message || 'Too many attempts. Please try again later.';
    } else {
      this.error = err?.error?.message || 'An error occurred. Please try again.';
    }
  }
}
