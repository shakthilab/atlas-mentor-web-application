import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

interface AvatarPaletteEntry {
  gradient: string;
  color: string;
}

// Matches the mockup's gradient chips (teal/gold/slate/blue), each paired with
// a legible text color. Kept as literals per the convention in
// data-table/_data-table-tokens.scss and status-pill/kpi-card - avoids
// duplicating the global Google Fonts @import into this component's chunk.
const AVATAR_PALETTE: AvatarPaletteEntry[] = [
  { gradient: 'linear-gradient(155deg, #2C8D86, #164F4C)', color: '#ffffff' }, // teal
  { gradient: 'linear-gradient(155deg, #C99A3C, #A87C25)', color: '#3a2c0c' }, // gold
  { gradient: 'linear-gradient(155deg, #93A3AA, #56607A)', color: '#ffffff' }, // slate
  { gradient: 'linear-gradient(155deg, #3E72C7, #1E3E72)', color: '#ffffff' }, // blue
];

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  @Input() name = '';
  /** When set, renders a photo instead of the initials chip. */
  @Input() imageUrl?: string;
  @Input() size = 36;

  get initials(): string {
    const trimmed = (this.name || '').trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : trimmed.slice(0, 2).toUpperCase();
  }

  private get paletteEntry(): AvatarPaletteEntry {
    const name = this.name || '';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  }

  get background(): string {
    return this.paletteEntry.gradient;
  }

  get textColor(): string {
    return this.paletteEntry.color;
  }
}
