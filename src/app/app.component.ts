import { Component, OnInit } from '@angular/core';
import { ThemeService } from './core/services/theme.service';
import { LoadingService } from './core/services/loading.service';
import { LanguageService } from './core/services/language.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = 'EduCRM';
  isLoading$: Observable<boolean>;

  constructor(
    private themeService: ThemeService,
    private languageService: LanguageService,
    private loadingService: LoadingService
  ) {
    this.isLoading$ = this.loadingService.isLoading$.pipe(
      tap(isLoading => {
        if (isLoading) {
          document.body.classList.add('body-loading-lock');
        } else {
          document.body.classList.remove('body-loading-lock');
        }
      })
    );
  }

  ngOnInit(): void {
    this.themeService.init();
    // Applies the persisted language (or 'en' default) app-wide, before any feature
    // module renders — this is what makes the whole app, not just the navbar, come up
    // in the previously-selected language on reload/login.
    this.languageService.init();
  }
}
