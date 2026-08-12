import { Component } from '@angular/core';

@Component({
  selector: 'app-branding',
  template: `
    <div class="branding">
      <a href="/" class="d-flex align-items-center text-decoration-none logo-link">
        <div class="brand-logo-icon-box d-flex align-items-center justify-content-center">
          <i-tabler name="school" class="brand-logo-icon"></i-tabler>
        </div>
        <div class="brand-text-wrapper">
          <span class="brand-title">Atlas Mentor</span>
          <span class="brand-subtitle">CONSULTANCY</span>
        </div>
      </a>
    </div>
  `,
})
export class BrandingComponent {
  constructor() {}
}
