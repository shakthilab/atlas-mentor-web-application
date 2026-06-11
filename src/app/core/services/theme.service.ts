import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDark = false;
  private readonly STORAGE_KEY = 'educrm-theme';

  get isDarkMode(): boolean {
    return this._isDark;
  }

  init(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved ? saved === 'dark' : prefersDark;
    this._setTheme(shouldBeDark, false);
  }

  toggle(): void {
    this._setTheme(!this._isDark, true);
  }

  private _setTheme(dark: boolean, animate: boolean): void {
    this._isDark = dark;
    const body = document.body;

    if (animate) {
      body.classList.add('theme-transitioning');
      setTimeout(() => body.classList.remove('theme-transitioning'), 400);
    }

    dark ? body.classList.add('dark-theme') : body.classList.remove('dark-theme');
    localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
  }
}
