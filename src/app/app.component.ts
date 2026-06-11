import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = 'EduCRM';

  constructor(
    private themeService: ThemeService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.themeService.init();
    const savedLang = localStorage.getItem('educrm-lang') || 'en';
    this.translate.use(savedLang);
  }
}
