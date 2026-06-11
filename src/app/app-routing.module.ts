import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './core/guards/auth.guard';
import { HomeComponent } from './features/home/home.component';

const routes: Routes = [
  // ── Public / Auth routes (lazy-loaded via AuthenticationModule) ───────────
  {
    path: 'auth',
    component: BlankComponent,
    loadChildren: () =>
      import('./features/authentication/authentication.module').then(
        (m) => m.AuthenticationModule
      ),
  },

  // ── Protected routes (require active user) ────────────────────────────────
  {
    path: '',
    component: FullComponent,
    canActivate: [AuthGuard],
    children: [
      // Root — redirect hub (redirects to role dashboard)
      { path: '', component: HomeComponent },

      // ADMIN
      {
        path: 'admin',
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN'] },
        loadChildren: () =>
          import('./features/admin/admin.module').then((m) => m.AdminModule),
      },

      // STUDENT
      {
        path: 'student',
        canActivate: [AuthGuard],
        data: { roles: ['STUDENT'] },
        loadChildren: () =>
          import('./features/student/student.module').then((m) => m.StudentModule),
      },

      // EMPLOYEE / SENIOR_COUNSELLOR / JUNIOR_COUNSELLOR
      {
        path: 'employee',
        canActivate: [AuthGuard],
        data: { roles: ['EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'] },
        loadChildren: () =>
          import('./features/employee/employee.module').then((m) => m.EmployeeModule),
      },

      // MANAGER
      {
        path: 'manager',
        canActivate: [AuthGuard],
        data: { roles: ['MANAGER'] },
        loadChildren: () =>
          import('./features/manager/manager.module').then((m) => m.ManagerModule),
      },

      // BRANCH_PARTNER
      {
        path: 'branch-partner',
        canActivate: [AuthGuard],
        data: { roles: ['BRANCH_PARTNER'] },
        loadChildren: () =>
          import('./features/branch-partner/branch-partner.module').then(
            (m) => m.BranchPartnerModule
          ),
      },

      // COMPANY
      {
        path: 'company',
        canActivate: [AuthGuard],
        data: { roles: ['COMPANY'] },
        loadChildren: () =>
          import('./features/company/company.module').then((m) => m.CompanyModule),
      },

      // REFERRAL
      {
        path: 'referral',
        canActivate: [AuthGuard],
        data: { roles: ['REFERRAL'] },
        loadChildren: () =>
          import('./features/referral/referral.module').then((m) => m.ReferralModule),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '/' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
