import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { navItems } from './sidebar-data';
import { NavItem } from './nav-item/nav-item';
import { NavService } from '../../../core/services/nav.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/models/user.model';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  @Output() closeSidebar = new EventEmitter<void>();
  filteredNavItems: NavItem[] = [];
  normalNavItems: NavItem[] = [];
  settingsItem: NavItem | null = null;
  currentLang = 'en';

  languages = [
    { code: 'en', name: 'English' },
    { code: 'uz', name: "O'zbek" },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  constructor(
    public navService: NavService,
    private authService: AuthService,
    public themeService: ThemeService,
    private translate: TranslateService
  ) {
    const saved = localStorage.getItem('educrm-lang') || 'en';
    this.currentLang = saved;
  }

  ngOnInit(): void {
    this.filteredNavItems = this.getNavItemsForCurrentUser();
    this.settingsItem = this.filteredNavItems.find(item => item.displayName === 'nav.settings') || null;
    this.normalNavItems = this.filteredNavItems.filter(item => item.displayName !== 'nav.settings');
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  toggleDarkMode(): void {
    this.themeService.toggle();
  }

  changeLanguage(code: string): void {
    this.currentLang = code;
    this.translate.use(code);
    localStorage.setItem('educrm-lang', code);
  }

  get currentLangName(): string {
    const lang = this.languages.find(l => l.code === this.currentLang);
    return lang ? lang.name : 'English';
  }

  private getNavItemsForCurrentUser(): NavItem[] {
    const user = this.authService.currentUserValue;
    if (!user) return [];

    const role = user.role.toUpperCase() as UserRole;

    // Check if the user has a specific role that has its own menu items
    const hasSpecificRoleItems = navItems.some(item => 
      item.roles && item.roles.map(r => r.toUpperCase()).includes(role)
    );

    return navItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      const normalizedRoles = item.roles.map((r) => r.toUpperCase());

      if (normalizedRoles.includes(role)) return true;

      // Special employee fallback: only apply if the user does NOT have their own specific role items
      if (!hasSpecificRoleItems && normalizedRoles.includes('EMPLOYEE') && user.isEmployee) {
        return true;
      }

      return false;
    });
  }
}
