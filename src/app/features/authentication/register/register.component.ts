import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MasterDataService, MobileCountryCode } from '../../../core/services/master-data.service';
import { NotificationService } from '../../../core/services/notification.service';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
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

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class AppSideRegisterComponent implements OnInit {
  currentStep = 1;
  loading = false;
  error = '';
  hidePassword = true;
  hideConfirm = true;

  mobileCountryCodes: MobileCountryCode[] = [];
  showToast = false;
  toastTimeout: any = null;

  // Step 1 — Account
  step1 = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    mobileCountryCodeId: [null as number | null, Validators.required],
    phone:     ['', [Validators.required]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatch });

  // Step 2 — Preferences
  step2 = this.fb.group({
    countryId:    [null as number | null, Validators.required],
    universityId: [null as number | null],
    universityName: [''],
    course:       ['', Validators.required],
    intake:       [''],
  });

  // Step 3 — Details (all optional)
  step3 = this.fb.group({
    referralCode:        [''],
    basicAcademicDetails:[''],
    optionalNotes:       [''],
  });

  countries: any[] = [];
  universities: any[] = [];
  universitiesLoading = false;

  courses = ['MBBS', 'BDS', 'MD', 'BAMS', 'BHMS', 'B.Pharm', 'B.Sc Nursing'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private masterDataService: MasterDataService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.masterDataService.getMobileCountryCodes().subscribe({
      next: (res) => {
        this.mobileCountryCodes = res.data;
        const defaultMcc = this.mobileCountryCodes.find(m => m.mobileCode === '+91') || this.mobileCountryCodes[0];
        if (defaultMcc) {
          this.step1.patchValue({ mobileCountryCodeId: defaultMcc.id });
          this.updatePhoneValidators(defaultMcc);
        }
      }
    });

    this.masterDataService.getCountries().subscribe({
      next: (res) => {
        this.countries = res.data || [];
      }
    });

    this.step1.get('mobileCountryCodeId')?.valueChanges.subscribe(mccId => {
      const mcc = this.mobileCountryCodes.find(m => m.id === mccId);
      if (mcc) {
        this.updatePhoneValidators(mcc);
      }
    });

    this.step2.get('countryId')?.valueChanges.subscribe(countryId => {
      this.onCountryChange(countryId);
    });

    this.step2.get('universityId')?.valueChanges.subscribe(val => {
      const nameControl = this.step2.get('universityName');
      if (!nameControl) return;

      if (val === -1) {
        nameControl.setValidators([Validators.required]);
        nameControl.setValue('');
      } else {
        nameControl.clearValidators();
        const selectedUni = this.universities.find(u => u.id === val);
        if (selectedUni) {
          nameControl.setValue(selectedUni.name);
        } else {
          nameControl.setValue('');
        }
      }
      nameControl.updateValueAndValidity();
    });
  }

  onCountryChange(countryId: number | null): void {
    this.universities = [];
    this.step2.get('universityId')?.setValue(null);
    this.step2.get('universityName')?.setValue('');

    if (!countryId) return;

    this.universitiesLoading = true;
    this.masterDataService.getUniversitiesByCountry(countryId).subscribe({
      next: (res) => {
        this.universities = res.data || [];
        this.universitiesLoading = false;
      },
      error: () => {
        this.universitiesLoading = false;
      }
    });
  }

  updatePhoneValidators(mcc: MobileCountryCode): void {
    const phoneControl = this.step1.get('phone');
    if (!phoneControl) return;

    if (mcc.mobileNumberLength) {
      phoneControl.setValidators([
        Validators.required,
        Validators.minLength(mcc.mobileNumberLength),
        Validators.maxLength(mcc.mobileNumberLength)
      ]);
    } else {
      phoneControl.setValidators([
        Validators.required,
        Validators.pattern(/^\d{7,15}$/)
      ]);
    }
    phoneControl.updateValueAndValidity();
  }

  getSelectedMcc(): MobileCountryCode | undefined {
    const id = this.step1.get('mobileCountryCodeId')?.value;
    return this.mobileCountryCodes.find(m => m.id === id);
  }

  allowOnlyNumbers(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  showCountryRequiredToast(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.showToast = true;
    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  getPasswordStrength(): number {
    const val = this.step1.get('password')?.value || '';
    if (!val) return 0;

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  }

  getStrengthClass(): string {
    const score = this.getPasswordStrength();
    if (score <= 1) return 'weak';
    if (score === 2) return 'fair';
    if (score === 3) return 'good';
    return 'strong';
  }

  getStrengthLabel(): string {
    const score = this.getPasswordStrength();
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong';
  }

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

    const step2Value = { ...this.step2.value };
    if (step2Value.universityId === -1) {
      step2Value.universityId = null;
    }

    const payload = {
      ...accountFields,
      ...step2Value,
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
