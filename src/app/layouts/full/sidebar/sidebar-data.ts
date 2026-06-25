import { NavItem } from './nav-item/nav-item';
import { UserRole } from '../../../shared/models/user.model';

export const navItems: NavItem[] = [
  // ── ADMIN ──────────────────────────────────────────────────────────────────
  { navCap: 'nav.adminSection', roles: ['ADMIN'] },
  { displayName: 'nav.dashboard', iconName: 'layout-dashboard', route: '/admin', roles: ['ADMIN'] },
  { navCap: 'nav.management', roles: ['ADMIN'] },
  { displayName: 'nav.leads', iconName: 'target', route: '/admin/leads', roles: ['ADMIN'] },
  { displayName: 'nav.students', iconName: 'users', route: '/admin/students', roles: ['ADMIN'] },
  { displayName: 'nav.employees', iconName: 'user-check', route: '/admin/employees', roles: ['ADMIN'] },
  { displayName: 'nav.tasks', iconName: 'checklist', route: '/admin/tasks', roles: ['ADMIN'] },
  { displayName: 'nav.payments', iconName: 'credit-card', route: '/admin/payments', roles: ['ADMIN'] },

  { navCap: 'nav.organization', roles: ['ADMIN'] },
  { displayName: 'nav.branches', iconName: 'building', route: '/admin/branches', roles: ['ADMIN'] },
  { displayName: 'nav.companies', iconName: 'briefcase', route: '/admin/companies', roles: ['ADMIN'] },
  { displayName: 'nav.hierarchy', iconName: 'sitemap', route: '/admin/hierarchy', roles: ['ADMIN'] },
  { displayName: 'nav.referrals', iconName: 'user-plus', route: '/admin/referrals', roles: ['ADMIN'] },
  { navCap: 'nav.system', roles: ['ADMIN'] },
  { displayName: 'nav.documents', iconName: 'file-text', route: '/admin/documents', roles: ['ADMIN'] },
  { displayName: 'nav.resources', iconName: 'books', route: '/admin/resources', roles: ['ADMIN'] },

  { displayName: 'nav.settings', iconName: 'settings', route: '/admin/settings', roles: ['ADMIN'] },

  // ── STUDENT ────────────────────────────────────────────────────────────────
  { navCap: 'nav.studentSection', roles: ['STUDENT'] },
  { displayName: 'nav.dashboard', iconName: 'layout-dashboard', route: '/student', roles: ['STUDENT'] },
  { displayName: 'nav.profile', iconName: 'user', route: '/student/profile', roles: ['STUDENT'] },
  { displayName: 'nav.documents', iconName: 'file-text', route: '/student/documents', roles: ['STUDENT'] },

  // ── EMPLOYEE / COUNSELLORS ─────────────────────────────────────────────────
  { navCap: 'nav.employeeSection', roles: ['EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'] },
  { displayName: 'nav.dashboard', iconName: 'layout-dashboard', route: '/employee', roles: ['EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'] },
  { navCap: 'nav.work', roles: ['EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'] },
  { displayName: 'nav.leads', iconName: 'target', route: '/employee/leads', roles: ['EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'] },
  { displayName: 'nav.students', iconName: 'users', route: '/employee/students', roles: ['EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'] },
  { displayName: 'nav.tasks', iconName: 'checklist', route: '/employee/tasks', roles: ['EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'] },
  { displayName: 'nav.resources', iconName: 'books', route: '/employee/resources', roles: ['EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'] },
  { navCap: 'nav.account', roles: ['EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'] },
  { displayName: 'nav.settings', iconName: 'settings', route: '/employee/settings', roles: ['EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR'] },

  // ── MANAGER ────────────────────────────────────────────────────────────────
  { navCap: 'nav.managerSection', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.dashboard', iconName: 'layout-dashboard', route: '/manager', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { navCap: 'nav.management', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.leads', iconName: 'target', route: '/manager/leads', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.students', iconName: 'users', route: '/manager/students', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.employees', iconName: 'user-check', route: '/manager/employees', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.tasks', iconName: 'checklist', route: '/manager/tasks', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.referrals', iconName: 'user-plus', route: '/manager/referrals', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.companies', iconName: 'briefcase', route: '/manager/companies', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { navCap: 'nav.organization', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.branches', iconName: 'building', route: '/manager/branches', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.hierarchy', iconName: 'sitemap', route: '/manager/hierarchy', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.documents', iconName: 'file-text', route: '/manager/documents', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.resources', iconName: 'books', route: '/manager/resources', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },
  { displayName: 'nav.settings', iconName: 'settings', route: '/manager/settings', roles: ['MANAGER', 'ADMINISTRATIVE_ASSISTANT'] },

  // ── BRANCH PARTNER ─────────────────────────────────────────────────────────
  { navCap: 'nav.branchSection', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.dashboard', iconName: 'layout-dashboard', route: '/branch-partner', roles: ['BRANCH_PARTNER'] },
  { navCap: 'nav.management', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.leads', iconName: 'target', route: '/branch-partner/leads', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.students', iconName: 'users', route: '/branch-partner/students', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.employees', iconName: 'user-check', route: '/branch-partner/employees', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.tasks', iconName: 'checklist', route: '/branch-partner/tasks', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.referrals', iconName: 'user-plus', route: '/branch-partner/referrals', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.companies', iconName: 'briefcase', route: '/branch-partner/companies', roles: ['BRANCH_PARTNER'] },
  { navCap: 'nav.organization', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.branches', iconName: 'building', route: '/branch-partner/branches', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.hierarchy', iconName: 'sitemap', route: '/branch-partner/hierarchy', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.documents', iconName: 'file-text', route: '/branch-partner/documents', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.resources', iconName: 'books', route: '/branch-partner/resources', roles: ['BRANCH_PARTNER'] },
  { displayName: 'nav.settings', iconName: 'settings', route: '/branch-partner/settings', roles: ['BRANCH_PARTNER'] },

  // ── COMPANY ────────────────────────────────────────────────────────────────
  { navCap: 'nav.companySection', roles: ['COMPANY'] },
  { displayName: 'nav.dashboard', iconName: 'layout-dashboard', route: '/company', roles: ['COMPANY'] },
  { navCap: 'nav.management', roles: ['COMPANY'] },
  { displayName: 'nav.leads', iconName: 'target', route: '/company/leads', roles: ['COMPANY'] },
  { displayName: 'nav.students', iconName: 'users', route: '/company/students', roles: ['COMPANY'] },
  { displayName: 'nav.payments', iconName: 'credit-card', route: '/company/payments', roles: ['COMPANY'] },
  { displayName: 'nav.resources', iconName: 'books', route: '/company/resources', roles: ['COMPANY'] },

  // ── REFERRAL ───────────────────────────────────────────────────────────────
  { navCap: 'nav.referralSection', roles: ['REFERRAL'] },
  { displayName: 'nav.dashboard', iconName: 'layout-dashboard', route: '/referral', roles: ['REFERRAL'] },
  { navCap: 'nav.management', roles: ['REFERRAL'] },
  { displayName: 'nav.leads', iconName: 'target', route: '/referral/leads', roles: ['REFERRAL'] },
  { displayName: 'nav.students', iconName: 'users', route: '/referral/students', roles: ['REFERRAL'] },
  { displayName: 'nav.payments', iconName: 'credit-card', route: '/referral/payments', roles: ['REFERRAL'] },
  { displayName: 'nav.resources', iconName: 'books', route: '/referral/resources', roles: ['REFERRAL'] },
];
