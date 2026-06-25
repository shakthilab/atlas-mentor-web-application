import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  status: 'verifying' | 'success' | 'error' = 'verifying';
  errorMessage: string = '';
  token: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.status = 'error';
        this.errorMessage = 'Verification token is missing. Please make sure you copied the entire URL from the email.';
      } else {
        this.verifyToken();
      }
    });
  }

  verifyToken(): void {
    this.status = 'verifying';
    this.authService.verifyEmail(this.token).subscribe({
      next: () => {
        this.status = 'success';
      },
      error: (err) => {
        this.status = 'error';
        this.errorMessage = err?.error?.message || 'Verification failed. The token may be invalid or expired.';
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
