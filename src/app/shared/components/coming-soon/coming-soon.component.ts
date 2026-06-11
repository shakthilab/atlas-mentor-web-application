import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  template: `
    <div class="coming-soon-wrapper d-flex flex-column align-items-center justify-content-center">
      <i-tabler name="tools" class="icon-64 text-primary m-b-16 d-flex"></i-tabler>
      <h2 class="mat-headline-5 m-b-8">{{ pageTitle }}</h2>
      <p class="text-muted f-s-16">This page is under construction. Coming soon!</p>
    </div>
  `,
  styles: [`
    .coming-soon-wrapper {
      min-height: 60vh;
      gap: 0;
    }
    .icon-64 { width: 64px; height: 64px; }
  `]
})
export class ComingSoonComponent implements OnInit {
  pageTitle = 'Coming Soon';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.pageTitle = this.route.snapshot.data['title'] ?? 'Coming Soon';
  }
}
