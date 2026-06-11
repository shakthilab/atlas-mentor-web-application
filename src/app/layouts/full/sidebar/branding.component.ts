import { Component } from '@angular/core';

@Component({
  selector: 'app-branding',
  template: `
    <div class="branding">
      <a href="/" class="d-flex align-items-center text-decoration-none">
        <img src="/assets/logo/Atlas-Mentor-Pvt-Ltd.webp" alt="Atlas Mentor" class="brand-logo-image align-middle m-2" style="max-height: 40px; width: auto;" />
        <span class="brand-logo-text-mini">AM</span>
      </a>
    </div>
  `,
})
export class BrandingComponent {
  constructor() {}
}
