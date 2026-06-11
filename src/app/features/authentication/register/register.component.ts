import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class AppSideRegisterComponent {
  currentStep = 1;
  loading = false;
  error = '';
  hidePassword = true;
  hideConfirm = true;

  // Phone country codes
  countryCodes = [
    { id: 1,  code: '+1',   flag: '🇺🇸', label: '+1 US' },
    { id: 2,  code: '+44',  flag: '🇬🇧', label: '+44 UK' },
    { id: 3,  code: '+91',  flag: '🇮🇳', label: '+91 IN' },
    { id: 4,  code: '+998', flag: '🇺🇿', label: '+998 UZ' },
    { id: 5,  code: '+61',  flag: '🇦🇺', label: '+61 AU' },
    { id: 6,  code: '+49',  flag: '🇩🇪', label: '+49 DE' },
    { id: 7,  code: '+33',  flag: '🇫🇷', label: '+33 FR' },
    { id: 8,  code: '+86',  flag: '🇨🇳', label: '+86 CN' },
    { id: 9,  code: '+971', flag: '🇦🇪', label: '+971 UAE' },
    { id: 10, code: '+966', flag: '🇸🇦', label: '+966 SA' },
  ];

  // Step 1 — Account
  step1 = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    mobileCountryCodeId: [3, Validators.required],
    phone:     ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatch });

  // Step 2 — Preferences
  step2 = this.fb.group({
    countryId:    [null as number | null, Validators.required],
    universityId: [null as number | null],
    course:       ['', Validators.required],
    intake:       [''],
  });

  // Step 3 — Details (all optional)
  step3 = this.fb.group({
    referralCode:        [''],
    basicAcademicDetails:[''],
    optionalNotes:       [''],
  });

  // Sample countries (replace with API call)
  countries = [
    { id: 1,  name: 'United States' },
    { id: 2,  name: 'United Kingdom' },
    { id: 3,  name: 'Canada' },
    { id: 4,  name: 'Australia' },
    { id: 5,  name: 'Germany' },
    { id: 6,  name: 'France' },
    { id: 7,  name: 'India' },
    { id: 8,  name: 'Uzbekistan' },
    { id: 9,  name: 'UAE' },
    { id: 10, name: 'China' },
  ];

  courses = ['MBBS', 'BDS', 'MD', 'BAMS', 'BHMS', 'B.Pharm', 'B.Sc Nursing', 'MBA', 'Engineering', 'Other'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  get s1() { return this.step1.controls; }
  get s2() { return this.step2.controls; }

  next(): void {
    if (this.currentStep === 1) {
      this.step1.markAllAsTouched();
      if (this.step1.invalid) return;
    }
    if (this.currentStep === 2) {
      this.step2.markAllAsTouched();
      if (this.step2.invalid) return;
    }
    this.currentStep++;
  }

  back(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  onSubmit(): void {
    this.step3.markAllAsTouched();
    if (this.step1.invalid || this.step2.invalid) {
      this.error = 'Please complete all required fields.';
      return;
    }

    this.loading = true;
    this.error = '';

    const { confirmPassword, ...accountFields } = this.step1.value as any;

    const payload = {
      ...accountFields,
      ...this.step2.value,
      ...this.step3.value,
      notes: this.step3.value.optionalNotes,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.router.navigate(['/auth/login'], {
          queryParams: { registered: 'true' },
        });
      },
      error: (err) => {
        this.error = err?.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      },
    });
  }
}
