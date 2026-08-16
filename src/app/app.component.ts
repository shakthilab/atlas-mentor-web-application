import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from './core/services/theme.service';
import { LoadingService } from './core/services/loading.service';
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
    private translate: TranslateService,
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
    const savedLang = localStorage.getItem('educrm-lang') || 'en';
    this.translate.use(savedLang);
  }
}
