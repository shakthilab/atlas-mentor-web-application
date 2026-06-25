import { Routes } from '@angular/router';

import { AppSideLoginComponent } from './login/login.component';
import { AppSideRegisterComponent } from './register/register.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';

export const AuthenticationRoutes: Routes = [
  { path: 'login', component: AppSideLoginComponent },
  { path: 'forgot-password', component: AppSideLoginComponent },
  { path: 'reset-password', component: AppSideLoginComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'register/student', component: AppSideRegisterComponent },
  { path: 'register', component: AppSideRegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
