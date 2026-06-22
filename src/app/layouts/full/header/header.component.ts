import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  showFiller = false;
  isIconSpinning = false;
  currentLang = 'en';
  currentUser: any = null;

  languages = [
    { code: 'en', name: 'English' },
    { code: 'uz', name: "O'zbek" },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  constructor(
    public dialog: MatDialog,
    public themeService: ThemeService,
    private translate: TranslateService,
    public authService: AuthService,
  ) {
    const saved = localStorage.getItem('educrm-lang') || 'en';
    this.currentLang = saved;
    this.translate.use(saved);

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  get profileLink(): string {
    if (!this.currentUser) return '/';
    const role = this.currentUser.role.toUpperCase();
    if (role === 'STUDENT') return '/student/profile';
    if (['ADMIN', 'MANAGER', 'BRANCH_PARTNER', 'EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR', 'ADMINISTRATIVE_ASSISTANT'].includes(role)) {
      const base = this.authService.getRoleRoute(this.currentUser.role);
      return `${base}/settings`;
    }
    return this.authService.getRoleRoute(this.currentUser.role);
  }

  get tasksLink(): string {
    if (!this.currentUser) return '/';
    const role = this.currentUser.role.toUpperCase();
    if (role === 'STUDENT') return '/student';
    if (['ADMIN', 'MANAGER', 'BRANCH_PARTNER', 'EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR', 'ADMINISTRATIVE_ASSISTANT'].includes(role)) {
      const base = this.authService.getRoleRoute(this.currentUser.role);
      return `${base}/tasks`;
    }
    return this.authService.getRoleRoute(this.currentUser.role);
  }

  get showTasksLink(): boolean {
    if (!this.currentUser) return false;
    const role = this.currentUser.role.toUpperCase();
    return ['ADMIN', 'MANAGER', 'BRANCH_PARTNER', 'EMPLOYEE', 'SENIOR_COUNSELLOR', 'JUNIOR_COUNSELLOR', 'STUDENT', 'ADMINISTRATIVE_ASSISTANT'].includes(role);
  }

  toggleDarkMode(): void {
    this.isIconSpinning = true;
    this.themeService.toggle();
    setTimeout(() => (this.isIconSpinning = false), 450);
  }

  changeLanguage(code: string): void {
    this.currentLang = code;
    this.translate.use(code);
    localStorage.setItem('educrm-lang', code);
  }

  logout(): void {
    this.authService.logout();
  }
}
