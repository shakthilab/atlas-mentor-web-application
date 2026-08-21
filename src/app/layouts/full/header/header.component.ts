import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
  OnDestroy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { navItems } from '../sidebar/sidebar-data';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnDestroy {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  showFiller = false;
  isIconSpinning = false;
  currentLang = 'en';
  currentUser: any = null;
  screenTitleKey = '';
  screenTitleFallback = '';
  private routerSubscription: Subscription = Subscription.EMPTY;

  languages = [
    { code: 'en', name: 'English' },
    { code: 'uz', name: "O'zbek" },
    { code: 'ru', name: 'Русский' },
    { code: 'ka', name: 'ქართული' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  get displayRoleName(): string {
    if (!this.currentUser) return '';
    return this.currentUser.roleName || this.authService.formatRoleName(this.currentUser.role);
  }

  constructor(
    public dialog: MatDialog,
    public themeService: ThemeService,
    private translate: TranslateService,
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    const saved = localStorage.getItem('educrm-lang') || 'en';
    this.currentLang = saved;
    this.translate.use(saved);

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateScreenTitle(event.urlAfterRedirects);
    });

    this.updateScreenTitle(this.router.url);
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

  get settingsLink(): string {
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

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  updateScreenTitle(url: string) {
    if (!url) return;
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    // First try exact match in navItems
    let matchedItem = navItems.find(item => item.route && cleanUrl === item.route);
    
    // If not found, try prefix match (longest route prefix first)
    if (!matchedItem) {
      const candidates = navItems.filter(item => item.route && item.route !== '/' && (cleanUrl.startsWith(item.route + '/') || cleanUrl.startsWith(item.route + '?')));
      if (candidates.length > 0) {
        candidates.sort((a, b) => (b.route?.length || 0) - (a.route?.length || 0));
        matchedItem = candidates[0];
      }
    }

    if (matchedItem && matchedItem.displayName) {
      this.screenTitleKey = matchedItem.displayName;
      this.screenTitleFallback = '';
    } else {
      // Traverse route tree to find data.title
      let activeRoute = this.activatedRoute;
      while (activeRoute && activeRoute.firstChild) {
        activeRoute = activeRoute.firstChild;
      }
      
      const title = activeRoute?.snapshot?.data ? activeRoute.snapshot.data['title'] : undefined;
      if (title) {
        const possibleKey = 'nav.' + this.toCamelCase(title);
        this.screenTitleKey = possibleKey;
        this.screenTitleFallback = title;
      } else {
        // Fallback for Dashboard / Root route
        if (cleanUrl === '/admin' || cleanUrl === '/manager' || cleanUrl === '/employee' || cleanUrl === '/branch-partner' || cleanUrl === '/company' || cleanUrl === '/referral' || cleanUrl === '/student') {
          this.screenTitleKey = 'nav.dashboard';
          this.screenTitleFallback = 'Dashboard';
        } else {
          this.screenTitleKey = '';
          this.screenTitleFallback = '';
        }
      }
    }
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  }
}

