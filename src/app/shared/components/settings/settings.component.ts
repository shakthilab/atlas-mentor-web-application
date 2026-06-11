import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  template: `
    <div class="settings-container">
      <!-- Appearance Settings -->
      <mat-card class="cardWithShadow">
        <mat-card-header>
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">Appearance Settings</h5>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content class="p-t-20">
          <p class="text-muted m-b-20">Customize how Atlas Mentor looks on your device.</p>
          
          <div class="theme-options-grid">
            <div 
              class="theme-card-option" 
              [class.active]="!isDarkMode"
              (click)="setTheme(false)"
            >
              <div class="theme-preview light-preview">
                <div class="preview-header"></div>
                <div class="preview-body">
                  <div class="preview-sidebar"></div>
                  <div class="preview-content"></div>
                </div>
              </div>
              <div class="option-label">
                <i-tabler name="sun" class="icon-16 m-r-4"></i-tabler>
                <span>Light Theme</span>
              </div>
            </div>

            <div 
              class="theme-card-option" 
              [class.active]="isDarkMode"
              (click)="setTheme(true)"
            >
              <div class="theme-preview dark-preview">
                <div class="preview-header"></div>
                <div class="preview-body">
                  <div class="preview-sidebar"></div>
                  <div class="preview-content"></div>
                </div>
              </div>
              <div class="option-label">
                <i-tabler name="moon" class="icon-16 m-r-4"></i-tabler>
                <span>Dark Theme</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Language Settings -->
      <mat-card class="cardWithShadow m-t-20">
        <mat-card-header>
          <mat-card-title>
            <h5 class="mat-headline-6 f-w-600 m-b-0">Language Settings</h5>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content class="p-t-20">
          <p class="text-muted m-b-20">Select your preferred language for the Atlas Mentor platform.</p>
          
          <div class="language-options-grid">
            <div 
              *ngFor="let lang of languages" 
              class="language-card-option" 
              [class.active]="currentLang === lang.code"
              (click)="changeLanguage(lang.code)"
            >
              <div class="flag-wrapper">
                <ng-container [ngSwitch]="lang.code">
                  <!-- English -->
                  <svg *ngSwitchCase="'en'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" class="flag-svg">
                    <rect width="60" height="30" fill="#012169"/>
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="4"/>
                    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#fff" stroke-width="10"/>
                    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" stroke-width="6"/>
                  </svg>
                  <!-- Uzbekistan -->
                  <svg *ngSwitchCase="'uz'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 15" class="flag-svg">
                    <rect width="30" height="5" fill="#1EB53A"/>
                    <rect y="5" width="30" height="5" fill="#ffffff"/>
                    <rect y="10" width="30" height="5" fill="#0099B5"/>
                    <rect y="4.5" width="30" height="1" fill="#CE1126"/>
                    <rect y="9.5" width="30" height="1" fill="#CE1126"/>
                  </svg>
                  <!-- French -->
                  <svg *ngSwitchCase="'fr'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" class="flag-svg">
                    <rect width="1" height="2" fill="#002395"/>
                    <rect x="1" width="1" height="2" fill="#fff"/>
                    <rect x="2" width="1" height="2" fill="#ED2939"/>
                  </svg>
                  <!-- German -->
                  <svg *ngSwitchCase="'de'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" class="flag-svg">
                    <rect width="5" height="1" fill="#000"/>
                    <rect y="1" width="5" height="1" fill="#D00"/>
                    <rect y="2" width="5" height="1" fill="#FFCE00"/>
                  </svg>
                </ng-container>
              </div>
              <span class="language-name">{{ lang.name }}</span>
              <div class="active-badge" *ngIf="currentLang === lang.code">
                <i-tabler name="circle-check" class="icon-16 text-white"></i-tabler>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 16px;
    }
    .theme-options-grid {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      
      @media (max-width: 480px) {
        flex-direction: column;
      }
    }
    .theme-card-option {
      flex: 1;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      background-color: #ffffff;

      &:hover {
        border-color: #615dff;
        transform: translateY(-2px);
      }

      &.active {
        border-color: #615dff;
        box-shadow: 0 4px 12px rgba(97, 93, 255, 0.15);
        
        .option-label {
          color: #615dff;
          font-weight: 600;
        }
      }
    }
    .theme-preview {
      height: 100px;
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid #e2e8f0;
      background: #f4f6f9;
      position: relative;
    }
    .light-preview {
      background: #f4f6f9;
      .preview-header { background: #ffffff; height: 16px; border-bottom: 1px solid #e2e8f0; }
      .preview-sidebar { background: #ffffff; width: 24px; border-right: 1px solid #e2e8f0; }
      .preview-content { background: #f4f6f9; flex: 1; }
    }
    .dark-preview {
      background: #0c0c0e;
      .preview-header { background: #121214; height: 16px; border-bottom: 1px solid #242428; }
      .preview-sidebar { background: #121214; width: 24px; border-right: 1px solid #242428; }
      .preview-content { background: #0c0c0e; flex: 1; }
    }
    .preview-body {
      display: flex;
      flex: 1;
    }
    .option-label {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      font-size: 14px;
      color: #2a3547;
    }
    .icon-16 { width: 16px; height: 16px; display: flex; align-items: center; }

    /* Language Grid */
    .language-options-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 16px;
      
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }
    .language-card-option {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      position: relative;
      background-color: #ffffff;
      transition: all 0.2s ease-in-out;

      &:hover {
        border-color: #615dff;
        background-color: #f8fafc;
      }

      &.active {
        border-color: #615dff;
        background-color: #ecf2ff;
        
        .language-name {
          color: #615dff;
          font-weight: 600;
        }
      }
    }
    .flag-wrapper {
      width: 28px;
      height: 20px;
      display: flex;
      align-items: center;
      margin-right: 12px;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      
      .flag-svg {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    .language-name {
      font-size: 14px;
      color: #2a3547;
    }
    .active-badge {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background-color: #615dff;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :host-context(.dark-theme) {
      .theme-card-option {
        border-color: var(--dark-borderColor);
        background-color: var(--dark-cardbg);
        
        .option-label {
          color: #f8fafc;
        }
        
        .theme-preview {
          border-bottom: 1px solid var(--dark-borderColor);
        }

        &.active {
          border-color: #615dff;
          .option-label {
            color: #615dff;
          }
        }
      }

      .language-card-option {
        border-color: var(--dark-borderColor);
        background-color: var(--dark-cardbg);
        
        .language-name {
          color: #f8fafc;
        }

        &:hover {
          border-color: #615dff;
          background-color: var(--dark-hoverbgcolor);
        }

        &.active {
          border-color: #615dff;
          background-color: var(--dark-themelightprimary);
          
          .language-name {
            color: #615dff;
          }
        }
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  currentLang = 'en';

  languages = [
    { code: 'en', name: 'English' },
    { code: 'uz', name: "O'zbek" },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  constructor(
    private themeService: ThemeService,
    private translate: TranslateService
  ) {
    const saved = localStorage.getItem('educrm-lang') || 'en';
    this.currentLang = saved;
  }

  ngOnInit(): void {}

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  setTheme(dark: boolean): void {
    if (this.themeService.isDarkMode !== dark) {
      this.themeService.toggle();
    }
  }

  changeLanguage(code: string): void {
    this.currentLang = code;
    this.translate.use(code);
    localStorage.setItem('educrm-lang', code);
  }
}
