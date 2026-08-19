import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type StatusPillVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-pill.component.html',
  styleUrl: './status-pill.component.scss',
})
export class StatusPillComponent {
  @Input() label = '';
  @Input() variant: StatusPillVariant = 'neutral';
  /** Shows a small leading dot - used for lifecycle/stage pills (Registered, Active), not tag-like pills (Referral, Corporate). */
  @Input() dot = false;
}
