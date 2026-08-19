import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';

export type KpiDeltaDirection = 'up' | 'down' | 'neutral';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, TablerIconsModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  /** Tabler icon name (e.g. 'users', 'clock'). Omit to render a card with no icon chip. */
  @Input() icon?: string;
  /** Left accent bar + icon chip color. Any CSS color value. */
  @Input() railColor = '#2C8D86'; // $teal-500
  @Input() iconBg = '#E4F1EF'; // $teal-100
  @Input() iconColor = '#164F4C'; // $teal-700
  /** Optional trend text, e.g. "+12% vs last month". Omit to render no delta row. */
  @Input() delta?: string;
  @Input() deltaDirection: KpiDeltaDirection = 'neutral';
}
