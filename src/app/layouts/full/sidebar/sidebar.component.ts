import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { navItems } from './sidebar-data';
import { NavItem } from './nav-item/nav-item';
import { NavService } from '../../../core/services/nav.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/models/user.model';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  @Output() closeSidebar = new EventEmitter<void>();
  filteredNavItems: NavItem[] = [];
  normalNavItems: NavItem[] = [];
  settingsItem: NavItem | null = null;

  constructor(
    public navService: NavService,
    private authService: AuthService,
    public themeService: ThemeService,
    private languageService: LanguageService
  ) {}

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
    this.languageService.changeLanguage(code);
  }

  get currentLangName(): string {
    return this.languageService.currentLangName;
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
