import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface AppLanguage {
  code: string;
  name: string;
}

const STORAGE_KEY = 'educrm-lang';

/**
 * Single source of truth for the app's active language.
 *
 * Every language switcher in the app (header dropdown, settings page, sidebar)
 * should read `languages` / `currentLang` and call `changeLanguage()` from here
 * instead of keeping its own copy — that duplication is what previously let the
 * header, sidebar, and settings switchers drift out of sync with each other.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  /** Keep in sync with the translation files in src/assets/i18n/. */
  readonly languages: AppLanguage[] = [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'ka', name: 'ქართული' },
    { code: 'uz', name: "O'zbek" },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  currentLang: string;

  constructor(private translate: TranslateService) {
    const validCodes = this.languages.map(l => l.code);
    const saved = localStorage.getItem(STORAGE_KEY);
    this.currentLang = saved && validCodes.includes(saved) ? saved : 'en';
  }

  /** Applies the persisted language to the TranslateService. Call once on app bootstrap. */
  init(): void {
    this.translate.use(this.currentLang);
  }

  changeLanguage(code: string): void {
    this.currentLang = code;
    this.translate.use(code);
    localStorage.setItem(STORAGE_KEY, code);
  }

  get currentLangName(): string {
    return this.languages.find(l => l.code === this.currentLang)?.name ?? 'English';
  }
}
